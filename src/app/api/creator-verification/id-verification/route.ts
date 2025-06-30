import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);
    if (!user || !user.is_creator) {
      return NextResponse.json({ error: 'Only creators can submit ID verification' }, { status: 403 });
    }

    // Check if already verified
    const existingVerification = await query(
      'SELECT * FROM creator_id_verification WHERE creator_id = $1 AND status = $2',
      [user.id, 'verified']
    );

    if (existingVerification.rows.length > 0) {
      return NextResponse.json({ error: 'Creator already verified' }, { status: 400 });
    }

    const formData = await request.formData();
    const idDocumentType = formData.get('idDocumentType') as string;
    const idFrontFile = formData.get('idFrontFile') as File;
    const idBackFile = formData.get('idBackFile') as File | null;
    const selfieFile = formData.get('selfieFile') as File;
    const selfieWithIdFile = formData.get('selfieWithIdFile') as File;

    if (!idDocumentType || !idFrontFile || !selfieFile || !selfieWithIdFile) {
      return NextResponse.json({ error: 'Missing required files' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'id-verification', user.id);
    await mkdir(uploadDir, { recursive: true });

    // Save files
    const timestamp = Date.now();
    const idFrontPath = await saveFile(idFrontFile, uploadDir, `id-front-${timestamp}`);
    const idBackPath = idBackFile ? await saveFile(idBackFile, uploadDir, `id-back-${timestamp}`) : null;
    const selfiePath = await saveFile(selfieFile, uploadDir, `selfie-${timestamp}`);
    const selfieWithIdPath = await saveFile(selfieWithIdFile, uploadDir, `selfie-with-id-${timestamp}`);

    // Create verification record - auto-verify for now since you said it's instant
    const result = await query(`
      INSERT INTO creator_id_verification (
        creator_id, id_document_type, id_document_front_path, id_document_back_path,
        selfie_image_path, selfie_with_id_path, status, verified_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, status, created_at, verified_at
    `, [
      user.id,
      idDocumentType,
      idFrontPath,
      idBackPath,
      selfiePath,
      selfieWithIdPath,
      'verified', // Auto-verify instantly
      new Date(), // verified_at
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // expires in 1 year
    ]);

    const verification = result.rows[0];

    return NextResponse.json({
      success: true,
      verification: {
        id: verification.id,
        status: verification.status,
        submittedAt: verification.created_at,
        verifiedAt: verification.verified_at
      }
    });

  } catch (error) {
    console.error('ID verification error:', error);
    return NextResponse.json(
      { error: 'Failed to submit ID verification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);
    if (!user || !user.is_creator) {
      return NextResponse.json({ error: 'Only creators can check verification status' }, { status: 403 });
    }

    // Get verification status
    const result = await query(`
      SELECT id, status, created_at, verified_at, admin_notes, expires_at
      FROM creator_id_verification 
      WHERE creator_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [user.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        verified: false, 
        status: 'none',
        canSubmit: true 
      });
    }

    const verification = result.rows[0];
    return NextResponse.json({
      verified: verification.status === 'verified',
      status: verification.status,
      submittedAt: verification.created_at,
      verifiedAt: verification.verified_at,
      adminNotes: verification.admin_notes,
      expiresAt: verification.expires_at,
      canSubmit: verification.status !== 'verified'
    });

  } catch (error) {
    console.error('Verification status error:', error);
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}

async function saveFile(file: File, uploadDir: string, baseName: string): Promise<string> {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${baseName}.${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);
  
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));
  
  // Return relative path for database storage
  return `/uploads/id-verification/${path.basename(uploadDir)}/${fileName}`;
} 
