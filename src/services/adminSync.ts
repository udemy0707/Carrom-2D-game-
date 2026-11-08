/**
 * Admin & Game Real-time Synchronization Service
 * Handles UPI Deposit details, Player UTR verification, and Withdrawal request processing.
 * Synced across tabs using BroadcastChannel and localStorage events.
 */

export interface AdminDepositConfig {
  upiId: string;
  payeeName: string;
  qrImageUrl: string;
  instructions: string;
  minDeposit: number; // default: 200
  minWithdrawal: number; // default: 500
  updatedAt: number;
}

export interface DepositRequest {
  id: string;
  playerName: string;
  amount: number;
  utr: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'rejected';
  rejectionReason?: string;
}

export interface WithdrawalRequest {
  id: string;
  playerName: string;
  amount: number;
  playerUpi: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'rejected';
  rejectionReason?: string;
}

export interface AdminSecurityConfig {
  username: string;
  passwordHash: string; // Plain or hashed password
  urlSlug: string; // e.g. "admin9999"
}

// Storage Keys
const STORAGE_KEYS = {
  DEPOSIT_CONFIG: 'carrom_admin_deposit_config',
  DEPOSIT_REQUESTS: 'carrom_deposit_requests',
  WITHDRAWAL_REQUESTS: 'carrom_withdrawal_requests',
  SECURITY: 'carrom_admin_security',
  WALLET: 'carrom_royal_wallet',
};

// Default Admin Deposit Config
export const DEFAULT_DEPOSIT_CONFIG: AdminDepositConfig = {
  upiId: 'carromroyal.pay@okaxis',
  payeeName: 'Carrom Royal Official',
  qrImageUrl: '', // Empty means dynamic vector QR will be rendered
  instructions: 'Scan QR or pay directly to UPI ID. Copy and submit the 12-digit UTR/Reference number below.',
  minDeposit: 200,
  minWithdrawal: 500,
  updatedAt: Date.now(),
};

// Default Admin Security
export const DEFAULT_SECURITY: AdminSecurityConfig = {
  username: 'Admin',
  passwordHash: 'Bihpuria7@',
  urlSlug: 'admin9999',
};

// Broadcast Channel for Instant Multi-tab synchronization
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('carrom_royal_admin_sync');
  }
} catch {
  broadcastChannel = null;
}

type SyncEventType =
  | 'DEPOSIT_CONFIG_UPDATED'
  | 'DEPOSIT_REQUESTED'
  | 'DEPOSIT_STATUS_UPDATED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_STATUS_UPDATED'
  | 'SECURITY_UPDATED'
  | 'WALLET_UPDATED';

export interface SyncMessage {
  type: SyncEventType;
  payload?: any;
  timestamp: number;
}

export function broadcastSync(type: SyncEventType, payload?: any) {
  const msg: SyncMessage = { type, payload, timestamp: Date.now() };
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(msg);
    } catch (e) {
      console.warn('Broadcast failed:', e);
    }
  }
  // Also dispatch a window CustomEvent for same-tab subscribers
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('carrom_admin_sync', { detail: msg }));
  }
}

export function subscribeToSync(callback: (msg: SyncMessage) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<SyncMessage>;
    if (custom.detail) callback(custom.detail);
  };

  const handleBroadcast = (e: MessageEvent) => {
    if (e.data) callback(e.data);
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
      callback({
        type: 'WALLET_UPDATED',
        payload: { key: e.key },
        timestamp: Date.now(),
      });
    }
  };

  window.addEventListener('carrom_admin_sync', handleCustomEvent);
  window.addEventListener('storage', handleStorage);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    window.removeEventListener('carrom_admin_sync', handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}

/* ==========================================================================
   CONFIG & DATA ACCESSORS
   ========================================================================== */

export function getAdminDepositConfig(): AdminDepositConfig {
  if (typeof window === 'undefined') return DEFAULT_DEPOSIT_CONFIG;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DEPOSIT_CONFIG);
    if (!data) return DEFAULT_DEPOSIT_CONFIG;
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_DEPOSIT_CONFIG,
      ...parsed,
      minDeposit: parsed.minDeposit ?? DEFAULT_DEPOSIT_CONFIG.minDeposit,
      minWithdrawal: parsed.minWithdrawal ?? DEFAULT_DEPOSIT_CONFIG.minWithdrawal,
    };
  } catch {
    return DEFAULT_DEPOSIT_CONFIG;
  }
}

export function saveAdminDepositConfig(config: Partial<AdminDepositConfig>): AdminDepositConfig {
  const current = getAdminDepositConfig();
  const updated: AdminDepositConfig = {
    ...current,
    ...config,
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEYS.DEPOSIT_CONFIG, JSON.stringify(updated));
  broadcastSync('DEPOSIT_CONFIG_UPDATED', updated);
  return updated;
}

