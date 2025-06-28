import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db';

export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  is_creator: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  username: string;
  display_name?: string;
  is_creator?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(userData: CreateUserData): Promise<User> {
  const { email, password, username, display_name, is_creator = false } = userData;
  
  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );
  
  if (existingUser.rows.length > 0) {
    throw new Error('User with this email or username already exists');
  }
  
  const hashedPassword = await hashPassword(password);
  
  const result = await query(
    `INSERT INTO users (email, password_hash, username, display_name, is_creator)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, username, display_name, bio, profile_image_url, is_creator, is_verified, created_at`,
    [email, hashedPassword, username, display_name ?? null, is_creator]
  );
  
  return result.rows[0];
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const result = await query(
    `SELECT id, email, password_hash, username, display_name, bio, profile_image_url, 
     is_creator, is_verified, created_at
     FROM users WHERE email = $1`,
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  const isValid = await verifyPassword(password, user.password_hash);
  
  if (!isValid) {
    return null;
  }
  
  // Remove password_hash from returned user
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await query(
    `SELECT id, email, username, display_name, bio, profile_image_url, 
     is_creator, is_verified, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
  
  return result.rows[0] || null;
}

export function generateToken(userId: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}
