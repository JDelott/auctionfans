'use client';

import { useState, useRef } from 'react';


type VerificationStep = 'instructions' | 'id-upload' | 'selfie-upload' | 'review' | 'submitted';

interface IDVerificationProps {
  onVerificationSubmitted: () => void;
  onCancel: () => void;
}

export default function NewIDVerification({ onVerificationSubmitted, onCancel }: IDVerificationProps) {
  const [step, setStep] = useState<VerificationStep>('instructions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [idDocumentType, setIdDocumentType] = useState('driver_license');
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string>('');
  const [idBackPreview, setIdBackPreview] = useState<string>('');
  
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfieWithIdFile, setSelfieWithIdFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [selfieWithIdPreview, setSelfieWithIdPreview] = useState<string>('');

  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const selfieWithIdRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (
    file: File, 
    setFile: (file: File) => void, 
    setPreview: (preview: string) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image must be smaller than 10MB');
      return;
    }
    
    setFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!idFrontFile || !selfieFile || !selfieWithIdFile) {
      setError('Please upload all required files');
      return;
    }

    if (idDocumentType === 'driver_license' && !idBackFile) {
      setError('Please upload back of driver license');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('idDocumentType', idDocumentType);
      formData.append('idFrontFile', idFrontFile);
      if (idBackFile) formData.append('idBackFile', idBackFile);
      formData.append('selfieFile', selfieFile);
      formData.append('selfieWithIdFile', selfieWithIdFile);

      const response = await fetch('/api/creator-verification/id-verification', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStep('submitted');
        setTimeout(() => {
          onVerificationSubmitted();
        }, 3000);
      } else {
        setError(data.error || 'Failed to submit verification');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-300 text-xs mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {step === 'instructions' && (
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-white">What You&apos;ll Need</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-800/50 rounded-lg p-6">
              <div className="text-4xl mb-4">📄</div>
              <h4 className="text-white font-medium mb-2">Government ID</h4>
              <p className="text-zinc-400 text-sm">Driver&apos;s license, passport, or national ID card</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-6">
              <div className="text-4xl mb-4">🤳</div>
              <h4 className="text-white font-medium mb-2">Selfie Photos</h4>
              <p className="text-zinc-400 text-sm">Clear photo of yourself and holding your ID</p>
            </div>
          </div>

          <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
            <p className="text-amber-200 text-sm">
              ⚡ Fast track: Verification typically completed within 24 hours
            </p>
          </div>

          <button
            onClick={() => setStep('id-upload')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
          >
            Start Verification
          </button>
        </div>
      )}

      {step === 'id-upload' && (
        <IDUploadStep
          idDocumentType={idDocumentType}
          setIdDocumentType={setIdDocumentType}
          idFrontFile={idFrontFile}
          idBackFile={idBackFile}
          idFrontPreview={idFrontPreview}
          idBackPreview={idBackPreview}
          idFrontRef={idFrontRef}
          idBackRef={idBackRef}
          handleFileSelect={handleFileSelect}
          setIdFrontFile={setIdFrontFile}
          setIdBackFile={setIdBackFile}
          setIdFrontPreview={setIdFrontPreview}
          setIdBackPreview={setIdBackPreview}
          onNext={() => setStep('selfie-upload')}
          onBack={() => setStep('instructions')}
        />
      )}

      {step === 'selfie-upload' && (
        <SelfieUploadStep
          selfieFile={selfieFile}
          selfieWithIdFile={selfieWithIdFile}
          selfiePreview={selfiePreview}
          selfieWithIdPreview={selfieWithIdPreview}
          selfieRef={selfieRef}
          selfieWithIdRef={selfieWithIdRef}
          handleFileSelect={handleFileSelect}
          setSelfieFile={setSelfieFile}
          setSelfieWithIdFile={setSelfieWithIdFile}
          setSelfiePreview={setSelfiePreview}
          setSelfieWithIdPreview={setSelfieWithIdPreview}
          onNext={() => setStep('review')}
          onBack={() => setStep('id-upload')}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          idDocumentType={idDocumentType}
          idFrontPreview={idFrontPreview}
          idBackPreview={idBackPreview}
          selfiePreview={selfiePreview}
          selfieWithIdPreview={selfieWithIdPreview}
          onSubmit={handleSubmit}
          onBack={() => setStep('selfie-upload')}
          loading={loading}
        />
      )}

      {step === 'submitted' && (
        <div className="text-center space-y-6">
          <div className="text-green-400 text-6xl">✓</div>
          <h3 className="text-2xl font-bold text-white">Verification Submitted!</h3>
          <p className="text-zinc-300">
            Your ID verification has been submitted for review. You&apos;ll receive an email notification once it&apos;s processed.
          </p>
          <div className="bg-violet-900/20 border border-violet-700/30 rounded-lg p-4">
            <p className="text-violet-300 text-sm">
              📧 Check your email for updates • ⏱️ Processing time: 1-24 hours
            </p>
          </div>
        </div>
      )}

      {step !== 'submitted' && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
          >
            Cancel Process
          </button>
        </div>
      )}
    </div>
  );
}

// ID Upload Step Component - Fixed ref types
interface IDUploadStepProps {
  idDocumentType: string;
  setIdDocumentType: (type: string) => void;
  idFrontFile: File | null;
  idBackFile: File | null;
  idFrontPreview: string;
  idBackPreview: string;
  idFrontRef: React.RefObject<HTMLInputElement | null>;
  idBackRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (file: File, setFile: (file: File) => void, setPreview: (preview: string) => void) => void;
  setIdFrontFile: (file: File) => void;
  setIdBackFile: (file: File) => void;
  setIdFrontPreview: (preview: string) => void;
  setIdBackPreview: (preview: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function IDUploadStep({
  idDocumentType,
  setIdDocumentType,
  idFrontFile,
  idBackFile,
  idFrontPreview,
  idBackPreview,
  idFrontRef,
  idBackRef,
  handleFileSelect,
  setIdFrontFile,
  setIdBackFile,
  setIdFrontPreview,
  setIdBackPreview,
  onNext,
  onBack
}: IDUploadStepProps) {
  const canProceed = idFrontFile && (idDocumentType !== 'driver_license' || idBackFile);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-4">Upload ID Document</h3>
        <p className="text-zinc-400 mb-6">Select your ID type and upload clear photos</p>
      </div>

      {/* ID Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-300">ID Document Type</label>
        <select
          value={idDocumentType}
          onChange={(e) => setIdDocumentType(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        >
          <option value="driver_license">Driver&apos;s License</option>
          <option value="passport">Passport</option>
          <option value="national_id">National ID Card</option>
        </select>
      </div>

      {/* ID Front Upload */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-300">
          {idDocumentType === 'passport' ? 'Passport Photo Page' : 'Front of ID'}
        </label>
        <div
          onClick={() => idFrontRef.current?.click()}
          className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center cursor-pointer hover:border-zinc-500 transition-colors"
        >
          {idFrontPreview ? (
            <div className="mx-auto rounded-lg max-h-48 bg-zinc-800 flex items-center justify-center">
              <span className="text-zinc-400">ID Front Preview</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-zinc-400 text-4xl">📄</div>
              <p className="text-zinc-400">Click to upload ID front</p>
            </div>
          )}
        </div>
        <input
          ref={idFrontRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file, setIdFrontFile, setIdFrontPreview);
          }}
          className="hidden"
        />
      </div>

      {/* ID Back Upload (if driver's license) */}
      {idDocumentType === 'driver_license' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">Back of Driver&apos;s License</label>
          <div
            onClick={() => idBackRef.current?.click()}
            className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center cursor-pointer hover:border-zinc-500 transition-colors"
          >
            {idBackPreview ? (
              <div className="mx-auto rounded-lg max-h-48 bg-zinc-800 flex items-center justify-center">
                <span className="text-zinc-400">ID Back Preview</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-zinc-400 text-4xl">📄</div>
                <p className="text-zinc-400">Click to upload ID back</p>
              </div>
            )}
          </div>
          <input
            ref={idBackRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file, setIdBackFile, setIdBackPreview);
            }}
            className="hidden"
          />
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Next: Selfie Photos
        </button>
      </div>
    </div>
  );
}

