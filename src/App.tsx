/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Trophy,
  Coins,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Play,
  User,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  History,
  MessageCircle,
  Menu as MenuIcon,
  X,
  CreditCard,
  Building,
  CheckCircle2,
  Copy,
  Users,
  PlusCircle,
  LogIn,
  Flame,
  ArrowRight,
  ShieldAlert,
  Award
} from 'lucide-react';

/* ==========================================================================
   WEB AUDIO API PROCEDURAL SOUND ENGINE
   ========================================================================== */
class CarromAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playStrikerHit(power = 1) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const startFreq = 220 + Math.min(power, 1) * 140;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

    gain.gain.setValueAtTime(0.45 * Math.min(power, 1), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.085);
  }

  playCoinClack(intensity = 0.5) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = 620 + Math.random() * 200;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.032);

    gain.gain.setValueAtTime(Math.min(0.38, 0.08 + intensity * 0.3), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  playWallThud(intensity = 0.5) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.065);

    gain.gain.setValueAtTime(Math.min(0.3, 0.08 + intensity * 0.22), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.065);
  }

  playPocketSink(isQueen = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(180, t);
    osc1.frequency.exponentialRampToValueAtTime(45, t + 0.16);
    gain1.gain.setValueAtTime(0.6, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.16);

    if (isQueen) {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);
        gain.gain.setValueAtTime(0.28, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.24);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.24);
      });
    } else {
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(640, t + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(880, t + 0.12);
      gain2.gain.setValueAtTime(0.22, t + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t + 0.04);
      osc2.stop(t + 0.15);
    }
  }

  playFoul() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.22);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  playVictory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.09);
      gain.gain.setValueAtTime(0.35, t + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.45);
    });
  }

  playTick(isUrgent = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = isUrgent ? 950 : 750;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }
}

const soundEngine = new CarromAudioEngine();

/* ==========================================================================
   CONSTANTS & COORDINATE SPACE (Real Carrom Board Frame Proportions)
   ========================================================================== */
const BOARD_SIZE = 800;
const FRAME_THICKNESS = 48; // Solid wooden bumper thickness
const PLAY_MIN = FRAME_THICKNESS;
const PLAY_MAX = BOARD_SIZE - FRAME_THICKNESS;

// Corner Circular Net Holes (radius 36)
const POCKET_HOLE_RADIUS = 36;
const POCKETS = [
  { x: 78, y: 78 },
  { x: BOARD_SIZE - 78, y: 78 },
  { x: 78, y: BOARD_SIZE - 78 },
  { x: BOARD_SIZE - 78, y: BOARD_SIZE - 78 },
];

const STRIKER_RADIUS = 23;
const COIN_RADIUS = 16.5;

// Striker Baselines
const BASELINE_MIN_X = 185;
const BASELINE_MAX_X = BOARD_SIZE - 185;
const PLAYER_BASELINE_Y = 648;
const BOT_BASELINE_Y = 152;

// Maximum pull-back drag distance for full power
const MAX_DRAG_DIST = 175;
// Maximum realistic speed (tuned so full drag breaks the pack with authority)
const MAX_STRIKE_VELOCITY = 26.0;

// 6 Betting Options: 50, 100, 200, 500, 1000, 2000
const BETTING_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

type CoinType = 'white' | 'black' | 'queen';
type QueenState = 'on_board' | 'pending_player' | 'pending_bot' | 'covered_player' | 'covered_bot';

interface Coin {
  id: number;
  type: CoinType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  isSinking: boolean;
  sinkScale: number;
  isPocketed: boolean;
  rotation?: number;
  spinVel?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingScore {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface WalletState {
  realBalance: number;
  bonusBalance: number;
  wagerRequired: number;
  wagerCompleted: number;
  totalWon: number;
  matchesPlayed: number;
  matchesWon: number;
  transactions: Array<{
    id: string;
    type: 'deposit' | 'withdrawal' | 'entry' | 'win' | 'bonus_unlock';
    amount: number;
    description: string;
    timestamp: number;
    status: 'success' | 'pending';
  }>;
}

const DEFAULT_WALLET: WalletState = {
  realBalance: 1000,
  bonusBalance: 200,
  wagerRequired: 600,
  wagerCompleted: 0,
  totalWon: 0,
  matchesPlayed: 0,
  matchesWon: 0,
  transactions: [
    {
      id: 'TXN-INIT-001',
      type: 'deposit',
      amount: 1000,
      description: 'Initial Real Balance',
      timestamp: Date.now() - 3600000,
      status: 'success',
    },
    {
      id: 'TXN-INIT-002',
      type: 'deposit',
      amount: 200,
      description: 'Promotional Welcome Bonus (3x Wager)',
      timestamp: Date.now() - 3600000,
      status: 'success',
    },
  ],
};

interface GameRoom {
  gameId: string;
  hostName: string;
  opponentName: string;
  betAmount: number;
  totalPot: number; // 2 * betAmount
  winnerPrize: number; // 2 * betAmount * 0.90
  platformRake: number; // 2 * betAmount * 0.10
  status: 'waiting' | 'playing' | 'finished';
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export default function App() {
  // Navigation & Modals - Matchmaking page appears by default (Requirement 1)
  const [screen, setScreen] = useState<'lobby' | 'create_game' | 'join_game' | 'room_waiting' | 'gameplay'>('create_game');
  // 20-second turn timer with idle detection (Requirement 2)
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(20);
  const [idleSeconds, setIdleSeconds] = useState<number>(0);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const [activeModal, setActiveModal] = useState<'menu' | 'deposit' | 'withdraw' | 'history' | 'rules' | 'chat' | null>(null);

  // Custom Player Name (Rule 6: No Guest)
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      return localStorage.getItem('carrom_player_name') || 'Arjun';
    } catch {
      return 'Arjun';
    }
  });

  const [opponentName, setOpponentName] = useState<string>('Rahul_Striker');

  // Active Game Room Details
  const [activeRoom, setActiveRoom] = useState<GameRoom>({
    gameId: 'CR-5892',
    hostName: 'Arjun',
    opponentName: 'Rahul_Striker',
    betAmount: 500,
    totalPot: 1000,
    winnerPrize: 900,
    platformRake: 100,
    status: 'playing',
  });

  // Create Game Selection State (Betting Options: 50, 100, 200, 500, 1000, 2000)
  const [selectedBet, setSelectedBet] = useState<number>(500);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [copyNotification, setCopyNotification] = useState(false);

  // Economy state
  const [wallet, setWallet] = useState<WalletState>(() => {
    try {
      const saved = localStorage.getItem('carrom_royal_wallet');
      return saved ? JSON.parse(saved) : DEFAULT_WALLET;
    } catch {
      return DEFAULT_WALLET;
    }
  });

  const [soundMuted, setSoundMuted] = useState(false);

  // Quick Chat message bubble
  const [chatMessage, setChatMessage] = useState<{ text: string; sender: 'player' | 'bot' } | null>(null);

  // Rule 3, 6, 7 & 8 State: Accurate Coin Counts & Queen Cover Status
  const [playerWhitePocketed, setPlayerWhitePocketed] = useState(0);
  const [botBlackPocketed, setBotBlackPocketed] = useState(0);
  const [queenState, setQueenState] = useState<QueenState>('on_board');

  const [currentTurn, setCurrentTurn] = useState<'player' | 'bot'>('player');
  const [isStrikerMoving, setIsStrikerMoving] = useState(false);
  const [strikerX, setStrikerX] = useState<number>(400);

  // Dragging & Force Indicator state
  const [isDraggingStriker, setIsDraggingStriker] = useState(false);
  const [dragForce, setDragForce] = useState<{
    pullDist: number;
    power: number;
    dirX: number;
    dirY: number;
    pullX: number;
    pullY: number;
  }>({
    pullDist: 0,
    power: 0,
    dirX: 0,
    dirY: -1,
    pullX: 0,
    pullY: 0,
  });

  // Game over state (Rule 7)
  const [gameOverResult, setGameOverResult] = useState<{
    winner: 'player' | 'bot';
    winnerName: string;
    loserName: string;
    prizeWon: number;
    rakeDeducted: number;
    whiteScore: number;
    blackScore: number;
  } | null>(null);

  // Refs for 60fps canvas loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isTurnInProgressRef = useRef(false);
  const currentTurnRef = useRef<'player' | 'bot'>('player');
  const pocketsInTurnRef = useRef<Coin[]>([]);
  const strikerPocketedInTurnRef = useRef(false);
  const botAimLineRef = useRef<{ startX: number; startY: number; endX: number; endY: number; power: number } | null>(null);

  // Global drag handling tracking refs
  const dragTrackingRef = useRef<{
    active: boolean;
    touchStartX: number;
    touchStartY: number;
    currentPointerX: number;
    currentPointerY: number;
  }>({
    active: false,
    touchStartX: 0,
    touchStartY: 0,
    currentPointerX: 0,
    currentPointerY: 0,
  });

  // Physics entities
  const coinsRef = useRef<Coin[]>([]);
  const strikerRef = useRef<Coin>({
    id: 999,
    type: 'white',
    x: 400,
    y: PLAYER_BASELINE_Y,
    vx: 0,
    vy: 0,
    radius: STRIKER_RADIUS,
    mass: 2.2,
    isSinking: false,
    sinkScale: 1,
    isPocketed: false,
  });

  const particlesRef = useRef<Particle[]>([]);
  const floatingScoresRef = useRef<FloatingScore[]>([]);

  // Sound sync
  useEffect(() => {
    soundEngine.enabled = !soundMuted;
  }, [soundMuted]);

  // Wallet persistence
  useEffect(() => {
    try {
      localStorage.setItem('carrom_royal_wallet', JSON.stringify(wallet));
    } catch {
      // storage failed
    }
  }, [wallet]);

  // Player Name persistence
  useEffect(() => {
    try {
      localStorage.setItem('carrom_player_name', playerName);
    } catch {
      // storage failed
    }
  }, [playerName]);

  useEffect(() => {
    currentTurnRef.current = currentTurn;
  }, [currentTurn]);

