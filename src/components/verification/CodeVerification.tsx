'use client';

import { useState, useRef, useCallback } from 'react';
import { useVideoVerification } from '@/lib/hooks/useVideoVerification';
import Image from 'next/image';

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
  const { loading, error, verificationSession, generateCode, verifyCode, clearError } = useVideoVerification();
  const [step, setStep] = useState<'generate' | 'write' | 'capture' | 'verify' | 'success'>('generate');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Generate verification code
  const handleGenerateCode = async () => {
    const session = await generateCode(videoSessionId);
    if (session) {
      setStep('write');
    }
  };

  // Start camera for selfie
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setStep('capture');
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  };

  // Capture selfie with handwritten code
  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context?.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setStep('verify');
    }
  }, []);

  // Verify the captured image
  const handleVerifyCode = async () => {
    if (!verificationSession || !capturedImage) return;

    const result = await verifyCode(capturedImage.split(',')[1], verificationSession.id);
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
            onClick={startCamera}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full"
          >
            Ready - Start Camera
          </button>
        </div>
      )}

      {/* Step 3: Capture Selfie */}
      {step === 'capture' && (
        <div className="text-center">
          <div className="mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg border border-zinc-700"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <p className="text-zinc-300 text-sm mb-4">
            Hold up your handwritten code and make sure it&apos;s clearly visible
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={captureImage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-1"
            >
              📸 Capture Photo
            </button>
            <button
              onClick={() => setStep('write')}
              className="bg-zinc-600 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Verify */}
      {step === 'verify' && (
        <div className="text-center">
          <div className="mb-4 relative">
            <Image
              src={capturedImage}
              alt="Captured verification"
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
              onClick={startCamera}
              className="bg-zinc-600 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Retake
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
