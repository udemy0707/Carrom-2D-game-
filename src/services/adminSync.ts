/**
 * Admin & Game Real-time Synchronization Service backed by Firebase Firestore & Auth
 * Handles UPI Deposit details, Player UTR verification, Withdrawal requests,
 * Server-side Admin Credentials, and Real-time Multiplayer Matchmaking.
 */

import {
  db,
  ensureFirebaseAuth,
  handleFirestoreError,
  notifyQuotaExceeded,
  isQuotaError,
  OperationType,
} from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  runTransaction,
  query,
  limit,
} from 'firebase/firestore';

export interface AdminDepositConfig {
  upiId: string;
  payeeName: string;
  qrImageUrl: string;
  instructions: string;
  minDeposit: number;
  maxDeposit?: number;
  minWithdrawal: number;
  updatedAt: number;
}

export interface DepositRequest {
  id: string;
  playerName: string;
  amount: number;
  utr: string;
  screenshotUrl: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'rejected';
  rejectionReason?: string;
  userId?: string;
}

export interface WithdrawalRequest {
  id: string;
  playerName: string;
  amount: number;
  playerUpi: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'rejected';
  rejectionReason?: string;
  userId?: string;
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
  passwordHash: string;
  urlSlug: string;
}

export interface AuthoritativeCoin {
  id: number;
  type: 'white' | 'black' | 'queen';
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPocketed: boolean;
}

export interface AuthoritativeStriker {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPocketed: boolean;
}

export interface AuthoritativeShot {
  shooterName: string;
  shooterRole: 'host' | 'guest';
  strikerX: number;
  vx: number;
  vy: number;
  power: number;
  timestamp: number;
  sequenceNumber: number;
}

export interface AuthoritativeLiveAiming {
  shooterRole: 'host' | 'guest';
  strikerX: number;
  isDragging: boolean;
  power: number;
  dirX: number;
  dirY: number;
  pullX: number;
  pullY: number;
  pullDist: number;
  timestamp: number;
}

export interface AuthoritativeLivePhysics {
  shooterRole: 'host' | 'guest';
  striker: { x: number; y: number; vx: number; vy: number };
  coins: { id: number; x: number; y: number; vx: number; vy: number; isPocketed: boolean }[];
  timestamp: number;
}

export interface AuthoritativeGameState {
  version: number;
  sequenceNumber: number;
  gameStatus: 'playing' | 'finished';
  currentTurn: 'host' | 'guest';
  turnStartedAt: number;
  turnDeadline: number;
  turnDuration: number;
  hostScore: number;  // White coins pocketed
  guestScore: number; // Black coins pocketed
  queenState: 'on_board' | 'pending_host' | 'pending_guest' | 'covered_host' | 'covered_guest';
  coins: AuthoritativeCoin[];
  striker: AuthoritativeStriker;
  lastShot?: AuthoritativeShot;
  liveAiming?: AuthoritativeLiveAiming;
  livePhysics?: AuthoritativeLivePhysics;
  winnerRole?: 'host' | 'guest';
  winnerName?: string;
  prizeWon?: number;
  rakeDeducted?: number;
}

export function createInitialAuthoritativeGameState(): AuthoritativeGameState {
  const COIN_RADIUS = 16.5;
  const PLAYER_BASELINE_Y = 648;

  const coins: AuthoritativeCoin[] = [];
  let id = 1;

  // Center Red Queen
  coins.push({
    id: id++,
    type: 'queen',
    x: 400,
    y: 400,
    vx: 0,
    vy: 0,
    isPocketed: false,
  });

  // Ring 1 (6 coins around queen: 3 White, 3 Black alternating)
  const r1Dist = COIN_RADIUS * 2.05;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    coins.push({
      id: id++,
      type: i % 2 === 0 ? 'white' : 'black',
      x: Math.round((400 + Math.cos(angle) * r1Dist) * 100) / 100,
      y: Math.round((400 + Math.sin(angle) * r1Dist) * 100) / 100,
      vx: 0,
      vy: 0,
      isPocketed: false,
    });
  }

  // Ring 2 (12 coins in standard arrangement: 6 White, 6 Black)
  const r2CornerDist = COIN_RADIUS * 4.1;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    coins.push({
      id: id++,
      type: i % 2 === 0 ? 'black' : 'white',
      x: Math.round((400 + Math.cos(angle) * r2CornerDist) * 100) / 100,
      y: Math.round((400 + Math.sin(angle) * r2CornerDist) * 100) / 100,
      vx: 0,
      vy: 0,
      isPocketed: false,
    });
  }

  const r2EdgeDist = COIN_RADIUS * 2.05 * Math.sqrt(3);
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    coins.push({
      id: id++,
      type: i % 2 === 0 ? 'white' : 'black',
      x: Math.round((400 + Math.cos(angle) * r2EdgeDist) * 100) / 100,
      y: Math.round((400 + Math.sin(angle) * r2EdgeDist) * 100) / 100,
      vx: 0,
      vy: 0,
      isPocketed: false,
    });
  }

  const now = Date.now();
  return {
    version: 1,
    sequenceNumber: 1,
    gameStatus: 'playing',
    currentTurn: 'host',
    turnStartedAt: now,
    turnDeadline: now + 20000,
    turnDuration: 20,
    hostScore: 0,
    guestScore: 0,
    queenState: 'on_board',
    coins,
    striker: {
      x: 400,
      y: PLAYER_BASELINE_Y,
      vx: 0,
      vy: 0,
      isPocketed: false,
    },
  };
}

