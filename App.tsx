import React, { useState } from 'react';
import { 
  Zap, 
  ArrowRight, 
  Download, 
  AlertCircle, 
  Loader2, 
  Maximize2,
  CheckCircle2,
  Scan,
  Eraser
} from './components/Icons';
import { Uploader } from './components/Uploader';
import { ComparisonSlider } from './components/ComparisonSlider';
import { upscaleImage } from './services/geminiService';
import { AppStatus, ImageData, UpscaleMode, DetailLevel } from './types';

// Utility to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      }
    };
    reader.onerror = error => reject(error);
  });
};

const getImageDimensions = (url: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upscaleMode, setUpscaleMode] = useState<UpscaleMode>('standard');
  const [removeBackground, setRemoveBackground] = useState(false);
  const [creativity, setCreativity] = useState(0.3);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('medium');
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (file: File) => {
    try {
      setError(null);
      setStatus(AppStatus.SELECTING_IMAGE);
      
      const objectUrl = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      const dims = await getImageDimensions(objectUrl);
      
      setOriginalImage({
        url: objectUrl,
        base64: base64,
        mimeType: file.type,
        width: dims.width,
        height: dims.height
      });
      
      // Auto-suggest mode based on size
      if (dims.width < 1000 && dims.height < 1000) {
        setUpscaleMode('2x');
      } else {
        setUpscaleMode('standard');
      }
      
      setStatus(AppStatus.READY_TO_UPSCALE);
    } catch (e: any) {
      setError("Failed to process local file");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleUpscale = async () => {
    if (!originalImage) return;
    
    let interval: NodeJS.Timeout | null = null;

    try {
      setStatus(AppStatus.PROCESSING);
      setError(null);
      setProgress(0);

      // Simulate progress
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          // Fast at first, then slower
          const increment = prev < 30 ? 5 : prev < 60 ? 2 : 0.5;
          return Math.min(prev + increment, 90);
        });
      }, 200);
      
      const resultDataUrl = await upscaleImage(
        originalImage.base64, 
        originalImage.mimeType,
        originalImage.width || 1024,
        originalImage.height || 1024,
        {
          mode: upscaleMode,
          removeBackground,
          creativity,
          detailLevel
        }
      );
      
      if (interval) clearInterval(interval);
      setProgress(100);
      
      // Small delay to show 100% before switching view
      setTimeout(() => {
        setProcessedImage(resultDataUrl);
        setStatus(AppStatus.SUCCESS);
      }, 500);
      
    } catch (e: any) {
      if (interval) clearInterval(interval);
      console.error(e);
      setError(e.message || "Upscaling failed. Please try again.");
      setStatus(AppStatus.ERROR);
      setProgress(0);
    }
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setUpscaleMode('standard');
    setRemoveBackground(false);
    setCreativity(0.3);
    setDetailLevel('medium');
    setProgress(0);
  };

  // Helper to calculate suggestion text
  const getSuggestion = () => {
    if (!originalImage?.width) return null;
    if (originalImage.width < 800) return "Image is small. 2x Enhance is recommended for better clarity.";
    if (originalImage.width > 2000) return "Image is large. Standard mode recommended to avoid downscaling.";
    return "Standard mode is optimal for this resolution.";
  };

  return (
    <div className="min-h-screen bg-[#020617] text-gray-100 overflow-x-hidden selection:bg-blue-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Maximize2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Lumina
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              Free AI
            </span>
          </div>

          <div className="flex items-center gap-4">
               <div className="hidden sm:flex items-center gap-2 text-xs text-blue-400 bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-900/30">
                 <CheckCircle2 className="w-3 h-3" />
                 <span>Gemini Flash Active</span>
               </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        
        {/* Intro Hero - Only show when IDLE */}
        {status === AppStatus.IDLE && (
          <div className="text-center mb-16 space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
              Upscale with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Gemini Flash</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Enhance resolution and details using Google's efficient Gemini 2.5 Flash model. 
              Fast, free-tier friendly, and powerful image restoration.
            </p>
          </div>
        )}

        {/* Action Area */}
        <div className="space-y-8">
          
          {/* Uploader Section */}
          {status === AppStatus.IDLE && (
             <div className="transition-all duration-500">
                <Uploader onFileSelect={handleFileSelect} isLoading={false} />
             </div>
          )}

          {/* Preview & Processing Section */}
          {(status === AppStatus.READY_TO_UPSCALE || status === AppStatus.PROCESSING) && originalImage && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              <div className="bg-gray-900/40 rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-start gap-8">
                  {/* Left Column: Image */}
                  <div className="w-full lg:w-1/2 space-y-4">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/50 border border-gray-800">
                      <img src={originalImage.url} alt="Preview" className="w-full h-full object-contain" />
                      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur text-xs font-mono px-2 py-1 rounded border border-white/10 text-gray-300">
                        {originalImage.width} x {originalImage.height} px
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column: Controls & Stats */}
                  <div className="flex-1 space-y-6 w-full">
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-2">Configuration</h3>
                      <p className="text-gray-400 text-sm">
                        Analyze and configure your enhancement settings.
                      </p>
                    </div>

                    {status === AppStatus.READY_TO_UPSCALE && (
                      <div className="space-y-4">
                        {/* Suggestions Panel */}
                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                           <div className="bg-blue-500/20 p-1.5 rounded-lg shrink-0">
                             <Zap className="w-4 h-4 text-blue-400" />
                           </div>
                           <div className="space-y-1">
                             <div className="text-xs font-semibold text-blue-300 uppercase tracking-wide">AI Suggestion</div>
                             <p className="text-sm text-gray-300">{getSuggestion()}</p>
                           </div>
                        </div>

                        {/* Mode Selector */}
                        <div className="grid grid-cols-2 gap-4 bg-gray-800/50 p-1 rounded-xl border border-white/5">
                          <button
                            onClick={() => setUpscaleMode('standard')}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                              upscaleMode === 'standard' 
                                ? 'bg-gray-700 text-white shadow-lg border border-white/10' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                          >
                            <Zap className="w-4 h-4" />
                            <span className="font-medium text-sm">Standard</span>
                          </button>
                          <button
                            onClick={() => setUpscaleMode('2x')}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                              upscaleMode === '2x' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/20' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                          >
                            <Scan className="w-4 h-4" />
                            <span className="font-medium text-sm">2x Enhance</span>
                          </button>
                        </div>

                        {/* Background Removal Toggle */}
                        <div className="bg-gray-800/50 p-3 rounded-xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => setRemoveBackground(!removeBackground)}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${removeBackground ? 'bg-red-500/20 text-red-400' : 'bg-gray-700/50 text-gray-400'}`}>
                              <Eraser className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium transition-colors ${removeBackground ? 'text-white' : 'text-gray-400'}`}>Remove Background</span>
                              <span className="text-[10px] text-gray-500 leading-tight">Replace background with white</span>
                            </div>
                          </div>
                          <div className={`w-10 h-5 rounded-full transition-colors relative ${removeBackground ? 'bg-blue-500' : 'bg-gray-700'}`}>
                            <div className={`absolute top-1 bottom-1 w-3 h-3 bg-white rounded-full transition-all ${removeBackground ? 'left-6' : 'left-1'}`} />
                          </div>
                        </div>

                        {/* Advanced Controls */}
                        <div className="space-y-4 pt-2 border-t border-white/5">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium text-gray-300">Creativity (Temperature)</label>
                              <span className="text-xs text-gray-500">{creativity.toFixed(1)}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={creativity}
                              onChange={(e) => setCreativity(parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>Precise</span>
                              <span>Balanced</span>
                              <span>Creative</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Detail Level</label>
                            <div className="bg-gray-800/50 p-1 rounded-lg border border-white/5 flex relative">
                              {(['low', 'medium', 'high'] as DetailLevel[]).map((level) => (
                                <button
                                  key={level}
                                  onClick={() => setDetailLevel(level)}
                                  className={`flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all ${
                                    detailLevel === level
                                      ? 'bg-gray-700 text-white shadow-sm ring-1 ring-white/5'
                                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                  }`}
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-gray-900/50 p-3 rounded-lg border border-white/5">
                             <div className="text-gray-500 text-xs mb-1">Target Output</div>
                             <div className="text-sm font-semibold text-white">
                               {upscaleMode === '2x' && originalImage.width && originalImage.height
                                 ? `${originalImage.width * 2} x ${originalImage.height * 2} px`
                                 : 'Enhanced Quality'}
                             </div>
                           </div>
                           <div className="bg-gray-900/50 p-3 rounded-lg border border-white/5">
                             <div className="text-gray-500 text-xs mb-1">Max Output Possible</div>
                             <div className="text-sm font-semibold text-gray-300">~1024 px (Free)</div>
                           </div>
                        </div>

                      </div>
                    )}

                    {status === AppStatus.READY_TO_UPSCALE ? (
                      <div className="flex flex-col sm:flex-row gap-4 justify-start pt-2">
                        <button 
                          onClick={handleUpscale}
                          className={`flex-1 flex items-center justify-center gap-2 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transition-all hover:scale-[1.02] ${
                            upscaleMode === '2x' 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/20' 
                            : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 shadow-gray-600/20'
                          }`}
                        >
                          <Zap className="w-5 h-5" />
                          <span>
                            {removeBackground 
                              ? (upscaleMode === '2x' ? '2x Scale & Remove BG' : 'Enhance & Remove BG')
                              : (upscaleMode === '2x' ? 'Apply 2x Scale' : 'Enhance Image')
                            }
                          </span>
                        </button>
                        <button 
                          onClick={reset}
                          className="px-6 py-4 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 text-blue-400 animate-pulse">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">
                              {removeBackground ? 'Removing background & enhancing...' : (upscaleMode === '2x' ? 'Doubling resolution & detailing...' : 'Enhancing details...')}
                            </span>
                          </div>
                          <span className="text-blue-300 font-mono">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 ease-out relative"
                            style={{ width: `${progress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)]" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center pt-2">
                          Generating high-fidelity pixels with Gemini 2.5 Flash...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success / Comparison View */}
          {status === AppStatus.SUCCESS && originalImage && processedImage && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  Restoration Complete
                </h2>
                <div className="flex gap-3 w-full sm:w-auto">
                   <button 
                    onClick={reset}
                    className="flex-1 sm:flex-none text-center text-sm text-gray-400 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Start New
                  </button>
                  <a 
                    href={processedImage} 
                    download={`lumina-${upscaleMode === '2x' ? '2x' : 'enhanced'}.png`}
                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-5 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>

              <ComparisonSlider beforeImage={originalImage.url} afterImage={processedImage} />
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="bg-gray-900/50 p-6 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-sm mb-1">Mode</div>
                    <div className="text-xl font-semibold text-white">
                      {upscaleMode === '2x' ? '2x Super Res' : 'Standard Enhance'}
                    </div>
                 </div>
                 <div className="bg-gray-900/50 p-6 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-sm mb-1">Background</div>
                    <div className="text-xl font-semibold text-white">
                       {removeBackground ? 'Removed (White)' : 'Preserved'}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === AppStatus.ERROR && (
            <div className="max-w-md mx-auto text-center space-y-6 mt-12 animate-fade-in">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Processing Failed</h3>
                <p className="text-gray-400">{error || "Something went wrong during the upscaling process."}</p>
              </div>
              <button 
                onClick={reset}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg transition-colors border border-gray-700"
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;