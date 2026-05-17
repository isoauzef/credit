import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";

export interface SignatureCanvasHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  disabled?: boolean;
  onChange?: (dataUrl: string, isEmpty: boolean) => void;
  className?: string;
}

const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
  ({ width = 600, height = 180, disabled, onChange, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const lastPtRef = useRef<{ x: number; y: number } | null>(null);
    const emptyRef = useRef(true);
    const [isEmpty, setIsEmpty] = useState(true);
    const dprRef = useRef(1);

    // Configure canvas with proper DPR scaling for crisp lines on retina/mobile
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";
    }, [width, height]);

    const getPoint = (e: PointerEvent | React.PointerEvent): { x: number; y: number } => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (disabled) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.setPointerCapture(e.pointerId);
        drawingRef.current = true;
        lastPtRef.current = getPoint(e);
      },
      [disabled]
    );

    const move = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current || disabled) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const pt = getPoint(e);
        const last = lastPtRef.current ?? pt;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        lastPtRef.current = pt;
        if (emptyRef.current) {
          emptyRef.current = false;
          setIsEmpty(false);
        }
      },
      [disabled]
    );

    const end = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current) return;
        const canvas = canvasRef.current;
        if (canvas) {
          try { canvas.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        }
        drawingRef.current = false;
        lastPtRef.current = null;
        if (onChange && canvasRef.current) {
          onChange(canvasRef.current.toDataURL("image/png"), emptyRef.current);
        }
      },
      [onChange]
    );

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = dprRef.current;
      // Reset transform, wipe everything, then reapply ONLY the dpr scale so drawing
      // remains aligned to CSS pixels (the previous version applied scale twice).
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";
      emptyRef.current = true;
      setIsEmpty(true);
      if (onChange) onChange("", true);
    }, [onChange]);

    useImperativeHandle(ref, () => ({
      clear,
      isEmpty: () => emptyRef.current,
      toDataURL: () => (canvasRef.current ? canvasRef.current.toDataURL("image/png") : ""),
    }));

    return (
      <div className={className}>
        <div className="relative rounded-md border border-gray-300 bg-white">
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height, touchAction: "none", cursor: disabled ? "not-allowed" : "crosshair" }}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            onPointerCancel={end}
            aria-label="Signature area"
          />
          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400 select-none">
              Sign here with your mouse or finger
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>By signing you authorize us to act on your behalf with credit bureaus.</span>
          <button
            type="button"
            onClick={clear}
            disabled={disabled || isEmpty}
            className="text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }
);

SignatureCanvas.displayName = "SignatureCanvas";
export default SignatureCanvas;