export interface RematchState {
  requestedBy: string;
  requestedByRole: 'host' | 'guest';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  updatedAt: number;
}

export interface ServerGameRoom {
  roomId: string;
  roomCode: string;
  hostId: string;
  hostName: string;
  guestId?: string;
  guestName?: string;
  entryFee: number;
  totalPot: number;
  winnerPrize: number;
  platformRake: number;
  status: 'WAITING' | 'READY' | 'STARTING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'waiting' | 'active' | 'MATCHED' | 'finished' | 'ready' | 'matched' | 'playing' | string;
  playerCount: number;
  matchId?: string;
  turn: 'host' | 'guest';
  gameState?: string;
  winner?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: number;
  rematchState?: RematchState;
}

// Storage Keys & Firestore Paths
const STORAGE_KEYS = {
  DEPOSIT_CONFIG: 'carrom_admin_deposit_config',
  DEPOSIT_REQUESTS: 'carrom_deposit_requests',
  WITHDRAWAL_REQUESTS: 'carrom_withdrawal_requests',
  SECURITY: 'carrom_admin_security',
  WALLET: 'carrom_royal_wallet',
};

// Default Fallback Admin Deposit Config
export const DEFAULT_DEPOSIT_CONFIG: AdminDepositConfig = {
  upiId: 'carromroyal.pay@okaxis',
  payeeName: 'Carrom Royal Official',
  qrImageUrl: '',
  instructions: 'Scan QR or pay directly to UPI ID. Copy and submit the 12-digit UTR/Reference number below.',
  minDeposit: 200,
  minWithdrawal: 500,
  updatedAt: Date.now(),
};

// Initial Security State (Fully Synced Server-Side via Firestore)
export const DEFAULT_SECURITY: AdminSecurityConfig = {
  username: '',
  passwordHash: '',
  urlSlug: '',
};

// Broadcast Channel for Local Instant Sync
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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('carrom_admin_sync', { detail: msg }));
  }
}

const syncSubscribers = new Set<(msg: SyncMessage) => void>();
let pooledUnsubscribe: (() => void) | null = null;

function notifySubscribers(msg: SyncMessage) {
  syncSubscribers.forEach((cb) => {
    try {
      cb(msg);
    } catch (e) {
      console.warn('Sync subscriber error:', e);
    }
  });
}

