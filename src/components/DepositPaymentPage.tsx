import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Upload,
  Image as ImageIcon,
  X,
  Eye,
  Camera,
  Trash2
} from 'lucide-react';
import {
  AdminDepositConfig,
  DepositRequest,
  getAdminDepositConfig,
  getDepositRequests,
  submitDepositRequest,
  subscribeToSync
} from '../services/adminSync';
import { UpiQrDisplay } from './UpiQrDisplay';

interface DepositPaymentPageProps {
  amount: number;
  playerName: string;
  onBack: () => void;
  onSuccessReturn: () => void;
}

// Client-side image scaler to keep localStorage fast and avoid browser storage quota errors
function compressScreenshot(file: File, maxDim = 1200, quality = 0.85): Promise<{ base64: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64: e.target?.result as string, sizeKb: Math.round(file.size / 1024) });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        const approxSizeKb = Math.round((compressedBase64.length * 3) / 4 / 1024);
        resolve({ base64: compressedBase64, sizeKb: approxSizeKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const DepositPaymentPage: React.FC<DepositPaymentPageProps> = ({
  amount,
  playerName,
  onBack,
  onSuccessReturn,
}) => {
  const [depositConfig, setDepositConfig] = useState<AdminDepositConfig>(getAdminDepositConfig);
  const [utrInput, setUtrInput] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [screenshotSizeKb, setScreenshotSizeKb] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedUtr, setSubmittedUtr] = useState('');
  const [submittedScreenshot, setSubmittedScreenshot] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [playerDeposits, setPlayerDeposits] = useState<DepositRequest[]>(() => {
    return getDepositRequests().filter((r) => r.playerName === playerName);
  });

  // Real-time synchronization for deposit config and status updates
  useEffect(() => {
    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'DEPOSIT_CONFIG_UPDATED') {
        setDepositConfig(getAdminDepositConfig());
      } else if (msg.type === 'DEPOSIT_STATUS_UPDATED' || msg.type === 'DEPOSIT_REQUESTED') {
        const reqs = getDepositRequests().filter((r) => r.playerName === playerName);
        setPlayerDeposits(reqs);
      }
    });
    return () => unsubscribe();
  }, [playerName]);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(depositConfig.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmt = () => {
    navigator.clipboard?.writeText(amount.toString());
    setCopiedAmt(true);
    setTimeout(() => setCopiedAmt(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image screenshot (JPG, PNG, WEBP).');
      return;
    }

    try {
      setIsCompressing(true);
      setErrorMsg('');
      const { base64, sizeKb } = await compressScreenshot(file);
      setScreenshotBase64(base64);
      setScreenshotName(file.name);
      setScreenshotSizeKb(sizeKb);
    } catch (err) {
      setErrorMsg('Failed to process image. Please choose another screenshot.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotBase64('');
    setScreenshotName('');
    setScreenshotSizeKb(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // STRICT REQUIREMENT 1: Screenshot MUST be attached
    if (!screenshotBase64) {
      setErrorMsg('Payment screenshot is strictly required! Please attach your payment screenshot before submitting.');
      return;
    }

    const trimmed = utrInput.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your 12-digit UPI UTR / Transaction ID.');
      return;
    }

    if (trimmed.length < 6) {
      setErrorMsg('Please enter a valid Transaction / UTR number (usually 12 digits).');
      return;
    }

    try {
      submitDepositRequest({
        playerName: playerName.trim() || 'Player',
        amount,
        utr: trimmed,
        screenshotUrl: screenshotBase64,
      });

      setSubmittedUtr(trimmed);
      setSubmittedScreenshot(screenshotBase64);
      setIsSubmitted(true);
      setPlayerDeposits(getDepositRequests().filter((r) => r.playerName === playerName));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit deposit request.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#072418] text-neutral-100 flex flex-col font-sans select-none overflow-y-auto">
      {/* Background gradient matching green felt theme */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, #0d4630 0%, #072a1c 55%, #03160e 100%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 w-full max-w-xl mx-auto px-4 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-xs font-semibold text-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center">
          <h1 className="font-display font-bold text-base text-white">Deposit Payment Gateway</h1>
          <p className="text-[11px] text-emerald-400">Official UPI Verification</p>
        </div>

        <div className="w-16 flex justify-end">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Secure Gateway" />
        </div>
      </header>

      {/* Body Container */}
      <main className="relative z-10 flex-1 w-full max-w-xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Deposit Summary Card */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-neutral-400">Deposit Amount</span>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-2xl text-amber-400">₹{amount}</span>
              <button
                type="button"
                onClick={handleCopyAmt}
                className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors"
                title="Copy Amount"
              >
                {copiedAmt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
              Direct Wallet Credit
            </span>
            <p className="text-[10px] text-neutral-400 mt-0.5">Instant Verification</p>
          </div>
        </div>

        {!isSubmitted ? (
          <div className="space-y-5">
            {/* Admin QR Code & UPI Details Display */}
            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Scan QR with any UPI App
                </span>
                <p className="text-[11px] text-neutral-400">
                  PhonePe · Google Pay · Paytm · BHIM · Cred · Amazon Pay
                </p>
              </div>

              {/* Dynamic or Custom QR Code */}
              <div className="my-1">
                <UpiQrDisplay
                  upiId={depositConfig.upiId}
                  payeeName={depositConfig.payeeName}
                  amount={amount}
                  customQrUrl={depositConfig.qrImageUrl}
                  size={200}
                  showDetails={false}
                />
              </div>

              {/* Admin UPI ID Box */}
              <div className="w-full max-w-sm bg-neutral-900/90 border border-neutral-700/80 rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
                <div className="text-left">
                  <span className="text-[10px] text-neutral-400 block">Admin UPI ID</span>
                  <span className="font-mono font-bold text-sm text-amber-400 select-all">
                    {depositConfig.upiId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy UPI
                    </>
                  )}
                </button>
              </div>

              {depositConfig.instructions && (
                <div className="w-full text-left bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-200/90">
                  <p className="text-[11px] leading-relaxed">
                    <strong>Note:</strong> {depositConfig.instructions}
                  </p>
                </div>
              )}
            </div>

            {/* STEP 2: MANDATORY PAYMENT SCREENSHOT UPLOAD */}
            <div className="bg-black/50 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Attach Payment Screenshot</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase font-black">
                      Required
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Upload receipt screenshot from your UPI app (showing Amount ₹{amount} &amp; UTR)
                  </p>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {!screenshotBase64 ? (
                /* Empty Upload Dropzone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer border-2 border-dashed border-neutral-700 hover:border-amber-400 bg-neutral-950/60 hover:bg-neutral-900/60 rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center space-y-2.5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isCompressing ? 'Processing Image...' : 'Tap to Upload Payment Screenshot'}
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">
                      JPG, PNG, WEBP · Mobile receipts &amp; screenshots supported
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-[10px] font-semibold text-amber-400">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload or Take Screenshot</span>
                  </div>
                </div>
              ) : (
                /* Screenshot Attached Card */
                <div className="bg-neutral-950/90 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Clickable Thumbnail */}
                    <div
                      onClick={() => setLightboxImage(screenshotBase64)}
                      className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-500/50 cursor-pointer group shrink-0 bg-black"
                      title="Click to view full preview"
                    >
                      <img
                        src={screenshotBase64}
                        alt="Payment Screenshot"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-emerald-300 truncate">
                          Screenshot Attached
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate max-w-[180px]">
                        {screenshotName || 'payment_receipt.jpg'} ({screenshotSizeKb} KB)
                      </p>
                      <button
                        type="button"
                        onClick={() => setLightboxImage(screenshotBase64)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 mt-0.5"
                      >
                        <Eye className="w-3 h-3" />
                        View Full Screenshot
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
                      title="Replace Screenshot"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
                      title="Remove Screenshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: SUBMIT UTR / TRANSACTION ID */}
            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Enter Payment UTR / Transaction ID</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase font-black">
                      Required
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Find the 12-digit UTR/Reference ID on your payment receipt
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    placeholder="Enter 12-Digit UTR / Transaction ID (e.g. 412356789012)"
                    className="w-full bg-neutral-950/80 border border-neutral-700 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 text-center uppercase tracking-widest"
                    maxLength={32}
                    required
                  />
                  <p className="text-[10px] text-neutral-400 text-center mt-1.5">
                    Google Pay: &quot;UPI transaction ID&quot; · PhonePe / Paytm / BHIM: &quot;UTR&quot;
                  </p>
                </div>

                {/* Submit button with strict requirement enforcement */}
                <button
                  type="submit"
                  disabled={!screenshotBase64 || !utrInput.trim() || isCompressing}
                  className={`w-full py-3.5 rounded-xl font-display font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                    !screenshotBase64 || !utrInput.trim() || isCompressing
                      ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-70'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 shadow-emerald-500/25 active:scale-[0.98]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {!screenshotBase64
                    ? 'Attach Screenshot to Enable Verification'
                    : !utrInput.trim()
                    ? 'Enter 12-Digit UTR to Submit'
                    : 'Submit Payment for Verification'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Submission Confirmed Screen */
          <div className="bg-black/60 backdrop-blur-md border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-display font-bold text-white">Deposit Request Submitted!</h2>
              <p className="text-xs text-neutral-300 max-w-sm mx-auto">
                Your payment of <strong className="text-amber-400">₹{amount}</strong> with UTR{' '}
                <strong className="font-mono text-white">{submittedUtr}</strong> and receipt screenshot have been transmitted to Admin.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-xs space-y-2.5 text-left">
              <div className="flex justify-between text-neutral-400">
                <span>Amount:</span>
                <span className="font-bold text-white text-sm">₹{amount}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Submitted UTR:</span>
                <span className="font-mono text-amber-400 font-bold">{submittedUtr}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Live Verification:</span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                  <Clock className="w-3 h-3 animate-spin" />
                  Pending Admin Approval
                </span>
              </div>

              {submittedScreenshot && (
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-neutral-400 text-[11px]">Submitted Screenshot:</span>
                  <button
                    type="button"
                    onClick={() => setLightboxImage(submittedScreenshot)}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Uploaded Image</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] text-neutral-400">
              Your wallet balance will update automatically in real-time as soon as the admin verifies your screenshot and approves this transaction.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setUtrInput('');
                  setScreenshotBase64('');
                  setScreenshotName('');
                  setScreenshotSizeKb(0);
                }}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
              >
                Submit Another Deposit
              </button>
              <button
                type="button"
                onClick={onSuccessReturn}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shadow-md shadow-emerald-500/20"
              >
                Return to Game
              </button>
            </div>
          </div>
        )}

        {/* Recent Deposit Requests by this Player */}
        {playerDeposits.length > 0 && (
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Your Recent Deposit Requests
            </h4>
            <div className="space-y-2">
              {playerDeposits.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {d.screenshotUrl ? (
                      <button
                        type="button"
                        onClick={() => setLightboxImage(d.screenshotUrl)}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-neutral-900 relative group"
                        title="Click to view payment screenshot"
                      >
                        <img src={d.screenshotUrl} alt="Receipt" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                          <Eye className="w-3 h-3 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/10 shrink-0 flex items-center justify-center text-neutral-500">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">₹{d.amount}</span>
                        <span className="font-mono text-[10px] text-neutral-400 truncate">UTR: {d.utr}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 block">
                        {new Date(d.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      d.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : d.status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {d.status === 'completed' ? 'Approved' : d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* LIGHTBOX MODAL FOR HIGH-RES SCREENSHOT VIEW */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-4 shadow-2xl relative space-y-3 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-white">Payment Screenshot Verification</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center p-2">
              <img
                src={lightboxImage}
                alt="Enlarged Payment Screenshot"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
