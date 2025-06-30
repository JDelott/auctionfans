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
        <div className="relative bg-red-950/50 backdrop-blur-sm border border-red-800/50 rounded-lg p-4 mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-300 text-xs mt-2 transition-colors duration-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {step === 'instructions' && (
        <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-32 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
          <div className="absolute bottom-0 right-1/4 w-24 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
          
          <div className="text-center space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Identity Verification</h3>
              <p className="text-zinc-400 leading-relaxed">Secure verification process using government-issued ID</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="group relative bg-zinc-950/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="w-3 h-3 bg-violet-500/40 rounded-full mx-auto mb-4 group-hover:bg-violet-400/60 transition-colors duration-300"></div>
                <h4 className="text-white font-medium mb-2 tracking-wide">Government ID</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">Driver&apos;s license, passport, or national ID card</p>
              </div>
              <div className="group relative bg-zinc-950/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="w-3 h-3 bg-emerald-500/40 rounded-full mx-auto mb-4 group-hover:bg-emerald-400/60 transition-colors duration-300"></div>
                <h4 className="text-white font-medium mb-2 tracking-wide">Identity Photos</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">Clear photos of yourself and holding your ID</p>
              </div>
            </div>

            <div className="relative bg-violet-950/30 backdrop-blur-sm border border-violet-800/30 rounded-lg p-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
              <div className="relative flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"></div>
                <p className="text-violet-300 text-sm">Verification processed instantly upon submission</p>
              </div>
            </div>

            <button
              onClick={() => setStep('id-upload')}
              className="group relative overflow-hidden border border-violet-500/40 hover:border-violet-400/80 bg-zinc-950/90 px-8 py-4 rounded-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                <div className="w-1 h-1 bg-violet-400 rounded-full group-hover:shadow-sm group-hover:shadow-violet-400"></div>
                <span className="text-violet-300 group-hover:text-white font-medium tracking-wider">BEGIN VERIFICATION</span>
              </div>
            </button>
          </div>
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
        <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
          
          <div className="relative text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <div className="text-white text-2xl font-bold">✓</div>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Verification Complete</h3>
            <p className="text-zinc-300 leading-relaxed max-w-md mx-auto">
              Your identity has been successfully verified. You can now proceed to the next step.
            </p>
            <div className="relative bg-violet-950/30 backdrop-blur-sm border border-violet-800/30 rounded-lg p-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
              <div className="relative flex items-center justify-center gap-4 text-violet-300 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                  <span>Verification complete</span>
                </div>
                <div className="w-[1px] h-4 bg-violet-800/50"></div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                  <span>Ready for next step</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step !== 'submitted' && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onCancel}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors duration-300 tracking-wide"
          >
            Cancel Process
          </button>
        </div>
      )}
    </div>
  );
}