  /* ==========================================================================
     SPAWN PARTICLES & FLOATING TEXTS
     ========================================================================== */
  const spawnPocketParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 4.2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 2 + Math.random() * 3.2,
        alpha: 1,
        life: 0,
        maxLife: 24 + Math.random() * 16,
      });
    }
  }, []);

  const spawnFloatingScore = useCallback((x: number, y: number, text: string, color = '#FBBF24') => {
    floatingScoresRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.6,
    });
  }, []);

  // Reset idle timer upon player response or movement (Requirement 2)
  const notifyActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    setIdleSeconds(0);
    setTurnTimeLeft(20);
  }, []);

  /* ==========================================================================
     RETURN COIN TO CENTER CIRCLE (FOR QUEEN COVER FAIL OR FOUL PENALTY)
     ========================================================================== */
  const returnCoinToCenter = useCallback((coinType: 'white' | 'black' | 'queen') => {
    const coin = coinsRef.current.find((c) => c.type === coinType && c.isPocketed);
    if (!coin) return;

    let targetX = 400;
    let targetY = 400;

    // Check if exact center is already occupied
    const isOccupied = coinsRef.current.some(
      (c) => !c.isPocketed && Math.hypot(c.x - 400, c.y - 400) < COIN_RADIUS * 2.1
    );

    if (isOccupied) {
      const angles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];
      for (const ang of angles) {
        const testX = 400 + Math.cos(ang) * (COIN_RADIUS * 2.3);
        const testY = 400 + Math.sin(ang) * (COIN_RADIUS * 2.3);
        const free = !coinsRef.current.some(
          (c) => !c.isPocketed && Math.hypot(c.x - testX, c.y - testY) < COIN_RADIUS * 1.9
        );
        if (free) {
          targetX = testX;
          targetY = testY;
          break;
        }
      }
    }

    coin.x = targetX;
    coin.y = targetY;
    coin.vx = 0;
    coin.vy = 0;
    coin.isPocketed = false;
    coin.isSinking = false;
    coin.sinkScale = 1;
  }, []);

  /* ==========================================================================
     BOARD INITIALIZATION (Standard Carrom Men Hexagon Cluster)
     ========================================================================== */
  const initializeBoard = useCallback(() => {
    const coins: Coin[] = [];
    let id = 1;

    // Center Red Queen
    coins.push({
      id: id++,
      type: 'queen',
      x: 400,
      y: 400,
      vx: 0,
      vy: 0,
      radius: COIN_RADIUS,
      mass: 1.0,
      isSinking: false,
      sinkScale: 1,
      isPocketed: false,
      rotation: Math.random() * Math.PI * 2,
      spinVel: 0,
    });

    // Ring 1 (6 coins around queen: 3 White, 3 Black alternating)
    const r1Dist = COIN_RADIUS * 2.05;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      coins.push({
        id: id++,
        type: i % 2 === 0 ? 'white' : 'black',
        x: 400 + Math.cos(angle) * r1Dist,
        y: 400 + Math.sin(angle) * r1Dist,
        vx: 0,
        vy: 0,
        radius: COIN_RADIUS,
        mass: 1.0,
        isSinking: false,
        sinkScale: 1,
        isPocketed: false,
        rotation: Math.random() * Math.PI * 2,
        spinVel: 0,
      });
    }

    // Ring 2 (12 coins in standard arrangement: 6 White, 6 Black)
    const r2CornerDist = COIN_RADIUS * 4.1;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      coins.push({
        id: id++,
        type: i % 2 === 0 ? 'black' : 'white',
        x: 400 + Math.cos(angle) * r2CornerDist,
        y: 400 + Math.sin(angle) * r2CornerDist,
        vx: 0,
        vy: 0,
        radius: COIN_RADIUS,
        mass: 1.0,
        isSinking: false,
        sinkScale: 1,
        isPocketed: false,
        rotation: Math.random() * Math.PI * 2,
        spinVel: 0,
      });
    }

    const r2EdgeDist = COIN_RADIUS * 2.05 * Math.sqrt(3);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + Math.PI / 6;
      coins.push({
        id: id++,
        type: i % 2 === 0 ? 'white' : 'black',
        x: 400 + Math.cos(angle) * r2EdgeDist,
        y: 400 + Math.sin(angle) * r2EdgeDist,
        vx: 0,
        vy: 0,
        radius: COIN_RADIUS,
        mass: 1.0,
        isSinking: false,
        sinkScale: 1,
        isPocketed: false,
        rotation: Math.random() * Math.PI * 2,
        spinVel: 0,
      });
    }

    coinsRef.current = coins;

    // Striker initialization
    strikerRef.current = {
      id: 999,
      type: 'white',
      x: 400,
      y: PLAYER_BASELINE_Y,
      vx: 0,
      vy: 0,
      radius: STRIKER_RADIUS,
      mass: 2.2,
      isSinking: false,
      sinkScale: 1,
      isPocketed: false,
      rotation: 0,
      spinVel: 0,
    };

    setStrikerX(400);
    // At start, 9 white and 9 black on board -> 0 pocketed!
    setPlayerWhitePocketed(0);
    setBotBlackPocketed(0);
    setQueenState('on_board');
    setCurrentTurn('player');
    currentTurnRef.current = 'player';
    setTurnTimeLeft(20);
    setIdleSeconds(0);
    lastActivityTimeRef.current = Date.now();
    setIsStrikerMoving(false);
    setIsDraggingStriker(false);
    isTurnInProgressRef.current = false;
    pocketsInTurnRef.current = [];
    strikerPocketedInTurnRef.current = false;
    particlesRef.current = [];
    floatingScoresRef.current = [];
    botAimLineRef.current = null;
    setGameOverResult(null);
  }, []);

  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  /* ==========================================================================
     STARTING MATCH WITH WALLET DEDUCTION & COMMISSION RAKE
     ========================================================================== */
  const startMatchWithBet = (room: GameRoom) => {
    if (room.betAmount > 0) {
      if (wallet.realBalance < room.betAmount) {
        setActiveModal('deposit');
        return;
      }

      setWallet((prev) => ({
        ...prev,
        realBalance: prev.realBalance - room.betAmount,
        matchesPlayed: prev.matchesPlayed + 1,
        wagerCompleted: prev.wagerCompleted + room.betAmount,
        transactions: [
          {
            id: `TXN-ENTRY-${Date.now().toString().slice(-6)}`,
            type: 'entry',
            amount: room.betAmount,
            description: `Match Entry for Room ${room.gameId} (Pot: ₹${room.totalPot})`,
            timestamp: Date.now(),
            status: 'success',
          },
          ...prev.transactions,
        ],
      }));
    }

    setActiveRoom(room);
    initializeBoard();
    setScreen('gameplay');
  };

  /* ==========================================================================
     CREATE GAME FLOW
     ========================================================================== */
  const handleCreateRoom = () => {
    const randomId = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const bet = selectedBet;
    const totalPot = bet * 2;
    const platformRake = Math.round(totalPot * 0.1);
    const winnerPrize = totalPot - platformRake;

    const newRoom: GameRoom = {
      gameId: randomId,
      hostName: playerName.trim() || 'Player',
      opponentName: 'Challenger_Pro',
      betAmount: bet,
      totalPot,
      winnerPrize,
      platformRake,
      status: 'waiting',
    };

    setActiveRoom(newRoom);
    setScreen('room_waiting');
  };

  /* ==========================================================================
     JOIN GAME FLOW
     ========================================================================== */
  const handleJoinRoomWithCode = () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;

    const bet = selectedBet;
    const totalPot = bet * 2;
    const platformRake = Math.round(totalPot * 0.1);
    const winnerPrize = totalPot - platformRake;

    const joinedRoom: GameRoom = {
      gameId: code,
      hostName: 'Opponent_Master',
      opponentName: playerName.trim() || 'Player',
      betAmount: bet,
      totalPot,
      winnerPrize,
      platformRake,
      status: 'playing',
    };

    startMatchWithBet(joinedRoom);
  };

  /* ==========================================================================
     PHYSICS SIMULATION STEP (RULE 1: STRONGER FRAME LOGIC & RULE 2: FAIR POCKETS)
     ========================================================================== */
  const runPhysicsStep = useCallback((dt: number) => {
    const RESTITUTION_COIN = 0.86;
    const RESTITUTION_WALL = 0.82;
    const STOP_VELOCITY = 0.045;

    const coins = coinsRef.current;
    const striker = strikerRef.current;
    const allDiscs = [striker, ...coins].filter((c) => !c.isPocketed);

    // 1. Move & apply authentic Coulomb fine-powder sliding friction
    for (const d of allDiscs) {
      if (d.isSinking) {
        d.sinkScale = Math.max(0, d.sinkScale - 0.075);
        d.vx *= 0.78;
        d.vy *= 0.78;
        d.x += d.vx;
        d.y += d.vy;

        if (d.sinkScale <= 0.08) {
          d.isPocketed = true;
          d.isSinking = false;
          d.vx = 0;
          d.vy = 0;

          if (d.id === striker.id) {
            strikerPocketedInTurnRef.current = true;
            soundEngine.playFoul();
            spawnFloatingScore(d.x, d.y, 'FOUL! STRIKER', '#EF4444');
          } else {
            pocketsInTurnRef.current.push(d);
            const isQueen = d.type === 'queen';
            soundEngine.playPocketSink(isQueen);

            spawnFloatingScore(
              d.x,
              d.y,
              isQueen ? '+QUEEN' : d.type === 'white' ? '+1 WHITE' : '+1 BLACK',
              isQueen ? '#EC4899' : d.type === 'white' ? '#FFFFFF' : '#A3E635'
            );
            spawnPocketParticles(
              d.x,
              d.y,
              isQueen ? '#EC4899' : d.type === 'white' ? '#FFFFFF' : '#EAB308'
            );
          }
        }
        continue;
      }

      d.x += d.vx * dt;
      d.y += d.vy * dt;

      // Rotational spin animation update
      if (d.spinVel) {
        d.rotation = (d.rotation || 0) + d.spinVel * dt;
        d.spinVel *= 0.985;
      }

      // Realistic sliding friction (powder deceleration)
      const currentSpeed = Math.hypot(d.vx, d.vy);
      if (currentSpeed > 0) {
        const kineticDecel = 0.034 * dt;
        const airResistance = 1.0 - 0.0018 * dt;

        const newSpeed = Math.max(0, (currentSpeed - kineticDecel) * airResistance);
        if (newSpeed < STOP_VELOCITY) {
          d.vx = 0;
          d.vy = 0;
          d.spinVel = 0;
        } else {
          const ratio = newSpeed / currentSpeed;
          d.vx *= ratio;
          d.vy *= ratio;
        }
      }

      // RULE 2: FAIR NET HOLE POCKET DETECTION
      // Only considered pocket if the coin center is accurately within the round net hole!
      for (const pocket of POCKETS) {
        const dist = Math.hypot(d.x - pocket.x, d.y - pocket.y);
        if (dist < POCKET_HOLE_RADIUS * 0.72 && !d.isSinking) {
          d.isSinking = true;
          d.vx = (pocket.x - d.x) * 0.16;
          d.vy = (pocket.y - d.y) * 0.16;
          break;
        }
      }

      // RULE 1: STRONG UNBREAKABLE FRAME BOUNDARY CHECK
      // Enforce that under NO circumstance can striker or coins ever exit the frame!
      if (!d.isSinking) {
        const minBound = PLAY_MIN + d.radius;
        const maxBound = PLAY_MAX - d.radius;

        if (d.x < minBound) {
          d.x = minBound;
          d.vx = Math.abs(d.vx) * RESTITUTION_WALL;
          if (Math.abs(d.vx) > 0.3) soundEngine.playWallThud(Math.abs(d.vx) / 8);
        } else if (d.x > maxBound) {
          d.x = maxBound;
          d.vx = -Math.abs(d.vx) * RESTITUTION_WALL;
          if (Math.abs(d.vx) > 0.3) soundEngine.playWallThud(Math.abs(d.vx) / 8);
        }

        if (d.y < minBound) {
          d.y = minBound;
          d.vy = Math.abs(d.vy) * RESTITUTION_WALL;
          if (Math.abs(d.vy) > 0.3) soundEngine.playWallThud(Math.abs(d.vx) / 8);
        } else if (d.y > maxBound) {
          d.y = maxBound;
          d.vy = -Math.abs(d.vy) * RESTITUTION_WALL;
          if (Math.abs(d.vy) > 0.3) soundEngine.playWallThud(Math.abs(d.vy) / 8);
        }
      }
    }

    // 2. 2D Elastic Impulses between all active discs
    const active = allDiscs.filter((d) => !d.isSinking && !d.isPocketed);
    const len = active.length;

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const d1 = active[i];
        const d2 = active[j];

        // REQUIREMENT 4: Striker positioning NEVER moves or pushes any coin!
        // When the shot is not actively in flight, the striker is stationary / being positioned on the baseline.
        // It must NEVER collide with, overlap-resolve, or move any coin touching the base or baseline.
        if (!isTurnInProgressRef.current && (d1.id === striker.id || d2.id === striker.id)) {
          continue;
        }

        const dx = d2.x - d1.x;
        const dy = d2.y - d1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = d1.radius + d2.radius;

        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;

          const overlap = minDist - dist;
          const totalMass = d1.mass + d2.mass;

          d1.x -= nx * overlap * (d2.mass / totalMass);
          d1.y -= ny * overlap * (d2.mass / totalMass);
          d2.x += nx * overlap * (d1.mass / totalMass);
          d2.y += ny * overlap * (d1.mass / totalMass);

          const rvx = d1.vx - d2.vx;
          const rvy = d1.vy - d2.vy;
          const vn = rvx * nx + rvy * ny;

          if (vn > 0) {
            const impulse = ((1 + RESTITUTION_COIN) * vn) / (1 / d1.mass + 1 / d2.mass);

            d1.vx -= (impulse / d1.mass) * nx;
            d1.vy -= (impulse / d1.mass) * ny;
            d2.vx += (impulse / d2.mass) * nx;
            d2.vy += (impulse / d2.mass) * ny;

            // Apply angular torque (spin animation) from glancing collision
            const vt = -rvx * ny + rvy * nx;
            d1.spinVel = (d1.spinVel || 0) + vt * 0.04;
            d2.spinVel = (d2.spinVel || 0) - vt * 0.04;

            if (d1.id === striker.id || d2.id === striker.id) {
              soundEngine.playStrikerHit(Math.min(1, vn / 14));
            } else {
              soundEngine.playCoinClack(Math.min(1, vn / 10));
            }
          }
        }
      }
    }
  }, [spawnFloatingScore, spawnPocketParticles]);

  /* ==========================================================================
     SETTLEMENT & STRICT CARROM RULES (RULES 3, 6, 7 & 8)
     ========================================================================== */
  const checkTurnSettlement = useCallback(() => {
    const allDiscs = [strikerRef.current, ...coinsRef.current].filter((c) => !c.isPocketed);
    const moving = allDiscs.some(
      (d) => Math.hypot(d.vx, d.vy) > 0.05 || d.isSinking
    );

    if (moving) {
      setIsStrikerMoving(true);
      return;
    }

    if (!isTurnInProgressRef.current) return;

    // Board has stopped completely
    isTurnInProgressRef.current = false;
    setIsStrikerMoving(false);

    const pocketedCoins = pocketsInTurnRef.current;
    const strikerPocketed = strikerPocketedInTurnRef.current;
    const currentWho = currentTurnRef.current;

    pocketsInTurnRef.current = [];
    strikerPocketedInTurnRef.current = false;

    // Coins pocketed this turn
    const whitePocketedThisTurn = pocketedCoins.filter((c) => c.type === 'white').length;
    const blackPocketedThisTurn = pocketedCoins.filter((c) => c.type === 'black').length;
    const queenPocketedThisTurn = pocketedCoins.some((c) => c.type === 'queen');

    let newWhiteTotal = playerWhitePocketed + whitePocketedThisTurn;
    let newBlackTotal = botBlackPocketed + blackPocketedThisTurn;

    let nextWho: 'player' | 'bot' = currentWho === 'player' ? 'bot' : 'player';

    // -------------------------------------------------------------
    // RULE 3: STRIKER FOUL LOGIC (REQUIREMENT 3: ONLY IF SCORE >= 1, NEVER BELOW 0)
    // -------------------------------------------------------------
    if (strikerPocketed) {
      soundEngine.playFoul();

      if (currentWho === 'player') {
        if (newWhiteTotal >= 1) {
          // Score is 1 or greater: foul IS considered
          newWhiteTotal = Math.max(0, newWhiteTotal - 1);
          returnCoinToCenter('white');
          spawnFloatingScore(400, PLAYER_BASELINE_Y, 'FOUL! -1 COIN DEDUCTED', '#EF4444');
        } else {
          // Score is 0: foul is NOT considered and score never falls below 0
          newWhiteTotal = 0;
          spawnFloatingScore(400, PLAYER_BASELINE_Y, 'STRIKER SINK (SCORE 0 - NO PENALTY)', '#F59E0B');
        }

        if (queenState === 'pending_player') {
          returnCoinToCenter('queen');
          setQueenState('on_board');
          spawnFloatingScore(400, 400, 'COVER FAILED! QUEEN RETURNED', '#EC4899');
        }
      } else {
        if (newBlackTotal >= 1) {
          newBlackTotal = Math.max(0, newBlackTotal - 1);
          returnCoinToCenter('black');
          spawnFloatingScore(400, BOT_BASELINE_Y, 'BOT FOUL! -1 COIN DEDUCTED', '#EF4444');
        } else {
          newBlackTotal = 0;
          spawnFloatingScore(400, BOT_BASELINE_Y, 'BOT SINK (SCORE 0 - NO PENALTY)', '#F59E0B');
        }

        if (queenState === 'pending_bot') {
          returnCoinToCenter('queen');
          setQueenState('on_board');
          spawnFloatingScore(400, 400, 'COVER FAILED! QUEEN RETURNED', '#EC4899');
        }
      }

      // Next striker hitting chance given to the next player
      nextWho = currentWho === 'player' ? 'bot' : 'player';
    } else {
      // -------------------------------------------------------------
      // NO FOUL: RULE 8 QUEEN COVER + RULE 6 TURN HANDOFF LOGIC
      // -------------------------------------------------------------

      if (currentWho === 'player') {
        // Player's turn (Owns White)
        if (queenPocketedThisTurn) {
          // Player just pocketed Queen on this turn!
          if (whitePocketedThisTurn >= 1) {
            // Already covered in same shot!
            setQueenState('covered_player');
            spawnFloatingScore(400, 400, '👑 QUEEN COVERED & SECURED!', '#FBBF24');
            nextWho = 'player'; // Extra turn
          } else {
            // Queen pending: must cover on next shot
            setQueenState('pending_player');
            spawnFloatingScore(400, 400, '👑 QUEEN PENDING! POCKET WHITE TO COVER', '#F59E0B');
            nextWho = 'player'; // Extra turn to cover
          }
        } else if (queenState === 'pending_player') {
          // Player had a pending Queen from previous shot
          if (whitePocketedThisTurn >= 1) {
            // Cover successful!
            setQueenState('covered_player');
            spawnFloatingScore(400, 400, '👑 QUEEN COVERED & SECURED!', '#FBBF24');
            nextWho = 'player'; // Extra turn
          } else {
            // Failed to pocket White coin! Queen returns to center!
            returnCoinToCenter('queen');
            setQueenState('on_board');
            spawnFloatingScore(400, 400, 'COVER FAILED! QUEEN RETURNED TO CENTER', '#EC4899');
            nextWho = 'bot'; // Turn passes to opponent
          }
        } else {
          // Standard shot: Rule 6
          if (whitePocketedThisTurn >= 1) {
            // Pocketed own white coin -> Extra turn!
            nextWho = 'player';
          } else {
            // Pocketed no white coin (or only black coins) -> Next turn given to Opponent!
            nextWho = 'bot';
          }
        }
      } else {
        // Bot's turn (Owns Black)
        if (queenPocketedThisTurn) {
          if (blackPocketedThisTurn >= 1) {
            setQueenState('covered_bot');
            spawnFloatingScore(400, 400, '👑 BOT COVERED QUEEN!', '#FBBF24');
            nextWho = 'bot';
          } else {
            setQueenState('pending_bot');
            spawnFloatingScore(400, 400, '👑 BOT PENDING QUEEN COVER', '#F59E0B');
            nextWho = 'bot';
          }
        } else if (queenState === 'pending_bot') {
          if (blackPocketedThisTurn >= 1) {
            setQueenState('covered_bot');
            spawnFloatingScore(400, 400, '👑 BOT SECURED QUEEN!', '#FBBF24');
            nextWho = 'bot';
          } else {
            returnCoinToCenter('queen');
            setQueenState('on_board');
            spawnFloatingScore(400, 400, 'COVER FAILED! QUEEN RETURNED TO CENTER', '#EC4899');
            nextWho = 'player';
          }
        } else {
          // Standard shot: Rule 6
          if (blackPocketedThisTurn >= 1) {
            nextWho = 'bot';
          } else {
            nextWho = 'player';
          }
        }
      }
    }

    setPlayerWhitePocketed(newWhiteTotal);
    setBotBlackPocketed(newBlackTotal);

    // -------------------------------------------------------------
    // RULE 7: ALL 9 COINS POCKETED GAME OVER & DECLARATION
    // -------------------------------------------------------------
    if (newWhiteTotal >= 9 || newBlackTotal >= 9) {
      const winner = newWhiteTotal >= 9 ? 'player' : 'bot';
      const prizeWon = winner === 'player' ? activeRoom.winnerPrize : 0;
      const rakeDeducted = winner === 'player' ? activeRoom.platformRake : 0;

      if (winner === 'player') {
        soundEngine.playVictory();
        if (prizeWon > 0) {
          setWallet((prev) => ({
            ...prev,
            realBalance: prev.realBalance + prizeWon,
            totalWon: prev.totalWon + prizeWon,
            matchesWon: prev.matchesWon + 1,
            transactions: [
              {
                id: `TXN-WIN-${Date.now().toString().slice(-6)}`,
                type: 'win',
                amount: prizeWon,
                description: `Victory in Room ${activeRoom.gameId} (10% Rake Deducted)`,
                timestamp: Date.now(),
                status: 'success',
              },
              ...prev.transactions,
            ],
          }));
        }
      }

      setGameOverResult({
        winner,
        winnerName: winner === 'player' ? playerName : opponentName,
        loserName: winner === 'player' ? opponentName : playerName,
        prizeWon,
        rakeDeducted,
        whiteScore: newWhiteTotal,
        blackScore: newBlackTotal,
      });
      return;
    }

    setCurrentTurn(nextWho);
    currentTurnRef.current = nextWho;
    setTurnTimeLeft(20);
    setIdleSeconds(0);
    lastActivityTimeRef.current = Date.now();

    // Reset striker
    const nextBaseY = nextWho === 'player' ? PLAYER_BASELINE_Y : BOT_BASELINE_Y;
    strikerRef.current = {
      ...strikerRef.current,
      x: 400,
      y: nextBaseY,
      vx: 0,
      vy: 0,
      isSinking: false,
      sinkScale: 1,
      isPocketed: false,
    };
    setStrikerX(400);

    // Bot Shot Execution
    if (nextWho === 'bot') {
      setTimeout(() => {
        executeBotTurn();
      }, 700);
    }
  }, [playerWhitePocketed, botBlackPocketed, queenState, activeRoom, playerName, opponentName, returnCoinToCenter, spawnFloatingScore]);

  /* ==========================================================================
     BOT LOGIC
     ========================================================================== */
  const executeBotTurn = useCallback(() => {
    const active = coinsRef.current.filter((c) => !c.isPocketed && !c.isSinking);
    if (active.length === 0) return;

    // If bot has pending queen, it MUST aim for a black coin!
    let targetCoin: Coin | undefined;
    if (queenState === 'pending_bot') {
      targetCoin = active.find((c) => c.type === 'black');
    }
    if (!targetCoin) {
      targetCoin = active.find((c) => c.type === 'queen') || active.find((c) => c.type === 'black') || active[0];
    }

    // Find closest pocket to target coin
    let bestPocket = POCKETS[2];
    let minDist = Infinity;
    for (const pocket of POCKETS) {
      const d = Math.hypot(targetCoin.x - pocket.x, targetCoin.y - pocket.y);
      if (d < minDist) {
        minDist = d;
        bestPocket = pocket;
      }
    }

    const coinToPocketAngle = Math.atan2(bestPocket.y - targetCoin.y, bestPocket.x - targetCoin.x);
    const hitPointDist = STRIKER_RADIUS + COIN_RADIUS;
    const ghostX = targetCoin.x - Math.cos(coinToPocketAngle) * hitPointDist;
    const ghostY = targetCoin.y - Math.sin(coinToPocketAngle) * hitPointDist;

    let botX = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, ghostX));
    strikerRef.current.x = botX;
    strikerRef.current.y = BOT_BASELINE_Y;
    setStrikerX(botX);

    let shotAngle = Math.atan2(ghostY - BOT_BASELINE_Y, ghostX - botX);
    if (Math.sin(shotAngle) < 0.2) {
      shotAngle = Math.atan2(targetCoin.y - BOT_BASELINE_Y, targetCoin.x - botX);
    }

    const distance = Math.hypot(ghostX - botX, ghostY - BOT_BASELINE_Y);
    const shotPower = Math.min(22, Math.max(8, Math.sqrt(distance * 1.3)));

    botAimLineRef.current = {
      startX: botX,
      startY: BOT_BASELINE_Y,
      endX: botX + Math.cos(shotAngle) * (distance * 0.95),
      endY: BOT_BASELINE_Y + Math.sin(shotAngle) * (distance * 0.95),
      power: shotPower,
    };

    setTimeout(() => {
      botAimLineRef.current = null;
      isTurnInProgressRef.current = true;
      setIsStrikerMoving(true);

      strikerRef.current.vx = Math.cos(shotAngle) * shotPower;
      strikerRef.current.vy = Math.sin(shotAngle) * shotPower;

      soundEngine.playStrikerHit(shotPower / MAX_STRIKE_VELOCITY);
    }, 600);
  }, [queenState]);

  /* ==========================================================================
     20-SECOND TURN TIMER (REQUIREMENT 2: 20s LIMIT, 5s IDLE TRIGGER, TICKING AUDIO)
     ========================================================================== */
  useEffect(() => {
    if (screen !== 'gameplay' || isStrikerMoving || isTurnInProgressRef.current || gameOverResult) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedIdle = Math.floor((now - lastActivityTimeRef.current) / 1000);
      setIdleSeconds(elapsedIdle);

      // Countdown only starts if no movement/response is made for 5 seconds
      if (elapsedIdle >= 5) {
        const remaining = Math.max(0, 20 - elapsedIdle);
        setTurnTimeLeft(remaining);

        // Play ticking sound on last 5 seconds (5, 4, 3, 2, 1)
        if (remaining <= 5 && remaining > 0) {
          soundEngine.playTick(remaining <= 2);
        }

        if (remaining <= 0) {
          soundEngine.playFoul();
          const nextTurn = currentTurnRef.current === 'player' ? 'bot' : 'player';
          spawnFloatingScore(
            400,
            currentTurnRef.current === 'player' ? PLAYER_BASELINE_Y : BOT_BASELINE_Y,
            "TIME'S UP! TURN PASSED",
            '#EF4444'
          );

          setCurrentTurn(nextTurn);
          currentTurnRef.current = nextTurn;

          // Reset striker for next player
          const nextBaseY = nextTurn === 'player' ? PLAYER_BASELINE_Y : BOT_BASELINE_Y;
          strikerRef.current = {
            ...strikerRef.current,
            x: 400,
            y: nextBaseY,
            vx: 0,
            vy: 0,
            isSinking: false,
            sinkScale: 1,
            isPocketed: false,
          };
          setStrikerX(400);

          lastActivityTimeRef.current = Date.now();
          setIdleSeconds(0);
          setTurnTimeLeft(20);

          if (nextTurn === 'bot') {
            setTimeout(() => {
              executeBotTurn();
            }, 700);
          }
        }
      } else {
        setTurnTimeLeft(20);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, isStrikerMoving, gameOverResult, executeBotTurn, spawnFloatingScore]);

  /* ==========================================================================
     GLOBAL POINTER / DRAG HANDLERS (FINGERS CAN GO OUT OF CANVAS BOUNDARY)
     ========================================================================== */
  const updateDragFromPointer = useCallback((clientX: number, clientY: number) => {
    notifyActivity();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = BOARD_SIZE / rect.width;

    const currentX = (clientX - rect.left) * scale;
    const currentY = (clientY - rect.top) * scale;

    const s = strikerRef.current;
    const pullX = currentX - s.x;
    const pullY = currentY - s.y;
    const pullDist = Math.hypot(pullX, pullY);

    if (pullDist > 4) {
      const clampedPull = Math.min(MAX_DRAG_DIST, pullDist);
      const t = clampedPull / MAX_DRAG_DIST;
      const power = Math.pow(t, 1.35);

      const pullAngle = Math.atan2(pullY, pullX);
      const shotAngle = pullAngle + Math.PI;

      const dirX = Math.cos(shotAngle);
      const dirY = Math.sin(shotAngle);

      setDragForce({
        pullDist: clampedPull,
        power,
        dirX,
        dirY,
        pullX,
        pullY,
      });
    } else {
      setDragForce({
        pullDist: 0,
        power: 0,
        dirX: 0,
        dirY: -1,
        pullX: 0,
        pullY: 0,
      });
    }
  }, []);

  const handlePointerDownOnCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    notifyActivity();
    if (currentTurn !== 'player' || isStrikerMoving) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = BOARD_SIZE / rect.width;
    const clickX = (e.clientX - rect.left) * scale;
    const clickY = (e.clientY - rect.top) * scale;

    const s = strikerRef.current;
    const distToStriker = Math.hypot(clickX - s.x, clickY - s.y);

    if (distToStriker < STRIKER_RADIUS * 2.8 || clickY > PLAYER_BASELINE_Y - 50) {
      dragTrackingRef.current = {
        active: true,
        touchStartX: e.clientX,
        touchStartY: e.clientY,
        currentPointerX: e.clientX,
        currentPointerY: e.clientY,
      };

      setIsDraggingStriker(true);
      updateDragFromPointer(e.clientX, e.clientY);
    }
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!dragTrackingRef.current.active) return;
      dragTrackingRef.current.currentPointerX = e.clientX;
      dragTrackingRef.current.currentPointerY = e.clientY;
      updateDragFromPointer(e.clientX, e.clientY);
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (!dragTrackingRef.current.active) return;
      dragTrackingRef.current.active = false;
      setIsDraggingStriker(false);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scale = BOARD_SIZE / rect.width;
      const currentX = (e.clientX - rect.left) * scale;
      const currentY = (e.clientY - rect.top) * scale;

      const s = strikerRef.current;
      const pullX = currentX - s.x;
      const pullY = currentY - s.y;
      const pullDist = Math.hypot(pullX, pullY);

      if (pullDist > 8) {
        const clampedPull = Math.min(MAX_DRAG_DIST, pullDist);
        const t = clampedPull / MAX_DRAG_DIST;
        const power = Math.pow(t, 1.35);
        const impulseSpeed = power * MAX_STRIKE_VELOCITY;

        const pullAngle = Math.atan2(pullY, pullX);
        const shotAngle = pullAngle + Math.PI;

        isTurnInProgressRef.current = true;
        setIsStrikerMoving(true);

        strikerRef.current.vx = Math.cos(shotAngle) * impulseSpeed;
        strikerRef.current.vy = Math.sin(shotAngle) * impulseSpeed;

        soundEngine.playStrikerHit(power);
      }

      setDragForce({
        pullDist: 0,
        power: 0,
        dirX: 0,
        dirY: -1,
        pullX: 0,
        pullY: 0,
      });
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [updateDragFromPointer]);

  // Baseline positioning slider
  const handleBaselineSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    notifyActivity();
    if (currentTurn !== 'player' || isStrikerMoving) return;
    const newX = parseFloat(e.target.value);
    setStrikerX(newX);
    strikerRef.current.x = newX;
    strikerRef.current.y = PLAYER_BASELINE_Y;
  };

  /* ==========================================================================
     CANVAS VECTOR RENDERING (RULE 4: REAL CARROM FRAME & RULE 5: CLEAN NET HOLES)
     ========================================================================== */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const SUB_STEPS = 4;
      const subDt = 1.0 / SUB_STEPS;
      for (let s = 0; s < SUB_STEPS; s++) {
        runPhysicsStep(subDt);
      }

      checkTurnSettlement();

      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // -------------------------------------------------------------
      // RULE 4: SOLID POLISHED WOOD FRAME (NO CUT-OFF APPEARANCE)
      // -------------------------------------------------------------
      ctx.save();
      // Outer frame perimeter with natural rounded corners
      ctx.beginPath();
      ctx.roundRect(4, 4, BOARD_SIZE - 8, BOARD_SIZE - 8, 20);
      const woodGrad = ctx.createLinearGradient(0, 0, BOARD_SIZE, BOARD_SIZE);
      woodGrad.addColorStop(0, '#421E0E');
      woodGrad.addColorStop(0.5, '#5C2D16');
      woodGrad.addColorStop(1, '#2D1408');
      ctx.fillStyle = woodGrad;
      ctx.fill();

      // Outer gold trim hairline
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#B88230';
      ctx.stroke();

      // Inner wood frame bevel line
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1E0A03';
      ctx.strokeRect(FRAME_THICKNESS, FRAME_THICKNESS, BOARD_SIZE - FRAME_THICKNESS * 2, BOARD_SIZE - FRAME_THICKNESS * 2);
      ctx.restore();

      // --- PLAYING SURFACE (Real Warm Indian Carrom Ply Veneer) ---
      ctx.save();
      const plyGrad = ctx.createRadialGradient(400, 400, 50, 400, 400, 480);
      plyGrad.addColorStop(0, '#E4C38E'); // Blonde beechwood veneer
      plyGrad.addColorStop(0.7, '#D4AE76');
      plyGrad.addColorStop(1, '#BF9558');
      ctx.fillStyle = plyGrad;
      ctx.fillRect(PLAY_MIN, PLAY_MIN, PLAY_MAX - PLAY_MIN, PLAY_MAX - PLAY_MIN);

      // -------------------------------------------------------------
      // RULE 2 & 4: AUTHENTIC CIRCULAR NET HOLES WITH WOVEN NET MESH
      // -------------------------------------------------------------
      for (const pocket of POCKETS) {
        // Outer dark leather pocket ring
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS + 3, 0, Math.PI * 2);
        ctx.fillStyle = '#1A0E08';
        ctx.fill();

        // Hole cavity
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#06080B';
        ctx.fill();

        // Woven Net Mesh Texture inside circular pocket
        ctx.save();
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS - 1, 0, Math.PI * 2);
        ctx.clip();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1.2;
        for (let offset = -40; offset <= 40; offset += 8) {
          ctx.beginPath();
          ctx.moveTo(pocket.x - 40, pocket.y + offset);
          ctx.lineTo(pocket.x + 40, pocket.y + offset + 24);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pocket.x - 40, pocket.y + offset + 24);
          ctx.lineTo(pocket.x + 40, pocket.y + offset);
          ctx.stroke();
        }
        ctx.restore();

        // Thin brass ring rim
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(184, 130, 48, 0.4)';
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      }

      // --- TRADITIONAL CARROM INLAYS ---
      ctx.strokeStyle = 'rgba(92, 45, 18, 0.5)';
      ctx.lineWidth = 2;

      // Center Circle & Concentric Rosette
      ctx.beginPath();
      ctx.arc(400, 400, 40, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(400, 400, 108, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 12; i++) {
        const ang = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.arc(400 + Math.cos(ang) * 58, 400 + Math.sin(ang) * 58, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4 BASELINES
      const horizontalBaselines = [PLAYER_BASELINE_Y, BOT_BASELINE_Y];
      for (const by of horizontalBaselines) {
        ctx.beginPath();
        ctx.roundRect(BASELINE_MIN_X - 16, by - 12, (BASELINE_MAX_X - BASELINE_MIN_X) + 32, 24, 12);
        ctx.fillStyle = 'rgba(180, 125, 80, 0.35)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(92, 45, 18, 0.6)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(BASELINE_MIN_X, by - 4);
        ctx.lineTo(BASELINE_MAX_X, by - 4);
        ctx.moveTo(BASELINE_MIN_X, by + 4);
        ctx.lineTo(BASELINE_MAX_X, by + 4);
        ctx.strokeStyle = 'rgba(75, 35, 12, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        for (const cx of [BASELINE_MIN_X, BASELINE_MAX_X]) {
          ctx.beginPath();
          ctx.arc(cx, by, 18, 0, Math.PI * 2);
          ctx.fillStyle = '#C48858';
          ctx.fill();
          ctx.strokeStyle = '#6E3212';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cx, by, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#D92D20';
          ctx.fill();
        }
      }

      const verticalBaselines = [BOT_BASELINE_Y, PLAYER_BASELINE_Y];
      for (const bx of verticalBaselines) {
        ctx.beginPath();
        ctx.roundRect(bx - 12, BASELINE_MIN_X - 16, 24, (BASELINE_MAX_X - BASELINE_MIN_X) + 32, 12);
        ctx.fillStyle = 'rgba(180, 125, 80, 0.35)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(92, 45, 18, 0.6)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        for (const cy of [BASELINE_MIN_X, BASELINE_MAX_X]) {
          ctx.beginPath();
          ctx.arc(bx, cy, 18, 0, Math.PI * 2);
          ctx.fillStyle = '#C48858';
          ctx.fill();
          ctx.strokeStyle = '#6E3212';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(bx, cy, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#D92D20';
          ctx.fill();
        }
      }

      // -------------------------------------------------------------
      // RULE 5: ARROWS TERMINATE BEFORE NET HOLES (NEVER TOUCH NET HOLES)
      // -------------------------------------------------------------
      for (const pocket of POCKETS) {
        const ang = Math.atan2(pocket.y - 400, pocket.x - 400);

        // Arrow line starts outside the center mandala and ends 185px away from net hole
        const arrowStartDist = 115;
        const arrowEndDist = 270;

        const startX = 400 + Math.cos(ang) * arrowStartDist;
        const startY = 400 + Math.sin(ang) * arrowStartDist;
        const endX = 400 + Math.cos(ang) * arrowEndDist;
        const endY = 400 + Math.sin(ang) * arrowEndDist;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(92, 45, 18, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Tip circle at end (cleanly outside net hole)
        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#6E3212';
        ctx.fill();

        // Foul arc near the baseline intersection (distance 190 from center)
        const arcCenterX = 400 + Math.cos(ang) * 190;
        const arcCenterY = 400 + Math.sin(ang) * 190;
        ctx.beginPath();
        ctx.arc(arcCenterX, arcCenterY, 32, ang - 0.45, ang + 0.45);
        ctx.strokeStyle = 'rgba(92, 45, 18, 0.5)';
        ctx.stroke();
      }
      ctx.restore();

      // --- DRAW ALL PUCKS / COINS (REQUIREMENT 6: 3D SHADOWS & ROTATIONAL ANIMATIONS) ---
      const activeCoins = coinsRef.current.filter((c) => !c.isPocketed);
      for (const coin of activeCoins) {
        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.scale(coin.sinkScale, coin.sinkScale);

        const speed = Math.hypot(coin.vx, coin.vy);

        // Dynamic 3D Shadows
        // 1. Ambient Occlusion Shadow directly beneath
        ctx.beginPath();
        ctx.ellipse(1, 1.5, coin.radius * 1.02, coin.radius * 0.98, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10, 5, 2, 0.45)';
        ctx.fill();

        // 2. Cast Directional Shadow (simulating warm top-left table light)
        const shadowX = 3.5 + Math.min(3, speed * 0.12);
        const shadowY = 4.8 + Math.min(4, speed * 0.15);
        ctx.beginPath();
        ctx.ellipse(shadowX, shadowY, coin.radius * 0.98, coin.radius * 0.92, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.fill();

        // High-speed motion blur trail
        if (speed > 2.5) {
          const trailLen = Math.min(32, speed * 2.2);
          const moveAngle = Math.atan2(coin.vy, coin.vx);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-Math.cos(moveAngle) * trailLen, -Math.sin(moveAngle) * trailLen);
          ctx.lineWidth = coin.radius * 1.4;
          ctx.lineCap = 'round';
          ctx.strokeStyle =
            coin.type === 'queen'
              ? 'rgba(239, 68, 68, 0.22)'
              : coin.type === 'white'
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(30, 41, 59, 0.3)';
          ctx.stroke();
        }

        // Apply angular rotation for spinning disc animation
        if (coin.rotation) {
          ctx.rotate(coin.rotation);
        }

        // 3D Beveled Coin Body
        const cGrad = ctx.createRadialGradient(-coin.radius * 0.35, -coin.radius * 0.35, 2, 0, 0, coin.radius);

        if (coin.type === 'queen') {
          cGrad.addColorStop(0, '#FF5A5A');
          cGrad.addColorStop(0.4, '#E02424');
          cGrad.addColorStop(0.85, '#991B1B');
          cGrad.addColorStop(1, '#5C0B0B');
        } else if (coin.type === 'white') {
          cGrad.addColorStop(0, '#FFFFFF');
          cGrad.addColorStop(0.35, '#F5F0E6');
          cGrad.addColorStop(0.75, '#D6C8B2');
          cGrad.addColorStop(1, '#94836D');
        } else {
          cGrad.addColorStop(0, '#475569');
          cGrad.addColorStop(0.4, '#1E293B');
          cGrad.addColorStop(0.85, '#0F172A');
          cGrad.addColorStop(1, '#020617');
        }

        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fillStyle = cGrad;
        ctx.fill();

        // Outer 3D chamfered rim highlight & shade
        ctx.lineWidth = 1.4;
        ctx.strokeStyle =
          coin.type === 'queen'
            ? 'rgba(254, 202, 202, 0.5)'
            : coin.type === 'white'
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(148, 163, 184, 0.45)';
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius - 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // Concave central depression / inner bowl (characteristic carrommen dish)
        const bowlGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coin.radius * 0.72);
        if (coin.type === 'queen') {
          bowlGrad.addColorStop(0, '#B91C1C');
          bowlGrad.addColorStop(0.7, '#7F1D1D');
          bowlGrad.addColorStop(1, '#991B1B');
        } else if (coin.type === 'white') {
          bowlGrad.addColorStop(0, '#EAE1D1');
          bowlGrad.addColorStop(0.7, '#C5B59E');
          bowlGrad.addColorStop(1, '#D8CCA8');
        } else {
          bowlGrad.addColorStop(0, '#1E293B');
          bowlGrad.addColorStop(0.7, '#0F172A');
          bowlGrad.addColorStop(1, '#1A2230');
        }

        ctx.beginPath();
        ctx.arc(0, 0, coin.radius * 0.72, 0, Math.PI * 2);
        ctx.fillStyle = bowlGrad;
        ctx.fill();

        // Concentric engraved rings and grain details
        ctx.lineWidth = 1.1;
        ctx.strokeStyle =
          coin.type === 'queen'
            ? '#FBBF24'
            : coin.type === 'white'
            ? 'rgba(120, 85, 55, 0.35)'
            : 'rgba(255, 255, 255, 0.2)';

        ctx.beginPath();
        ctx.arc(0, 0, coin.radius * 0.48, 0, Math.PI * 2);
        ctx.stroke();

        // Center jewel / emblem
        if (coin.type === 'queen') {
          // Embossed golden 6-petal starburst
          ctx.fillStyle = '#F59E0B';
          for (let petal = 0; petal < 6; petal++) {
            const petalAng = (petal * Math.PI) / 3;
            ctx.beginPath();
            ctx.arc(Math.cos(petalAng) * 4.2, Math.sin(petalAng) * 4.2, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = '#FEF08A';
          ctx.fill();
        } else {
          // Subtle woodgrain spinning radial spokes
          ctx.strokeStyle =
            coin.type === 'white' ? 'rgba(120, 85, 55, 0.22)' : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 0.8;
          for (let sp = 0; sp < 4; sp++) {
            const spAng = (sp * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(spAng) * 2, Math.sin(spAng) * 2);
            ctx.lineTo(Math.cos(spAng) * (coin.radius * 0.44), Math.sin(spAng) * (coin.radius * 0.44));
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = coin.type === 'white' ? '#8C7760' : '#475569';
          ctx.fill();
        }

        // Top-left glossy specular shine
        ctx.beginPath();
        ctx.arc(-coin.radius * 0.38, -coin.radius * 0.38, coin.radius * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fill();

        ctx.restore();
      }

      // --- DRAW STRIKER (PROFESSIONAL 3D ACRYLIC TOURNAMENT STRIKER & MOTION TRAIL) ---
      const striker = strikerRef.current;
      if (!striker.isPocketed) {
        ctx.save();
        ctx.translate(striker.x, striker.y);
        ctx.scale(striker.sinkScale, striker.sinkScale);

        const strikerSpeed = Math.hypot(striker.vx, striker.vy);

        // Striker 3D Shadows
        // 1. Ambient Occlusion Contact Shadow
        ctx.beginPath();
        ctx.ellipse(1, 2, striker.radius * 1.04, striker.radius * 0.98, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
        ctx.fill();

        // 2. Cast Directional Shadow
        const sShadowX = 4.5 + Math.min(4, strikerSpeed * 0.18);
        const sShadowY = 6.2 + Math.min(5, strikerSpeed * 0.22);
        ctx.beginPath();
        ctx.ellipse(sShadowX, sShadowY, striker.radius * 1.0, striker.radius * 0.94, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
        ctx.fill();

        // Dynamic High-Speed Motion Trail
        if (strikerSpeed > 3.0) {
          const sTrailLen = Math.min(48, strikerSpeed * 2.8);
          const sMoveAngle = Math.atan2(striker.vy, striker.vx);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-Math.cos(sMoveAngle) * sTrailLen, -Math.sin(sMoveAngle) * sTrailLen);
          ctx.lineWidth = striker.radius * 1.6;
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
          ctx.stroke();
        }

        // Heavy Tournament Ivory / Phenolic Resin Striker Body
        const sGrad = ctx.createRadialGradient(-striker.radius * 0.35, -striker.radius * 0.35, 3, 0, 0, striker.radius);
        sGrad.addColorStop(0, '#FFFFFF');
        sGrad.addColorStop(0.35, '#FBF9F5');
        sGrad.addColorStop(0.7, '#E5DDCF');
        sGrad.addColorStop(0.92, '#C2B5A0');
        sGrad.addColorStop(1, '#8A7B66');

        ctx.beginPath();
        ctx.arc(0, 0, striker.radius, 0, Math.PI * 2);
        ctx.fillStyle = sGrad;
        ctx.fill();

        // Outer Metallic Gold Rim with 3D bevel
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#D99B26';
        ctx.stroke();

        ctx.lineWidth = 1.0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(0, 0, striker.radius - 1.2, 0, Math.PI * 2);
        ctx.stroke();

        // Middle Concentric Recessed Ring
        ctx.beginPath();
        ctx.arc(0, 0, striker.radius * 0.68, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(217, 155, 38, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner Brass / Amber Gem Medallion
        const innerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, striker.radius * 0.52);
        innerGrad.addColorStop(0, '#FEF3C7');
        innerGrad.addColorStop(0.45, '#F59E0B');
        innerGrad.addColorStop(0.85, '#B45309');
        innerGrad.addColorStop(1, '#78350F');

        ctx.beginPath();
        ctx.arc(0, 0, striker.radius * 0.52, 0, Math.PI * 2);
        ctx.fillStyle = innerGrad;
        ctx.fill();
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Radial Sunburst Rays in center
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
        ctx.lineWidth = 1.0;
        for (let ray = 0; ray < 8; ray++) {
          const rayAng = (ray * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(rayAng) * 3, Math.sin(rayAng) * 3);
          ctx.lineTo(Math.cos(rayAng) * (striker.radius * 0.44), Math.sin(rayAng) * (striker.radius * 0.44));
          ctx.stroke();
        }

        // Center polished ruby/gold core
        ctx.beginPath();
        ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = '#EF4444';
        ctx.fill();
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Crisp Specular Glint
        ctx.beginPath();
        ctx.arc(-striker.radius * 0.38, -striker.radius * 0.38, striker.radius * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        ctx.restore();
      }

      // --- DYNAMIC DARK CIRCLE & DRAG FORCE INDICATOR ---
      if (isDraggingStriker && dragForce.power > 0.02 && currentTurnRef.current === 'player') {
        ctx.save();

        const minCircleRadius = STRIKER_RADIUS + 8;
        const maxCircleRadius = 138;
        const currentCircleRadius = minCircleRadius + dragForce.power * (maxCircleRadius - minCircleRadius);

        const circleGrad = ctx.createRadialGradient(
          striker.x,
          striker.y,
          STRIKER_RADIUS,
          striker.x,
          striker.y,
          currentCircleRadius
        );
        circleGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        circleGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0.32)');
        circleGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');

        ctx.beginPath();
        ctx.arc(striker.x, striker.y, currentCircleRadius, 0, Math.PI * 2);
        ctx.fillStyle = circleGrad;
        ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.stroke();

        const pullTargetX = striker.x + (dragForce.pullX || 0);
        const pullTargetY = striker.y + (dragForce.pullY || 0);

        ctx.beginPath();
        ctx.setLineDash([6, 5]);
        ctx.moveTo(striker.x, striker.y);
        ctx.lineTo(pullTargetX, pullTargetY);
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.7)';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.setLineDash([]);

        const arrowLength = 36 + dragForce.power * 72;
        const arrowStartX = striker.x + dragForce.dirX * (STRIKER_RADIUS + 2);
        const arrowStartY = striker.y + dragForce.dirY * (STRIKER_RADIUS + 2);
        const arrowEndX = striker.x + dragForce.dirX * (STRIKER_RADIUS + arrowLength);
        const arrowEndY = striker.y + dragForce.dirY * (STRIKER_RADIUS + arrowLength);

        const arrowGrad = ctx.createLinearGradient(arrowStartX, arrowStartY, arrowEndX, arrowEndY);
        arrowGrad.addColorStop(0, '#E52E2E');
        arrowGrad.addColorStop(0.5, '#FF6A00');
        arrowGrad.addColorStop(1, '#FFE600');

        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(arrowEndX, arrowEndY);
        ctx.strokeStyle = arrowGrad;
        ctx.lineWidth = 4.2;
        ctx.lineCap = 'round';
        ctx.stroke();

        const shotAngle = Math.atan2(dragForce.dirY, dragForce.dirX);
        const headSize = 13;
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowEndY);
        ctx.lineTo(
          arrowEndX - Math.cos(shotAngle - 0.45) * headSize,
          arrowEndY - Math.sin(shotAngle - 0.45) * headSize
        );
        ctx.lineTo(
          arrowEndX - Math.cos(shotAngle + 0.45) * headSize,
          arrowEndY - Math.sin(shotAngle + 0.45) * headSize
        );
        ctx.closePath();
        ctx.fillStyle = '#FFE600';
        ctx.fill();

        const trajectoryLen = 130 + dragForce.power * 210;
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.moveTo(arrowEndX, arrowEndY);
        ctx.lineTo(
          arrowEndX + dragForce.dirX * trajectoryLen,
          arrowEndY + dragForce.dirY * trajectoryLen
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      }

      // Bot Aim Telegraph
      if (botAimLineRef.current) {
        const b = botAimLineRef.current;
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.beginPath();
        ctx.moveTo(b.startX, b.startY);
        ctx.lineTo(b.endX, b.endY);
        ctx.stroke();
        ctx.restore();
      }

      // Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life += 1;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // Floating Scores
      const scores = floatingScoresRef.current;
      for (let i = scores.length - 1; i >= 0; i--) {
        const s = scores[i];
        s.y += s.vy;
        s.alpha -= 0.024;

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.font = 'bold 20px Outfit, sans-serif';
        ctx.fillStyle = s.color;
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 6;
        ctx.textAlign = 'center';
        ctx.fillText(s.text, s.x, s.y);
        ctx.restore();

        if (s.alpha <= 0) {
          scores.splice(i, 1);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [runPhysicsStep, checkTurnSettlement, isDraggingStriker, dragForce]);

  /* ==========================================================================
     WALLET DEPOSIT & WITHDRAW HANDLERS
     ========================================================================== */
  const handleDeposit = (amount: number) => {
    const bonusEarned = Math.round(amount * 0.2);
    setWallet((prev) => ({
      ...prev,
      realBalance: prev.realBalance + amount,
      bonusBalance: prev.bonusBalance + bonusEarned,
      wagerRequired: prev.wagerRequired + bonusEarned * 3,
      transactions: [
        {
          id: `TXN-DEP-${Date.now().toString().slice(-6)}`,
          type: 'deposit',
          amount,
          description: `UPI Instant Deposit (+₹${bonusEarned} Bonus)`,
          timestamp: Date.now(),
          status: 'success',
        },
        ...prev.transactions,
      ],
    }));
    soundEngine.playPocketSink(true);
    setActiveModal(null);
  };

  const handleWithdrawal = (amount: number) => {
    if (amount < 500 || amount > wallet.realBalance) return;
    setWallet((prev) => ({
      ...prev,
      realBalance: prev.realBalance - amount,
      transactions: [
        {
          id: `TXN-WTH-${Date.now().toString().slice(-6)}`,
          type: 'withdrawal',
          amount,
          description: `IMPS Instant Payout`,
          timestamp: Date.now(),
          status: 'success',
        },
        ...prev.transactions,
      ],
    }));
    soundEngine.playCoinClack(1);
    setActiveModal(null);
  };

  /* ==========================================================================
     RENDER
     ========================================================================== */
  return (
    <div className="min-h-screen bg-[#073622] text-neutral-100 flex flex-col justify-between font-sans select-none overflow-x-hidden relative">
      {/* Background radial gradient to match reference image emerald green table felt */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 32%, #0b492f 0%, #063521 55%, #021f13 100%)',
        }}
      />

      {/* --- TOP BAR (MATCHING REFERENCE IMAGE EXACTLY WITH QUEEN INDICATOR) --- */}
      <div className="relative z-10 w-full max-w-[460px] mx-auto px-4 pt-3 pb-1 flex items-center justify-between">
        {/* Left: Opponent Avatar Card with Opponent Name & Queen Indicator */}
        <div className="flex flex-col items-start gap-1">
          <div className="w-12 h-12 rounded-lg bg-[#2768A3] border-2 border-[#5497D7] flex items-center justify-center shadow-md overflow-hidden relative">
            <User className="w-8 h-8 text-neutral-200 fill-neutral-200" />
            {/* Rule 8: Red Queen Indicator on Scoreboard for Opponent */}
            {queenState === 'pending_bot' && (
              <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-600 border border-white animate-ping" />
            )}
            {queenState === 'covered_bot' && (
              <div className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full p-0.5 text-[8px]">
                👑
              </div>
            )}
          </div>
          {/* Real Opponent Name below profile (Rule 6: No Guest) */}
          <span className="text-[11px] font-bold text-neutral-200 tracking-tight leading-none pl-0.5">
            {opponentName}
          </span>
          {/* Black Coin Counter: Accurately shows number of black coins pocketed out of 9! */}
          <div className="flex items-center gap-1 pl-1 mt-0.5">
            <span className="font-display font-extrabold text-base text-white tabular-nums">
              {botBlackPocketed}
            </span>
            <div className="w-4 h-4 rounded-full bg-neutral-900 border border-neutral-700 shadow-sm" />
            {queenState === 'covered_bot' && (
              <div className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow-sm ml-0.5" title="Queen Secured by Opponent" />
            )}
          </div>
        </div>

        {/* Center: Gold Coins Stack & Total Pot Display & 10-Second Turn Countdown (Requirement 5) */}
        <div className="flex flex-col items-center justify-center -mt-1">
          <div className="flex items-center justify-center -space-x-1.5 mb-0.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border border-yellow-300 shadow-sm flex items-center justify-center text-[10px] font-bold text-amber-900">
              ₹
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border border-yellow-300 shadow-sm -mt-1 flex items-center justify-center text-xs font-bold text-amber-900">
              ₹
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border border-yellow-300 shadow-sm flex items-center justify-center text-[10px] font-bold text-amber-900">
              ₹
            </div>
          </div>
          {/* Total Pot Number (2 * Bet Amount) */}
          <span className="font-display font-black text-xl text-white tracking-wide drop-shadow-md">
            {activeRoom.totalPot.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-300 font-semibold tracking-wider uppercase mt-0.5">
            {activeRoom.gameId} · Bet ₹{activeRoom.betAmount}
          </span>
        </div>

        {/* Right: Player Avatar Card with Player Name & Queen Indicator */}
        <div className="flex flex-col items-end gap-1">
          <div
            className={`w-12 h-12 rounded-lg bg-[#1E609A] border-2 flex items-center justify-center shadow-md overflow-hidden relative transition-all ${
              currentTurn === 'player'
                ? 'border-emerald-400 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/30'
                : 'border-neutral-600 opacity-85'
            }`}
          >
            <User className="w-8 h-8 text-neutral-100 fill-neutral-100" />
            {/* Rule 8: Red Queen Indicator on Scoreboard for Player */}
            {queenState === 'pending_player' && (
              <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-600 border border-white animate-ping" />
            )}
            {queenState === 'covered_player' && (
              <div className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full p-0.5 text-[8px]">
                👑
              </div>
            )}
          </div>
          {/* Real Player Name below profile (Rule 6: No Guest) */}
          <span className="text-[11px] font-bold text-emerald-300 tracking-tight leading-none pr-0.5">
            {playerName}
          </span>
          {/* White Coin Counter: Accurately shows number of white coins pocketed out of 9! */}
          <div className="flex items-center gap-1 pr-1 mt-0.5">
            {queenState === 'covered_player' && (
              <div className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow-sm mr-0.5" title="Queen Secured by You!" />
            )}
            <div className="w-4 h-4 rounded-full bg-[#EDE8DF] border border-neutral-300 shadow-sm" />
            <span className="font-display font-extrabold text-base text-white tabular-nums">
              {playerWhitePocketed}
            </span>
          </div>
        </div>
      </div>

      {/* --- QUEEN STATUS NOTIFIER BANNER (RULE 8) --- */}
      {queenState === 'pending_player' && (
        <div className="relative z-10 w-full max-w-[420px] mx-auto px-4 -mt-1 mb-1">
          <div className="bg-red-500/20 border border-red-500/60 rounded-xl px-3 py-1 text-center shadow-sm flex items-center justify-center gap-2 animate-pulse">
            <span className="text-sm">👑</span>
            <span className="text-xs font-bold text-red-200">
              Queen Pocketed! Pocket a White coin on this shot to cover and secure the Queen!
            </span>
          </div>
        </div>
      )}

      {queenState === 'pending_bot' && (
        <div className="relative z-10 w-full max-w-[420px] mx-auto px-4 -mt-1 mb-1">
          <div className="bg-red-500/20 border border-red-500/60 rounded-xl px-3 py-1 text-center shadow-sm flex items-center justify-center gap-2">
            <span className="text-sm">👑</span>
            <span className="text-xs font-bold text-red-200">
              Opponent pocketed Queen! Must cover with a Black coin.
            </span>
          </div>
        </div>
      )}

      {/* --- CENTER: THE CARROM BOARD CANVAS (RULE 4 REAL BOARD FRAME) --- */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-3 py-1">
        <div className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] game-viewport flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            onPointerDown={handlePointerDownOnCanvas}
            className="w-full h-full cursor-crosshair touch-none select-none"
          />

          {/* Quick Chat Overlay Bubble */}
          {chatMessage && (
            <div className="absolute top-10 left-10 bg-neutral-900/90 border border-amber-400/60 rounded-xl px-3 py-1.5 shadow-xl animate-bounce">
              <span className="text-xs font-bold text-amber-300">{chatMessage.text}</span>
            </div>
          )}

          {/* DIRECT ON-SCREEN COUNTDOWN OVERLAY (REQUIREMENT 2: SHOWN ON SCREEN AFTER 5s IDLE) */}
          {idleSeconds >= 5 && turnTimeLeft <= 15 && !isStrikerMoving && !isTurnInProgressRef.current && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div
                className={`flex flex-col items-center justify-center rounded-3xl px-6 py-4 backdrop-blur-md border shadow-2xl transition-all duration-300 ${
                  turnTimeLeft <= 5
                    ? 'bg-red-950/90 border-red-500 text-red-100 ring-4 ring-red-500/50 scale-105 animate-pulse shadow-red-500/40'
                    : 'bg-neutral-950/80 border-amber-400/80 text-amber-200 shadow-amber-500/20'
                }`}
              >
                <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-300 mb-0.5">
                  {currentTurn === 'player' ? 'Your Turn' : `${opponentName}'s Turn`}
                </span>
                <div className="flex items-baseline gap-1 my-0.5">
                  <span className="font-display font-black text-6xl tracking-tight tabular-nums drop-shadow-xl">
                    {turnTimeLeft}
                  </span>
                  <span className="text-xl font-bold text-neutral-300">s</span>
                </div>
                <span className="text-[10px] text-neutral-300 font-semibold mt-1">
                  {turnTimeLeft <= 5 ? '⚠️ Striking timer running out!' : 'Slide or touch board to reset'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* --- STRIKER POSITIONING SLIDER --- */}
        <div className="w-full max-w-[340px] mt-4 px-2">
          <div className="relative flex items-center bg-[#062c1b]/90 border border-emerald-800/60 rounded-full h-8 px-2 shadow-inner">
            <input
              type="range"
              min={BASELINE_MIN_X}
              max={BASELINE_MAX_X}
              step={1}
              value={strikerX}
              onChange={handleBaselineSliderChange}
              disabled={currentTurn !== 'player' || isStrikerMoving}
              className="w-full appearance-none bg-transparent cursor-pointer disabled:opacity-50 accent-amber-400 h-6
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-7
                [&::-webkit-slider-thumb]:h-7
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gradient-to-tr
                [&::-webkit-slider-thumb]:from-[#D5CDBC]
                [&::-webkit-slider-thumb]:to-[#FFFFFF]
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-[#C68B2F]
                [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>
        </div>
      </div>

      {/* --- BOTTOM CONTROLS & ACTION BUTTONS --- */}
      <div className="relative z-10 w-full max-w-[460px] mx-auto px-5 pb-5 pt-1 flex items-center justify-between">
        {/* Bottom Left: Chat Bubble Button */}
        <button
          onClick={() => setActiveModal('chat')}
          className="w-14 h-14 rounded-full bg-gradient-to-b from-[#F5C242] to-[#D9961A] border-2 border-[#FFF0A0] shadow-[0_4px_14px_rgba(217,150,26,0.6)] flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Open Chat Emojis"
        >
          <MessageCircle className="w-6 h-6 text-neutral-900 fill-neutral-900" />
        </button>

        {/* Quick Lobby / Match Hub Center Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setScreen('create_game')}
            className="bg-emerald-500/20 border border-emerald-400/80 hover:bg-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-300 shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create / Join Room</span>
          </button>
          <span className="text-[10px] text-neutral-400">
            {currentTurn === 'player' ? 'Your Turn to Strike' : 'Opponent Thinking...'}
          </span>
        </div>

        {/* Bottom Right: Menu Button with "Tap to open menu." tooltip */}
        <div className="relative flex items-center">
          <div className="absolute right-16 whitespace-nowrap bg-neutral-900/95 border border-neutral-700/80 rounded-full px-3 py-1 shadow-lg text-[11px] font-semibold text-neutral-200 pointer-events-none flex items-center gap-1">
            <span>Tap to open menu.</span>
            <div className="w-1.5 h-1.5 bg-neutral-900 rotate-45 -mr-1 border-r border-b border-neutral-700" />
          </div>

          <button
            onClick={() => setActiveModal('menu')}
            className="w-14 h-14 rounded-full bg-gradient-to-b from-[#F5C242] to-[#D9961A] border-2 border-[#FFF0A0] shadow-[0_4px_14px_rgba(217,150,26,0.6)] flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Open Menu"
          >
            <MenuIcon className="w-6 h-6 text-neutral-900 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ==========================================================================
          MODALS & FLYOUTS
          ========================================================================== */}

      {/* --- CREATE GAME MODAL (WITH 6 BETTING OPTIONS: 50, 100, 200, 500, 1000, 2000) --- */}
      {screen === 'create_game' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            {/* Modal Header & Floating Close (Requirement 1) */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-2xl text-white tracking-tight">
                  Matchmaking
                </h3>
                <span className="text-xs text-neutral-400 font-medium">Select wager and start instant match</span>
              </div>
              <button
                onClick={() => setScreen('gameplay')}
                className="text-neutral-400 hover:text-white p-2 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/80 transition-all active:scale-95"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Player Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Your In-Game Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* 6 BETTING OPTIONS (50, 100, 200, 500, 1000, 2000) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-200">Select Betting Amount</span>
                <span className="text-[11px] text-amber-400 font-medium">10% Platform Rake on Total Pot</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {BETTING_AMOUNTS.map((amt) => {
                  const pot = amt * 2;
                  const rake = Math.round(pot * 0.1);
                  const win = pot - rake;
                  const isSelected = selectedBet === amt;

                  return (
                    <div
                      key={amt}
                      onClick={() => setSelectedBet(amt)}
                      className={`relative cursor-pointer rounded-2xl py-3.5 px-2.5 border transition-all duration-300 flex flex-col justify-between items-center text-center group ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500/25 via-neutral-900 to-amber-950/45 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-[1.03]'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                        Bet
                      </span>

                      <span className="font-display font-black text-2xl text-white tabular-nums tracking-tight">
                        ₹{amt}
                      </span>

                      <div className="mt-2 pt-1.5 border-t border-neutral-800/80 w-full text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                        <span className="text-neutral-400 font-medium text-[10px]">Win</span>
                        <span>₹{win}</span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center text-[10px] font-black shadow-sm">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Winner Payout (Requirement 1: Adjusted places and spaces) */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center justify-between text-xs shadow-inner">
              <span className="text-neutral-300 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Winner Takes (10% Rake Deducted):
              </span>
              <span className="font-display font-black text-xl text-emerald-400 tabular-nums">
                ₹{(selectedBet * 2) - Math.round(selectedBet * 2 * 0.1)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={() => setScreen('join_game')}
                className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-neutral-700"
              >
                <LogIn className="w-4 h-4 text-neutral-300" />
                Join Existing Room
              </button>
              <button
                onClick={handleCreateRoom}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Generate Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ROOM WAITING LOBBY (SHOWS UNIQUE GAME ID & PLAYERS) --- */}
      {screen === 'room_waiting' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl relative">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-400">
                Matchmaking Room Created
              </span>
              <h3 className="font-display font-black text-2xl text-white">Share Game ID to Play</h3>
              <p className="text-xs text-neutral-400">
                Give this unique room code to another player to join and play together
              </p>
            </div>

            {/* UNIQUE GAME ID DISPLAY CARD */}
            <div className="bg-neutral-950 border-2 border-amber-400/80 rounded-2xl p-4 shadow-xl space-y-2">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
                Unique Room Code
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-display font-black text-3xl tracking-widest text-amber-400">
                  {activeRoom.gameId}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeRoom.gameId);
                    setCopyNotification(true);
                    setTimeout(() => setCopyNotification(false), 2000);
                  }}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 active:scale-95 transition-all"
                  title="Copy Game ID"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              {copyNotification && (
                <span className="text-[11px] text-emerald-400 font-semibold block animate-pulse">
                  ✓ Copied to clipboard!
                </span>
              )}
            </div>

            {/* List of Players in Room */}
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 text-left space-y-2.5">
              <span className="text-[11px] font-bold text-neutral-300 block uppercase tracking-wider">
                Players in Room (1/2)
              </span>

              <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-400 font-bold">
                    1
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">{activeRoom.hostName}</span>
                    <span className="text-[10px] text-amber-400">Room Host (White Pucks)</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  READY
                </span>
              </div>

              <div className="flex items-center justify-between bg-neutral-900/60 border border-dashed border-neutral-800 rounded-xl p-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 font-bold animate-pulse">
                    ?
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-400">Waiting for Challenger...</span>
                    <span className="text-[10px] text-neutral-500">Share ID {activeRoom.gameId}</span>
                  </div>
                </div>
                <span className="text-[10px] text-neutral-500 font-semibold animate-pulse">
                  CONNECTING...
                </span>
              </div>
            </div>

            {/* Start Match CTA */}
            <div className="space-y-2">
              <button
                onClick={() => startMatchWithBet(activeRoom)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-black text-xs shadow-lg transition-all active:scale-95"
              >
                Play with Online Challenger Now (₹{activeRoom.betAmount})
              </button>
              <button
                onClick={() => setScreen('create_game')}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Change Bet / Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- JOIN GAME MODAL --- */}
      {screen === 'join_game' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-display font-extrabold text-xl text-white">Join Game Room</h3>
                <p className="text-xs text-neutral-400">Enter the unique Game ID provided by your opponent</p>
              </div>
              <button onClick={() => setScreen('gameplay')} className="text-neutral-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Enter Unique Game ID</label>
                <input
                  type="text"
                  placeholder="e.g. CR-5892"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 font-mono font-bold tracking-widest uppercase focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-300 block">Available Open Rooms</span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {[
                  { id: 'CR-8219', host: 'Kavita_Pro', bet: 200 },
                  { id: 'CR-3944', host: 'Vikram_Ace', bet: 500 },
                  { id: 'CR-7102', host: 'Samir_King', bet: 1000 },
                ].map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setJoinCodeInput(r.id);
                      setSelectedBet(r.bet);
                    }}
                    className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-amber-500/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-white block">{r.host}</span>
                      <span className="text-[10px] text-amber-400 font-mono">{r.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 block">Bet ₹{r.bet}</span>
                      <span className="text-[10px] text-neutral-400">Pot ₹{r.bet * 2}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setScreen('create_game')}
                className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs"
              >
                Back to Create
              </button>
              <button
                onClick={handleJoinRoomWithCode}
                disabled={!joinCodeInput.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-black text-xs transition-all disabled:opacity-50"
              >
                Join Room & Play
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MENU MODAL --- */}
      {activeModal === 'menu' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-display font-bold text-lg text-white">Game Menu</h3>
              <button onClick={() => setActiveModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setScreen('create_game');
                }}
                className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  Create / Join Room
                </span>
                <span className="text-amber-400 text-[10px]">New Bet</span>
              </button>

              <button
                onClick={() => {
                  setSoundMuted((m) => !m);
                }}
                className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  {soundMuted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                  Sound FX
                </span>
                <span className="text-amber-400 font-bold">{soundMuted ? 'OFF' : 'ON'}</span>
              </button>

              <button
                onClick={() => setActiveModal('deposit')}
                className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Wallet Balance
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">₹{wallet.realBalance}</span>
              </button>

              <button
                onClick={() => setActiveModal('withdraw')}
                className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-400" />
                  Withdraw Funds
                </span>
                <span className="text-neutral-400 text-[10px]">Min. ₹500</span>
              </button>

              <button
                onClick={() => setActiveModal('rules')}
                className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Carrom Rules & Queen Cover
                </span>
              </button>

              <button
                onClick={() => {
                  initializeBoard();
                  setActiveModal(null);
                }}
                className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  Restart Match
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CHAT EMOJI FLYOUT --- */}
      {activeModal === 'chat' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="max-w-xs w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-2xl relative mb-16">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300">Quick Reactions</span>
              <button onClick={() => setActiveModal(null)} className="text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Good Luck! 🎯', 'Nice Shot! 👏', 'Cover the Queen! 👑', 'Oops! 😅', 'Rematch? ⚔️', 'Thanks! 🤝'].map((msg) => (
                <button
                  key={msg}
                  onClick={() => {
                    setChatMessage({ text: msg, sender: 'player' });
                    setActiveModal(null);
                    setTimeout(() => setChatMessage(null), 3000);
                  }}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-left text-neutral-200 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- DEPOSIT WALLET MODAL --- */}
      {activeModal === 'deposit' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Deposit Cash</h3>
                <p className="text-xs text-neutral-400">Instant UPI Deposit with 20% Promotional Bonus</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[200, 500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleDeposit(amt)}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-center transition-all group"
                >
                  <span className="block font-bold text-sm text-white group-hover:text-amber-400">₹{amt}</span>
                  <span className="block text-[10px] text-emerald-400 font-semibold">+₹{Math.round(amt * 0.2)}</span>
                </button>
              ))}
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-400 space-y-1">
              <span className="block font-semibold text-neutral-300 text-[11px]">Instant UPI Gateways</span>
              <p className="text-[10px]">Google Pay · PhonePe · Paytm · NetBanking</p>
            </div>
          </div>
        </div>
      )}

      {/* --- WITHDRAW MODAL --- */}
      {activeModal === 'withdraw' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Withdraw Funds</h3>
                <p className="text-xs text-neutral-400">Direct Bank IMPS / UPI Transfer</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-400">Withdrawable Balance</span>
                <span className="font-bold text-emerald-400 text-sm">₹{wallet.realBalance}</span>
              </div>
              <div className="flex justify-between text-neutral-500 text-[10px]">
                <span>Minimum Withdrawal</span>
                <span>₹500</span>
              </div>
            </div>

            {wallet.realBalance >= 500 ? (
              <button
                onClick={() => handleWithdrawal(500)}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors"
              >
                Withdraw ₹500 via IMPS
              </button>
            ) : (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg">
                Threshold not met. Win a few more matches to reach ₹500!
              </p>
            )}
          </div>
        </div>
      )}

      {/* --- RULES MODAL --- */}
      {activeModal === 'rules' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-display font-bold text-base text-white">Official Carrom Rules</h3>
              <button onClick={() => setActiveModal(null)} className="text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <p>• <strong>Strict Frame & Net Holes:</strong> Coins and striker stay inside the board frame at all times. Pockets only count when entering the round net hole opening.</p>
              <p>• <strong>Striker Foul:</strong> If the striker enters a net hole, it is a foul! 1 pocketed coin is deducted and returned to center, and next turn is given to your opponent.</p>
              <p>• <strong>Turn Continuity (Rule 6):</strong> You only get an extra turn if you pocket your OWN coin. If you pocket an opponent coin, it counts for them and turn passes to them!</p>
              <p>• <strong>Queen Cover Rule (Rule 8):</strong> After pocketing the Red Queen, you MUST pocket your own coin on the cover shot. If successful, the Queen is secured! If you fail, the Queen returns to the center circle!</p>
              <p>• <strong>Winning (Rule 7):</strong> First player to pocket all 9 coins of their color wins the match pot (minus 10% platform rake).</p>
            </div>
          </div>
        </div>
      )}

      {/* --- RULE 7: GAME OVER & WINNER/LOSER MODAL --- */}
      {gameOverResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-neutral-800 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-lg">
              {gameOverResult.winner === 'player' ? '🏆' : '💔'}
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-display font-black text-white">
                {gameOverResult.winner === 'player' ? 'Winner Declared!' : 'Match Finished'}
              </h2>
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs space-y-1 mt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-emerald-400">🏆 Winner</span>
                  <span className="text-white">{gameOverResult.winnerName} (Pocketed 9 Coins)</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="text-red-400">Loser</span>
                  <span>{gameOverResult.loserName}</span>
                </div>
              </div>
            </div>

            {/* Payout Breakdown */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 text-xs text-left space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Room Code</span>
                <span className="font-mono text-white">{activeRoom.gameId}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Total Match Pot</span>
                <span className="text-white font-bold">₹{activeRoom.totalPot}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>10% Platform Charge</span>
                <span>-₹{activeRoom.platformRake}</span>
              </div>
              <div className="border-t border-neutral-800 pt-1.5 flex justify-between font-bold text-sm text-emerald-400">
                <span>Winner Payout Credited</span>
                <span>+₹{activeRoom.winnerPrize}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setGameOverResult(null);
                  setScreen('create_game');
                }}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs"
              >
                Change Bet
              </button>
              <button
                onClick={() => {
                  setGameOverResult(null);
                  startMatchWithBet(activeRoom);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs transition-colors"
              >
                Rematch (₹{activeRoom.betAmount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
