import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Key,
  QrCode,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Upload,
  RefreshCw,
  LogOut,
  Gamepad2,
  AlertCircle,
  Settings,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  Clock,
  ChevronRight,
  TrendingUp,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { subscribeToQuotaState, isQuotaExceeded } from '../firebase';
import {
  AdminDepositConfig,
  DepositRequest,
  WithdrawalRequest,
  AdminSecurityConfig,
  getAdminDepositConfig,
  saveAdminDepositConfig,
  getDepositRequests,
  updateDepositStatus,
  deleteDepositRequest,
  getWithdrawalRequests,
  updateWithdrawalStatus,
  deleteWithdrawalRequest,
  getAdminSecurity,
  saveAdminSecurity,
  subscribeToSync
} from '../services/adminSync';
import { UpiQrDisplay } from './UpiQrDisplay';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('carrom_admin_session') === 'true';
    } catch {
      return false;
    }
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Tab: 'deposits_config' | 'deposit_requests' | 'withdrawals' | 'security'
  const [activeTab, setActiveTab] = useState<'deposits_config' | 'deposit_requests' | 'withdrawals' | 'security'>(() => {
    try {
      const reqs = getDepositRequests();
      const pendingDeposits = reqs.filter((r) => r.status === 'pending').length;
      if (pendingDeposits > 0) return 'deposit_requests';
    } catch {}
    return 'deposit_requests';
  });

  // Admin Data States
  const [depositConfig, setDepositConfig] = useState<AdminDepositConfig>(getAdminDepositConfig);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(getDepositRequests);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(getWithdrawalRequests);
  const [securityConfig, setSecurityConfig] = useState<AdminSecurityConfig>(getAdminSecurity);

  // Form states for Deposit Config
  const [formUpiId, setFormUpiId] = useState(depositConfig.upiId);
  const [formPayeeName, setFormPayeeName] = useState(depositConfig.payeeName);
  const [formQrUrl, setFormQrUrl] = useState(depositConfig.qrImageUrl);
  const [formInstructions, setFormInstructions] = useState(depositConfig.instructions);
  const [formMinDeposit, setFormMinDeposit] = useState<number>(depositConfig.minDeposit ?? 200);
  const [formMinWithdrawal, setFormMinWithdrawal] = useState<number>(depositConfig.minWithdrawal ?? 500);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Form states for Password Change
  const [currentPwInput, setCurrentPwInput] = useState('');
  const [newPwInput, setNewPwInput] = useState('');
  const [confirmPwInput, setConfirmPwInput] = useState('');
  const [customSlugInput, setCustomSlugInput] = useState(securityConfig.urlSlug || '');
  const [pwChangeMessage, setPwChangeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Firestore Quota State
  const [isQuotaExceededState, setIsQuotaExceededState] = useState<boolean>(() => isQuotaExceeded());

  useEffect(() => {
    const unsub = subscribeToQuotaState((exceeded) => {
      if (exceeded) setIsQuotaExceededState(true);
    });
    return () => unsub();
  }, []);

  // Filter states
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDepositScreenshot, setSelectedDepositScreenshot] = useState<DepositRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Subscribe to real-time events across tabs
  useEffect(() => {
    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'DEPOSIT_CONFIG_UPDATED') {
        const updated = getAdminDepositConfig();
        setDepositConfig(updated);
        setFormMinDeposit(updated.minDeposit ?? 200);
        setFormMinWithdrawal(updated.minWithdrawal ?? 500);
      } else if (msg.type === 'DEPOSIT_REQUESTED' || msg.type === 'DEPOSIT_STATUS_UPDATED') {
        setDepositRequests(getDepositRequests());
      } else if (msg.type === 'WITHDRAWAL_REQUESTED' || msg.type === 'WITHDRAWAL_STATUS_UPDATED') {
        setWithdrawalRequests(getWithdrawalRequests());
      } else if (msg.type === 'SECURITY_UPDATED') {
        setSecurityConfig(getAdminSecurity());
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync state if tabs change
  const refreshData = () => {
    const currentConfig = getAdminDepositConfig();
    setDepositConfig(currentConfig);
    setDepositRequests(getDepositRequests());
    setWithdrawalRequests(getWithdrawalRequests());
    setSecurityConfig(getAdminSecurity());
    setFormMinDeposit(currentConfig.minDeposit ?? 200);
    setFormMinWithdrawal(currentConfig.minWithdrawal ?? 500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const sec = getAdminSecurity();
    const cleanUsername = usernameInput.trim();
    const cleanPassword = passwordInput.trim();

    if (cleanUsername === sec.username && cleanPassword === sec.passwordHash) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('carrom_admin_session', 'true');
      } catch {}
      // Sync form values
      const currentConfig = getAdminDepositConfig();
      setFormUpiId(currentConfig.upiId);
      setFormPayeeName(currentConfig.payeeName);
      setFormQrUrl(currentConfig.qrImageUrl);
      setFormInstructions(currentConfig.instructions);
      setFormMinDeposit(currentConfig.minDeposit ?? 200);
      setFormMinWithdrawal(currentConfig.minWithdrawal ?? 500);
    } else {
      setLoginError('Invalid Admin credentials. Check username & password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('carrom_admin_session');
    } catch {}
  };

  // Handle QR File Upload (Base64)
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setFormQrUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Deposit Details
  const handleSaveDepositConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveAdminDepositConfig({
      upiId: formUpiId.trim(),
      payeeName: formPayeeName.trim(),
      qrImageUrl: formQrUrl.trim(),
      instructions: formInstructions.trim(),
      minDeposit: Math.max(1, Number(formMinDeposit) || 200),
      minWithdrawal: Math.max(1, Number(formMinWithdrawal) || 500),
    });
    setDepositConfig(saved);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  // Change Admin Password & Access Slug
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwChangeMessage(null);

    const sec = getAdminSecurity();
    if (currentPwInput !== sec.passwordHash) {
      setPwChangeMessage({ type: 'error', text: 'Current password does not match.' });
      return;
    }

    if (!newPwInput || newPwInput.length < 4) {
      setPwChangeMessage({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }

    if (newPwInput !== confirmPwInput) {
      setPwChangeMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const updated = await saveAdminSecurity({
      passwordHash: newPwInput,
      urlSlug: customSlugInput.trim().toLowerCase(),
    });

    setSecurityConfig(updated);
    setPwChangeMessage({ type: 'success', text: 'Admin security details saved to server successfully!' });
    setCurrentPwInput('');
    setNewPwInput('');
    setConfirmPwInput('');
  };

  // Process Withdrawal: Completed or Reject
  const handleProcessWithdrawal = async (id: string, status: 'completed' | 'rejected') => {
    await updateWithdrawalStatus(id, status);
    setWithdrawalRequests(getWithdrawalRequests());
  };

  // Delete Withdrawal Request
  const handleDeleteWithdrawal = async (id: string) => {
    await deleteWithdrawalRequest(id);
    setWithdrawalRequests(getWithdrawalRequests());
  };

  // Process Deposit: Completed or Reject
  const handleProcessDeposit = async (id: string, status: 'completed' | 'rejected') => {
    await updateDepositStatus(id, status);
    setDepositRequests(getDepositRequests());
  };

  // Delete Deposit Request
  const handleDeleteDeposit = async (id: string) => {
    await deleteDepositRequest(id);
    setDepositRequests(getDepositRequests());
  };

  // Pending counts
  const pendingWithdrawalsCount = withdrawalRequests.filter((r) => r.status === 'pending').length;
  const pendingDepositsCount = depositRequests.filter((r) => r.status === 'pending').length;

  /* ==========================================================================
     LOGIN SCREEN
     ========================================================================== */
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="w-7 h-7 text-neutral-950" />
            </div>
            <h2 className="text-2xl font-display font-extrabold text-white">Carrom Royal Admin</h2>
            <p className="text-xs text-neutral-400">Restricted Management Console</p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Admin Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Admin Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-display font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Access Admin Panel
            </button>
          </form>

          <div className="pt-2 text-center border-t border-neutral-800/80">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-neutral-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              Return to Carrom Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     AUTHENTICATED ADMIN DASHBOARD
     ========================================================================== */
  return (
    <div className="fixed inset-0 z-50 bg-[#090D14] text-neutral-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Firestore Daily Quota Exceeded Alert Banner for Admin */}
      {isQuotaExceededState && (
        <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 sm:px-8 py-2 text-amber-100 text-xs shadow-lg flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-amber-200">Firestore Daily Free Quota Exceeded</p>
              <p className="text-[11px] text-amber-300/90 leading-tight">
                Database cloud sync is running in local/offline mode. Daily free quota resets automatically every 24 hours. Local operations remain operational.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://console.firebase.google.com/project/gen-lang-client-0121363322/firestore/databases/ai-studio-carrom2dgame-259800d7-cdd9-4da0-8e4d-1320fa7ff6bf/data?openUpgradeDialog=true"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-[11px] transition-colors"
            >
              Console
            </a>
            <button
              onClick={() => setIsQuotaExceededState(false)}
              className="p-1 text-amber-400 hover:text-amber-200"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Admin Navbar */}
      <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-base sm:text-lg text-white">Carrom Royal</h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Admin Console
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">Real-time Deposit & Withdrawal Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refreshData}
            title="Refresh Live Data"
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="hidden sm:inline">Play</span> Game
          </button>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-56 sm:w-64 border-r border-neutral-800/80 bg-neutral-950/50 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 px-3 py-1">
              Operations
            </div>

            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'withdrawals'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdrawals</span>
              </div>
              {pendingWithdrawalsCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'withdrawals' ? 'bg-neutral-950 text-amber-400' : 'bg-rose-500 text-white'
                  }`}
                >
                  {pendingWithdrawalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('deposit_requests')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'deposit_requests'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ArrowDownLeft className="w-4 h-4" />
                <span>UTR Verifications</span>
              </div>
              {pendingDepositsCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'deposit_requests' ? 'bg-neutral-950 text-amber-400' : 'bg-amber-500 text-neutral-950'
                  }`}
                >
                  {pendingDepositsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('deposits_config')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'deposits_config'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Deposit Details (UPI/QR)</span>
            </button>

            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 px-3 pt-4 py-1">
              Settings
            </div>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'security'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Security & Password</span>
            </button>
          </div>
        </aside>

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-900/30">
          {/* TAB 1: WITHDRAWALS PROCESSING (Manual UPI Payouts with Completed/Reject) */}
          {activeTab === 'withdrawals' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-amber-400" />
                    User Withdrawal Requests
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Review user withdrawal requests and player UPI IDs. Process payouts manually and mark Completed or Reject.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
                  {(['pending', 'all', 'completed', 'rejected'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setWithdrawalFilter(f)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                        withdrawalFilter === f ? 'bg-neutral-800 text-amber-400 font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Withdrawals List */}
              {withdrawalRequests.filter((r) => withdrawalFilter === 'all' || r.status === withdrawalFilter).length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-neutral-900 rounded-2xl mx-auto flex items-center justify-center text-neutral-500">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-neutral-300">No withdrawal requests found</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    When players request a withdrawal in the game, their custom amount and UPI ID will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {withdrawalRequests
                    .filter((r) => withdrawalFilter === 'all' || r.status === withdrawalFilter)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-neutral-500">{item.id}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                item.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : item.status === 'rejected'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-neutral-400">Player:</span>
                            <span className="font-bold text-white text-sm">{item.playerName}</span>
                            <span className="text-neutral-500 text-xs">·</span>
                            <span className="text-lg font-bold text-emerald-400">₹{item.amount}</span>
                          </div>

                          {/* Player UPI ID - Explicitly Highlighted with 1-click Copy */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-neutral-400">Player UPI ID:</span>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg">
                              <span className="font-mono font-bold text-amber-400 text-xs select-all">
                                {item.playerUpi}
                              </span>
                              <button
                                onClick={() => handleCopy(item.playerUpi, item.id)}
                                title="Copy Player UPI ID"
                                className="text-neutral-400 hover:text-white p-0.5 transition-colors"
                              >
                                {copiedId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: 2 options (Reject & Completed) strictly synced in real-time + Delete Button */}
                        <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800/80">
                          {item.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleProcessWithdrawal(item.id, 'rejected')}
                                className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject & Refund
                              </button>
                              <button
                                onClick={() => handleProcessWithdrawal(item.id, 'completed')}
                                className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-500/20"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Completed (Paid)
                              </button>
                            </>
                          ) : (
                            <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                              {item.status === 'completed' ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  <span className="text-emerald-400 font-semibold">Processed Successfully</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-rose-400" />
                                  <span className="text-rose-400 font-semibold">Rejected & Refunded</span>
                                </>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteWithdrawal(item.id)}
                            title="Delete Request"
                            className="p-2 rounded-xl bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UTR VERIFICATION (PLAYER DEPOSITS) */}
          {activeTab === 'deposit_requests' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <ArrowDownLeft className="w-5 h-5 text-amber-400" />
                    Player Deposit UTR Requests
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Verify UTR / Transaction IDs submitted by players after paying via your UPI QR. Approve to credit balance immediately.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
                  {(['pending', 'all', 'completed', 'rejected'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDepositFilter(f)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                        depositFilter === f ? 'bg-neutral-800 text-amber-400 font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {depositRequests.filter((r) => depositFilter === 'all' || r.status === depositFilter).length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-neutral-900 rounded-2xl mx-auto flex items-center justify-center text-neutral-500">
                    <ArrowDownLeft className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-neutral-300">No deposit requests found</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    When players deposit and enter their UTR number, it will appear here for verification.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {depositRequests
                    .filter((r) => depositFilter === 'all' || r.status === depositFilter)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-neutral-500">{item.id}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                item.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : item.status === 'rejected'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-neutral-400">Player:</span>
                            <span className="font-bold text-white text-sm">{item.playerName}</span>
                            <span className="text-neutral-500 text-xs">·</span>
                            <span className="text-lg font-bold text-amber-400">₹{item.amount}</span>
                          </div>

                          {/* UTR / Transaction ID */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-neutral-400">UTR / Ref:</span>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg">
                              <span className="font-mono font-bold text-white text-xs select-all">{item.utr}</span>
                              <button
                                onClick={() => handleCopy(item.utr, item.id)}
                                title="Copy UTR"
                                className="text-neutral-400 hover:text-white p-0.5 transition-colors"
                              >
                                {copiedId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Attached Payment Screenshot */}
                          <div className="flex items-center gap-2 pt-1.5">
                            <span className="text-xs text-neutral-400">Receipt:</span>
                            {item.screenshotUrl ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDepositScreenshot(item)}
                                  className="w-11 h-11 rounded-lg overflow-hidden border-2 border-amber-500/60 bg-neutral-900 relative group cursor-pointer shrink-0 shadow"
                                  title="Click to view full screenshot"
                                >
                                  <img
                                    src={item.screenshotUrl}
                                    alt="Payment Receipt"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDepositScreenshot(item)}
                                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Screenshot</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-500 italic">No receipt attached</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800/80">
                          {item.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleProcessDeposit(item.id, 'rejected')}
                                className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => handleProcessDeposit(item.id, 'completed')}
                                className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-500/20"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Approve & Credit
                              </button>
                            </>
                          ) : (
                            <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                              {item.status === 'completed' ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  <span className="text-emerald-400 font-semibold">Credited to Player Wallet</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-rose-400" />
                                  <span className="text-rose-400 font-semibold">Rejected</span>
                                </>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteDeposit(item.id)}
                            title="Delete Request"
                            className="p-2 rounded-xl bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEPOSIT DETAILS CONFIGURATION (QR & UPI ID) */}
          {activeTab === 'deposits_config' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  Admin Deposit Details (QR Code & UPI ID)
                </h2>
                <p className="text-xs text-neutral-400">
                  Configure the UPI ID and QR code shown to players when depositing. Updates are strictly synced in real-time.
                </p>
              </div>

              {configSavedToast && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Deposit details updated and synced with the game immediately!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Form Column */}
                <div className="md:col-span-7 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <form onSubmit={handleSaveDepositConfig} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Admin UPI ID <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formUpiId}
                        onChange={(e) => setFormUpiId(e.target.value)}
                        placeholder="e.g. yourname@okaxis, merchant@upi"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">Players will pay directly to this UPI ID.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Payee / Account Name
                      </label>
                      <input
                        type="text"
                        value={formPayeeName}
                        onChange={(e) => setFormPayeeName(e.target.value)}
                        placeholder="e.g. Carrom Royal Gaming"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* QR Code Upload / Image Option */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        UPI QR Code Image
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleQrUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            Upload QR Image File
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          {formQrUrl
                            ? 'Custom QR Image loaded.'
                            : 'Currently using auto-generated vector QR matching your UPI ID.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Minimum Deposit (₹) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formMinDeposit}
                          onChange={(e) => setFormMinDeposit(Math.max(1, parseInt(e.target.value) || 0))}
                          placeholder="200"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-amber-400 focus:outline-none focus:border-amber-500"
                          required
                        />
                        <p className="text-[11px] text-neutral-500 mt-1">Default ₹200. Minimum deposit for players.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Minimum Withdrawal (₹) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formMinWithdrawal}
                          onChange={(e) => setFormMinWithdrawal(Math.max(1, parseInt(e.target.value) || 0))}
                          placeholder="500"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-emerald-400 focus:outline-none focus:border-amber-500"
                          required
                        />
                        <p className="text-[11px] text-neutral-500 mt-1">Default ₹500. Minimum withdrawal for players.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Player Deposit Instructions / Note
                      </label>
                      <textarea
                        rows={3}
                        value={formInstructions}
                        onChange={(e) => setFormInstructions(e.target.value)}
                        placeholder="Instructions displayed to users on the deposit screen"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-display font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      Save & Sync with Game
                    </button>
                  </form>
                </div>

                {/* Live Preview Column */}
                <div className="md:col-span-5 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    Live Player In-Game Preview
                  </div>

                  <div className="p-4 bg-neutral-900/80 rounded-2xl border border-neutral-800/80 w-full flex flex-col items-center">
                    <UpiQrDisplay
                      upiId={formUpiId || 'carrom@upi'}
                      payeeName={formPayeeName || 'Admin'}
                      customQrUrl={formQrUrl}
                      size={180}
                      showDetails={true}
                    />
                  </div>

                  <p className="text-[11px] text-neutral-400 max-w-xs">
                    This is exactly how the QR and UPI ID appear when players select an amount in the game deposit section.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & PASSWORD SETTINGS */}
          {activeTab === 'security' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  Admin Security Settings
                </h2>
                <p className="text-xs text-neutral-400">
                  Change the admin console password or customize the secret URL access slug.
                </p>
              </div>

              {pwChangeMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    pwChangeMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {pwChangeMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{pwChangeMessage.text}</span>
                </div>
              )}

              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Current Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={currentPwInput}
                      onChange={(e) => setCurrentPwInput(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      New Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={newPwInput}
                      onChange={(e) => setNewPwInput(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Confirm New Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPwInput}
                      onChange={(e) => setConfirmPwInput(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Admin Access URL Keyword / Slug
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-neutral-500">URL /</span>
                      <input
                        type="text"
                        value={customSlugInput}
                        onChange={(e) => setCustomSlugInput(e.target.value)}
                        placeholder="admin-slug"
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Type this word in the URL bar (e.g. <code>/{customSlugInput || 'secret-slug'}</code>) to access the admin panel. Synced server-side.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-display font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Update Admin Password & Security
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ADMIN LIGHTBOX MODAL FOR VERIFYING PAYMENT SCREENSHOT */}
      {selectedDepositScreenshot && (
        <div
          onClick={() => setSelectedDepositScreenshot(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4 flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-400 font-semibold">{selectedDepositScreenshot.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedDepositScreenshot.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : selectedDepositScreenshot.status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {selectedDepositScreenshot.status}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-white mt-1">
                  Player: <span className="text-amber-300">{selectedDepositScreenshot.playerName}</span> ·{' '}
                  <span className="text-emerald-400 font-black">₹{selectedDepositScreenshot.amount}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-400">
                  <span className="flex items-center gap-1 font-mono text-white bg-neutral-900 px-2.5 py-0.5 rounded-lg border border-neutral-800">
                    UTR: {selectedDepositScreenshot.utr}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-neutral-400">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedDepositScreenshot.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDepositScreenshot(null)}
                className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Screenshot Display Box */}
            <div className="flex-1 overflow-auto rounded-2xl bg-neutral-900/80 border border-neutral-800 p-2 flex items-center justify-center min-h-[320px]">
              {selectedDepositScreenshot.screenshotUrl ? (
                <img
                  src={selectedDepositScreenshot.screenshotUrl}
                  alt="Player Payment Receipt Screenshot"
                  className="max-h-[58vh] w-auto max-w-full object-contain rounded-xl shadow-xl"
                />
              ) : (
                <div className="text-center text-neutral-500 py-12">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No screenshot was uploaded with this deposit request.</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(selectedDepositScreenshot.utr, 'modal_utr')}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {copiedId === 'modal_utr' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy UTR</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedDepositScreenshot.status === 'pending' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleProcessDeposit(selectedDepositScreenshot.id, 'rejected');
                        setSelectedDepositScreenshot(null);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleProcessDeposit(selectedDepositScreenshot.id, 'completed');
                        setSelectedDepositScreenshot(null);
                      }}
                      className="flex-1 sm:flex-initial px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Credit ₹{selectedDepositScreenshot.amount}
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-neutral-400 font-semibold flex items-center gap-1.5">
                    {selectedDepositScreenshot.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Approved & Credited</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-400">Rejected</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
