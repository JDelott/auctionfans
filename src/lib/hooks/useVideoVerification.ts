import { useState, useCallback } from 'react';

interface VerificationSession {
  id: string;
  code: string;
  expiresAt: string;
}

interface VerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  readCode?: string;
  attemptsRemaining?: number;
}

export function useVideoVerification() {
  const [loading, setLoading] = useState(false);
  const [verificationSession, setVerificationSession] = useState<VerificationSession | null>(null);
  const [error, setError] = useState<string>('');

  const generateCode = useCallback(async (videoSessionId: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/generate-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoSessionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationSession(data.verificationSession);
        return data.verificationSession;
      } else {
        setError(data.error || 'Failed to generate code');
        return null;
      }
    } catch {
      setError('Network error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyCode = useCallback(async (imageData: string, sessionId: string): Promise<VerificationResult | null> => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-handwritten-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, sessionId }),
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        setError(data.error || 'Verification failed');
        return data;
      }
    } catch {
      setError('Network error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    verificationSession,
    generateCode,
    verifyCode,
    clearError: () => setError('')
  };
}
