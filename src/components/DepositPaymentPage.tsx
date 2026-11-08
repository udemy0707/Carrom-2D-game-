import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Clock
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

export const DepositPaymentPage: React.FC<DepositPaymentPageProps> = ({
  amount,
  playerName,
  onBack,
  onSuccessReturn,
}) => {
  const [depositConfig, setDepositConfig] = useState<AdminDepositConfig>(getAdminDepositConfig);
  const [utrInput, setUtrInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedUtr, setSubmittedUtr] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = utrInput.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your 12-digit UPI UTR / Transaction ID.');
      return;
    }

    if (trimmed.length < 6) {
      setErrorMsg('Please enter a valid Transaction / UTR number (usually 12 digits).');
      return;
    }

    submitDepositRequest({
      playerName: playerName.trim() || 'Player',
      amount,
      utr: trimmed,
    });

    setSubmittedUtr(trimmed);
    setIsSubmitted(true);
    setPlayerDeposits(getDepositRequests().filter((r) => r.playerName === playerName));
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

            {/* Place Below QR and UPI ID to submit UTR / Transaction ID */}
            <div className="bg-black/50 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">Enter Payment UTR / Transaction ID</h3>
                  <p className="text-[11px] text-neutral-400">
                    Find the 12-digit UTR/Reference ID from your UPI app receipt
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
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
                    Example: In Google Pay look for &quot;UPI transaction ID&quot;, in PhonePe look for &quot;UTR&quot;
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-display font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Submit Payment for Verification
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
                <strong className="font-mono text-white">{submittedUtr}</strong> has been transmitted to Admin.
              </p>
            </div>

            <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-xs space-y-2 text-left">
              <div className="flex justify-between text-neutral-400">
                <span>Amount:</span>
                <span className="font-bold text-white">₹{amount}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Submitted UTR:</span>
                <span className="font-mono text-amber-400">{submittedUtr}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Live Verification:</span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                  <Clock className="w-3 h-3 animate-spin" />
                  Pending Admin Approval
                </span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              Your wallet balance will update automatically in real-time as soon as the admin approves this transaction.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setUtrInput('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
              >
                Submit Another UTR
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
              {playerDeposits.slice(0, 4).map((d) => (
                <div
                  key={d.id}
                  className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">₹{d.amount}</span>
                      <span className="font-mono text-[10px] text-neutral-400">UTR: {d.utr}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500">
                      {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
    </div>
  );
};
