import { useRef, useEffect, useState, useCallback } from 'react';
import { BackButton } from '../common/BackButton';
import { SoundToggle } from '../common/SoundToggle';
import { StarReward } from '../common/StarReward';
import { useSound } from '../../hooks/useSound';
import { addStar } from '../../utils/storageUtils';

const COLORS = [
  '#EF4444', '#F97316', '#FACC15', '#22C55E',
  '#06B6D4', '#4F46E5', '#A855F7', '#EC4899',
  '#000000', '#6B7280', '#FFFFFF', '#78350F',
];

const BRUSH_SIZES = [
  { label: '●', size: 12, display: 12 },
  { label: '●', size: 28, display: 24 },
  { label: '●', size: 52, display: 40 },
];

export function DrawingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#4F46E5');
  const [brushSize, setBrushSize] = useState(28);
  const [isDrawing, setIsDrawing] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [totalStars, setTotalStars] = useState(0);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Resize canvas to match display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const tmp = canvas.toDataURL();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const img = new Image();
      img.onload = () => canvas.getContext('2d')?.drawImage(img, 0, 0);
      img.src = tmp;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const { play } = useSound();

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    lastPos.current = pos;
    if (!pos) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [color, brushSize]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    if (!pos || !lastPos.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing, color, brushSize]);

  const stopDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'lydia-drawing.png';
    a.click();
  };

  const handleDone = () => {
    play('star');
    const progress = addStar('drawing');
    setTotalStars(progress.stars);
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 1800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-rose-50 flex flex-col">
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <BackButton />
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-kidpink">⭐ {totalStars}</span>
          <SoundToggle />
        </div>
      </header>

      {/* Celebration overlay */}
      {celebrating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-none">
          <StarReward count={2} message="Beautiful work, Lydia! 🎨" />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm overflow-x-auto">
        {/* Color palette */}
        <div className="flex gap-2 flex-shrink-0">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="rounded-full transition-transform active:scale-90 flex-shrink-0"
              style={{
                width: 36,
                height: 36,
                backgroundColor: c,
                border: c === color ? '3px solid #000' : '2px solid #ddd',
                outline: c === color ? '2px solid #fff' : 'none',
                outlineOffset: '-4px',
              }}
              aria-label={c}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 flex-shrink-0 mx-1" />

        {/* Brush sizes */}
        <div className="flex gap-2 items-center flex-shrink-0">
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.size}
              onClick={() => setBrushSize(b.size)}
              className="rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
              style={{
                width: 44,
                height: 44,
                border: brushSize === b.size ? '2px solid #000' : '2px solid #ddd',
                backgroundColor: brushSize === b.size ? '#f3f4f6' : 'white',
              }}
              aria-label={`Brush size ${b.size}`}
            >
              <div
                className="rounded-full"
                style={{ width: b.display, height: b.display, backgroundColor: color }}
              />
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 ml-auto flex-shrink-0">
          <button
            onClick={saveDrawing}
            className="bg-blue-100 text-kidblue font-bold rounded-xl px-3 py-2 text-sm active:scale-95 transition-transform"
          >
            💾 Save
          </button>
          <button
            onClick={clearCanvas}
            className="bg-red-100 text-kidred font-bold rounded-xl px-3 py-2 text-sm active:scale-95 transition-transform"
          >
            🗑 Clear
          </button>
          <button
            onClick={handleDone}
            className="bg-kidpink text-white font-bold rounded-xl px-3 py-2 text-sm active:scale-95 transition-transform"
          >
            Done! 🌟
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-3">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-2xl bg-white shadow-inner cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
    </div>
  );
}
