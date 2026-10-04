"use client";

import { useEffect, useRef, useState } from "react";
import * as QRCodeGenerator from "qrcode";
import { LoaderCircle } from "lucide-react";

export function QrCode({ value, label }: { value: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    let active = true;
    setError(false);

    QRCodeGenerator.toCanvas(canvas, value, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    }).catch(() => {
      if (active) setError(true);
    });

    return () => {
      active = false;
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [value]);

  return (
    <div className="flex min-h-60 items-center  justify-center rounded-xl border bg-white p-3">
      {error ? (
        <p className="max-w-52 text-center text-sm text-red-700">
          Не удалось сформировать QR-код. Введите данные вручную.
        </p>
      ) : (
        <>
          <canvas ref={canvasRef} role="img" aria-label={label} className="size-60 max-w-full" />
          {!value && <LoaderCircle className="animate-spin text-black" />}
        </>
      )}
    </div>
  );
}