function startPooledFirestoreSync() {
  if (pooledUnsubscribe) return;

  let unsubConfig: () => void = () => {};
  let unsubSecurity: () => void = () => {};
  let unsubDeposits: () => void = () => {};
  let unsubWithdrawals: () => void = () => {};

  try {
    unsubConfig = onSnapshot(
      doc(db, 'config', 'deposit'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const updatedConfig: AdminDepositConfig = {
            upiId: data.upiId || DEFAULT_DEPOSIT_CONFIG.upiId,
            payeeName: data.payeeName || DEFAULT_DEPOSIT_CONFIG.payeeName,
            qrImageUrl: data.qrImageUrl || DEFAULT_DEPOSIT_CONFIG.qrImageUrl,
            instructions: DEFAULT_DEPOSIT_CONFIG.instructions,
            minDeposit: data.minDeposit ?? DEFAULT_DEPOSIT_CONFIG.minDeposit,
            maxDeposit: data.maxDeposit ?? 50000,
            minWithdrawal: DEFAULT_DEPOSIT_CONFIG.minWithdrawal,
            updatedAt: Date.now(),
          };
          localStorage.setItem(STORAGE_KEYS.DEPOSIT_CONFIG, JSON.stringify(updatedConfig));
          notifySubscribers({ type: 'DEPOSIT_CONFIG_UPDATED', payload: updatedConfig, timestamp: Date.now() });
        }
      },
      (err) => {
        if (isQuotaError(err)) {
          notifyQuotaExceeded();
        } else {
          console.warn('Firestore deposit config sub error:', err.message);
        }
      }
    );
  } catch (e: any) {
    if (isQuotaError(e)) {
      notifyQuotaExceeded();
    }
  }

  try {
    unsubSecurity = onSnapshot(
      doc(db, 'config', 'security'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const updatedSec: AdminSecurityConfig = {
            username: data.username || DEFAULT_SECURITY.username,
            passwordHash: data.passwordHash || DEFAULT_SECURITY.passwordHash,
            urlSlug: data.urlSlug || DEFAULT_SECURITY.urlSlug,
          };
          localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(updatedSec));
          notifySubscribers({ type: 'SECURITY_UPDATED', payload: updatedSec, timestamp: Date.now() });
        }
      },
      (err) => {
        if (isQuotaError(err)) {
          notifyQuotaExceeded();
        } else {
          console.warn('Firestore security sub error:', err.message);
        }
      }
    );
  } catch (e: any) {
    if (isQuotaError(e)) {
      notifyQuotaExceeded();
    }
  }

  try {
    const depositQuery = query(collection(db, 'deposit_requests'), limit(50));
    unsubDeposits = onSnapshot(
      depositQuery,
      (snap) => {
        const items: DepositRequest[] = [];
        snap.forEach((d) => {
          const val = d.data();
          const rawStatus = val.status || 'pending';
          items.push({
            id: val.id || d.id,
            playerName: val.playerName || val.userId || 'Player',
            amount: val.amount || 0,
            utr: val.utrNumber || '',
            screenshotUrl: val.screenshotUrl || (val.paymentMethod?.startsWith('data:image') ? val.paymentMethod : ''),
            timestamp: val.createdAt ? new Date(val.createdAt).getTime() : Date.now(),
            status: rawStatus === 'approved' ? 'completed' : (rawStatus as any),
            rejectionReason: val.adminNotes,
            userId: val.userId,
          });
        });
        localStorage.setItem(STORAGE_KEYS.DEPOSIT_REQUESTS, JSON.stringify(items));
        notifySubscribers({ type: 'DEPOSIT_REQUESTED', payload: items, timestamp: Date.now() });
      },
      (err) => {
        if (isQuotaError(err)) {
          notifyQuotaExceeded();
        } else {
          console.warn('Firestore deposit requests sub error:', err.message);
        }
      }
    );
  } catch (e: any) {
    if (isQuotaError(e)) {
      notifyQuotaExceeded();
    }
  }

  try {
    const withdrawalQuery = query(collection(db, 'withdrawal_requests'), limit(50));
    unsubWithdrawals = onSnapshot(
      withdrawalQuery,
      (snap) => {
        const items: WithdrawalRequest[] = [];
        snap.forEach((d) => {
          const val = d.data();
          const rawStatus = val.status || 'pending';
          items.push({
            id: val.id || d.id,
            playerName: val.playerName || val.userId || 'Player',
            amount: val.amount || 0,
            playerUpi: val.upiId || '',
            timestamp: val.createdAt ? new Date(val.createdAt).getTime() : Date.now(),
            status: rawStatus === 'approved' ? 'completed' : (rawStatus as any),
            rejectionReason: val.adminNotes,
            userId: val.userId,
          });
        });
        localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS, JSON.stringify(items));
        notifySubscribers({ type: 'WITHDRAWAL_REQUESTED', payload: items, timestamp: Date.now() });
      },
      (err) => {
        if (isQuotaError(err)) {
          notifyQuotaExceeded();
        } else {
          console.warn('Firestore withdrawal requests sub error:', err.message);
        }
      }
    );
  } catch (e: any) {
    if (isQuotaError(e)) {
      notifyQuotaExceeded();
    }
  }

  pooledUnsubscribe = () => {
    unsubConfig();
    unsubSecurity();
    unsubDeposits();
    unsubWithdrawals();
    pooledUnsubscribe = null;
  };
}

export function subscribeToSync(callback: (msg: SyncMessage) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  syncSubscribers.add(callback);
  startPooledFirestoreSync();

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
    syncSubscribers.delete(callback);
    window.removeEventListener('carrom_admin_sync', handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    if (syncSubscribers.size === 0 && pooledUnsubscribe) {
      pooledUnsubscribe();
    }
  };
}

/* ==========================================================================
   CONFIG & DATA ACCESSORS (SERVER BACKED WITH LOCAL FALLBACK)
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

export async function saveAdminDepositConfig(config: Partial<AdminDepositConfig>): Promise<AdminDepositConfig> {
  const current = getAdminDepositConfig();
  const updated: AdminDepositConfig = {
    ...current,
    ...config,
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEYS.DEPOSIT_CONFIG, JSON.stringify(updated));
  broadcastSync('DEPOSIT_CONFIG_UPDATED', updated);

  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'config', 'deposit'), {
      upiId: updated.upiId,
      payeeName: updated.payeeName,
      qrImageUrl: updated.qrImageUrl || '',
      minDeposit: updated.minDeposit,
      maxDeposit: 50000,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to sync deposit config to Firestore:', err);
  }

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

export async function saveAdminSecurity(security: Partial<AdminSecurityConfig>): Promise<AdminSecurityConfig> {
  const current = getAdminSecurity();
  const updated: AdminSecurityConfig = {
    ...current,
    ...security,
  };
  localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(updated));
  broadcastSync('SECURITY_UPDATED', updated);

  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'config', 'security'), {
      username: updated.username,
      passwordHash: updated.passwordHash,
      urlSlug: updated.urlSlug.toLowerCase(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to save admin security to Firestore:', err);
  }

  return updated;
}

/* ==========================================================================
   REAL-TIME MULTIPLAYER ROOM MATCHMAKING (FIRESTORE + HYBRID LOCAL FALLBACK)
   ========================================================================== */

function saveLocalRoom(room: ServerGameRoom) {
  try {
    localStorage.setItem(`carrom_room_${room.roomId}`, JSON.stringify(room));
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(`carrom_room_${room.roomId}`);
      channel.postMessage(room);
      channel.close();
    }
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`carrom_room_${room.roomId}`, { detail: room }));
  }
}

