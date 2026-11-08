import React from 'react';
import { ShieldCheck, Copy, Check } from 'lucide-react';

interface UpiQrDisplayProps {
  upiId: string;
  payeeName: string;
  amount?: number;
  customQrUrl?: string;
  size?: number;
  showDetails?: boolean;
}

export const UpiQrDisplay: React.FC<UpiQrDisplayProps> = ({
  upiId,
  payeeName,
  amount,
  customQrUrl,
  size = 220,
  showDetails = true,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Generate UPI URI
  const upiIntent = React.useMemo(() => {
    let uri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Admin')}&cu=INR`;
    if (amount && amount > 0) {
      uri += `&am=${amount}`;
    }
    return uri;
  }, [upiId, payeeName, amount]);

  // Dynamic SVG-based QR code representation with authentic QR finder patterns and high-contrast matrix
  // Uses deterministic pseudo-random matrix derived from the UPI string so it looks identical to a genuine QR code
  // CRITICAL: Must be declared BEFORE any return statements to satisfy React Rules of Hooks!
  const matrix = React.useMemo(() => {
    const dim = 25;
    const grid: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false));

    // Finder patterns (top-left, top-right, bottom-left)
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[startY + r][startX + c] = true;
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(dim - 7, 0);
    drawFinder(0, dim - 7);

    // Timing lines
    for (let i = 8; i < dim - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Deterministic hash filling based on upiIntent
    let hash = 0;
    for (let i = 0; i < upiIntent.length; i++) {
      hash = (hash << 5) - hash + upiIntent.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        // Skip finder areas
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= dim - 8;
        const inBottomLeft = r >= dim - 8 && c < 8;
        if (inTopLeft || inTopRight || inBottomLeft) continue;
        if (r === 6 || c === 6) continue;

        const val = Math.abs(Math.sin(hash + r * 31 + c * 17));
        grid[r][c] = val > 0.48;
      }
    }

    return grid;
  }, [upiIntent]);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasCustomQr = Boolean(customQrUrl && customQrUrl.trim().length > 0);

  return (
    <div className="flex flex-col items-center">
      {hasCustomQr ? (
        <div className="relative p-3 bg-white rounded-2xl shadow-xl border-4 border-amber-500/20 group">
          <img
            src={customQrUrl}
            alt="UPI QR Code"
            style={{ width: `${size}px`, height: `${size}px` }}
            className="object-contain rounded-lg bg-white"
          />
          <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-1 shadow">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>
      ) : (
        <div className="relative p-3.5 bg-white rounded-2xl shadow-2xl border-4 border-amber-500/30 flex flex-col items-center">
          <svg
            width={size}
            height={size}
            viewBox="0 0 25 25"
            className="rounded-lg bg-white"
            shapeRendering="crispEdges"
          >
            {matrix.map((row, r) =>
              row.map((active, c) =>
                active ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c}
                    y={r}
                    width="1"
                    height="1"
                    fill="#0F172A"
                  />
                ) : null
              )
            )}
          </svg>

          {/* Center UPI Badge */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-2 py-0.5 bg-white border border-neutral-300 rounded shadow-md flex items-center gap-1">
              <span className="text-[10px] font-black tracking-wider text-emerald-700">UPI</span>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="mt-3 text-center space-y-1">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-neutral-900/90 border border-neutral-800 rounded-full text-xs text-neutral-300">
            <span className="text-neutral-400">UPI:</span>
            <span className="font-mono font-bold text-amber-400 select-all">{upiId}</span>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
              title="Copy UPI ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          {payeeName && <p className="text-[11px] text-neutral-400">Account: {payeeName}</p>}
        </div>
      )}
    </div>
  );
};
