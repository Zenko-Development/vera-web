"use client";

import { useEffect, useRef, useState } from "react";
import QRCodeStyling, { type Options } from "qr-code-styling";
import { LoaderCircle } from "lucide-react";

export function QrCode({ value, label }: { value: string; label: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const options: Options = {
      width: 620,
      height: 620,
      type: "canvas",
      margin: 4,
      qrOptions: { errorCorrectionLevel: "H" },
      dotsOptions: {
        color: "#000000",
        type: "rounded", // ← скругление модулей
      },
      cornersSquareOptions: {
        color: "#000000",
        type: "extra-rounded", // ← скругление угловых маркеров
      },
      cornersDotOptions: {
        color: "#000000",
        type: "dot",
      },
    };

    const qr = new QRCodeStyling(options);
    qrRef.current = qr;

    if (containerRef.current) {
      qr.append(containerRef.current);
    }

    return () => {
      qrRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    const qr = qrRef.current;
    if (!qr) return;

    if (!value) {
      setError(false);
      const canvas = containerRef.current?.querySelector("canvas");
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    setError(false);
    Promise.resolve(qr.update({ data: value })).catch(() => setError(true));
  }, [value]);

  return (
    <div className="flex w-full aspect-square items-center justify-center rounded-xl border bg-white p-3">
      {error ? (
        <p className="max-w-52 text-center text-sm text-red-700">
          Не удалось сформировать QR-код. Введите данные вручную.
        </p>
      ) : (
        <>
          <div
            ref={containerRef}
            role="img"
            aria-label={label}
            className="flex h-full w-full items-center justify-center [&>canvas]:h-full [&>canvas]:w-full"
          />
          {!value && (
            <LoaderCircle className="absolute h-8 w-8 animate-spin text-black" />
          )}
        </>
      )}
    </div>
  );
}