// Selfie Upload Step Component - Fixed ref types
interface SelfieUploadStepProps {
  selfieFile: File | null;
  selfieWithIdFile: File | null;
  selfiePreview: string;
  selfieWithIdPreview: string;
  selfieRef: React.RefObject<HTMLInputElement | null>;
  selfieWithIdRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (file: File, setFile: (file: File) => void, setPreview: (preview: string) => void) => void;
  setSelfieFile: (file: File) => void;
  setSelfieWithIdFile: (file: File) => void;
  setSelfiePreview: (preview: string) => void;
  setSelfieWithIdPreview: (preview: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function SelfieUploadStep({
  selfieFile,
  selfieWithIdFile,
  selfiePreview,
  selfieWithIdPreview,
  selfieRef,
  selfieWithIdRef,
  handleFileSelect,
  setSelfieFile,
  setSelfieWithIdFile,
  setSelfiePreview,
  setSelfieWithIdPreview,
  onNext,
  onBack
}: SelfieUploadStepProps) {
  const canProceed = selfieFile && selfieWithIdFile;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-4">Upload Selfie Photos</h3>
        <p className="text-zinc-400 mb-6">Take clear photos of yourself for identity verification</p>
      </div>

      {/* Regular Selfie */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-300">Clear Selfie Photo</label>
        <div
          onClick={() => selfieRef.current?.click()}
          className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center cursor-pointer hover:border-zinc-500 transition-colors"
        >
          {selfiePreview ? (
            <div className="mx-auto rounded-lg max-h-48 bg-zinc-800 flex items-center justify-center">
              <span className="text-zinc-400">Selfie Preview</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-zinc-400 text-4xl">🤳</div>
              <p className="text-zinc-400">Click to upload selfie</p>
            </div>
          )}
        </div>
        <input
          ref={selfieRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file, setSelfieFile, setSelfiePreview);
          }}
          className="hidden"
        />
      </div>

      {/* Selfie with ID */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-300">Selfie Holding Your ID</label>
        <div
          onClick={() => selfieWithIdRef.current?.click()}
          className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center cursor-pointer hover:border-zinc-500 transition-colors"
        >
          {selfieWithIdPreview ? (
            <div className="mx-auto rounded-lg max-h-48 bg-zinc-800 flex items-center justify-center">
              <span className="text-zinc-400">Selfie with ID Preview</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-zinc-400 text-4xl">📱</div>
              <p className="text-zinc-400">Click to upload selfie with ID</p>
            </div>
          )}
        </div>
        <input
          ref={selfieWithIdRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file, setSelfieWithIdFile, setSelfieWithIdPreview);
          }}
          className="hidden"
        />
      </div>

      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">Photo Tips:</h4>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Use good lighting and avoid shadows</li>
          <li>• Face the camera directly</li>
          <li>• Hold your ID clearly visible next to your face</li>
          <li>• Make sure all text on ID is readable</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Next: Review
        </button>
      </div>
    </div>
  );
}

