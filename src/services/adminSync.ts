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
  screenshotUrl: string; // Base64 data URL of uploaded payment screenshot
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

export interface PlayerTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'entry' | 'win';
  amount: number;
  description: string;
  timestamp: number;
  status: 'success' | 'pending' | 'rejected';
  screenshotUrl?: string;
  utr?: string;
}

export interface PlayerWalletData {
  realBalance: number;
  totalWon: number;
  matchesPlayed: number;
  matchesWon: number;
  transactions: PlayerTransaction[];
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
   PERMANENT PLAYER DATA & WALLET STORAGE (NO HARDCODED VALUES)
   ========================================================================== */

function getPlayerStorageKey(playerName?: string): string {
  if (!playerName || !playerName.trim()) return STORAGE_KEYS.WALLET;
  return `carrom_wallet_${playerName.trim().toLowerCase()}`;
}

export function getPlayerWallet(playerName?: string): PlayerWalletData {
  if (typeof window === 'undefined') {
    return { realBalance: 0, totalWon: 0, matchesPlayed: 0, matchesWon: 0, transactions: [] };
  }

  try {
    const playerKey = getPlayerStorageKey(playerName);
    let raw = localStorage.getItem(playerKey);
    if (!raw && playerKey !== STORAGE_KEYS.WALLET) {
      // Fallback to active wallet key
      raw = localStorage.getItem(STORAGE_KEYS.WALLET);
    }

    if (!raw) {
      return { realBalance: 0, totalWon: 0, matchesPlayed: 0, matchesWon: 0, transactions: [] };
    }

    const parsed = JSON.parse(raw);

    // Clean out any legacy artificial initial deposit mock if present
    const cleanedTransactions: PlayerTransaction[] = Array.isArray(parsed.transactions)
      ? parsed.transactions.filter((t: any) => t && t.id !== 'TXN-INIT-001')
      : [];

    let realBal = Number(parsed.realBalance) || 0;
    // If only legacy fake initial transaction was present and balance was 1000, sanitize to 0
    if (parsed.transactions?.length === 1 && parsed.transactions[0]?.id === 'TXN-INIT-001' && realBal === 1000) {
      realBal = 0;
    }

    return {
      realBalance: Math.max(0, realBal),
      totalWon: Number(parsed.totalWon) || 0,
      matchesPlayed: Number(parsed.matchesPlayed) || 0,
      matchesWon: Number(parsed.matchesWon) || 0,
      transactions: cleanedTransactions,
    };
  } catch (err) {
    console.error('Error loading player wallet:', err);
    return { realBalance: 0, totalWon: 0, matchesPlayed: 0, matchesWon: 0, transactions: [] };
  }
}

export function savePlayerWallet(wallet: PlayerWalletData, playerName?: string, broadcast: boolean = true): void {
  if (typeof window === 'undefined') return;

  try {
    const sanitized: PlayerWalletData = {
      realBalance: Math.max(0, Number(wallet.realBalance) || 0),
      totalWon: Number(wallet.totalWon) || 0,
      matchesPlayed: Number(wallet.matchesPlayed) || 0,
      matchesWon: Number(wallet.matchesWon) || 0,
      transactions: Array.isArray(wallet.transactions) ? wallet.transactions : [],
    };

    const serialized = JSON.stringify(sanitized);
    const playerKey = getPlayerStorageKey(playerName);

    const prevPlayer = localStorage.getItem(playerKey);
    const prevGlobal = localStorage.getItem(STORAGE_KEYS.WALLET);

    // Persist to global active wallet
    localStorage.setItem(STORAGE_KEYS.WALLET, serialized);

    // Persist to specific player profile key if name provided
    if (playerName && playerName.trim()) {
      localStorage.setItem(playerKey, serialized);
    }

    // Only broadcast if something actually changed AND broadcast was requested
    const hasChanged = prevPlayer !== serialized || prevGlobal !== serialized;
    if (broadcast && hasChanged) {
      broadcastSync('WALLET_UPDATED', sanitized);
    }
  } catch (err) {
    console.error('Failed to save player wallet permanently:', err);
  }
}

/* ==========================================================================
   DEPOSIT REQUESTS (WITH MANDATORY PAYMENT SCREENSHOT)
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

export function getPlayerDepositHistory(playerName: string): DepositRequest[] {
  const norm = (playerName || '').trim().toLowerCase();
  return getDepositRequests().filter((r) => (r.playerName || '').trim().toLowerCase() === norm);
}

export function submitDepositRequest(params: {
  playerName: string;
  amount: number;
  utr: string;
  screenshotUrl: string;
}): DepositRequest {
  if (!params.screenshotUrl || !params.screenshotUrl.trim()) {
    throw new Error('Payment screenshot is strictly required.');
  }

  const requests = getDepositRequests();
  const newRequest: DepositRequest = {
    id: `DEP-${Date.now().toString().slice(-6)}`,
    playerName: params.playerName.trim() || 'Player',
    amount: params.amount,
    utr: params.utr.trim(),
    screenshotUrl: params.screenshotUrl,
    timestamp: Date.now(),
    status: 'pending',
  };

  const updated = [newRequest, ...requests];
  localStorage.setItem(STORAGE_KEYS.DEPOSIT_REQUESTS, JSON.stringify(updated));

  // Permanently record in player's wallet ledger as pending verification
  const currentWallet = getPlayerWallet(params.playerName);
  const updatedWallet: PlayerWalletData = {
    ...currentWallet,
    transactions: [
      {
        id: `TXN-DEP-${newRequest.id}`,
        type: 'deposit',
        amount: params.amount,
        description: `Deposit Submitted (UTR: ${params.utr.trim()}) - Awaiting Admin Approval`,
        timestamp: Date.now(),
        status: 'pending',
        screenshotUrl: params.screenshotUrl,
        utr: params.utr.trim(),
      },
      ...currentWallet.transactions,
    ],
  };
  savePlayerWallet(updatedWallet, params.playerName);

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

  // If completed, credit player's permanent balance and mark transaction successful
  if (status === 'completed') {
    creditPlayerWallet(target.amount, target.utr, target.playerName, target.id);
  } else if (status === 'rejected') {
    markPlayerDepositRejected(target.playerName, target.id, rejectionReason);
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

export function getPlayerWithdrawalHistory(playerName: string): WithdrawalRequest[] {
  const norm = (playerName || '').trim().toLowerCase();
  return getWithdrawalRequests().filter((r) => (r.playerName || '').trim().toLowerCase() === norm);
}

export function submitWithdrawalRequest(params: {
  playerName: string;
  amount: number;
  playerUpi: string;
}): { success: boolean; request?: WithdrawalRequest; error?: string } {
  const currentWallet = getPlayerWallet(params.playerName);

  if (currentWallet.realBalance < params.amount) {
    return { success: false, error: 'Insufficient real balance' };
  }

  // Deduct/hold from realBalance immediately and record in ledger
  const updatedWallet: PlayerWalletData = {
    ...currentWallet,
    realBalance: Math.max(0, currentWallet.realBalance - params.amount),
    transactions: [
      {
        id: `TXN-WTH-REQ-${Date.now().toString().slice(-6)}`,
        type: 'withdrawal',
        amount: params.amount,
        description: `Withdrawal to ${params.playerUpi} (Pending Admin Approval)`,
        timestamp: Date.now(),
        status: 'pending',
      },
      ...currentWallet.transactions,
    ],
  };

  savePlayerWallet(updatedWallet, params.playerName);

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

  // If rejected, refund the funds back to player's wallet permanently!
  if (status === 'rejected') {
    refundPlayerWallet(target.amount, target.id, target.playerName);
  } else if (status === 'completed') {
    // Update matching transaction in player's wallet to success
    updateWalletTransactionStatus(target.playerName, `WTH-${requestId}`, 'success');
  }

  broadcastSync('WITHDRAWAL_STATUS_UPDATED', { request: target, status });
  return target;
}

export function deleteWithdrawalRequest(requestId: string): boolean {
  const requests = getWithdrawalRequests();
  const target = requests.find((r) => r.id === requestId);
  // If the deleted request was pending, refund the money to user's wallet automatically
  if (target && target.status === 'pending') {
    refundPlayerWallet(target.amount, target.id, target.playerName);
  }
  const updated = requests.filter((r) => r.id !== requestId);
  localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS, JSON.stringify(updated));
  broadcastSync('WITHDRAWAL_STATUS_UPDATED', { deletedId: requestId });
  return true;
}

/* ==========================================================================
   WALLET SYNC HELPERS (PERMANENT & CONSISTENT)
   ========================================================================== */

function creditPlayerWallet(amount: number, utr: string, playerName?: string, requestId?: string) {
  try {
    const current = getPlayerWallet(playerName);
    const updatedBalance = current.realBalance + amount;

    // Check if there is an existing pending deposit transaction for this requestId or utr
    let found = false;
    const updatedTxns = current.transactions.map((t) => {
      if (!found && (
        (requestId && t.id.includes(requestId)) ||
        (t.type === 'deposit' && t.status === 'pending' && t.utr === utr) ||
        (t.type === 'deposit' && t.status === 'pending' && t.amount === amount)
      )) {
        found = true;
        return {
          ...t,
          status: 'success' as const,
          description: `Deposit Approved (UTR: ${utr})`,
        };
      }
      return t;
    });

    if (!found) {
      updatedTxns.unshift({
        id: `TXN-DEP-${Date.now().toString().slice(-6)}`,
        type: 'deposit',
        amount,
        description: `Deposit Approved (UTR: ${utr})`,
        timestamp: Date.now(),
        status: 'success',
        utr,
      });
    }

    const updated: PlayerWalletData = {
      ...current,
      realBalance: updatedBalance,
      transactions: updatedTxns,
    };

    savePlayerWallet(updated, playerName);
  } catch (e) {
    console.error('Failed to credit player wallet:', e);
  }
}

function markPlayerDepositRejected(playerName?: string, requestId?: string, reason?: string) {
  try {
    const current = getPlayerWallet(playerName);
    let found = false;
    const updatedTxns = current.transactions.map((t) => {
      if (!found && requestId && t.id.includes(requestId)) {
        found = true;
        return {
          ...t,
          status: 'rejected' as const,
          description: `Deposit Rejected${reason ? `: ${reason}` : ''}`,
        };
      }
      return t;
    });

    const updated: PlayerWalletData = {
      ...current,
      transactions: updatedTxns,
    };
    savePlayerWallet(updated, playerName);
  } catch (e) {
    console.error('Failed to mark deposit rejected:', e);
  }
}

function refundPlayerWallet(amount: number, requestId: string, playerName?: string) {
  try {
    const current = getPlayerWallet(playerName);
    const updatedBalance = current.realBalance + amount;

    const updatedTxns = [
      {
        id: `TXN-REF-${Date.now().toString().slice(-6)}`,
        type: 'deposit' as const,
        amount,
        description: `Withdrawal Refund (${requestId})`,
        timestamp: Date.now(),
        status: 'success' as const,
      },
      ...current.transactions.map((t) => {
        if (t.type === 'withdrawal' && t.status === 'pending' && t.amount === amount) {
          return { ...t, status: 'rejected' as const, description: `${t.description} - Refunded` };
        }
        return t;
      }),
    ];

    const updated: PlayerWalletData = {
      ...current,
      realBalance: updatedBalance,
      transactions: updatedTxns,
    };

    savePlayerWallet(updated, playerName);
  } catch (e) {
    console.error('Failed to refund player wallet:', e);
  }
}

function updateWalletTransactionStatus(playerName: string | undefined, keyword: string, status: 'success' | 'pending' | 'rejected') {
  try {
    const current = getPlayerWallet(playerName);
    const updatedTxns = current.transactions.map((t) => {
      if (t.id.includes(keyword) || t.description.includes(keyword)) {
        return { ...t, status };
      }
      return t;
    });

    const updated: PlayerWalletData = {
      ...current,
      transactions: updatedTxns,
    };
    savePlayerWallet(updated, playerName);
  } catch (e) {
    console.error('Failed to update wallet transaction status:', e);
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
