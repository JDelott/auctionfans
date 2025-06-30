'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CodeVerification from '@/components/verification/CodeVerification';

export default function TestVerificationPage() {
  const { user } = useAuth();
  const [videoSessionId, setVideoSessionId] = useState<string>('');
  const [showVerification, setShowVerification] = useState(false);

  const createVideoSession = async () => {
    try {
      const response = await fetch('/api/video-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (response.ok) {
        setVideoSessionId(data.videoSession.id);
        setShowVerification(true);
      }
    } catch (error) {
      console.error('Failed to create video session:', error);
    }
  };

  if (!user?.is_creator) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">You must be a creator to test verification</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Test Verification System
        </h1>

        {!showVerification ? (
          <div className="text-center">
            <button
              onClick={createVideoSession}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Start Verification Test
            </button>
          </div>
        ) : (
          <CodeVerification
            videoSessionId={videoSessionId}
            onVerified={() => {
              alert('Verification completed successfully!');
              setShowVerification(false);
            }}
            onCancel={() => {
              setShowVerification(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