// Review Step Component - Simple previews without images
interface ReviewStepProps {
  idDocumentType: string;
  idFrontPreview: string;
  idBackPreview: string;
  selfiePreview: string;
  selfieWithIdPreview: string;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

function ReviewStep({
  idDocumentType,
  idFrontPreview,
  idBackPreview,
  selfiePreview,
  selfieWithIdPreview,
  onSubmit,
  onBack,
  loading
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-4">Review Your Submission</h3>
        <p className="text-zinc-400 mb-6">Please review all photos before submitting</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-white font-medium">ID Document ({idDocumentType.replace('_', ' ')})</h4>
          <div className="space-y-3">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Front:</p>
              <div className="w-full h-32 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center">
                <span className="text-zinc-500">
                  {idFrontPreview ? 'ID Front Uploaded ✓' : 'No image'}
                </span>
              </div>
            </div>
            {idBackPreview && (
              <div>
                <p className="text-zinc-400 text-sm mb-2">Back:</p>
                <div className="w-full h-32 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center">
                  <span className="text-zinc-500">ID Back Uploaded ✓</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-white font-medium">Selfie Photos</h4>
          <div className="space-y-3">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Selfie:</p>
              <div className="w-full h-32 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center">
                <span className="text-zinc-500">
                  {selfiePreview ? 'Selfie Uploaded ✓' : 'No image'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-2">Selfie with ID:</p>
              <div className="w-full h-32 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center">
                <span className="text-zinc-500">
                  {selfieWithIdPreview ? 'Selfie with ID Uploaded ✓' : 'No image'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
        <p className="text-green-300 text-sm">
          ✓ All photos look good? Submit for verification. Our team will review within 24 hours.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            'Submit for Verification'
          )}
        </button>
      </div>
    </div>
  );
} 
