import React, { useCallback, useRef } from 'react';
import { Upload, ImageIcon, Zap } from './Icons';

interface UploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const Uploader: React.FC<UploaderProps> = ({ onFileSelect, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        type="file"
        ref={inputRef}
        onChange={handleInputChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        disabled={isLoading}
      />
      
      <div 
        onClick={isLoading ? undefined : handleClick}
        className={`
          group relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300
          ${isLoading 
            ? 'border-gray-700 bg-gray-900/50 cursor-wait opacity-70' 
            : 'border-gray-600 hover:border-blue-500 hover:bg-gray-800/50 cursor-pointer bg-gray-900/30'
          }
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="flex flex-col items-center justify-center gap-4 relative z-10">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl border border-gray-700 group-hover:border-blue-500/50">
            {isLoading ? (
              <Zap className="w-10 h-10 text-blue-400 animate-pulse" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-400 transition-colors" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white group-hover:text-blue-200 transition-colors">
              {isLoading ? 'Processing Image...' : 'Upload Image to Upscale'}
            </h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              {isLoading 
                ? 'Gemini 2.5 Flash is enhancing your image. This may take a moment.' 
                : 'Select a PNG, JPG or WEBP image. We recommend images under 10MB.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};