function getLocalRoom(roomId: string): ServerGameRoom | null {
  try {
    const raw = localStorage.getItem(`carrom_room_${roomId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function createMultiplayerRoom(playerName: string, entryFee: number): Promise<ServerGameRoom> {
  const user = await ensureFirebaseAuth();
  // Generate unique 6-digit public room code
  const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
  const roomId = roomCode;
  const totalPot = entryFee * 2;
  const platformRake = Math.round(totalPot * 0.1);
  const winnerPrize = totalPot - platformRake;

  console.log(`[ROOM_CREATE] Generating Room Code ${roomCode} for Host "${playerName}" (UID: ${user.uid})...`);

  const room: ServerGameRoom = {
    roomId,
    roomCode,
    hostId: user.uid,
    hostName: playerName.trim() || 'Host Player',
    entryFee,
    totalPot,
    winnerPrize,
    platformRake,
    status: 'WAITING',
    playerCount: 1,
    turn: 'host',
    gameState: JSON.stringify(createInitialAuthoritativeGameState()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes expiry
  };

  saveLocalRoom(room);

  try {
    await setDoc(doc(db, 'game_rooms', roomId), room);
    console.log(`[ROOM_CREATE] Room ${roomCode} saved to Firestore successfully.`);
  } catch (err) {
    if (isQuotaError(err)) {
      notifyQuotaExceeded();
      console.warn(`[ROOM_CREATE] Firestore quota exceeded. Running in hybrid local broadcast mode for ${roomCode}`);
    } else {
      console.warn(`[ROOM_CREATE] Firestore write error for ${roomCode}:`, err);
    }
  }

  return room;
}

export async function joinMultiplayerRoom(
  roomCodeInput: string,
  playerName: string
): Promise<{ success: boolean; room?: ServerGameRoom; error?: string }> {
  const cleanCode = roomCodeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleanCode || cleanCode.length < 5) {
    return { success: false, error: 'Please enter a valid 6-digit Room Code.' };
  }

  const user = await ensureFirebaseAuth();
  const guestNameInput = playerName.trim() || 'Guest Player';

  // 1. Try local storage / broadcast channel room lookup
  let localRoom = getLocalRoom(cleanCode);
  if (!localRoom && cleanCode.startsWith('CR')) {
    const numericCode = cleanCode.replace(/^CR/, '');
    if (numericCode) localRoom = getLocalRoom(numericCode);
  }

  if (localRoom) {
    // Perform strict validation checks on local room
    if (localRoom.expiresAt && Date.now() > localRoom.expiresAt) {
      return { success: false, error: 'This room code has expired. Please ask the host for a new code.' };
    }

    if (localRoom.hostId === user.uid && (!localRoom.guestId || localRoom.guestId !== user.uid)) {
      return { success: false, error: 'You are the host of this room. You cannot join your own room as Player 2.' };
    }

    const currentStatus = localRoom.status;
    if (currentStatus !== 'WAITING' && currentStatus !== 'waiting' && localRoom.guestId !== user.uid) {
      if (currentStatus === 'READY' || currentStatus === 'STARTING' || currentStatus === 'IN_PROGRESS' || currentStatus === 'MATCHED' || currentStatus === 'active') {
        return { success: false, error: 'This room is already full or match is in progress.' };
      }
      if (currentStatus === 'CANCELLED') {
        return { success: false, error: 'This room was cancelled by the host.' };
      }
      if (currentStatus === 'COMPLETED' || currentStatus === 'finished') {
        return { success: false, error: 'This room match has already finished.' };
      }
    }

    if (localRoom.playerCount >= 2 && localRoom.guestId && localRoom.guestId !== user.uid) {
      return { success: false, error: 'This room is already full (2/2 players).' };
    }

    const now = Date.now();
    let currentGameState: AuthoritativeGameState;
    try {
      currentGameState = JSON.parse(localRoom.gameState || '');
    } catch {
      currentGameState = createInitialAuthoritativeGameState();
    }
    currentGameState.turnStartedAt = now;
    currentGameState.turnDeadline = now + 20000;

    const matchId = `MATCH-${localRoom.roomCode}-${now.toString().slice(-4)}`;

    const mergedRoom: ServerGameRoom = {
      ...localRoom,
      guestId: user.uid,
      guestName: guestNameInput,
      playerCount: 2,
      status: 'READY',
      matchId,
      gameState: JSON.stringify(currentGameState),
      updatedAt: new Date().toISOString(),
    };

    saveLocalRoom(mergedRoom);

    try {
      await updateDoc(doc(db, 'game_rooms', mergedRoom.roomId), {
        guestId: user.uid,
        guestName: guestNameInput,
        playerCount: 2,
        status: 'READY',
        matchId,
        gameState: mergedRoom.gameState,
        updatedAt: mergedRoom.updatedAt,
      });
    } catch (e) {
      if (isQuotaError(e)) notifyQuotaExceeded();
    }

    return { success: true, room: mergedRoom };
  }

  // 2. Try Firestore lookup & transaction
  try {
    let targetDocRef = doc(db, 'game_rooms', cleanCode);
    let snap = await getDoc(targetDocRef);

    if (!snap.exists() && cleanCode.startsWith('CR')) {
      const numericCode = cleanCode.replace(/^CR/, '');
      if (numericCode) {
        targetDocRef = doc(db, 'game_rooms', numericCode);
        snap = await getDoc(targetDocRef);
      }
    }

    if (!snap.exists()) {
      return { success: false, error: `Room "${roomCodeInput.trim()}" not found. Please verify the code with the host.` };
    }

    const joinedRoom = await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(targetDocRef);
      if (!roomSnap.exists()) {
        throw new Error(`Room "${cleanCode}" no longer exists.`);
      }

      const roomData = roomSnap.data() as ServerGameRoom;

      if (roomData.expiresAt && Date.now() > roomData.expiresAt) {
        throw new Error('This room code has expired. Please ask the host for a new code.');
      }

      if (roomData.hostId === user.uid && roomData.guestId !== user.uid) {
        throw new Error('You are the host of this room. You cannot join your own room as Player 2.');
      }

      const status = roomData.status;
      if (status !== 'WAITING' && status !== 'waiting' && roomData.guestId !== user.uid) {
        if (status === 'READY' || status === 'STARTING' || status === 'IN_PROGRESS' || status === 'MATCHED' || status === 'active') {
          throw new Error('This room is already full or match is in progress.');
        }
        if (status === 'CANCELLED') {
          throw new Error('This room was cancelled by the host.');
        }
        if (status === 'COMPLETED' || status === 'finished') {
          throw new Error('This room match has already finished.');
        }
      }

      if (roomData.playerCount >= 2 && roomData.guestId && roomData.guestId !== user.uid) {
        throw new Error('This room is already full (2/2 players).');
      }

      let currentGameState: AuthoritativeGameState;
      try {
        currentGameState = JSON.parse(roomData.gameState || '');
      } catch {
        currentGameState = createInitialAuthoritativeGameState();
      }

      const now = Date.now();
      currentGameState.turnStartedAt = now;
      currentGameState.turnDeadline = now + 20000;
      const matchId = `MATCH-${roomData.roomCode || roomData.roomId}-${now.toString().slice(-4)}`;

      const updatedFields: Partial<ServerGameRoom> = {
        guestId: user.uid,
        guestName: guestNameInput,
        playerCount: 2,
        status: 'READY',
        matchId,
        gameState: JSON.stringify(currentGameState),
        updatedAt: new Date().toISOString(),
      };

      transaction.update(targetDocRef, updatedFields);

      const mergedRoom: ServerGameRoom = {
        ...roomData,
        ...updatedFields,
      };

      saveLocalRoom(mergedRoom);
      return mergedRoom;
    });

    return { success: true, room: joinedRoom };
  } catch (err: any) {
    if (isQuotaError(err)) {
      notifyQuotaExceeded();
    }
    console.error('[ROOM_JOIN_ERROR]', err);
    return { success: false, error: err.message || 'Failed to join room.' };
  }
}

export async function cancelMultiplayerRoom(roomId: string): Promise<void> {
  const currentLocal = getLocalRoom(roomId);
  if (currentLocal) {
    const updated: ServerGameRoom = {
      ...currentLocal,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };
    saveLocalRoom(updated);
  }

  try {
    const docRef = doc(db, 'game_rooms', roomId);
    await updateDoc(docRef, {
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    if (isQuotaError(e)) notifyQuotaExceeded();
  }
}

export async function requestMultiplayerRematch(roomId: string, playerName: string, role: 'host' | 'guest'): Promise<void> {
  const currentLocal = getLocalRoom(roomId);
  const rematchState: RematchState = {
    requestedBy: playerName,
    requestedByRole: role,
    status: 'PENDING',
    updatedAt: Date.now(),
  };

  if (currentLocal) {
    saveLocalRoom({ ...currentLocal, rematchState });
  }

  try {
    const docRef = doc(db, 'game_rooms', roomId);
    await updateDoc(docRef, { rematchState });
  } catch (e) {
    if (isQuotaError(e)) notifyQuotaExceeded();
  }
}

export async function respondMultiplayerRematch(roomId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
  const currentLocal = getLocalRoom(roomId);
  if (currentLocal && currentLocal.rematchState) {
    const updatedState: RematchState = {
      ...currentLocal.rematchState,
      status,
      updatedAt: Date.now(),
    };
    saveLocalRoom({ ...currentLocal, rematchState: updatedState });
  }

  try {
    const docRef = doc(db, 'game_rooms', roomId);
    await updateDoc(docRef, {
      'rematchState.status': status,
      'rematchState.updatedAt': Date.now(),
    });
  } catch (e) {
    if (isQuotaError(e)) notifyQuotaExceeded();
  }
}

export function subscribeToRoom(roomId: string, callback: (room: ServerGameRoom) => void): () => void {
  let channel: BroadcastChannel | null = null;
  const handleMessage = (e: MessageEvent) => {
    if (e.data) callback(e.data);
  };

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(`carrom_room_${roomId}`);
      channel.addEventListener('message', handleMessage);
    } catch {
      channel = null;
    }
  }

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<ServerGameRoom>;
    if (custom.detail) callback(custom.detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(`carrom_room_${roomId}`, handleCustomEvent);
  }

  const initialLocal = getLocalRoom(roomId);
  if (initialLocal) {
    callback(initialLocal);
  }

  // Fast Real-time Firestore Snapshot Listener (Sub-100ms Push Sync)
  const unsubFirestore = onSnapshot(
    doc(db, 'game_rooms', roomId),
    (snap) => {
      if (snap.exists()) {
        const roomData = snap.data() as ServerGameRoom;
        saveLocalRoom(roomData);
        callback(roomData);
      }
    },
    (err) => {
      if (isQuotaError(err)) {
        notifyQuotaExceeded();
      } else {
        console.warn(`[ROOM_SUBSCRIPTION_WARN] Room ${roomId}:`, err.message);
      }
    }
  );

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener(`carrom_room_${roomId}`, handleCustomEvent);
    }
    unsubFirestore();
  };
}

export async function updateRoomGameState(
  roomId: string,
  gameState: any,
  turn?: 'host' | 'guest',
  status?: ServerGameRoom['status'],
  winner?: string
): Promise<void> {
  const currentLocal = getLocalRoom(roomId);
  const updatedPayload: any = {
    gameState: typeof gameState === 'string' ? gameState : JSON.stringify(gameState),
    updatedAt: new Date().toISOString(),
  };
  if (turn) updatedPayload.turn = turn;
  if (status) updatedPayload.status = status;
  if (winner) updatedPayload.winner = winner;

  if (currentLocal) {
    const merged = { ...currentLocal, ...updatedPayload };
    saveLocalRoom(merged);
  }

  try {
    const docRef = doc(db, 'game_rooms', roomId);
    await updateDoc(docRef, updatedPayload);
  } catch (err) {
    if (isQuotaError(err)) {
      notifyQuotaExceeded();
    } else {
      console.warn('Failed to update room state in Firestore:', err);
    }
  }
}

let lastFirestoreStreamTime = 0;

export function broadcastLiveStreamState(roomId: string, patchState: Partial<AuthoritativeGameState>): void {
  const currentLocal = getLocalRoom(roomId);
  if (!currentLocal) return;

  let existingGameState: AuthoritativeGameState;
  try {
    existingGameState = typeof currentLocal.gameState === 'string'
      ? JSON.parse(currentLocal.gameState)
      : (currentLocal.gameState || {});
  } catch {
    existingGameState = {} as any;
  }

  const updatedGameState = { ...existingGameState, ...patchState };
  const updatedPayload: Partial<ServerGameRoom> = {
    ...currentLocal,
    gameState: JSON.stringify(updatedGameState),
    updatedAt: new Date().toISOString(),
  };

  saveLocalRoom(updatedPayload as ServerGameRoom);

  const now = Date.now();
  if (now - lastFirestoreStreamTime > 100) {
    lastFirestoreStreamTime = now;
    try {
      const docRef = doc(db, 'game_rooms', roomId);
      updateDoc(docRef, {
        gameState: JSON.stringify(updatedGameState),
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    } catch {}
  }
}

/* ==========================================================================
   PERMANENT PLAYER DATA & WALLET STORAGE WITH FIRESTORE REPLICATION
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
      raw = localStorage.getItem(STORAGE_KEYS.WALLET);
    }

    if (!raw) {
      return { realBalance: 0, totalWon: 0, matchesPlayed: 0, matchesWon: 0, transactions: [] };
    }

    const parsed = JSON.parse(raw);
    const cleanedTransactions: PlayerTransaction[] = Array.isArray(parsed.transactions)
      ? parsed.transactions.filter((t: any) => t && t.id !== 'TXN-INIT-001')
      : [];

    let realBal = Number(parsed.realBalance) || 0;
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

function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22 || String(err).includes('QuotaExceededError')) {
      console.warn(`[STORAGE] LocalStorage quota exceeded for "${key}". Pruning old storage items...`);
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k !== key && k !== STORAGE_KEYS.WALLET && (k.startsWith('carrom_wallet_') || k.startsWith('carrom_room_'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(key, value);
        return true;
      } catch {
        console.warn(`[STORAGE] Could not persist key "${key}" to LocalStorage due to space constraints.`);
        return false;
      }
    }
    return false;
  }
}

export async function savePlayerWallet(wallet: PlayerWalletData, playerName?: string, broadcast: boolean = true): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const rawTxns = Array.isArray(wallet.transactions) ? wallet.transactions : [];
    // Sanitize transactions: strip huge base64 screenshot strings and cap at 25 items to conserve LocalStorage
    const sanitizedTxns: PlayerTransaction[] = rawTxns.slice(0, 25).map((t) => {
      const { screenshotUrl, ...rest } = t as any;
      return rest;
    });

    const sanitized: PlayerWalletData = {
      realBalance: Math.max(0, Number(wallet.realBalance) || 0),
      totalWon: Number(wallet.totalWon) || 0,
      matchesPlayed: Number(wallet.matchesPlayed) || 0,
      matchesWon: Number(wallet.matchesWon) || 0,
      transactions: sanitizedTxns,
    };

    const serialized = JSON.stringify(sanitized);
    const playerKey = getPlayerStorageKey(playerName);

    const prevPlayer = localStorage.getItem(playerKey);
    const prevGlobal = localStorage.getItem(STORAGE_KEYS.WALLET);

    safeSetItem(STORAGE_KEYS.WALLET, serialized);
    if (playerName && playerName.trim() && playerName.trim().length >= 2) {
      safeSetItem(playerKey, serialized);
    }

    const hasChanged = prevPlayer !== serialized || prevGlobal !== serialized;
    if (broadcast && hasChanged) {
      broadcastSync('WALLET_UPDATED', sanitized);
    }

    ensureFirebaseAuth().then((user) => {
      const userId = user.uid;
      setDoc(doc(db, 'users', userId), {
        userId,
        depositCoins: sanitized.realBalance,
        bonusCoins: 0,
        withdrawableCoins: sanitized.realBalance,
        totalMatches: sanitized.matchesPlayed,
        wins: sanitized.matchesWon,
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        console.warn('Firestore user wallet sync error:', err.message);
      });
    });
  } catch (err) {
    console.error('Failed to save player wallet permanently:', err);
  }
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

export function getPlayerDepositHistory(playerName: string): DepositRequest[] {
  const norm = (playerName || '').trim().toLowerCase();
  return getDepositRequests().filter((r) => (r.playerName || '').trim().toLowerCase() === norm);
}

export async function submitDepositRequest(params: {
  playerName: string;
  amount: number;
  utr: string;
  screenshotUrl: string;
}): Promise<DepositRequest> {
  if (!params.screenshotUrl || !params.screenshotUrl.trim()) {
    throw new Error('Payment screenshot is strictly required.');
  }

  const user = await ensureFirebaseAuth();
  const requestId = `DEP-${Date.now().toString().slice(-6)}`;
  
  const newRequest: DepositRequest = {
    id: requestId,
    playerName: params.playerName.trim() || 'Player',
    amount: params.amount,
    utr: params.utr.trim(),
    screenshotUrl: params.screenshotUrl,
    timestamp: Date.now(),
    status: 'pending',
    userId: user.uid,
  };

  const requests = getDepositRequests();
  const updated = [newRequest, ...requests];
  localStorage.setItem(STORAGE_KEYS.DEPOSIT_REQUESTS, JSON.stringify(updated));

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
  await savePlayerWallet(updatedWallet, params.playerName);
  broadcastSync('DEPOSIT_REQUESTED', newRequest);

  try {
    await setDoc(doc(db, 'deposit_requests', requestId), {
      id: requestId,
      userId: user.uid,
      playerName: params.playerName.trim() || 'Player',
      amount: params.amount,
      utrNumber: params.utr.trim(),
      screenshotUrl: params.screenshotUrl,
      status: 'pending',
      paymentMethod: 'UPI',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    if (isQuotaError(err)) {
      notifyQuotaExceeded();
    } else {
      console.warn(`[DEPOSIT] Firestore deposit request write error for ${requestId}:`, err);
    }
  }

  return newRequest;
}

export async function updateDepositStatus(
  requestId: string,
  status: 'completed' | 'rejected',
  rejectionReason?: string
): Promise<DepositRequest | null> {
  const requests = getDepositRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) return null;

  const target = requests[index];
  target.status = status;
  if (rejectionReason) target.rejectionReason = rejectionReason;

  localStorage.setItem(STORAGE_KEYS.DEPOSIT_REQUESTS, JSON.stringify(requests));

  if (status === 'completed') {
    creditPlayerWallet(target.amount, target.utr, target.playerName, target.id);
  } else if (status === 'rejected') {
    markPlayerDepositRejected(target.playerName, target.id, rejectionReason);
  }

  broadcastSync('DEPOSIT_STATUS_UPDATED', { request: target, status });

  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'deposit_requests', requestId);
    await updateDoc(docRef, {
      status: status === 'completed' ? 'approved' : 'rejected',
      adminNotes: rejectionReason || '',
    });

    // Cross-device server wallet balance sync for target user
    if (target.userId) {
      const userRef = doc(db, 'users', target.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentDeposit = Number(userData.depositCoins) || 0;
        const currentWithdraw = Number(userData.withdrawableCoins) || 0;
        if (status === 'completed') {
          await updateDoc(userRef, {
            depositCoins: currentDeposit + target.amount,
            withdrawableCoins: currentWithdraw + target.amount,
            updatedAt: new Date().toISOString(),
          });
        }
      } else if (status === 'completed') {
        await setDoc(userRef, {
          userId: target.userId,
          depositCoins: target.amount,
          bonusCoins: 0,
          withdrawableCoins: target.amount,
          totalMatches: 0,
          wins: 0,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Failed to update deposit status in Firestore:', err);
  }

  return target;
}

export async function deleteDepositRequest(requestId: string): Promise<boolean> {
  const requests = getDepositRequests();
  const updated = requests.filter((r) => r.id !== requestId);
  localStorage.setItem(STORAGE_KEYS.DEPOSIT_REQUESTS, JSON.stringify(updated));
  broadcastSync('DEPOSIT_STATUS_UPDATED', { deletedId: requestId });

  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, 'deposit_requests', requestId));
    console.log(`[FIRESTORE] Permanently deleted deposit_requests/${requestId}`);
  } catch (err) {
    console.warn(`Failed to delete deposit_requests/${requestId} in Firestore:`, err);
  }
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

export async function submitWithdrawalRequest(params: {
  playerName: string;
  amount: number;
  playerUpi: string;
}): Promise<{ success: boolean; request?: WithdrawalRequest; error?: string }> {
  const currentWallet = getPlayerWallet(params.playerName);

  if (currentWallet.realBalance < params.amount) {
    return { success: false, error: 'Insufficient real balance' };
  }

  const user = await ensureFirebaseAuth();
  const requestId = `WTH-${Date.now().toString().slice(-6)}`;

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

  await savePlayerWallet(updatedWallet, params.playerName);

  const requests = getWithdrawalRequests();
  const newRequest: WithdrawalRequest = {
    id: requestId,
    playerName: params.playerName.trim() || 'Player',
    amount: params.amount,
    playerUpi: params.playerUpi.trim(),
    timestamp: Date.now(),
    status: 'pending',
    userId: user.uid,
  };

  const updated = [newRequest, ...requests];
  localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS, JSON.stringify(updated));
  broadcastSync('WITHDRAWAL_REQUESTED', newRequest);

  try {
    await setDoc(doc(db, 'withdrawal_requests', requestId), {
      id: requestId,
      userId: user.uid,
      playerName: params.playerName.trim() || 'Player',
      amount: params.amount,
      upiId: params.playerUpi.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    if (isQuotaError(err)) {
      notifyQuotaExceeded();
    } else {
      console.warn(`[WITHDRAWAL] Firestore withdrawal request write error for ${requestId}:`, err);
    }
  }

  return { success: true, request: newRequest };
}

export async function updateWithdrawalStatus(
  requestId: string,
  status: 'completed' | 'rejected',
  rejectionReason?: string
): Promise<WithdrawalRequest | null> {
  const requests = getWithdrawalRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) return null;

  const target = requests[index];
  target.status = status;
  if (rejectionReason) target.rejectionReason = rejectionReason;

  localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS, JSON.stringify(requests));

  if (status === 'rejected') {
    refundPlayerWallet(target.amount, target.id, target.playerName);
  } else if (status === 'completed') {
    updateWalletTransactionStatus(target.playerName, `WTH-${requestId}`, 'success');
  }

  broadcastSync('WITHDRAWAL_STATUS_UPDATED', { request: target, status });

  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'withdrawal_requests', requestId);
    await updateDoc(docRef, {
      status: status === 'completed' ? 'approved' : 'rejected',
      adminNotes: rejectionReason || '',
    });

    // Cross-device refund sync if rejected by admin
    if (status === 'rejected' && target.userId) {
      const userRef = doc(db, 'users', target.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentDeposit = Number(userData.depositCoins) || 0;
        const currentWithdraw = Number(userData.withdrawableCoins) || 0;
        await updateDoc(userRef, {
          depositCoins: currentDeposit + target.amount,
          withdrawableCoins: currentWithdraw + target.amount,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Failed to update withdrawal status in Firestore:', err);
  }

  return target;
}

export async function deleteWithdrawalRequest(requestId: string): Promise<boolean> {
  const requests = getWithdrawalRequests();
  const target = requests.find((r) => r.id === requestId);
  if (target && target.status === 'pending') {
    refundPlayerWallet(target.amount, target.id, target.playerName);
  }
  const updated = requests.filter((r) => r.id !== requestId);
  localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS, JSON.stringify(updated));
  broadcastSync('WITHDRAWAL_STATUS_UPDATED', { deletedId: requestId });

  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, 'withdrawal_requests', requestId));
    console.log(`[FIRESTORE] Permanently deleted withdrawal_requests/${requestId}`);
  } catch (err) {
    console.warn(`Failed to delete withdrawal_requests/${requestId} in Firestore:`, err);
  }
  return true;
}

export function subscribeToUserWallet(
  userId: string,
  callback: (data: { depositCoins: number; withdrawableCoins: number; totalMatches: number; wins: number }) => void
): () => void {
  return onSnapshot(
    doc(db, 'users', userId),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          depositCoins: Number(data.depositCoins) || 0,
          withdrawableCoins: Number(data.withdrawableCoins) ?? Number(data.depositCoins) ?? 0,
          totalMatches: Number(data.totalMatches) || 0,
          wins: Number(data.wins) || 0,
        });
      }
    },
    (err) => {
      if (isQuotaError(err)) {
        notifyQuotaExceeded();
      } else {
        console.warn('Firestore user wallet subscription error:', err.message);
      }
    }
  );
}

/* ==========================================================================
   WALLET SYNC HELPERS
   ========================================================================== */

function creditPlayerWallet(amount: number, utr: string, playerName?: string, requestId?: string) {
  try {
    const current = getPlayerWallet(playerName);
    const updatedBalance = current.realBalance + amount;

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
   URL & ROUTE DETECTION (MATCHES CONFIGURED SLUG IN FIRESTORE OR FALLBACK)
   ========================================================================== */

export function checkIsAdminUrl(): boolean {
  if (typeof window === 'undefined') return false;

  const security = getAdminSecurity();
  const configuredSlug = (security.urlSlug || '').toLowerCase().trim();
  if (!configuredSlug) return false;

  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  const pathSegments = path.split('/').filter(Boolean);
  const hashSegments = hash.replace(/^#\/?/, '').split('/').filter(Boolean);

  // Match ONLY the dynamically configured server-side URL slug from Firestore
  if (pathSegments.includes(configuredSlug)) return true;
  if (hashSegments.includes(configuredSlug)) return true;
  if (search.includes(configuredSlug)) return true;

  return false;
}
