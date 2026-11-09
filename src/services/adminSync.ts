/**
 * Admin & Game Real-time Synchronization Service backed by Firebase Firestore & Auth
 * Handles UPI Deposit details, Player UTR verification, Withdrawal requests,
 * Server-side Admin Credentials, and Real-time Multiplayer Matchmaking.
 */

import {
  db,
  ensureFirebaseAuth,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  runTransaction,
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

export interface ServerGameRoom {
  roomId: string;
  hostId: string;
  hostName: string;
  guestId?: string;
  guestName?: string;
  entryFee: number;
  totalPot: number;
  winnerPrize: number;
  platformRake: number;
  status: 'waiting' | 'active' | 'MATCHED' | 'finished';
  turn: 'host' | 'guest';
  gameState?: string;
  winner?: string;
  createdAt: string;
  updatedAt: string;
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

// Default Fallback Admin Security (Initial Server State)
export const DEFAULT_SECURITY: AdminSecurityConfig = {
  username: 'admin',
  passwordHash: 'admin123',
  urlSlug: 'admin',
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

  // Subscribe to real-time Firestore collections
  const unsubConfig = onSnapshot(
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
        callback({ type: 'DEPOSIT_CONFIG_UPDATED', payload: updatedConfig, timestamp: Date.now() });
      }
    },
    (err) => {
      console.warn('Firestore deposit config sub error:', err.message);
    }
  );

  const unsubSecurity = onSnapshot(
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
        callback({ type: 'SECURITY_UPDATED', payload: updatedSec, timestamp: Date.now() });
      } else {
        // Initialize default security on server if not present
        setDoc(doc(db, 'config', 'security'), {
          username: DEFAULT_SECURITY.username,
          passwordHash: DEFAULT_SECURITY.passwordHash,
          urlSlug: DEFAULT_SECURITY.urlSlug,
          updatedAt: new Date().toISOString(),
        }).catch((err) => console.warn('Init server security error:', err));
      }
    },
    (err) => {
      console.warn('Firestore security sub error:', err.message);
    }
  );

  const unsubDeposits = onSnapshot(
    collection(db, 'deposit_requests'),
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
      if (items.length > 0) {
        localStorage.setItem(STORAGE_KEYS.DEPOSIT_REQUESTS, JSON.stringify(items));
        callback({ type: 'DEPOSIT_REQUESTED', payload: items, timestamp: Date.now() });
      }
    },
    (err) => {
      console.warn('Firestore deposit requests sub error:', err.message);
    }
  );

  const unsubWithdrawals = onSnapshot(
    collection(db, 'withdrawal_requests'),
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
      if (items.length > 0) {
        localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS, JSON.stringify(items));
        callback({ type: 'WITHDRAWAL_REQUESTED', payload: items, timestamp: Date.now() });
      }
    },
    (err) => {
      console.warn('Firestore withdrawal requests sub error:', err.message);
    }
  );

  return () => {
    window.removeEventListener('carrom_admin_sync', handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    unsubConfig();
    unsubSecurity();
    unsubDeposits();
    unsubWithdrawals();
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
   REAL-TIME MULTIPLAYER ROOM MATCHMAKING (FIRESTORE BACKED)
   ========================================================================== */

export async function createMultiplayerRoom(playerName: string, entryFee: number): Promise<ServerGameRoom> {
  const user = await ensureFirebaseAuth();
  const roomId = Math.floor(100000 + Math.random() * 900000).toString();
  const totalPot = entryFee * 2;
  const platformRake = Math.round(totalPot * 0.1);
  const winnerPrize = totalPot - platformRake;

  console.log(`[ROOM] Creating room with ID ${roomId} for host "${playerName}" (UID: ${user.uid})...`);

  const room: ServerGameRoom = {
    roomId,
    hostId: user.uid,
    hostName: playerName.trim() || 'Host Player',
    entryFee,
    totalPot,
    winnerPrize,
    platformRake,
    status: 'waiting',
    turn: 'host',
    gameState: JSON.stringify(createInitialAuthoritativeGameState()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'game_rooms', roomId), room);
    console.log(`[ROOM] Room created successfully: ${roomId}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `game_rooms/${roomId}`);
  }

  return room;
}

export async function joinMultiplayerRoom(
  roomIdInput: string,
  playerName: string
): Promise<{ success: boolean; room?: ServerGameRoom; error?: string }> {
  let cleanCode = roomIdInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleanCode) {
    return { success: false, error: 'Please enter a valid Room Code.' };
  }

  const user = await ensureFirebaseAuth();
  const guestNameInput = playerName.trim() || 'Guest Player';

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
      console.warn(`[SERVER] Room ID "${cleanCode}" not found in database.`);
      return { success: false, error: `Room "${roomIdInput.trim()}" not found. Please verify the code with the host.` };
    }

    // Atomic room joining transaction
    const joinedRoom = await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(targetDocRef);
      if (!roomSnap.exists()) {
        throw new Error(`Room "${cleanCode}" no longer exists.`);
      }

      const roomData = roomSnap.data() as ServerGameRoom;
      console.log(`[SERVER] Room join request received for room ${cleanCode}`);
      console.log(`[SERVER] Existing room verified: hostName="${roomData.hostName}", hostId="${roomData.hostId}", status="${roomData.status}"`);

      // Creator re-joining their own room directly
      if (roomData.hostId === user.uid && roomData.guestId !== user.uid) {
        if (roomData.guestName) {
          console.log(`[SERVER] Host session re-joining matched room ${cleanCode}`);
          return roomData;
        }
      }

      if (roomData.status !== 'waiting' && (roomData.status as string) !== 'WAITING' && roomData.guestId !== user.uid) {
        throw new Error(`Room "${cleanCode}" is already in status "${roomData.status}" and cannot be joined.`);
      }

      if (roomData.guestId && roomData.guestId !== user.uid) {
        throw new Error(`Room "${cleanCode}" already has Player 2 (${roomData.guestName}) connected.`);
      }

      let currentGameState: AuthoritativeGameState;
      if (roomData.gameState) {
        try {
          currentGameState = JSON.parse(roomData.gameState);
        } catch {
          currentGameState = createInitialAuthoritativeGameState();
        }
      } else {
        currentGameState = createInitialAuthoritativeGameState();
      }

      const now = Date.now();
      currentGameState.turnStartedAt = now;
      currentGameState.turnDeadline = now + 20000;

      const updatedFields: Partial<ServerGameRoom> = {
        guestId: user.uid,
        guestName: guestNameInput,
        status: 'MATCHED',
        gameState: JSON.stringify(currentGameState),
        updatedAt: new Date().toISOString(),
      };

      console.log(`[SERVER] Player 2 registered: "${guestNameInput}" (UID: ${user.uid})`);
      console.log(`[SERVER] Room status updated to MATCHED`);
      transaction.update(targetDocRef, updatedFields);

      const mergedRoom: ServerGameRoom = {
        ...roomData,
        ...updatedFields,
      };

      console.log(`[SERVER] Both players verified for room ${mergedRoom.roomId}: Host="${mergedRoom.hostName}", Guest="${mergedRoom.guestName}"`);
      console.log(`[SERVER] Match initialization confirmed`);

      return mergedRoom;
    });

    return { success: true, room: joinedRoom };
  } catch (err: any) {
    console.error('[SERVER] Room join error:', err);
    return { success: false, error: err.message || 'Failed to join room. Please check code.' };
  }
}

export function subscribeToRoom(roomId: string, callback: (room: ServerGameRoom) => void): () => void {
  console.log(`[ROOM_LISTEN] Attaching Firestore snapshot listener for game_rooms/${roomId}`);
  return onSnapshot(
    doc(db, 'game_rooms', roomId),
    (snap) => {
      if (snap.exists()) {
        const roomData = snap.data() as ServerGameRoom;
        console.log(`[ROOM_LISTEN] Snapshot for room ${roomId}: status="${roomData.status}", hostName="${roomData.hostName}", guestName="${roomData.guestName || 'UNDEFINED'}", guestId="${roomData.guestId || 'UNDEFINED'}"`);
        callback(roomData);
      } else {
        console.warn(`[ROOM_LISTEN] Snapshot triggered for room ${roomId} but document does not exist.`);
      }
    },
    (err) => {
      console.warn(`[ROOM_LISTEN] Room subscription error for ${roomId}:`, err.message);
    }
  );
}

export async function updateRoomGameState(
  roomId: string,
  gameState: any,
  turn?: 'host' | 'guest',
  status?: 'waiting' | 'active' | 'finished',
  winner?: string
): Promise<void> {
  try {
    const docRef = doc(db, 'game_rooms', roomId);
    const updatePayload: any = {
      gameState: typeof gameState === 'string' ? gameState : JSON.stringify(gameState),
      updatedAt: new Date().toISOString(),
    };
    if (turn) updatePayload.turn = turn;
    if (status) updatePayload.status = status;
    if (winner) updatePayload.winner = winner;

    await updateDoc(docRef, updatePayload);
  } catch (err) {
    console.warn('Failed to update room state:', err);
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

export async function savePlayerWallet(wallet: PlayerWalletData, playerName?: string, broadcast: boolean = true): Promise<void> {
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

    localStorage.setItem(STORAGE_KEYS.WALLET, serialized);
    if (playerName && playerName.trim()) {
      localStorage.setItem(playerKey, serialized);
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
    handleFirestoreError(err, OperationType.WRITE, `deposit_requests/${requestId}`);
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
  } catch (err) {
    console.warn('Failed to update deposit status in Firestore:', err);
  }

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
    handleFirestoreError(err, OperationType.WRITE, `withdrawal_requests/${requestId}`);
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
  } catch (err) {
    console.warn('Failed to update withdrawal status in Firestore:', err);
  }

  return target;
}

export function deleteWithdrawalRequest(requestId: string): boolean {
  const requests = getWithdrawalRequests();
  const target = requests.find((r) => r.id === requestId);
  if (target && target.status === 'pending') {
    refundPlayerWallet(target.amount, target.id, target.playerName);
  }
  const updated = requests.filter((r) => r.id !== requestId);
  localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_REQUESTS, JSON.stringify(updated));
  broadcastSync('WITHDRAWAL_STATUS_UPDATED', { deletedId: requestId });
  return true;
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
  const configuredSlug = (security.urlSlug || 'admin').toLowerCase();

  const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const hash = window.location.hash.toLowerCase().replace(/^#\/?|\/+$/g, '');
  const search = window.location.search.toLowerCase();

  if (path === configuredSlug) return true;
  if (hash === configuredSlug) return true;
  if (search.includes(configuredSlug) || search.includes(`admin`)) {
    if (search.includes(`route=${configuredSlug}`) || search.includes(configuredSlug)) {
      return true;
    }
  }

  return false;
}
