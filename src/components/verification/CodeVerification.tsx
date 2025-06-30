'use client';

import { useState, useRef } from 'react';
import { useVideoVerification } from '@/lib/hooks/useVideoVerification';
import Image from 'next/image';

type VerificationStep = 'generate' | 'write' | 'upload' | 'verify' | 'success';

interface CodeVerificationProps {
  videoSessionId: string;
  onVerified: () => void;
  onCancel: () => void;
}

interface VerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  readCode?: string;
  attemptsRemaining?: number;
}

export default function CodeVerification({ videoSessionId, onVerified, onCancel }: CodeVerificationProps) {
  const [step, setStep] = useState<VerificationStep>('generate');
  const [uploadedImage, setUploadedImage] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    generateCode, 
    verifyCode, 
    verificationSession, 
    loading, 
    error, 
    clearError 
  } = useVideoVerification();

  const handleGenerateCode = async () => {
    await generateCode(videoSessionId);
    setStep('write');
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setUploadError('');
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5MB');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      setStep('verify');
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Verify the uploaded image
  const handleVerifyCode = async () => {
    if (!verificationSession || !uploadedImage) return;

    const result = await verifyCode(uploadedImage.split(',')[1], verificationSession.id);
    setVerificationResult(result);

    if (result?.verified) {
      setStep('success');
      setTimeout(() => {
        onVerified();
      }, 2000);
    }
  };

  // Format expiration time
  const formatExpiration = (expiresAt: string) => {
    const date = new Date(expiresAt);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Authentication Verification
      </h2>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300 text-xs mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {uploadError && (
        <div className="bg-orange-900/50 border border-orange-700 rounded-lg p-4 mb-6">
          <p className="text-orange-300 text-sm">{uploadError}</p>
          <button
            onClick={() => setUploadError('')}
            className="text-orange-400 hover:text-orange-300 text-xs mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step 1: Generate Code */}
      {step === 'generate' && (
        <div className="text-center">
          <p className="text-zinc-300 mb-6">
            Generate a unique verification code to authenticate your items.
          </p>
          <button
            onClick={handleGenerateCode}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Verification Code'}
          </button>
        </div>
      )}

      {/* Step 2: Write Code */}
      {step === 'write' && verificationSession && (
        <div className="text-center">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
            <h3 className="text-white font-bold text-xl mb-2">Your Code:</h3>
            <div className="text-violet-400 font-mono text-2xl font-bold tracking-wider">
              {verificationSession.code}
            </div>
            <p className="text-zinc-400 text-xs mt-2">
              Expires: {formatExpiration(verificationSession.expiresAt)}
            </p>
          </div>
          
          <div className="text-left mb-6">
            <h4 className="text-white font-medium mb-3">Instructions:</h4>
            <ol className="text-zinc-300 text-sm space-y-2 list-decimal list-inside">
              <li>Write this code clearly on a piece of paper by hand</li>
              <li>Hold the paper in front of you</li>
              <li>Take a selfie showing both you and the handwritten code</li>
              <li>Make sure the code is clearly visible and readable</li>
            </ol>
          </div>
          
          <button
            onClick={() => setStep('upload')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full"
          >
            Ready - Upload Selfie
          </button>
        </div>
      )}

      {/* Step 3: Upload Selfie */}
      {step === 'upload' && (
        <div className="text-center">
          <div className="mb-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                dragActive 
                  ? 'border-violet-400 bg-violet-500/10' 
                  : 'border-zinc-600 hover:border-zinc-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-zinc-300 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <p className="text-zinc-300 mb-2">
                Drag and drop your selfie here
              </p>
              <p className="text-zinc-500 text-sm mb-4">
                or click to browse files
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Choose File
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
          
          <div className="text-left mb-6">
            <h4 className="text-white font-medium mb-2">Tips for best results:</h4>
            <ul className="text-zinc-300 text-sm space-y-1 list-disc list-inside">
              <li>Use good lighting</li>
              <li>Hold the paper steady and flat</li>
              <li>Make sure the code is clearly readable</li>
              <li>Include your face in the photo</li>
            </ul>
          </div>
          
          <button
            onClick={() => setStep('write')}
            className="bg-zinc-600 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 4: Verify */}
      {step === 'verify' && (
        <div className="text-center">
          <div className="mb-4 relative">
            <Image
              src={uploadedImage}
              alt="Uploaded verification selfie"
              width={400}
              height={300}
              className="w-full rounded-lg border border-zinc-700 max-h-64 object-cover"
            />
          </div>
          
          <p className="text-zinc-300 text-sm mb-4">
            Review your photo. Make sure the handwritten code is clearly visible.
          </p>
          
          {verificationResult && !verificationResult.verified && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{verificationResult.message}</p>
              {verificationResult.readCode && (
                <p className="text-red-400 text-xs mt-1">
                  AI read: &quot;{verificationResult.readCode}&quot;
                </p>
              )}
              {verificationResult.attemptsRemaining !== undefined && (
                <p className="text-red-400 text-xs mt-1">
                  Attempts remaining: {verificationResult.attemptsRemaining}
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleVerifyCode}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-1"
            >
              {loading ? 'Verifying...' : '✓ Verify Code'}
            </button>
            <button
              onClick={() => setStep('upload')}
              className="bg-zinc-600 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Upload New
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 'success' && (
        <div className="text-center">
          <div className="text-green-400 text-6xl mb-4">✓</div>
          <h3 className="text-white text-xl font-bold mb-2">Verified!</h3>
          <p className="text-zinc-300 mb-4">
            Your items are now authenticated and ready to be published as auctions.
          </p>
          <div className="animate-pulse text-violet-400">
            Proceeding to auction creation...
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {step !== 'success' && (
        <button
          onClick={onCancel}
          className="w-full mt-6 text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
        >
          Cancel Process
        </button>
      )}
    </div>
  );
}