export function getAdminSecurity(): AdminSecurityConfig {
  if (typeof window === 'undefined') return DEFAULT_SECURITY;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SECURITY);
    if (!data) return DEFAULT_SECURITY;
    return { ...DEFAULT_SECURITY, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SECURITY;
  }
}

export function saveAdminSecurity(security: Partial<AdminSecurityConfig>): AdminSecurityConfig {
  const current = getAdminSecurity();
  const updated: AdminSecurityConfig = {
    ...current,
    ...security,
  };
  localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(updated));
  broadcastSync('SECURITY_UPDATED', updated);
  return updated;
}

/* ==========================================================================
   DEPOSIT REQUESTS
   ========================================================================== */

export function getDepositRequests(): DepositRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DEPOSIT_REQUESTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function submitDepositRequest(params: {
  playerName: string;
  amount: number;
  utr: string;
}): DepositRequest {
  const requests = getDepositRequests();
  const newRequest: DepositRequest = {
    id: `DEP-${Date.now().toString().slice(-6)}`,
    playerName: params.playerName.trim() || 'Player',
    amount: params.amount,
    utr: params.utr.trim(),
    timestamp: Date.now(),
    status: 'pending',
  };

  const updated = [newRequest, ...requests];
  localStorage.setItem(STORAGE_KEYS.DEPOSIT_REQUESTS, JSON.stringify(updated));
  broadcastSync('DEPOSIT_REQUESTED', newRequest);
  return newRequest;
}

export function updateDepositStatus(
  requestId: string,
  status: 'completed' | 'rejected',
  rejectionReason?: string
): DepositRequest | null {
  const requests = getDepositRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) return null;

  const target = requests[index];
  target.status = status;
  if (rejectionReason) target.rejectionReason = rejectionReason;

  localStorage.setItem(STORAGE_KEYS.DEPOSIT_REQUESTS, JSON.stringify(requests));

  // If completed, credit player wallet
  if (status === 'completed') {
    creditPlayerWallet(target.amount, target.utr);
  }

  broadcastSync('DEPOSIT_STATUS_UPDATED', { request: target, status });
  return target;
}

export function deleteDepositRequest(requestId: string): boolean {
  const requests = getDepositRequests();
  const updated = requests.filter((r) => r.id !== requestId);
  localStorage.setItem(STORAGE_KEYS.DEPOSIT_REQUESTS, JSON.stringify(updated));
  broadcastSync('DEPOSIT_STATUS_UPDATED', { deletedId: requestId });
  return true;
}

/* ==========================================================================
   WITHDRAWAL REQUESTS
   ========================================================================== */

export function getWithdrawalRequests(): WithdrawalRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function submitWithdrawalRequest(params: {
  playerName: string;
  amount: number;
  playerUpi: string;
}): { success: boolean; request?: WithdrawalRequest; error?: string } {
  const walletStr = localStorage.getItem(STORAGE_KEYS.WALLET);
  const wallet = walletStr ? JSON.parse(walletStr) : null;

  if (!wallet || wallet.realBalance < params.amount) {
    return { success: false, error: 'Insufficient real balance' };
  }

  // Deduct/hold from realBalance immediately
  wallet.realBalance -= params.amount;
  wallet.transactions = [
    {
      id: `TXN-WTH-REQ-${Date.now().toString().slice(-6)}`,
      type: 'withdrawal',
      amount: params.amount,
      description: `Withdrawal to ${params.playerUpi} (Pending Admin Approval)`,
      timestamp: Date.now(),
      status: 'pending',
    },
    ...(wallet.transactions || []),
  ];
  localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));

  const requests = getWithdrawalRequests();
  const newRequest: WithdrawalRequest = {
    id: `WTH-${Date.now().toString().slice(-6)}`,
    playerName: params.playerName.trim() || 'Player',
    amount: params.amount,
    playerUpi: params.playerUpi.trim(),
    timestamp: Date.now(),
    status: 'pending',
  };

  const updated = [newRequest, ...requests];
  localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS, JSON.stringify(updated));
  broadcastSync('WITHDRAWAL_REQUESTED', newRequest);
  broadcastSync('WALLET_UPDATED', wallet);

  return { success: true, request: newRequest };
}

