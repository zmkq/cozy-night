"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Eraser, Undo, Download } from "lucide-react";
import { NeonButton } from "@/components/christmas/NeonButton";

interface DrawingCanvasProps {
  onSubmit: (dataUrl: string) => void;
  disabled?: boolean;
  width?: number;
  height?: number;
}

export function DrawingCanvas({ onSubmit, disabled, width = 300, height = 300 }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#FFFFFF");
  const [lineWidth, setLineWidth] = useState(4);
  const lastPos = useRef({ x: 0, y: 0 });
  const historyRef = useRef<ImageData[]>([]);

  const COLORS = ["#FFFFFF", "#FF4D6A", "#2ECC71", "#FFD93D", "#00BFFF", "#FF6B35"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Save initial state
    historyRef.current = [ctx.getImageData(0, 0, width, height)];
  }, [width, height]);

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * (width / rect.width),
      y: (clientY - rect.top) * (height / rect.height),
    };
  }, [width, height]);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    const pos = getPos(e);
    lastPos.current = pos;
    setIsDrawing(true);
  }, [disabled, getPos]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastPos.current = pos;
  }, [isDrawing, disabled, color, lineWidth, getPos]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      // Save to history
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        historyRef.current.push(ctx.getImageData(0, 0, width, height));
        if (historyRef.current.length > 20) historyRef.current.shift();
      }
    }
  }, [isDrawing, width, height]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || historyRef.current.length <= 1) return;
    
    historyRef.current.pop();
    const lastState = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(lastState, 0, 0);
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);
    historyRef.current = [ctx.getImageData(0, 0, width, height)];
  }, [width, height]);

  const submit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSubmit(canvas.toDataURL("image/png"));
  }, [onSubmit]);

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative rounded-2xl overflow-hidden border-2 border-white/20"
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none cursor-crosshair w-full"
          style={{ aspectRatio: `${width}/${height}` }}
        />
        
        {disabled && (
          <div className="absolute inset-0 bg-midnight/50 flex items-center justify-center">
            <span className="text-frost/60">Drawing locked</span>
          </div>
        )}
      </motion.div>

      {/* Color Picker */}
      <div className="flex items-center justify-center gap-2">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-8 h-8 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-white" : ""}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Tools */}
      <div className="flex gap-2">
        <button
          onClick={undo}
          className="flex-1 h-10 bg-white/10 rounded-xl flex items-center justify-center gap-2 text-frost/60 hover:text-cream transition-colors"
        >
          <Undo size={16} /> Undo
        </button>
        <button
          onClick={clear}
          className="flex-1 h-10 bg-white/10 rounded-xl flex items-center justify-center gap-2 text-frost/60 hover:text-cream transition-colors"
        >
          <Eraser size={16} /> Clear
        </button>
      </div>

      {/* Submit */}
      <NeonButton variant="green" size="lg" fullWidth onClick={submit} disabled={disabled}>
        Submit Drawing
      </NeonButton>
    </div>
  );
}
