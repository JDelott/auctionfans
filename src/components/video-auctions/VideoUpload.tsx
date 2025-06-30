'use client';

import { useState, useRef } from 'react';

interface VideoSession {
  id: string;
  creator_id: string;
  video_url: string;
  status: string;
  created_at: string;
}

interface Screenshot {
  id: string;
  timestamp: number;
  imageUrl: string;
}

interface VideoUploadProps {
  onVideoUploadComplete: (videoSession: VideoSession) => void;
  onScreenshotsUploadComplete: (videoSession: VideoSession, screenshots: Screenshot[]) => void;
}

export default function VideoUpload({ onVideoUploadComplete, onScreenshotsUploadComplete }: VideoUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<'video' | 'screenshots'>('video');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Handle video file upload
  const handleVideoSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) { // 500MB limit
      setError('Video file must be under 500MB');
      return;
    }

    uploadVideoFile(file);
  };

  const uploadVideoFile = async (file: File) => {
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/video-sessions/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (response.ok) {
        setTimeout(() => {
          onVideoUploadComplete(data.videoSession);
        }, 500);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle screenshot files upload
  const handleScreenshotsSelect = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('Please select image files');
      return;
    }

    if (imageFiles.length > 20) {
      setError('Maximum 20 screenshots allowed');
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      // Create a proper video session for screenshots
      const sessionResponse = await fetch('/api/video-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source: 'screenshots'
        })
      });

      const sessionData = await sessionResponse.json();
      if (!sessionResponse.ok) {
        throw new Error(sessionData.error || 'Failed to create session');
      }

      const videoSession = sessionData.videoSession;
      const uploadedScreenshots: Screenshot[] = [];

      // Upload each screenshot
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        // Convert to base64
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        const imageData = base64Data.split(',')[1]; // Remove data:image/...;base64,

        // Save screenshot
        const screenshotResponse = await fetch('/api/video-sessions/screenshots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoSessionId: videoSession.id,
            timestamp: i * 10, // Assign timestamps (0, 10, 20, etc.)
            imageData
          })
        });

        const screenshotData = await screenshotResponse.json();
        
        if (screenshotResponse.ok) {
          uploadedScreenshots.push({
            id: screenshotData.screenshot.id,
            timestamp: i * 10,
            imageUrl: screenshotData.screenshot.image_url
          });
        }

        // Update progress
        setProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      }

      setTimeout(() => {
        onScreenshotsUploadComplete(videoSession, uploadedScreenshots);
      }, 500);

    } catch (error) {
      console.error('Screenshot upload failed:', error);
      setError('Failed to upload screenshots. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (uploadMethod === 'video' && files.length > 0) {
      handleVideoSelect(files[0]);
    } else if (uploadMethod === 'screenshots' && files.length > 0) {
      const fileList = e.dataTransfer.files;
      handleScreenshotsSelect(fileList);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Add Your Content</h2>
        <p className="text-zinc-400">
          Upload a video to capture screenshots from, or upload screenshots directly if you already have them.
        </p>
      </div>

      {/* Method Selection */}
      <div className="flex rounded-lg bg-zinc-900/50 p-1 mb-8">
        <button
          onClick={() => setUploadMethod('video')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
            uploadMethod === 'video'
              ? 'bg-violet-600 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          📹 Upload Video
        </button>
        <button
          onClick={() => setUploadMethod('screenshots')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
            uploadMethod === 'screenshots'
              ? 'bg-violet-600 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          📸 Upload Screenshots
        </button>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive 
            ? 'border-violet-500 bg-violet-500/10' 
            : 'border-zinc-700 hover:border-zinc-600'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {!uploading ? (
          <>
            <div className="mb-6">
              <svg className="w-16 h-16 text-zinc-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {uploadMethod === 'video' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                )}
              </svg>
              <h3 className="text-white font-medium mb-2">
                {uploadMethod === 'video' ? 'Drop your video here' : 'Drop your screenshots here'}
              </h3>
              <p className="text-zinc-400 text-sm">or click to browse files</p>
            </div>

            <button
              onClick={() => {
                if (uploadMethod === 'video') {
                  fileInputRef.current?.click();
                } else {
                  screenshotInputRef.current?.click();
                }
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {uploadMethod === 'video' ? 'Choose Video File' : 'Choose Screenshot Files'}
            </button>

            {/* Video Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleVideoSelect(file);
              }}
              className="hidden"
            />

            {/* Screenshots Input */}
            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files) handleScreenshotsSelect(files);
              }}
              className="hidden"
            />

            <div className="mt-6 text-xs text-zinc-500">
              {uploadMethod === 'video' ? (
                <>
                  <p>Supported formats: MP4, MOV, AVI, MKV</p>
                  <p>Maximum file size: 500MB</p>
                </>
              ) : (
                <>
                  <p>Supported formats: JPG, PNG, GIF, WebP</p>
                  <p>Maximum: 20 screenshots</p>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto">
              <svg className="w-16 h-16 text-violet-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            
            <div>
              <p className="text-white font-medium mb-2">
                {uploadMethod === 'video' ? 'Uploading video...' : 'Uploading screenshots...'}
              </p>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div 
                  className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-zinc-400 text-sm mt-1">{progress}%</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