// ID Upload Step Component
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
    <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 overflow-hidden">
      <div className="absolute top-0 left-1/4 w-32 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
      
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Upload ID Document</h3>
          <p className="text-zinc-400 mb-6 leading-relaxed">Select your ID type and upload clear photos</p>
        </div>

        {/* ID Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300 tracking-wide uppercase">ID Document Type</label>
          <select
            value={idDocumentType}
            onChange={(e) => setIdDocumentType(e.target.value)}
            className="w-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-300"
          >
            <option value="driver_license">Driver&apos;s License</option>
            <option value="passport">Passport</option>
            <option value="national_id">National ID Card</option>
          </select>
        </div>

        {/* ID Front Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300 tracking-wide uppercase">
            {idDocumentType === 'passport' ? 'Passport Photo Page' : 'Front of ID'}
          </label>
          <div
            onClick={() => idFrontRef.current?.click()}
            className="group relative border-2 border-dashed border-zinc-700/50 hover:border-violet-500/50 rounded-lg p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {idFrontPreview ? (
              <div className="relative mx-auto rounded-lg h-32 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="font-medium tracking-wide">ID Front Uploaded</span>
                </div>
              </div>
            ) : (
              <div className="relative space-y-3">
                <div className="w-4 h-4 bg-violet-500/40 rounded-full mx-auto group-hover:bg-violet-400/60 transition-colors duration-300"></div>
                <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 tracking-wide">Click to upload ID front</p>
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
            <label className="block text-sm font-medium text-zinc-300 tracking-wide uppercase">Back of Driver&apos;s License</label>
            <div
              onClick={() => idBackRef.current?.click()}
              className="group relative border-2 border-dashed border-zinc-700/50 hover:border-violet-500/50 rounded-lg p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {idBackPreview ? (
                <div className="relative mx-auto rounded-lg h-32 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="font-medium tracking-wide">ID Back Uploaded</span>
                  </div>
                </div>
              ) : (
                <div className="relative space-y-3">
                  <div className="w-4 h-4 bg-violet-500/40 rounded-full mx-auto group-hover:bg-violet-400/60 transition-colors duration-300"></div>
                  <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 tracking-wide">Click to upload ID back</p>
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
            className="flex-1 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 hover:border-zinc-600/50 text-white py-3 rounded-lg font-medium transition-all duration-300 tracking-wide"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 group relative overflow-hidden border border-violet-500/40 hover:border-violet-400/80 bg-zinc-950/90 disabled:border-zinc-700/50 disabled:bg-zinc-800/50 text-white py-3 rounded-lg font-medium transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span className={`tracking-wider ${canProceed ? 'text-violet-300 group-hover:text-white' : 'text-zinc-500'}`}>
                Next: Identity Photos
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Selfie Upload Step Component
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
    <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 overflow-hidden">
      <div className="absolute top-0 right-1/4 w-32 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Upload Identity Photos</h3>
          <p className="text-zinc-400 mb-6 leading-relaxed">Take clear photos of yourself for identity verification</p>
        </div>

        {/* Regular Selfie */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300 tracking-wide uppercase">Clear Photo of Yourself</label>
          <div
            onClick={() => selfieRef.current?.click()}
            className="group relative border-2 border-dashed border-zinc-700/50 hover:border-emerald-500/50 rounded-lg p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {selfiePreview ? (
              <div className="relative mx-auto rounded-lg h-32 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="font-medium tracking-wide">Selfie Uploaded</span>
                </div>
              </div>
            ) : (
              <div className="relative space-y-3">
                <div className="w-4 h-4 bg-emerald-500/40 rounded-full mx-auto group-hover:bg-emerald-400/60 transition-colors duration-300"></div>
                <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 tracking-wide">Click to upload selfie</p>
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
          <label className="block text-sm font-medium text-zinc-300 tracking-wide uppercase">Photo Holding Your ID</label>
          <div
            onClick={() => selfieWithIdRef.current?.click()}
            className="group relative border-2 border-dashed border-zinc-700/50 hover:border-emerald-500/50 rounded-lg p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {selfieWithIdPreview ? (
              <div className="relative mx-auto rounded-lg h-32 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="font-medium tracking-wide">Selfie with ID Uploaded</span>
                </div>
              </div>
            ) : (
              <div className="relative space-y-3">
                <div className="w-4 h-4 bg-emerald-500/40 rounded-full mx-auto group-hover:bg-emerald-400/60 transition-colors duration-300"></div>
                <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 tracking-wide">Click to upload selfie with ID</p>
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

        <div className="relative bg-violet-950/30 backdrop-blur-sm border border-violet-800/30 rounded-lg p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
          <div className="relative">
            <h4 className="text-violet-300 font-medium mb-3 tracking-wide uppercase text-sm">Photo Guidelines</h4>
            <ul className="text-violet-200 text-sm space-y-2 leading-relaxed">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-violet-400 rounded-full"></div>
                Use good lighting and avoid shadows
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-violet-400 rounded-full"></div>
                Face the camera directly
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-violet-400 rounded-full"></div>
                Hold your ID clearly visible next to your face
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-violet-400 rounded-full"></div>
                Ensure all text on ID is readable
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 hover:border-zinc-600/50 text-white py-3 rounded-lg font-medium transition-all duration-300 tracking-wide"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 group relative overflow-hidden border border-emerald-500/40 hover:border-emerald-400/80 bg-zinc-950/90 disabled:border-zinc-700/50 disabled:bg-zinc-800/50 text-white py-3 rounded-lg font-medium transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span className={`tracking-wider ${canProceed ? 'text-emerald-300 group-hover:text-white' : 'text-zinc-500'}`}>
                Next: Review
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Review Step Component
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
    <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
      
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Review Submission</h3>
          <p className="text-zinc-400 mb-6 leading-relaxed">Verify all documents before final submission</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-white font-medium tracking-wide uppercase text-sm">ID Document ({idDocumentType.replace('_', ' ')})</h4>
            <div className="space-y-4">
              <div>
                <p className="text-zinc-400 text-sm mb-2 tracking-wide">Front Side</p>
                <div className="w-full h-32 bg-zinc-950/60 backdrop-blur-sm border border-zinc-700/50 rounded-lg flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${idFrontPreview ? 'bg-emerald-400' : 'bg-zinc-600'}`}></div>
                    <span className={`text-sm font-medium tracking-wide ${idFrontPreview ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {idFrontPreview ? 'ID Front Uploaded' : 'No Image'}
                    </span>
                  </div>
                </div>
              </div>
              {idBackPreview && (
                <div>
                  <p className="text-zinc-400 text-sm mb-2 tracking-wide">Back Side</p>
                  <div className="w-full h-32 bg-zinc-950/60 backdrop-blur-sm border border-zinc-700/50 rounded-lg flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-emerald-400 text-sm font-medium tracking-wide">ID Back Uploaded</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium tracking-wide uppercase text-sm">Identity Photos</h4>
            <div className="space-y-4">
              <div>
                <p className="text-zinc-400 text-sm mb-2 tracking-wide">Personal Photo</p>
                <div className="w-full h-32 bg-zinc-950/60 backdrop-blur-sm border border-zinc-700/50 rounded-lg flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selfiePreview ? 'bg-emerald-400' : 'bg-zinc-600'}`}></div>
                    <span className={`text-sm font-medium tracking-wide ${selfiePreview ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {selfiePreview ? 'Selfie Uploaded' : 'No Image'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-2 tracking-wide">Photo with ID</p>
                <div className="w-full h-32 bg-zinc-950/60 backdrop-blur-sm border border-zinc-700/50 rounded-lg flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selfieWithIdPreview ? 'bg-emerald-400' : 'bg-zinc-600'}`}></div>
                    <span className={`text-sm font-medium tracking-wide ${selfieWithIdPreview ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {selfieWithIdPreview ? 'Selfie with ID Uploaded' : 'No Image'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative bg-emerald-950/30 backdrop-blur-sm border border-emerald-800/30 rounded-lg p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <p className="text-emerald-300 text-sm">Ready for submission. Verification will be processed instantly.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 hover:border-zinc-600/50 disabled:border-zinc-800/50 text-white py-3 rounded-lg font-medium transition-all duration-300 tracking-wide"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 group relative overflow-hidden border border-emerald-500/40 hover:border-emerald-400/80 bg-zinc-950/90 disabled:border-zinc-700/50 text-white py-3 rounded-lg font-medium transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400"></div>
                  <span className="text-emerald-300 tracking-wider">Submitting...</span>
                </>
              ) : (
                <span className="text-emerald-300 group-hover:text-white tracking-wider">Submit for Verification</span>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
