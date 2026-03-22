import { useState, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export default function ExplodedViewViewer({ imageUrl, title = "Diagram" }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleZoom = (direction) => {
    setScale(s => Math.max(1, Math.min(5, s + (direction === 'in' ? 0.5 : -0.5))));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h2 className="font-bold text-gray-800 text-base">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleZoom('out')}
            disabled={scale <= 1}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
            Zoom Out
          </button>
          <button
            onClick={() => handleZoom('in')}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            Zoom In
          </button>
          <button
            onClick={handleReset}
            disabled={scale === 1 && position.x === 0 && position.y === 0}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full bg-gray-100 overflow-hidden ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        style={{ height: "500px" }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={imageUrl}
            alt={title}
            className="max-h-full max-w-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Info */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-600">
        {scale > 1 ? (
          <p>Drag to pan • Zoom: {Math.round(scale * 100)}%</p>
        ) : (
          <p>Click zoom in to explore the diagram</p>
        )}
      </div>
    </div>
  );
}