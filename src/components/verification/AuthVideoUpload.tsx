'use client';

import { useState, useRef } from 'react';

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setStep('upload');
    }
  };

  const handleUpload = async () => {
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
  };

  if (step === 'instructions') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Record Your Authentication Video</h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Video Requirements</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Show your face clearly throughout the video
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Hold up each item you want to authenticate
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Clearly state: &quot;I am [Your Name] and I own these items&quot;
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Describe each item (name, condition, any unique features)
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Keep video under 5 minutes
            </li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            <strong>Important:</strong> This video will be linked to all items you create from it. 
            You can declare up to 10 items in one video.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStep('recording')}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Recording
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 'recording') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Upload Your Authentication Video</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/*"
            className="hidden"
          />
          
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          
          <p className="text-lg font-medium text-gray-900 mb-2">Click to upload your video</p>
          <p className="text-gray-500">MP4, MOV, AVI up to 100MB</p>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choose Video File
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStep('instructions')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Video Declaration Details</h2>
        
        {videoFile && (
          <div className="mb-6">
            <video
              ref={videoRef}
              controls
              className="w-full rounded-lg"
              src={URL.createObjectURL(videoFile)}
            />
            <p className="text-sm text-gray-600 mt-2">
              Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many items are you declaring in this video?
            </label>
            <select
              value={declaredItemsCount}
              onChange={(e) => setDeclaredItemsCount(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <option key={num} value={num}>{num} item{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Declaration Summary
            </label>
            <textarea
              value={declarationText}
              onChange={(e) => setDeclarationText(e.target.value)}
              placeholder="Briefly describe what you declared in the video (e.g., 'Vintage Nike Air Jordan 1, red and black, size 10, good condition with original box')"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              This helps our verification team match your video to your listings
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep('recording')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Change Video
            </button>
            <button
              onClick={handleUpload}
              disabled={loading || !declarationText}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : 'Submit for Verification'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 
