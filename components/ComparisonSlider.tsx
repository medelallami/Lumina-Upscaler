import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scan, ZoomIn, ZoomOut, RotateCcw } from './Icons';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ beforeImage, afterImage, className }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startPanRef = useRef({ x: 0, y: 0 });
  const startMouseRef = useRef({ x: 0, y: 0 });

  // Reset zoom/pan when images change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [beforeImage, afterImage]);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Check if clicking the slider handle
    const target = e.target as HTMLElement;
    const isHandle = target.closest('.slider-handle');

    if (isHandle) {
      setIsResizing(true);
    } else if (zoom > 1) {
      setIsPanning(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startMouseRef.current = { x: clientX, y: clientY };
      startPanRef.current = { ...pan };
    }
  }, [zoom, pan]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setIsPanning(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (isResizing) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    } 
    else if (isPanning && zoom > 1) {
      e.preventDefault(); // Prevent page scroll on touch
      const deltaX = clientX - startMouseRef.current.x;
      const deltaY = clientY - startMouseRef.current.y;
      
      setPan({
        x: startPanRef.current.x + deltaX,
        y: startPanRef.current.y + deltaY
      });
    }
  }, [isResizing, isPanning, zoom]);

  useEffect(() => {
    // Attach global listeners for dragging to continue even if mouse leaves container
    if (isResizing || isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isResizing, isPanning, handleMouseMove, handleMouseUp]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.5, 4));
  const handleZoomOut = () => {
    setZoom(z => {
      const newZoom = Math.max(z - 0.5, 1);
      if (newZoom === 1) setPan({ x: 0, y: 0 }); // Reset pan on full zoom out
      return newZoom;
    });
  };
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSliderPosition(50);
  };

  return (
    <div 
      className={`relative w-full h-[350px] sm:h-[500px] md:h-[600px] overflow-hidden rounded-xl shadow-2xl bg-black select-none group ${className}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      style={{ cursor: isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
    >
      
      {/* Layer 1: Before Image (The Background Layer) */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
           className="w-full h-full"
           style={{ 
             transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
             transformOrigin: 'center',
             transition: isPanning ? 'none' : 'transform 0.2s ease-out'
           }}
        >
          <img 
            src={beforeImage} 
            alt="Original" 
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>
      </div>

      {/* Layer 2: After Image (The Foreground Layer, Clipped by Slider) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <div 
           className="w-full h-full"
           style={{ 
             transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
             transformOrigin: 'center',
             transition: isPanning ? 'none' : 'transform 0.2s ease-out'
           }}
        >
          <img 
            src={afterImage} 
            alt="Upscaled" 
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>
      </div>

      {/* Labels - Fade out when zoomed to prevent obstruction */}
      <div className={`transition-opacity duration-300 ${zoom > 1 ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold z-10 border border-white/10 pointer-events-none">
          Original
        </div>
        <div className="absolute top-4 right-4 bg-blue-600/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold z-10 border border-white/10 shadow-[0_0_15px_rgba(37,99,235,0.5)] pointer-events-none">
          Lumina 2x
        </div>
      </div>

      {/* Slider Handle - Fixed relative to the container (viewport) */}
      <div 
        className="slider-handle absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-blue-100 transition-colors"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-blue-500 hover:scale-110 transition-transform">
          <Scan className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Zoom Controls Toolbar */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-30">
         <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-lg p-1 flex items-center shadow-xl">
            <button 
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2 hover:bg-white/10 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="w-12 text-center text-xs font-mono text-gray-300 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-2 hover:bg-white/10 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/20 mx-1"></div>
            <button 
              onClick={handleReset}
              className="p-2 hover:bg-white/10 rounded-md text-white transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
         </div>
      </div>
      
      {/* Pan hint when zoomed */}
      {zoom > 1 && !isPanning && (
        <div className="absolute bottom-4 left-4 text-xs text-white/50 bg-black/40 px-2 py-1 rounded backdrop-blur-sm pointer-events-none animate-pulse">
           Drag to pan
        </div>
      )}

    </div>
  );
};