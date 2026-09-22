import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";

function paint(
  ctx: CanvasRenderingContext2D,
  rect: DOMRect,
  dataUrl: string,
): void {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.restore();
  if (!dataUrl) return;
  const img = new Image();
  img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
  img.src = dataUrl;
}

interface SignaturePadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
  locked?: boolean;
}

export function SignaturePad({
  value,
  onChange,
  label,
  locked = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2.2;
      paint(ctx, rect, valueRef.current);
    };

    setup();
    const observer = new ResizeObserver(setup);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    paint(ctx, canvas.getBoundingClientRect(), value);
  }, [value]);

  function pos(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function pointerDown(e: PointerEvent<HTMLCanvasElement>) {
    if (locked) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function pointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function pointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/jpeg", 0.72));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    paint(ctx, canvas.getBoundingClientRect(), "");
    onChange("");
  }

  return (
    <div className={`signature-pad ${locked ? "is-locked" : ""}`}>
      <div className="signature-head">
        <span>{label}</span>
        {locked ? null : (
          <button type="button" className="text-btn" onClick={clear}>
            Effacer / Clear
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="signature-canvas no-print"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      />
      {value ? (
        <img className="signature-print" src={value} alt="" />
      ) : (
        <div className="signature-print signature-print-empty" />
      )}
    </div>
  );
}
