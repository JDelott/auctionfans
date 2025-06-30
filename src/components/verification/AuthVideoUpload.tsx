'use client';

import { useState, useRef, useCallback, useMemo } from 'react';

interface AuthVideoUploadProps {
  onVideoUploaded: () => void;
  onCancel: () => void;
}

export default function AuthVideoUpload({ onVideoUploaded, onCancel }: AuthVideoUploadProps) {
  const [step, setStep] = useState<'instructions' | 'recording' | 'upload' | 'uploading'>('instructions');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [declarationText, setDeclarationText] = useState('');
  const [declaredItemsCount, setDeclaredItemsCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Memoize video URL to prevent recreation on every render
  const videoUrl = useMemo(() => {
    return videoFile ? URL.createObjectURL(videoFile) : null;
  }, [videoFile]);

  // Optimize text change handler
  const handleDeclarationTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDeclarationText(e.target.value);
  }, []);

  // Optimize items count change handler
  const handleItemsCountChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDeclaredItemsCount(parseInt(e.target.value));
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setStep('upload');
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!videoFile || !declarationText) {
      setError('Please complete all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('declarationText', declarationText);
      formData.append('declaredItemsCount', declaredItemsCount.toString());

      const response = await fetch('/api/creator-verification/auth-video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onVideoUploaded();
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [videoFile, declarationText, declaredItemsCount, onVideoUploaded]);

  // Memoize video preview component
  const VideoPreview = useMemo(() => {
    if (!videoFile || !videoUrl) return null;

    return (
      <div className="relative mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-violet-500/5 rounded-2xl blur-xl"></div>
        <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            <h3 className="text-lg font-bold text-white tracking-tight">Video Preview</h3>
          </div>
          
          <div className="relative bg-zinc-950/80 rounded-xl overflow-hidden border border-zinc-800/50 max-w-2xl mx-auto">
            <video
              ref={videoRef}
              controls
              className="w-full h-auto max-h-96 bg-zinc-900"
              src={videoUrl}
              style={{ objectFit: 'contain' }}
            />
          </div>
          
          <div className="mt-6 bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-sm text-zinc-300 font-medium">{videoFile.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                <span>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>
                <span>•</span>
                <span className="px-2 py-1 bg-emerald-900/50 text-emerald-300 rounded">
                  READY
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs text-zinc-500 font-mono">
              Preview your video above before submitting for verification
            </div>
          </div>
        </div>
      </div>
    );
  }, [videoFile, videoUrl]);

  if (step === 'instructions') {
    return (
      <div className="min-h-screen bg-zinc-950 py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
              Upload Authentication Video
            </h1>
            <p className="text-xl text-zinc-300 max-w-2xl mx-auto font-light">
              Upload your video proof of ownership for item authentication
            </p>
          </div>

          {/* Requirements Card */}
          <div className="relative mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-violet-500/5 rounded-2xl blur-xl"></div>
            <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                <h3 className="text-xl font-bold text-white tracking-tight">Video Requirements</h3>
              </div>
              
              <div className="grid gap-4">
                {[
                  'Show your face clearly throughout the video',
                  'Hold up each item you want to authenticate',
                  'Clearly state: "I am [Your Name] and I own these items"',
                  'Mention when/where each item appeared in your published content',
                  'Describe each item (name, condition, any unique features)',
                  'Keep video under 5 minutes'
                ].map((requirement, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{requirement}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="relative mb-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent rounded-2xl blur-xl"></div>
            <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-violet-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-violet-500/20 border border-violet-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-violet-300 font-medium mb-2">Important</h4>
                  <p className="text-zinc-300 leading-relaxed">
                    This video will be linked to all items you create from it. You can declare up to <span className="text-white font-medium">10 items</span> in one video.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={onCancel}
              className="group relative overflow-hidden border border-zinc-700/50 hover:border-zinc-600/80 bg-zinc-950/90 px-6 py-3 rounded-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative text-zinc-300 group-hover:text-white font-medium tracking-wider">CANCEL</span>
            </button>
            <button
              onClick={() => setStep('recording')}
              className="group relative overflow-hidden border border-emerald-500/40 hover:border-emerald-400/80 bg-zinc-950/90 px-6 py-3 rounded-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative text-emerald-300 group-hover:text-white font-medium tracking-wider">UPLOAD VIDEO</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'recording') {
    return (
      <div className="min-h-screen bg-zinc-950 py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
              Upload Authentication Video
            </h1>
            <p className="text-xl text-zinc-300 max-w-2xl mx-auto font-light">
              Select your recorded video file
            </p>
          </div>

          {/* Upload Area */}
          <div className="relative mb-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-violet-500/5 rounded-2xl blur-xl"></div>
            <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-12">
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="video/*"
                className="hidden"
              />
              
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">Upload Your Video</h3>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                  Select your authentication video file. Supported formats: MP4, MOV, AVI up to 100MB
                </p>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative overflow-hidden border border-emerald-500/40 hover:border-emerald-400/80 bg-zinc-950/90 px-6 py-3 rounded-lg transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative text-emerald-300 group-hover:text-white font-medium tracking-wider">CHOOSE VIDEO FILE</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setStep('instructions')}
              className="group relative overflow-hidden border border-zinc-700/50 hover:border-zinc-600/80 bg-zinc-950/90 px-6 py-3 rounded-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative text-zinc-300 group-hover:text-white font-medium tracking-wider">← BACK</span>
            </button>
            <button
              onClick={onCancel}
              className="group relative overflow-hidden border border-zinc-700/50 hover:border-zinc-600/80 bg-zinc-950/90 px-6 py-3 rounded-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative text-zinc-300 group-hover:text-white font-medium tracking-wider">CANCEL</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-zinc-950 py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
              Video Declaration Details
            </h1>
            <p className="text-xl text-zinc-300 max-w-2xl mx-auto font-light">
              Provide details about your authentication video
            </p>
          </div>

          {/* Video Preview - Memoized */}
          {VideoPreview}

          {/* Form */}
          <div className="space-y-8">
            {/* Items Count */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent rounded-2xl blur-xl"></div>
              <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-violet-400 rounded-full"></div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Items Declared</h3>
                </div>
                
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  How many items are you declaring in this video?
                </label>
                
                <select
                  value={declaredItemsCount}
                  onChange={handleItemsCountChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num} className="bg-zinc-800">
                      {num} item{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Declaration Summary */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-2xl blur-xl"></div>
              <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Declaration Summary</h3>
                </div>
                
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Briefly describe what you declared in the video
                </label>
                
                <textarea
                  value={declarationText}
                  onChange={handleDeclarationTextChange}
                  placeholder="Example: 'Vintage Nike Air Jordan 1, red and black, size 10, good condition with original box. Supreme Box Logo hoodie, black, size large, worn once.'"
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                  required
                />
                
                <p className="text-sm text-zinc-500 mt-3 font-mono">
                  This helps our verification team match your video to your listings
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent rounded-2xl blur-xl"></div>
                <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep('recording')}
                disabled={loading}
                className="group relative overflow-hidden border border-zinc-700/50 hover:border-zinc-600/80 bg-zinc-950/90 px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative text-zinc-300 group-hover:text-white font-medium tracking-wider">CHANGE VIDEO</span>
              </button>
              <button
                onClick={handleUpload}
                disabled={loading || !declarationText}
                className="group relative overflow-hidden border border-violet-500/40 hover:border-violet-400/80 bg-zinc-950/90 px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative text-violet-300 group-hover:text-white font-medium tracking-wider">
                  {loading ? 'UPLOADING...' : 'SUBMIT FOR VERIFICATION'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 