export function updateWithdrawalStatus(
  requestId: string,
  status: 'completed' | 'rejected',
  rejectionReason?: string
): WithdrawalRequest | null {
  const requests = getWithdrawalRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) return null;

  const target = requests[index];
  target.status = status;
  if (rejectionReason) target.rejectionReason = rejectionReason;

  localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS, JSON.stringify(requests));

  // If rejected, refund the funds back to player's wallet!
  if (status === 'rejected') {
    refundPlayerWallet(target.amount, target.id);
  } else if (status === 'completed') {
    // Update matching transaction in wallet to completed
    updateWalletTransactionStatus(`WTH-${requestId}`, 'success');
  }

  broadcastSync('WITHDRAWAL_STATUS_UPDATED', { request: target, status });
  return target;
}

export function deleteWithdrawalRequest(requestId: string): boolean {
  const requests = getWithdrawalRequests();
  const target = requests.find((r) => r.id === requestId);
  // If the deleted request was pending, refund the money to user's wallet automatically
  if (target && target.status === 'pending') {
    refundPlayerWallet(target.amount, target.id);
  }
  const updated = requests.filter((r) => r.id !== requestId);
  localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS, JSON.stringify(updated));
  broadcastSync('WITHDRAWAL_STATUS_UPDATED', { deletedId: requestId });
  return true;
}

/* ==========================================================================
   WALLET SYNC HELPERS (NO BONUS SYSTEM)
   ========================================================================== */

function creditPlayerWallet(amount: number, utr: string) {
  try {
    const walletStr = localStorage.getItem(STORAGE_KEYS.WALLET);
    if (!walletStr) return;
    const wallet = JSON.parse(walletStr);

    wallet.realBalance = (wallet.realBalance || 0) + amount;
    // Strictly clear any legacy bonus fields
    delete wallet.bonusBalance;
    delete wallet.wagerRequired;
    delete wallet.wagerCompleted;

    wallet.transactions = [
      {
        id: `TXN-DEP-${Date.now().toString().slice(-6)}`,
        type: 'deposit',
        amount,
        description: `Deposit Approved (UTR: ${utr})`,
        timestamp: Date.now(),
        status: 'success',
      },
      ...(wallet.transactions || []),
    ];

    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
    broadcastSync('WALLET_UPDATED', wallet);
  } catch (e) {
    console.error('Failed to credit wallet:', e);
  }
}

function refundPlayerWallet(amount: number, requestId: string) {
  try {
    const walletStr = localStorage.getItem(STORAGE_KEYS.WALLET);
    if (!walletStr) return;
    const wallet = JSON.parse(walletStr);

    wallet.realBalance = (wallet.realBalance || 0) + amount;
    delete wallet.bonusBalance;
    delete wallet.wagerRequired;
    delete wallet.wagerCompleted;

    wallet.transactions = [
      {
        id: `TXN-REF-${Date.now().toString().slice(-6)}`,
        type: 'deposit',
        amount,
        description: `Withdrawal Refund (${requestId})`,
        timestamp: Date.now(),
        status: 'success',
      },
      ...(wallet.transactions || []),
    ];

    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
    broadcastSync('WALLET_UPDATED', wallet);
  } catch (e) {
    console.error('Failed to refund wallet:', e);
  }
}

function updateWalletTransactionStatus(keyword: string, status: 'success' | 'pending') {
  try {
    const walletStr = localStorage.getItem(STORAGE_KEYS.WALLET);
    if (!walletStr) return;
    const wallet = JSON.parse(walletStr);

    if (Array.isArray(wallet.transactions)) {
      for (const t of wallet.transactions) {
        if (t.id.includes(keyword) || t.description.includes(keyword)) {
          t.status = status;
          break;
        }
      }
    }

    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
    broadcastSync('WALLET_UPDATED', wallet);
  } catch (e) {
    console.error('Failed to update wallet transaction:', e);
  }
}

/* ==========================================================================
   URL & ROUTE DETECTION (MATCHES /admin9999, /Admin9999, #admin9999, etc.)
   ========================================================================== */

export function checkIsAdminUrl(): boolean {
  if (typeof window === 'undefined') return false;

  const security = getAdminSecurity();
  const configuredSlug = (security.urlSlug || 'admin9999').toLowerCase();

  const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const hash = window.location.hash.toLowerCase().replace(/^#\/?|\/+$/g, '');
  const search = window.location.search.toLowerCase();

  // Match case-insensitively against path, hash, or search param
  if (path === configuredSlug) return true;
  if (hash === configuredSlug) return true;
  if (search.includes(configuredSlug) || search.includes(`admin`)) {
    if (search.includes(`route=${configuredSlug}`) || search.includes(configuredSlug)) {
      return true;
    }
  }

  // Also fallback check for default "admin9999"
  if (path === 'admin9999' || hash === 'admin9999') return true;

  return false;
}
