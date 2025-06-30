'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface Screenshot {
  id: string;
  timestamp: number;
  imageUrl: string;
}

interface VideoPlayerProps {
  videoUrl: string;
  videoSessionId: string;
  onScreenshotCaptured: (screenshot: Screenshot) => void;
  screenshots: Screenshot[];
}

export default function VideoPlayer({ videoUrl, videoSessionId, onScreenshotCaptured, screenshots }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const captureScreenshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx?.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Send to API to save
      const response = await fetch('/api/video-sessions/screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoSessionId,
          timestamp: Math.floor(currentTime),
          imageData: imageData.split(',')[1] // Remove data:image/jpeg;base64,
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        onScreenshotCaptured({
          id: data.screenshot.id,
          timestamp: Math.floor(currentTime),
          imageUrl: data.screenshot.image_url
        });
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error);
    } finally {
      setCapturing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
        <h2 className="text-xl font-bold text-white mb-4">
          Capture Screenshots of Items
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          Scrub through your video and capture screenshots when items appear that you want to sell.
        </p>

        {/* Video Player */}
        <div className="relative bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Timeline */}
          <div className="flex items-center space-x-4">
            <span className="text-zinc-400 text-sm font-mono">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-zinc-400 text-sm font-mono">
              {formatTime(duration)}
            </span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={togglePlay}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button
              onClick={captureScreenshot}
              disabled={capturing}
              className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {capturing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Capturing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Capture Screenshot</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Screenshots Grid */}
        {screenshots.length > 0 && (
          <div className="mt-8">
            <h3 className="text-white font-medium mb-4">
              Captured Screenshots ({screenshots.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {screenshots.map((screenshot) => (
                <div key={screenshot.id} className="relative group">
                  <Image
                    src={screenshot.imageUrl}
                    alt={`Screenshot at ${formatTime(screenshot.timestamp)}`}
                    width={200}
                    height={150}
                    className="w-full h-24 object-cover rounded-lg border border-zinc-700"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/75 text-white text-xs px-2 py-1 rounded">
                    {formatTime(screenshot.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
