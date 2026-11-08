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
  Award,
  LogOut,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode
} from 'lucide-react';

import { AdminPanel } from './components/AdminPanel';
import { DepositPaymentPage } from './components/DepositPaymentPage';
import {
  checkIsAdminUrl,
  subscribeToSync,
  submitWithdrawalRequest,
  getWithdrawalRequests,
  getAdminDepositConfig,
  WithdrawalRequest
} from './services/adminSync';

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

  playFirecracker() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Series of 4 rapid crisp crackle-pops & whistle
    for (let i = 0; i < 4; i++) {
      const delay = t + i * 0.12 + Math.random() * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800 + Math.random() * 600, delay);
      osc.frequency.exponentialRampToValueAtTime(80, delay + 0.05);

      gain.gain.setValueAtTime(0.35, delay);
      gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.055);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(delay);
      osc.stop(delay + 0.055);
    }
  }

  playDefeat() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Sombre descending minor triad
    const notes = [392.0, 329.63, 261.63, 196.0];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.14);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + idx * 0.14 + 0.4);

      gain.gain.setValueAtTime(0.25, t + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.14 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + idx * 0.14);
      osc.stop(t + idx * 0.14 + 0.5);
    });
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
  totalWon: number;
  matchesPlayed: number;
  matchesWon: number;
  transactions: Array<{
    id: string;
    type: 'deposit' | 'withdrawal' | 'entry' | 'win';
    amount: number;
    description: string;
    timestamp: number;
    status: 'success' | 'pending';
  }>;
}

const DEFAULT_WALLET: WalletState = {
  realBalance: 1000,
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
   AUTHENTIC 3D LATHE-TURNED CARROM COIN FOR SCOREBOARD (REQUIREMENT 6)
   Exact match to the wooden carrommen on the board:
   - Boxwood white with turned chamfer and bowl depression
   - Ebonite black with turned chamfer and slate ring
   - Royal crimson Queen with lathe rings and golden 8-point royal star inlay
   ========================================================================== */
const ScoreboardCarromCoin: React.FC<{
  type: 'white' | 'black' | 'queen';
  size?: number;
  className?: string;
}> = ({ type, size = 24, className = '' }) => {
  const gradId = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] ${className}`}
    >
      <defs>
        {/* White Coin Gradients */}
        <radialGradient id={`${gradId}-white`} cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="32%" stopColor="#F8F4EC" />
          <stop offset="72%" stopColor="#DFD3C0" />
          <stop offset="92%" stopColor="#C2B198" />
          <stop offset="100%" stopColor="#8A775E" />
        </radialGradient>
        <radialGradient id={`${gradId}-white-bowl`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EDE4D6" />
          <stop offset="70%" stopColor="#C8B9A2" />
          <stop offset="100%" stopColor="#DDD3C1" />
        </radialGradient>

        {/* Black Coin Gradients */}
        <radialGradient id={`${gradId}-black`} cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="32%" stopColor="#1E293B" />
          <stop offset="75%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <radialGradient id={`${gradId}-black-bowl`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="70%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </radialGradient>

        {/* Queen Coin Gradients */}
        <radialGradient id={`${gradId}-queen`} cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#FF4D4D" />
          <stop offset="35%" stopColor="#DC2626" />
          <stop offset="75%" stopColor="#991B1B" />
          <stop offset="100%" stopColor="#500707" />
        </radialGradient>
        <radialGradient id={`${gradId}-queen-bowl`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#991B1B" />
          <stop offset="70%" stopColor="#7F1D1D" />
          <stop offset="100%" stopColor="#B91C1C" />
        </radialGradient>
      </defs>

      {/* Layer 1: Ambient Occlusion & Cast Shadow */}
      <ellipse cx="16.5" cy="18" rx="13" ry="11.5" fill="rgba(0,0,0,0.55)" />

      {/* Layer 2: Main Coin Body */}
      {type === 'white' && (
        <>
          <circle cx="16" cy="15" r="13" fill={`url(#${gradId}-white)`} />
          <circle cx="16" cy="15" r="12.2" stroke="rgba(255,255,255,0.9)" strokeWidth="1" fill="none" />
          <circle cx="16" cy="15" r="9" fill={`url(#${gradId}-white-bowl)`} />
          <circle cx="16" cy="15" r="6" stroke="rgba(110,78,48,0.45)" strokeWidth="0.9" fill="none" />
          <circle cx="16" cy="15" r="1.8" fill="rgba(110,78,48,0.7)" />
        </>
      )}

      {type === 'black' && (
        <>
          <circle cx="16" cy="15" r="13" fill={`url(#${gradId}-black)`} />
          <circle cx="16" cy="15" r="12.2" stroke="rgba(148,163,184,0.6)" strokeWidth="1" fill="none" />
          <circle cx="16" cy="15" r="9" fill={`url(#${gradId}-black-bowl)`} />
          <circle cx="16" cy="15" r="6" stroke="rgba(255,255,255,0.25)" strokeWidth="0.9" fill="none" />
          <circle cx="16" cy="15" r="1.8" fill="rgba(255,255,255,0.4)" />
        </>
      )}

      {type === 'queen' && (
        <>
          <circle cx="16" cy="15" r="13" fill={`url(#${gradId}-queen)`} />
          <circle cx="16" cy="15" r="12.2" stroke="rgba(254,202,202,0.7)" strokeWidth="1" fill="none" />
          <circle cx="16" cy="15" r="9" fill={`url(#${gradId}-queen-bowl)`} />
          <circle cx="16" cy="15" r="6" stroke="#FBBF24" strokeWidth="1" fill="none" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((petal) => {
            const ang = (petal * Math.PI) / 4;
            const px = 16 + Math.cos(ang) * 4;
            const py = 15 + Math.sin(ang) * 4;
            return <circle key={petal} cx={px} cy={py} r="1.3" fill="#F59E0B" />;
          })}
          <circle cx="16" cy="15" r="2.5" fill="#FEF08A" stroke="#D97706" strokeWidth="0.8" />
        </>
      )}
    </svg>
  );
};

/* ==========================================================================
   CELEBRATION FIRECRACKERS CANVAS ANIMATION (REQUIREMENT 5: VICTORY)
   ========================================================================== */
const FirecrackerCelebration: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      decay: number;
      radius: number;
    }

    interface Rocket {
      x: number;
      y: number;
      vy: number;
      targetY: number;
      color: string;
    }

    const sparks: Spark[] = [];
    const rockets: Rocket[] = [];
    const colors = ['#F59E0B', '#10B981', '#06B6D4', '#EC4899', '#EF4444', '#EAB308', '#8B5CF6'];

    const launchRocket = () => {
      rockets.push({
        x: Math.random() * (width * 0.8) + width * 0.1,
        y: height,
        vy: -(Math.random() * 4 + 10),
        targetY: Math.random() * (height * 0.5) + height * 0.12,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    const explode = (x: number, y: number, color: string) => {
      const count = 40 + Math.floor(Math.random() * 25);
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 5.5 + 1.8;
        sparks.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color,
          alpha: 1,
          decay: Math.random() * 0.022 + 0.014,
          radius: Math.random() * 2.6 + 1.2,
        });
      }
    };

    launchRocket();
    launchRocket();
    const interval = setInterval(launchRocket, 420);

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      // Rockets update
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Sparks update
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.065;
        s.vx *= 0.98;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />;
};

/* ==========================================================================
   SOMBER DEFEAT ANIMATION (REQUIREMENT 5: LOSING ANIMATION)
   ========================================================================== */
const DefeatAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/35 via-black/45 to-black/85" />
      <div className="absolute inset-0 opacity-40">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 bg-gradient-to-b from-rose-500/50 via-red-900/30 to-transparent rounded-full animate-pulse"
            style={{
              left: `${(i * 4.2) % 100}%`,
              top: `${(i * 7) % 75}%`,
              height: `${28 + (i % 5) * 16}px`,
              animationDuration: `${1.2 + (i % 3) * 0.4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

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
  const [activeModal, setActiveModal] = useState<'menu' | 'deposit' | 'withdraw' | 'history' | 'rules' | 'chat' | 'confirm_leave' | null>(null);

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

  // Admin Panel, Deposit Config & Deposit Payment Page state
  const [adminConfig, setAdminConfig] = useState(getAdminDepositConfig);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [depositPaymentAmount, setDepositPaymentAmount] = useState<number | null>(null);
  const [customDepositInput, setCustomDepositInput] = useState<string>('');

  // Custom Withdrawal form state
  const [customWithdrawAmount, setCustomWithdrawAmount] = useState<string>('');
  const [playerWithdrawUpi, setPlayerWithdrawUpi] = useState<string>('');
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState<string | null>(null);
  const [recentWithdrawals, setRecentWithdrawals] = useState<WithdrawalRequest[]>(() => {
    return getWithdrawalRequests().filter((r) => r.playerName === playerName);
  });

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

  // Rematch / Restart approval notification state (Requirement 9)
  const [rematchPrompt, setRematchPrompt] = useState<{
    type: 'restart' | 'rematch';
    status: 'requesting' | 'approved' | 'declined';
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

  // URL route detection for Admin Panel (/admin9999, /Admin9999, etc.) & real-time sync
  useEffect(() => {
    const handleCheckUrl = () => {
      if (checkIsAdminUrl()) {
        setIsAdminOpen(true);
      }
    };

    handleCheckUrl();
    window.addEventListener('popstate', handleCheckUrl);
    window.addEventListener('hashchange', handleCheckUrl);

    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'DEPOSIT_CONFIG_UPDATED') {
        setAdminConfig(getAdminDepositConfig());
      } else if (
        msg.type === 'WALLET_UPDATED' ||
        msg.type === 'WITHDRAWAL_STATUS_UPDATED' ||
        msg.type === 'DEPOSIT_STATUS_UPDATED'
      ) {
        const saved = localStorage.getItem('carrom_royal_wallet');
        if (saved) {
          try {
            setWallet(JSON.parse(saved));
          } catch {}
        }
        setRecentWithdrawals(getWithdrawalRequests().filter((r) => r.playerName === playerName));
      }
    });

    return () => {
      window.removeEventListener('popstate', handleCheckUrl);
      window.removeEventListener('hashchange', handleCheckUrl);
      unsubscribe();
    };
  }, [playerName]);

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

  // Center reference design image
  const centerDesignImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/assets/aistudio/Screenshot_2026-11-08_135550_b3450cc4.png';
    img.onload = () => {
      centerDesignImgRef.current = img;
    };
  }, []);

  /* ==========================================================================
     STARTING MATCH WITH WALLET DEDUCTION & COMMISSION RAKE
     ========================================================================== */
  const startMatchWithBet = (room: GameRoom) => {
    if (room.betAmount > 0) {
      if (wallet.realBalance < room.betAmount) {
        // Auto reload balance for seamless non-stop gameplay
        setWallet((prev) => ({
          ...prev,
          realBalance: prev.realBalance + room.betAmount + 1000,
        }));
      }

      setWallet((prev) => ({
        ...prev,
        realBalance: Math.max(0, prev.realBalance - room.betAmount),
        matchesPlayed: prev.matchesPlayed + 1,
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
     REMATCH FUNCTION (REQUIREMENT 4: SAME PLAYER, SAME BET, FRESH NEW START)
     ========================================================================== */
  const handleRematch = () => {
    setGameOverResult(null);
    if (wallet.realBalance < activeRoom.betAmount) {
      setWallet((prev) => ({
        ...prev,
        realBalance: prev.realBalance + activeRoom.betAmount + 1000,
      }));
    }
    const rematchRoom: GameRoom = {
      ...activeRoom,
      status: 'playing',
    };
    startMatchWithBet(rematchRoom);
  };

  /* ==========================================================================
     REMATCH / RESTART REQUEST FLOW (REQUIREMENT 9: OPPONENT APPROVE / REJECT)
     ========================================================================== */
  const initiateRestartOrRematch = (type: 'restart' | 'rematch') => {
    setActiveModal(null);
    setRematchPrompt({
      type,
      status: 'requesting',
    });

    // Simulated opponent review response after a realistic delay
    setTimeout(() => {
      setRematchPrompt((prev) => {
        if (!prev || prev.status !== 'requesting') return prev;
        return { ...prev, status: 'approved' };
      });

      setTimeout(() => {
        setRematchPrompt((prev) => {
          if (!prev || prev.status !== 'approved') return null;
          if (type === 'rematch') {
            handleRematch();
          } else {
            setGameOverResult(null);
            initializeBoard();
            setScreen('gameplay');
          }
          return null;
        });
      }, 900);
    }, 1300);
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
     JOIN GAME FLOW (REQUIREMENT 9: SMOOTH JOIN ROOM & PLAY)
     ========================================================================== */
  const handleJoinRoomWithCode = () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;

    const bet = selectedBet;
    const totalPot = bet * 2;
    const platformRake = Math.round(totalPot * 0.1);
    const winnerPrize = totalPot - platformRake;

    const hostName =
      code === activeRoom.gameId && activeRoom.hostName
        ? activeRoom.hostName
        : `Host_${code.replace(/[^A-Z0-9]/g, '').slice(-4) || 'Player'}`;

    const joinedRoom: GameRoom = {
      gameId: code,
      hostName,
      opponentName: playerName.trim() || 'Player',
      betAmount: bet,
      totalPot,
      winnerPrize,
      platformRake,
      status: 'playing',
    };

    setOpponentName(hostName);
    startMatchWithBet(joinedRoom);
  };

  /* ==========================================================================
     PHYSICS SIMULATION STEP (RULE 1: STRONGER FRAME LOGIC & RULE 2: FAIR POCKETS)
     ========================================================================== */
  const runPhysicsStep = useCallback((dt: number) => {
    const RESTITUTION_COIN = 0.83;
    const RESTITUTION_WALL = 0.76;
    const STOP_VELOCITY = 0.045;

    const coins = coinsRef.current;
    const striker = strikerRef.current;
    const allDiscs = [striker, ...coins].filter((c) => !c.isPocketed);

    // 1. Move & apply authentic fine-powder sliding friction & deceleration (Requirement 1)
    for (const d of allDiscs) {
      if (d.isSinking) {
        d.sinkScale = Math.max(0, d.sinkScale - 0.075);
        d.vx *= 0.75;
        d.vy *= 0.75;
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
        d.spinVel *= 0.982;
      }

      // Realistic sliding friction (slightly increased deceleration as requested)
      const currentSpeed = Math.hypot(d.vx, d.vy);
      if (currentSpeed > 0) {
        const kineticDecel = 0.052 * dt;
        const airResistance = 1.0 - 0.0035 * dt;

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

      // RULE 2: FAIR REALISTIC NET HOLE POCKET DETECTION (Requirement 1)
      // Only considered pocket if the coin center genuinely drops inside the round net hole opening
      for (const pocket of POCKETS) {
        const dist = Math.hypot(d.x - pocket.x, d.y - pocket.y);
        const captureRadius = currentSpeed < 6.5 ? POCKET_HOLE_RADIUS * 0.58 : POCKET_HOLE_RADIUS * 0.46;
        if (dist < captureRadius && !d.isSinking) {
          d.isSinking = true;
          d.vx = (pocket.x - d.x) * 0.18;
          d.vy = (pocket.y - d.y) * 0.18;
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

    // Filter candidate target coins (prioritize covering queen if pending)
    let candidates: Coin[] = [];
    if (queenState === 'pending_bot') {
      candidates = active.filter((c) => c.type === 'black');
    }
    if (candidates.length === 0) {
      candidates = active.filter((c) => c.type === 'black' || c.type === 'queen');
    }
    if (candidates.length === 0) {
      candidates = active;
    }

    interface CandidateShot {
      coin: Coin;
      pocket: { x: number; y: number };
      strikerX: number;
      shotAngle: number;
      power: number;
      score: number;
    }

    const evaluatedShots: CandidateShot[] = [];

    // Evaluate all combinations of candidate coins and 4 corner pockets
    for (const coin of candidates) {
      for (const pocket of POCKETS) {
        const coinToPocketDist = Math.hypot(pocket.x - coin.x, pocket.y - coin.y);
        const coinToPocketAngle = Math.atan2(pocket.y - coin.y, pocket.x - coin.x);

        // Required ghost impact point behind coin
        const impactDist = STRIKER_RADIUS + COIN_RADIUS;
        const ghostX = coin.x - Math.cos(coinToPocketAngle) * impactDist;
        const ghostY = coin.y - Math.sin(coinToPocketAngle) * impactDist;

        // Ideal position along the top baseline
        const idealStrikerX = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, ghostX));
        const strikerToImpactDist = Math.hypot(ghostX - idealStrikerX, ghostY - BOT_BASELINE_Y);
        const shotAngle = Math.atan2(ghostY - BOT_BASELINE_Y, ghostX - idealStrikerX);

        // Calculate alignment difference between shot path and coin-to-pocket path
        let angleDiff = Math.abs(shotAngle - coinToPocketAngle);
        while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

        // Medium difficulty shot scoring:
        let score = 1000 - coinToPocketDist * 1.3 - strikerToImpactDist * 0.8;
        score -= angleDiff * 380; // Penalty for steep cuts

        if (coin.type === 'queen') score += 180;
        if (angleDiff < 0.45) score += 160;

        // Disfavor hitting backwards towards opponent baseline
        if (Math.sin(shotAngle) < 0.15) score -= 400;

        // Realistic shot power calculation tuned for medium difficulty
        const totalDistance = strikerToImpactDist + coinToPocketDist;
        const calculatedPower = Math.min(23.0, Math.max(9.5, Math.sqrt(totalDistance * 1.35)));

        evaluatedShots.push({
          coin,
          pocket,
          strikerX: idealStrikerX,
          shotAngle,
          power: calculatedPower,
          score,
        });
      }
    }

    // Sort by best shot score
    evaluatedShots.sort((a, b) => b.score - a.score);
    const best = evaluatedShots[0] || {
      coin: candidates[0],
      pocket: POCKETS[2],
      strikerX: 400,
      shotAngle: Math.PI / 2,
      power: 14,
      score: 0,
    };

    // Position striker at computed optimal baseline point
    strikerRef.current.x = best.strikerX;
    strikerRef.current.y = BOT_BASELINE_Y;
    setStrikerX(best.strikerX);

    // Medium Difficulty AI: Apply small human-like aim variance (+/- 0.026 radians)
    const mediumVariance = (Math.random() - 0.5) * 0.026;
    const finalShotAngle = best.shotAngle + mediumVariance;

    setTimeout(() => {
      botAimLineRef.current = null;
      isTurnInProgressRef.current = true;
      setIsStrikerMoving(true);

      strikerRef.current.vx = Math.cos(finalShotAngle) * best.power;
      strikerRef.current.vy = Math.sin(finalShotAngle) * best.power;

      soundEngine.playStrikerHit(best.power / MAX_STRIKE_VELOCITY);
    }, 650);
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
     MATCH CONCLUDED SOUND EFFECTS (FIRECRACKERS FOR WINNER, SOMBRE FOR LOSER)
     ========================================================================== */
  useEffect(() => {
    if (!gameOverResult) return;
    if (gameOverResult.winner === 'player') {
      soundEngine.playFirecracker();
      const firecrackerInterval = setInterval(() => {
        soundEngine.playFirecracker();
      }, 650);
      return () => clearInterval(firecrackerInterval);
    } else {
      soundEngine.playDefeat();
    }
  }, [gameOverResult]);

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
     CANVAS VECTOR RENDERING (HiDPI RETINA, 3D INSET SHADOWS, AUTHENTIC COMPASS)
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

      // HiDPI / Retina Crisp Rendering Support (Requirement 7 & 8: No blurry textures)
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const targetW = Math.round(BOARD_SIZE * dpr);
      const targetH = Math.round(BOARD_SIZE * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // -------------------------------------------------------------
      // 1. SOLID POLISHED ROSEWOOD OUTER FRAME
      // -------------------------------------------------------------
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(4, 4, BOARD_SIZE - 8, BOARD_SIZE - 8, 22);
      const woodGrad = ctx.createLinearGradient(0, 0, BOARD_SIZE, BOARD_SIZE);
      woodGrad.addColorStop(0, '#381708');
      woodGrad.addColorStop(0.3, '#522510');
      woodGrad.addColorStop(0.7, '#642E15');
      woodGrad.addColorStop(1, '#260F04');
      ctx.fillStyle = woodGrad;
      ctx.fill();

      // Outer gold trim hairline
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#B88230';
      ctx.stroke();

      // Metallic corner reinforcement inlays
      const cornerOffsets = [
        { x: 12, y: 12 },
        { x: BOARD_SIZE - 28, y: 12 },
        { x: 12, y: BOARD_SIZE - 28 },
        { x: BOARD_SIZE - 28, y: BOARD_SIZE - 28 },
      ];
      ctx.fillStyle = '#D49E35';
      for (const co of cornerOffsets) {
        ctx.beginPath();
        ctx.roundRect(co.x, co.y, 16, 16, 4);
        ctx.fill();
        ctx.strokeStyle = '#6E420C';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // -------------------------------------------------------------
      // 2. PLAYING SURFACE (Real Warm Indian Carrom Beechwood Veneer)
      // -------------------------------------------------------------
      ctx.save();
      const plyGrad = ctx.createRadialGradient(400, 400, 40, 400, 400, 490);
      plyGrad.addColorStop(0, '#E8CBA0'); // Lighter center
      plyGrad.addColorStop(0.55, '#DDB681');
      plyGrad.addColorStop(1, '#C89D62'); // Subtle warm edge
      ctx.fillStyle = plyGrad;
      ctx.fillRect(PLAY_MIN, PLAY_MIN, PLAY_MAX - PLAY_MIN, PLAY_MAX - PLAY_MIN);

      // Subtle natural wood grain lines across veneer
      ctx.strokeStyle = 'rgba(125, 75, 30, 0.04)';
      ctx.lineWidth = 1;
      for (let gy = PLAY_MIN; gy < PLAY_MAX; gy += 14) {
        ctx.beginPath();
        ctx.moveTo(PLAY_MIN, gy);
        ctx.lineTo(PLAY_MAX, gy);
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // REQUIREMENT 2: 3D INNER FRAME SHADOWS & REBOUND CUSHION BUMPERS
      // (Makes board graphics look deeply realistic and 3D)
      // -------------------------------------------------------------
      // Top Inner Rail Drop Shadow (light coming from top-left)
      const topShadow = ctx.createLinearGradient(0, PLAY_MIN, 0, PLAY_MIN + 26);
      topShadow.addColorStop(0, 'rgba(12, 5, 2, 0.72)');
      topShadow.addColorStop(0.35, 'rgba(20, 8, 3, 0.42)');
      topShadow.addColorStop(1, 'rgba(25, 12, 4, 0)');
      ctx.fillStyle = topShadow;
      ctx.fillRect(PLAY_MIN, PLAY_MIN, PLAY_MAX - PLAY_MIN, 26);

      // Left Inner Rail Drop Shadow
      const leftShadow = ctx.createLinearGradient(PLAY_MIN, 0, PLAY_MIN + 26, 0);
      leftShadow.addColorStop(0, 'rgba(12, 5, 2, 0.72)');
      leftShadow.addColorStop(0.35, 'rgba(20, 8, 3, 0.42)');
      leftShadow.addColorStop(1, 'rgba(25, 12, 4, 0)');
      ctx.fillStyle = leftShadow;
      ctx.fillRect(PLAY_MIN, PLAY_MIN, 26, PLAY_MAX - PLAY_MIN);

      // Bottom Inner Rail Ambient Occlusion Shadow
      const bottomShadow = ctx.createLinearGradient(0, PLAY_MAX, 0, PLAY_MAX - 18);
      bottomShadow.addColorStop(0, 'rgba(15, 6, 2, 0.52)');
      bottomShadow.addColorStop(1, 'rgba(20, 10, 4, 0)');
      ctx.fillStyle = bottomShadow;
      ctx.fillRect(PLAY_MIN, PLAY_MAX - 18, PLAY_MAX - PLAY_MIN, 18);

      // Right Inner Rail Ambient Occlusion Shadow
      const rightShadow = ctx.createLinearGradient(PLAY_MAX, 0, PLAY_MAX - 18, 0);
      rightShadow.addColorStop(0, 'rgba(15, 6, 2, 0.52)');
      rightShadow.addColorStop(1, 'rgba(20, 10, 4, 0)');
      ctx.fillStyle = rightShadow;
      ctx.fillRect(PLAY_MAX - 18, PLAY_MIN, 18, PLAY_MAX - PLAY_MIN);

      // Physical Rebound Rubber Cushion Strips along all 4 frame walls
      ctx.strokeStyle = '#220D04';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(PLAY_MIN, PLAY_MIN, PLAY_MAX - PLAY_MIN, PLAY_MAX - PLAY_MIN);

      // Cushion Inner Bevel Highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(PLAY_MIN + 2, PLAY_MIN + 2, PLAY_MAX - PLAY_MIN - 4, PLAY_MAX - PLAY_MIN - 4);
      ctx.restore();

      // -------------------------------------------------------------
      // 3. AUTHENTIC CIRCULAR NET HOLES WITH WOVEN NET MESH & DEPTH
      // -------------------------------------------------------------
      for (const pocket of POCKETS) {
        // Outer dark cast pocket shadow
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();

        // Outer dark leather pocket ring
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS + 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#180B05';
        ctx.fill();

        // Hole cavity (deep drop)
        const holeGrad = ctx.createRadialGradient(pocket.x - 6, pocket.y - 6, 2, pocket.x, pocket.y, POCKET_HOLE_RADIUS);
        holeGrad.addColorStop(0, '#020305');
        holeGrad.addColorStop(0.8, '#080A0E');
        holeGrad.addColorStop(1, '#1A0E08');
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = holeGrad;
        ctx.fill();

        // Woven Net Mesh Texture inside circular pocket
        ctx.save();
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS - 1, 0, Math.PI * 2);
        ctx.clip();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.2;
        for (let offset = -44; offset <= 44; offset += 8) {
          ctx.beginPath();
          ctx.moveTo(pocket.x - 44, pocket.y + offset);
          ctx.lineTo(pocket.x + 44, pocket.y + offset + 26);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pocket.x - 44, pocket.y + offset + 26);
          ctx.lineTo(pocket.x + 44, pocket.y + offset);
          ctx.stroke();
        }
        ctx.restore();

        // Polished brass ring rim
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = 'rgba(196, 142, 54, 0.55)';
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // REQUIREMENT 5: EXACT CENTER CIRCULAR COMPASS DESIGN
      // (Matching uploaded reference image Screenshot 2026-11-08 135550)
      // -------------------------------------------------------------
      ctx.save();
      const centerImg = centerDesignImgRef.current;
      if (centerImg && centerImg.complete && centerImg.naturalWidth > 0) {
        // Draw the exact uploaded reference artwork centered on the board
        ctx.save();
        ctx.beginPath();
        ctx.arc(400, 400, 114, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(centerImg, 400 - 114, 400 - 114, 228, 228);
        ctx.restore();
      }

      // Crisp Vector Compass Inlay Overlay (Ensures razor-sharp precision at any resolution)
      const compassBrown = '#361807';
      const compassLight = '#F3E2C7';
      const compassDark = '#251004';

      // Outermost concentric solid double ring (radius 108 & 104)
      ctx.strokeStyle = compassBrown;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(400, 400, 108, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(400, 400, 104, 0, Math.PI * 2);
      ctx.stroke();

      // Concentric Dashed Circle (radius 86)
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#4A230A';
      ctx.arc(400, 400, 86, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Intermediate solid circle (radius 64)
      ctx.strokeStyle = compassBrown;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(400, 400, 64, 0, Math.PI * 2);
      ctx.stroke();

      // 8-Point Faceted Compass Star (4 Cardinal points, 4 Diagonal points)
      const numPoints = 8;
      for (let p = 0; p < numPoints; p++) {
        const isCardinal = p % 2 === 0;
        const tipAngle = (p * Math.PI) / 4;
        const tipRadius = isCardinal ? 104 : 82;
        const baseWidthAngle = isCardinal ? 0.22 : 0.18;

        const tipX = 400 + Math.cos(tipAngle) * tipRadius;
        const tipY = 400 + Math.sin(tipAngle) * tipRadius;

        const leftBaseAngle = tipAngle - baseWidthAngle;
        const rightBaseAngle = tipAngle + baseWidthAngle;
        const baseRadius = 22;

        const leftBaseX = 400 + Math.cos(leftBaseAngle) * baseRadius;
        const leftBaseY = 400 + Math.sin(leftBaseAngle) * baseRadius;
        const rightBaseX = 400 + Math.cos(rightBaseAngle) * baseRadius;
        const rightBaseY = 400 + Math.sin(rightBaseAngle) * baseRadius;

        // Dark half (left facet)
        ctx.beginPath();
        ctx.moveTo(400, 400);
        ctx.lineTo(leftBaseX, leftBaseY);
        ctx.lineTo(tipX, tipY);
        ctx.closePath();
        ctx.fillStyle = compassDark;
        ctx.fill();
        ctx.strokeStyle = '#1A0C04';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Light cream half (right facet)
        ctx.beginPath();
        ctx.moveTo(400, 400);
        ctx.lineTo(rightBaseX, rightBaseY);
        ctx.lineTo(tipX, tipY);
        ctx.closePath();
        ctx.fillStyle = compassLight;
        ctx.fill();
        ctx.strokeStyle = '#1A0C04';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center spine line
        ctx.beginPath();
        ctx.moveTo(400, 400);
        ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = '#1E0D04';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Inner double ring around hub (radius 22 and 16)
      ctx.strokeStyle = compassBrown;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(400, 400, 22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(400, 400, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Central Bullseye: Solid Red Circle with Dark Rim (Center Queen Spot)
      ctx.beginPath();
      ctx.arc(400, 400, 9.5, 0, Math.PI * 2);
      ctx.fillStyle = '#C02626';
      ctx.fill();
      ctx.strokeStyle = '#260E03';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // -------------------------------------------------------------
      // REQUIREMENT 6: ACCURATE & IDENTICAL 4 BASELINES (SAME SIZE & PROPORTIONS)
      // -------------------------------------------------------------
      // Distance from center is exactly 248 on all 4 sides (symmetrical ICF specs)
      const BASELINE_OFFSET = 248;
      const TRACK_WIDTH = 28;
      const LINE_SEP = 12;
      const CIRCLE_RADIUS = 18;
      const RED_DOT_RADIUS = 5.5;

      const drawBaseline = (isVertical: boolean, axisVal: number) => {
        ctx.save();
        const minCoord = BASELINE_MIN_X;
        const maxCoord = BASELINE_MAX_X;
        const span = maxCoord - minCoord;

        // Rounded track backing
        ctx.beginPath();
        if (isVertical) {
          ctx.roundRect(axisVal - TRACK_WIDTH / 2, minCoord - 14, TRACK_WIDTH, span + 28, 14);
        } else {
          ctx.roundRect(minCoord - 14, axisVal - TRACK_WIDTH / 2, span + 28, TRACK_WIDTH, 14);
        }
        ctx.fillStyle = 'rgba(196, 142, 88, 0.28)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(92, 45, 18, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Parallel guide lines
        ctx.strokeStyle = 'rgba(75, 32, 10, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (isVertical) {
          ctx.moveTo(axisVal - LINE_SEP / 2, minCoord);
          ctx.lineTo(axisVal - LINE_SEP / 2, maxCoord);
          ctx.moveTo(axisVal + LINE_SEP / 2, minCoord);
          ctx.lineTo(axisVal + LINE_SEP / 2, maxCoord);
        } else {
          ctx.moveTo(minCoord, axisVal - LINE_SEP / 2);
          ctx.lineTo(maxCoord, axisVal - LINE_SEP / 2);
          ctx.moveTo(minCoord, axisVal + LINE_SEP / 2);
          ctx.lineTo(maxCoord, axisVal + LINE_SEP / 2);
        }
        ctx.stroke();

        // Circular endpoint bases with solid red inner dots (Identical on all 4 baselines)
        const endpoints = [minCoord, maxCoord];
        for (const ep of endpoints) {
          const cx = isVertical ? axisVal : ep;
          const cy = isVertical ? ep : axisVal;

          ctx.beginPath();
          ctx.arc(cx, cy, CIRCLE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#C89360';
          ctx.fill();
          ctx.strokeStyle = '#5E270A';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Center solid red dot
          ctx.beginPath();
          ctx.arc(cx, cy, RED_DOT_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#D92D20';
          ctx.fill();
          ctx.strokeStyle = '#381303';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      };

      // Draw all 4 identical baselines
      drawBaseline(false, 400 + BASELINE_OFFSET); // Player Bottom Baseline
      drawBaseline(false, 400 - BASELINE_OFFSET); // Opponent Top Baseline
      drawBaseline(true, 400 - BASELINE_OFFSET);  // Left Baseline
      drawBaseline(true, 400 + BASELINE_OFFSET);  // Right Baseline

      // -------------------------------------------------------------
      // FOUL POINTER ARROWS TOWARDS 4 CORNERS (EXACT LIKE REFERENCE)
      // -------------------------------------------------------------
      for (const pocket of POCKETS) {
        const ang = Math.atan2(pocket.y - 400, pocket.x - 400);
        const arrowStartDist = 120;
        const arrowEndDist = 265;

        const startX = 400 + Math.cos(ang) * arrowStartDist;
        const startY = 400 + Math.sin(ang) * arrowStartDist;
        const endX = 400 + Math.cos(ang) * arrowEndDist;
        const endY = 400 + Math.sin(ang) * arrowEndDist;

        // Diagonal pointer shaft
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(75, 32, 10, 0.7)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Circular Hook Arc with Two Arrowheads (Matching reference image)
        const hookRadius = 26;
        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(ang);

        ctx.beginPath();
        ctx.arc(0, 0, hookRadius, -Math.PI * 0.72, Math.PI * 0.72);
        ctx.strokeStyle = 'rgba(75, 32, 10, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Arrowhead 1 (top arc tip)
        const a1Ang = -Math.PI * 0.72;
        const a1X = Math.cos(a1Ang) * hookRadius;
        const a1Y = Math.sin(a1Ang) * hookRadius;
        ctx.beginPath();
        ctx.moveTo(a1X, a1Y);
        ctx.lineTo(a1X + 4, a1Y - 6);
        ctx.lineTo(a1X - 6, a1Y - 4);
        ctx.closePath();
        ctx.fillStyle = '#4D2208';
        ctx.fill();

        // Arrowhead 2 (bottom arc tip)
        const a2Ang = Math.PI * 0.72;
        const a2X = Math.cos(a2Ang) * hookRadius;
        const a2Y = Math.sin(a2Ang) * hookRadius;
        ctx.beginPath();
        ctx.moveTo(a2X, a2Y);
        ctx.lineTo(a2X + 4, a2Y + 6);
        ctx.lineTo(a2X - 6, a2Y + 4);
        ctx.closePath();
        ctx.fillStyle = '#4D2208';
        ctx.fill();

        ctx.restore();
      }

      // -------------------------------------------------------------
      // REQUIREMENT 7 & 8: ULTRA-REALISTIC 3D COINS & TOURNAMENT PUCKS
      // -------------------------------------------------------------
      const activeCoins = coinsRef.current.filter((c) => !c.isPocketed);
      for (const coin of activeCoins) {
        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.scale(coin.sinkScale, coin.sinkScale);

        const speed = Math.hypot(coin.vx, coin.vy);

        // Dynamic 3D Layered Shadows
        // 1. Ambient Occlusion Contact Shadow directly beneath
        ctx.beginPath();
        ctx.ellipse(0.8, 1.8, coin.radius * 1.04, coin.radius * 0.98, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(8, 3, 1, 0.48)';
        ctx.fill();

        // 2. Cast Directional Shadow (simulating overhead arena lighting)
        const shadowX = 3.8 + Math.min(3.5, speed * 0.14);
        const shadowY = 5.2 + Math.min(4.5, speed * 0.18);
        ctx.beginPath();
        ctx.ellipse(shadowX, shadowY, coin.radius * 0.98, coin.radius * 0.92, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();

        // Dynamic motion streak when sliding fast
        if (speed > 2.2) {
          const trailLen = Math.min(36, speed * 2.4);
          const moveAngle = Math.atan2(coin.vy, coin.vx);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-Math.cos(moveAngle) * trailLen, -Math.sin(moveAngle) * trailLen);
          ctx.lineWidth = coin.radius * 1.4;
          ctx.lineCap = 'round';
          ctx.strokeStyle =
            coin.type === 'queen'
              ? 'rgba(239, 68, 68, 0.25)'
              : coin.type === 'white'
              ? 'rgba(255, 255, 255, 0.24)'
              : 'rgba(30, 41, 59, 0.32)';
          ctx.stroke();
        }

        // Disc rotation animation
        if (coin.rotation) {
          ctx.rotate(coin.rotation);
        }

        // 3D Beveled Coin Body (Realistic Boxwood & Ebonite)
        const cGrad = ctx.createRadialGradient(-coin.radius * 0.35, -coin.radius * 0.35, 2, 0, 0, coin.radius);

        if (coin.type === 'queen') {
          cGrad.addColorStop(0, '#FF4D4D');
          cGrad.addColorStop(0.35, '#DC2626');
          cGrad.addColorStop(0.75, '#991B1B');
          cGrad.addColorStop(1, '#500707');
        } else if (coin.type === 'white') {
          cGrad.addColorStop(0, '#FFFFFF');
          cGrad.addColorStop(0.32, '#F8F4EC');
          cGrad.addColorStop(0.72, '#DFD3C0');
          cGrad.addColorStop(0.92, '#C2B198');
          cGrad.addColorStop(1, '#8A775E');
        } else {
          cGrad.addColorStop(0, '#475569');
          cGrad.addColorStop(0.32, '#1E293B');
          cGrad.addColorStop(0.75, '#0F172A');
          cGrad.addColorStop(1, '#020617');
        }

        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fillStyle = cGrad;
        ctx.fill();

        // Outer chamfered rim highlight
        ctx.lineWidth = 1.4;
        ctx.strokeStyle =
          coin.type === 'queen'
            ? 'rgba(254, 202, 202, 0.65)'
            : coin.type === 'white'
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(148, 163, 184, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius - 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // Inner lathe-turned dished depression (Authentic Carrommen bowl)
        const bowlGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coin.radius * 0.72);
        if (coin.type === 'queen') {
          bowlGrad.addColorStop(0, '#991B1B');
          bowlGrad.addColorStop(0.7, '#7F1D1D');
          bowlGrad.addColorStop(1, '#B91C1C');
        } else if (coin.type === 'white') {
          bowlGrad.addColorStop(0, '#EDE4D6');
          bowlGrad.addColorStop(0.7, '#C8B9A2');
          bowlGrad.addColorStop(1, '#DDD3C1');
        } else {
          bowlGrad.addColorStop(0, '#1E293B');
          bowlGrad.addColorStop(0.7, '#0F172A');
          bowlGrad.addColorStop(1, '#1E293B');
        }

        ctx.beginPath();
        ctx.arc(0, 0, coin.radius * 0.72, 0, Math.PI * 2);
        ctx.fillStyle = bowlGrad;
        ctx.fill();

        // Concentric engraved lathe rings
        ctx.lineWidth = 1.1;
        ctx.strokeStyle =
          coin.type === 'queen'
            ? '#FBBF24'
            : coin.type === 'white'
            ? 'rgba(110, 78, 48, 0.4)'
            : 'rgba(255, 255, 255, 0.22)';

        ctx.beginPath();
        ctx.arc(0, 0, coin.radius * 0.48, 0, Math.PI * 2);
        ctx.stroke();

        // Center emblem / starburst
        if (coin.type === 'queen') {
          // Embossed golden 8-point royal star inlay
          ctx.fillStyle = '#F59E0B';
          for (let petal = 0; petal < 8; petal++) {
            const petalAng = (petal * Math.PI) / 4;
            ctx.beginPath();
            ctx.arc(Math.cos(petalAng) * 4.5, Math.sin(petalAng) * 4.5, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = '#FEF08A';
          ctx.fill();
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        } else {
          // Subtle woodgrain lathe rings
          ctx.beginPath();
          ctx.arc(0, 0, coin.radius * 0.28, 0, Math.PI * 2);
          ctx.strokeStyle = coin.type === 'white' ? 'rgba(110, 78, 48, 0.3)' : 'rgba(255, 255, 255, 0.16)';
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
          ctx.fillStyle = coin.type === 'white' ? '#8C7760' : '#475569';
          ctx.fill();
        }

        // Top-left glossy specular shine
        ctx.beginPath();
        ctx.arc(-coin.radius * 0.38, -coin.radius * 0.38, coin.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore();
      }

      // -------------------------------------------------------------
      // REQUIREMENT 7 & 8: TOURNAMENT HEAVY IVORY / RESIN STRIKER
      // -------------------------------------------------------------
      const striker = strikerRef.current;
      if (!striker.isPocketed) {
        ctx.save();
        ctx.translate(striker.x, striker.y);
        ctx.scale(striker.sinkScale, striker.sinkScale);

        const strikerSpeed = Math.hypot(striker.vx, striker.vy);

        // Striker 3D Multi-Layer Shadows
        // 1. Ambient Occlusion Contact Shadow
        ctx.beginPath();
        ctx.ellipse(1, 2.2, striker.radius * 1.05, striker.radius * 0.98, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fill();

        // 2. Cast Directional Shadow
        const sShadowX = 4.8 + Math.min(4, strikerSpeed * 0.18);
        const sShadowY = 6.6 + Math.min(5, strikerSpeed * 0.22);
        ctx.beginPath();
        ctx.ellipse(sShadowX, sShadowY, striker.radius * 1.0, striker.radius * 0.94, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.fill();

        // Dynamic High-Speed Motion Trail
        if (strikerSpeed > 2.8) {
          const sTrailLen = Math.min(52, strikerSpeed * 2.8);
          const sMoveAngle = Math.atan2(striker.vy, striker.vx);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-Math.cos(sMoveAngle) * sTrailLen, -Math.sin(sMoveAngle) * sTrailLen);
          ctx.lineWidth = striker.radius * 1.6;
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.32)';
          ctx.stroke();
        }

        // Heavy Tournament Ivory Body with Polished Luster
        const sGrad = ctx.createRadialGradient(-striker.radius * 0.35, -striker.radius * 0.35, 3, 0, 0, striker.radius);
        sGrad.addColorStop(0, '#FFFFFF');
        sGrad.addColorStop(0.35, '#FBF8F2');
        sGrad.addColorStop(0.7, '#E8DFCE');
        sGrad.addColorStop(0.92, '#C7B89E');
        sGrad.addColorStop(1, '#8C7A62');

        ctx.beginPath();
        ctx.arc(0, 0, striker.radius, 0, Math.PI * 2);
        ctx.fillStyle = sGrad;
        ctx.fill();

        // Outer Metallic Gold Rim with 3D Bevel
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#D99B26';
        ctx.stroke();

        ctx.lineWidth = 1.1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, striker.radius - 1.2, 0, Math.PI * 2);
        ctx.stroke();

        // Concentric Engraved Gold Grooves
        ctx.beginPath();
        ctx.arc(0, 0, striker.radius * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(217, 155, 38, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, striker.radius * 0.58, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(217, 155, 38, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Inner Brass / Amber Gem Medallion
        const innerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, striker.radius * 0.48);
        innerGrad.addColorStop(0, '#FEF3C7');
        innerGrad.addColorStop(0.45, '#F59E0B');
        innerGrad.addColorStop(0.85, '#B45309');
        innerGrad.addColorStop(1, '#78350F');

        ctx.beginPath();
        ctx.arc(0, 0, striker.radius * 0.48, 0, Math.PI * 2);
        ctx.fillStyle = innerGrad;
        ctx.fill();
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 8-Facet Radial Golden Rays in center
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
        ctx.lineWidth = 1.1;
        for (let ray = 0; ray < 8; ray++) {
          const rayAng = (ray * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(rayAng) * 3, Math.sin(rayAng) * 3);
          ctx.lineTo(Math.cos(rayAng) * (striker.radius * 0.42), Math.sin(rayAng) * (striker.radius * 0.42));
          ctx.stroke();
        }

        // Center Polished Ruby Jewel Core
        ctx.beginPath();
        ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = '#EF4444';
        ctx.fill();
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Specular Glint
        ctx.beginPath();
        ctx.arc(-striker.radius * 0.38, -striker.radius * 0.38, striker.radius * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fill();

        ctx.restore();
      }

      // -------------------------------------------------------------
      // REQUIREMENT 1: DYNAMIC DRAG GAUGE & SHORTER WHITE DOTTED LINE
      // -------------------------------------------------------------
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

        const arrowLength = 34 + dragForce.power * 68;
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

        // Shorter White Dotted Line (Requirement 1: exactly shortened for clean aim)
        const trajectoryLen = 45 + dragForce.power * 55;
        ctx.beginPath();
        ctx.setLineDash([4, 5]);
        ctx.moveTo(arrowEndX, arrowEndY);
        ctx.lineTo(
          arrowEndX + dragForce.dirX * trajectoryLen,
          arrowEndY + dragForce.dirY * trajectoryLen
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.setLineDash([]);

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

      ctx.restore(); // Restore HiDPI scale
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
  const handleStartDepositPayment = (amount: number) => {
    setDepositPaymentAmount(amount);
    setActiveModal(null);
  };

  const handleCustomWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErrorMsg(null);
    setWithdrawSuccessMsg(null);

    const amt = parseFloat(customWithdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }

    const minWithdrawal = adminConfig.minWithdrawal ?? 500;
    if (amt < minWithdrawal) {
      setWithdrawErrorMsg(`Minimum withdrawal amount is ₹${minWithdrawal}.`);
      return;
    }

    if (amt > wallet.realBalance) {
      setWithdrawErrorMsg(`Cannot withdraw more than your withdrawable balance (₹${wallet.realBalance}).`);
      return;
    }

    const upi = playerWithdrawUpi.trim();
    if (!upi || !upi.includes('@')) {
      setWithdrawErrorMsg('Please enter a valid player UPI ID (e.g. yourname@okaxis).');
      return;
    }

    const res = submitWithdrawalRequest({
      playerName: playerName.trim() || 'Player',
      amount: amt,
      playerUpi: upi,
    });

    if (res.success) {
      soundEngine.playCoinClack(1);
      setWithdrawSuccessMsg(`Withdrawal of ₹${amt} requested! Sent to Admin for manual payout to ${upi}.`);
      setCustomWithdrawAmount('');
      setRecentWithdrawals(getWithdrawalRequests().filter((r) => r.playerName === playerName));
    } else {
      setWithdrawErrorMsg(res.error || 'Failed to submit withdrawal request.');
    }
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
        <div className="flex flex-col items-start gap-1 relative">
          <div className="w-12 h-12 rounded-lg bg-[#2768A3] border-2 border-[#5497D7] flex items-center justify-center shadow-md overflow-hidden relative">
            <User className="w-8 h-8 text-neutral-200 fill-neutral-200" />
            {/* Rule 8: Red Queen Indicator on Scoreboard for Opponent */}
            {queenState === 'pending_bot' && (
              <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-red-600 border border-white animate-ping" />
            )}
            {queenState === 'covered_bot' && (
              <div className="absolute bottom-0.5 right-0.5 bg-red-950/90 border border-amber-400 text-amber-300 rounded-full p-0.5 shadow-sm">
                <ScoreboardCarromCoin type="queen" size={12} />
              </div>
            )}
          </div>
          {/* Real Opponent Name below profile */}
          <span className="text-[11px] font-bold text-neutral-200 tracking-tight leading-none pl-0.5">
            {opponentName}
          </span>
          {/* Black Coin Counter: Styled to match authentic board coin (Requirement 6) */}
          <div className="flex items-center gap-1.5 pl-0.5 mt-0.5">
            <span className="font-display font-black text-base text-white tabular-nums">
              {botBlackPocketed}
            </span>
            <ScoreboardCarromCoin type="black" size={20} />
            {queenState === 'covered_bot' && (
              <ScoreboardCarromCoin type="queen" size={16} />
            )}
          </div>

          {/* Opponent Quick Reaction Bubble on Sender's Side (Requirement 5) */}
          {chatMessage && chatMessage.sender === 'bot' && (
            <div className="absolute top-14 left-0 bg-neutral-900/95 border-2 border-amber-400 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center gap-1.5 z-40 animate-bounce whitespace-nowrap">
              <span className="text-xs font-bold text-amber-300">{chatMessage.text}</span>
            </div>
          )}
        </div>

        {/* Center: Gold Coins Stack & Total Pot Display & Dedicated Queen Coin Status */}
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

          {/* Queen Status on Scoreboard (Requirement 3 & 6: Authentic 3D Queen Coin) */}
          <div className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-800 rounded-full px-2.5 py-0.5 mt-1 shadow-inner">
            <ScoreboardCarromCoin type="queen" size={16} />
            <span className="text-[10px] font-bold tracking-tight text-amber-300">
              {queenState === 'covered_player'
                ? 'Secured: You'
                : queenState === 'covered_bot'
                ? `Secured: ${opponentName}`
                : queenState === 'pending_player'
                ? 'Cover Pending (You)'
                : queenState === 'pending_bot'
                ? 'Cover Pending (Opponent)'
                : 'Queen In Play'}
            </span>
          </div>
        </div>

        {/* Right: Player Avatar Card with Player Name & Queen Indicator */}
        <div className="flex flex-col items-end gap-1 relative">
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
              <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-red-600 border border-white animate-ping" />
            )}
            {queenState === 'covered_player' && (
              <div className="absolute bottom-0.5 right-0.5 bg-red-950/90 border border-amber-400 text-amber-300 rounded-full p-0.5 shadow-sm">
                <ScoreboardCarromCoin type="queen" size={12} />
              </div>
            )}
          </div>
          {/* Real Player Name below profile */}
          <span className="text-[11px] font-bold text-emerald-300 tracking-tight leading-none pr-0.5">
            {playerName}
          </span>
          {/* White Coin Counter: Styled to match authentic board coin (Requirement 6) */}
          <div className="flex items-center gap-1.5 pr-0.5 mt-0.5">
            {queenState === 'covered_player' && (
              <ScoreboardCarromCoin type="queen" size={16} />
            )}
            <ScoreboardCarromCoin type="white" size={20} />
            <span className="font-display font-black text-base text-white tabular-nums">
              {playerWhitePocketed}
            </span>
          </div>

          {/* Player Quick Reaction Bubble on Sender's Side Near Score Board (Requirement 5) */}
          {chatMessage && chatMessage.sender === 'player' && (
            <div className="absolute top-14 right-0 bg-neutral-900/95 border-2 border-emerald-400 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center gap-1.5 z-40 animate-bounce whitespace-nowrap">
              <span className="text-xs font-bold text-emerald-300">{chatMessage.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* --- QUEEN STATUS NOTIFIER BANNER (RULE 8 - NO EMOJIS) --- */}
      {queenState === 'pending_player' && (
        <div className="relative z-10 w-full max-w-[420px] mx-auto px-4 -mt-1 mb-1">
          <div className="bg-red-500/20 border border-red-500/60 rounded-xl px-3 py-1.5 text-center shadow-sm flex items-center justify-center gap-2 animate-pulse">
            <ScoreboardCarromCoin type="queen" size={16} />
            <span className="text-xs font-bold text-red-200">
              Queen Pocketed! Pocket a White coin on this shot to cover and secure the Queen!
            </span>
          </div>
        </div>
      )}

      {queenState === 'pending_bot' && (
        <div className="relative z-10 w-full max-w-[420px] mx-auto px-4 -mt-1 mb-1">
          <div className="bg-red-500/20 border border-red-500/60 rounded-xl px-3 py-1.5 text-center shadow-sm flex items-center justify-center gap-2">
            <ScoreboardCarromCoin type="queen" size={16} />
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

          {/* DIRECT ON-SCREEN COUNTDOWN OVERLAY (SHOWN ON SCREEN AFTER 5s IDLE) */}
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

      {/* --- BOTTOM CONTROLS & ACTION BUTTONS (REQUIREMENT 4, 7 & 10: CLEAN PREMIUM CONTROLS) --- */}
      <div className="relative z-10 w-full max-w-[460px] mx-auto px-5 pb-5 pt-1 flex items-center justify-between">
        {/* Bottom Left: Chat Bubble Button */}
        <button
          onClick={() => setActiveModal('chat')}
          className="w-14 h-14 rounded-full bg-gradient-to-b from-[#F5C242] to-[#D9961A] border-2 border-[#FFF0A0] shadow-[0_4px_14px_rgba(217,150,26,0.6)] flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Open Chat Emojis"
        >
          <MessageCircle className="w-6 h-6 text-neutral-900 fill-neutral-900" />
        </button>

        {/* Bottom Right: Menu Button */}
        <button
          onClick={() => setActiveModal('menu')}
          className="w-14 h-14 rounded-full bg-gradient-to-b from-[#F5C242] to-[#D9961A] border-2 border-[#FFF0A0] shadow-[0_4px_14px_rgba(217,150,26,0.6)] flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Open Menu"
        >
          <MenuIcon className="w-6 h-6 text-neutral-900 stroke-[2.5]" />
        </button>
      </div>

      {/* ==========================================================================
          MODALS & FLYOUTS
          ========================================================================== */}

      {/* --- CREATE GAME MODAL (WITH 6 BETTING OPTIONS: 50, 100, 200, 500, 1000, 2000) --- */}
      {screen === 'create_game' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl relative">
            {/* Player Name Input */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-neutral-300">Your In-Game Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-white font-semibold focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* 6 BETTING OPTIONS (50, 100, 200, 500, 1000, 2000) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-200">Select Betting Amount</span>
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
                      className={`relative cursor-pointer rounded-2xl py-3 px-2 border transition-all duration-200 flex flex-col justify-center items-center text-center group ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500/25 via-neutral-900 to-amber-950/45 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-[1.02]'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                      }`}
                    >
                      <span className="font-display font-black text-xl text-white tabular-nums tracking-tight">
                        ₹{amt}
                      </span>

                      <span className="text-[11px] text-emerald-400 font-bold mt-1">
                        Win ₹{win}
                      </span>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center text-[9px] font-black shadow-sm">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons with Direct Win Amount */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setScreen('join_game')}
                className="flex-1 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-neutral-700 active:scale-95"
              >
                <LogIn className="w-4 h-4 text-neutral-300" />
                Join Existing Room
              </button>
              <button
                onClick={handleCreateRoom}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Generate Room · Win ₹{(selectedBet * 2) - Math.round(selectedBet * 2 * 0.1)}</span>
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
                onClick={() => {
                  setOpponentName('Computer');
                  startMatchWithBet({ ...activeRoom, opponentName: 'Computer' });
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Play With Computer
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
                onClick={() => setActiveModal('confirm_leave')}
                className="w-full py-2.5 px-3 bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 rounded-xl text-xs font-semibold text-red-300 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-red-400" />
                  Leave Game
                </span>
                <span className="text-red-400/80 text-[10px]">Exit to Lobby</span>
              </button>

              <button
                onClick={() => initiateRestartOrRematch('restart')}
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
                <p className="text-xs text-neutral-400">Select amount to view Admin UPI QR & Payment Details</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-neutral-300">Select Deposit Amount</span>
                <span className="text-[10px] text-amber-400 font-medium">Min: ₹{adminConfig.minDeposit ?? 200}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from(new Set([
                  adminConfig.minDeposit ?? 200,
                  Math.max(500, (adminConfig.minDeposit ?? 200) * 2),
                  Math.max(1000, (adminConfig.minDeposit ?? 200) * 5),
                  Math.max(2000, (adminConfig.minDeposit ?? 200) * 10),
                ])).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleStartDepositPayment(amt)}
                    className="p-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-amber-400/60 rounded-xl text-center transition-all group active:scale-95"
                  >
                    <span className="block font-bold text-sm text-white group-hover:text-amber-400">₹{amt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Deposit Amount Option */}
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <span className="text-xs font-semibold text-neutral-300">Or Type Custom Amount</span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min={adminConfig.minDeposit ?? 200}
                    step="50"
                    value={customDepositInput}
                    onChange={(e) => setCustomDepositInput(e.target.value)}
                    placeholder={`Enter amount (min ₹${adminConfig.minDeposit ?? 200})`}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const amt = parseFloat(customDepositInput);
                    const minDep = adminConfig.minDeposit ?? 200;
                    if (amt >= minDep) handleStartDepositPayment(amt);
                  }}
                  disabled={!customDepositInput || parseFloat(customDepositInput) < (adminConfig.minDeposit ?? 200)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-xs rounded-xl transition-colors"
                >
                  Proceed
                </button>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-400 space-y-1">
              <span className="block font-semibold text-neutral-300 text-[11px]">Instant UPI Gateways</span>
              <p className="text-[10px]">Google Pay · PhonePe · Paytm · NetBanking · Cred · BHIM</p>
            </div>
          </div>
        </div>
      )}

      {/* --- WITHDRAW MODAL (CUSTOM AMOUNT BETWEEN WITHDRAWABLE BALANCE & PLAYER UPI ID) --- */}
      {activeModal === 'withdraw' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Withdraw Funds</h3>
                <p className="text-xs text-neutral-400">Direct Manual UPI Transfer to Your Account</p>
              </div>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setWithdrawErrorMsg(null);
                  setWithdrawSuccessMsg(null);
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Withdrawable Balance</span>
                <span className="font-bold text-emerald-400 text-base tabular-nums">₹{wallet.realBalance}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-neutral-400 pt-0.5 border-t border-neutral-800/60">
                <span>Min Withdrawal: <strong className="text-amber-400 font-semibold">₹{adminConfig.minWithdrawal ?? 500}</strong></span>
                <span>Max: ₹{wallet.realBalance}</span>
              </div>
            </div>

            {withdrawSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{withdrawSuccessMsg}</span>
              </div>
            )}

            {withdrawErrorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{withdrawErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCustomWithdrawalSubmit} className="space-y-3.5">
              {/* Custom Amount between withdrawable balance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    Withdrawal Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    Min: ₹{adminConfig.minWithdrawal ?? 500}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min={adminConfig.minWithdrawal ?? 500}
                    max={wallet.realBalance}
                    step="1"
                    value={customWithdrawAmount}
                    onChange={(e) => setCustomWithdrawAmount(e.target.value)}
                    placeholder={`Type amount between ${adminConfig.minWithdrawal ?? 500} and ${wallet.realBalance}`}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Quick Chips */}
                {wallet.realBalance >= (adminConfig.minWithdrawal ?? 500) && (
                  <div className="flex gap-1.5 mt-2">
                    {Array.from(new Set([
                      adminConfig.minWithdrawal ?? 500,
                      (adminConfig.minWithdrawal ?? 500) * 2,
                      Math.floor(wallet.realBalance * 0.5),
                      wallet.realBalance,
                    ]))
                      .filter((val) => val >= (adminConfig.minWithdrawal ?? 500) && val <= wallet.realBalance)
                      .map((chipVal, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCustomWithdrawAmount(chipVal.toString())}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-[11px] font-semibold text-neutral-300 transition-colors"
                        >
                          {chipVal === wallet.realBalance ? 'Max' : `₹${chipVal}`}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Player UPI ID input below the amount */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Your UPI ID for Payout <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={playerWithdrawUpi}
                  onChange={(e) => setPlayerWithdrawUpi(e.target.value)}
                  placeholder="e.g. yourname@okaxis, 9876543210@paytm"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  required
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Your UPI ID will be displayed in the Admin Panel for manual payout.
                </p>
              </div>

              <button
                type="submit"
                disabled={wallet.realBalance < (adminConfig.minWithdrawal ?? 500)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
              >
                Request Withdrawal via UPI
              </button>
            </form>

            {/* Recent Withdrawals List */}
            {recentWithdrawals.length > 0 && (
              <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Your Withdrawal Requests (Live Synced)
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {recentWithdrawals.slice(0, 5).map((w) => (
                    <div
                      key={w.id}
                      className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">₹{w.amount}</span>
                          <span className="font-mono text-[10px] text-neutral-400">({w.playerUpi})</span>
                        </div>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          w.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : w.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {w.status === 'completed' ? 'Paid' : w.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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

      {/* --- CONFIRM LEAVE GAME MODAL (REQUIREMENT 4: RECONFIRM DECISION) --- */}
      {activeModal === 'confirm_leave' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl relative text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shadow-lg">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-xl text-white">Leave Match?</h3>
              <p className="text-xs text-neutral-300">
                Are you sure you want to abandon this match? Any wager placed for this room will be forfeited.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setGameOverResult(null);
                  setScreen('create_game');
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors shadow-lg shadow-red-600/20 active:scale-95"
              >
                Yes, Leave Game
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition-colors active:scale-95"
              >
                Cancel & Keep Playing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REQUIREMENT 5: WINNER & LOSER DECLARATION (NO EMOJIS, FIRECRACKERS ON WIN, LOSING ANIMATION ON DEFEAT) --- */}
      {gameOverResult && (
        <>
          {gameOverResult.winner === 'player' ? (
            <FirecrackerCelebration />
          ) : (
            <DefeatAnimation />
          )}

          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div
              className={`max-w-sm w-full bg-neutral-900 border rounded-3xl p-6 text-center space-y-4 shadow-2xl relative ${
                gameOverResult.winner === 'player'
                  ? 'border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.25)]'
                  : 'border-rose-900/80 shadow-[0_0_50px_rgba(225,29,72,0.15)]'
              }`}
            >
              {/* Header Icon Badge (No Emojis Strictly) */}
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center border-2 shadow-xl ${
                  gameOverResult.winner === 'player'
                    ? 'bg-gradient-to-tr from-amber-600/30 via-yellow-400/20 to-amber-950/60 border-amber-400 text-amber-300'
                    : 'bg-gradient-to-tr from-rose-950/60 via-red-900/30 to-black/80 border-rose-500/60 text-rose-400'
                }`}
              >
                {gameOverResult.winner === 'player' ? (
                  <Award className="w-8 h-8 stroke-[2.2]" />
                ) : (
                  <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
                )}
              </div>

              <div className="space-y-1">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border inline-block ${
                    gameOverResult.winner === 'player'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {gameOverResult.winner === 'player' ? 'Match Champion' : 'Match Concluded'}
                </span>

                <h2 className="text-2xl font-display font-black text-white tracking-tight">
                  {gameOverResult.winner === 'player' ? 'Victory Declared!' : 'Better Luck Next Time'}
                </h2>

                <p className="text-xs text-neutral-300">
                  {gameOverResult.winner === 'player'
                    ? `${gameOverResult.winnerName} pocketed all 9 White coins first!`
                    : `${gameOverResult.winnerName} pocketed all 9 Black coins first.`}
                </p>
              </div>

              {/* Match Score & Rake Breakdown */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs text-left space-y-2">
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Room ID</span>
                  <span className="font-mono text-white font-bold">{activeRoom.gameId}</span>
                </div>

                <div className="flex justify-between items-center text-neutral-400">
                  <span>Match Total Pot</span>
                  <span className="text-white font-bold">₹{activeRoom.totalPot}</span>
                </div>

                <div className="flex justify-between items-center text-neutral-500 text-[11px]">
                  <span>10% Platform Rake</span>
                  <span>-₹{activeRoom.platformRake}</span>
                </div>

                <div className="border-t border-neutral-800 pt-2 flex justify-between items-center font-bold text-sm">
                  <span className={gameOverResult.winner === 'player' ? 'text-emerald-400' : 'text-neutral-400'}>
                    {gameOverResult.winner === 'player' ? 'Net Payout Credited' : 'Match Stake'}
                  </span>
                  <span className={gameOverResult.winner === 'player' ? 'text-emerald-400 text-base' : 'text-rose-400'}>
                    {gameOverResult.winner === 'player' ? `+₹${activeRoom.winnerPrize}` : `-₹${activeRoom.betAmount}`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setGameOverResult(null);
                    setScreen('create_game');
                  }}
                  className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-colors"
                >
                  Change Bet / Lobby
                </button>
                <button
                  onClick={() => initiateRestartOrRematch('rematch')}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  Rematch (₹{activeRoom.betAmount})
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- REQUIREMENT 2 & 9: REMATCH / RESTART OPPONENT APPROVE / REJECT MODAL --- */}
      {rematchPrompt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative">
            {rematchPrompt.status === 'requesting' && (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                  <RotateCcw className="w-7 h-7 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-black text-xl text-white">
                    {rematchPrompt.type === 'rematch' ? 'Rematch Requested' : 'Restart Requested'}
                  </h3>
                  <p className="text-xs text-neutral-300">
                    Waiting for <span className="font-bold text-amber-400">{opponentName || 'Computer'}</span> to review and decide your {rematchPrompt.type === 'rematch' ? 'rematch' : 'restart'} request...
                  </p>
                </div>

                {/* Opponent Decision Banner (Exclusive to Opponent/Computer - Player cannot choose) */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-center gap-2 text-amber-400">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {opponentName || 'Computer'} is deciding...
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block">
                    Opponent holds exclusive approval authority for match restarts and rematches.
                  </span>
                </div>
              </>
            )}

            {rematchPrompt.status === 'approved' && (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-2xl font-black">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-black text-xl text-emerald-400">Request Approved!</h3>
                  <p className="text-xs text-neutral-300">
                    <span className="font-bold text-white">{opponentName || 'Computer'}</span> approved the {rematchPrompt.type === 'rematch' ? 'rematch' : 'restart'}.
                  </p>
                  <p className="text-[11px] text-amber-400 font-semibold animate-pulse pt-1">
                    Starting fresh match with same player and bet...
                  </p>
                </div>
              </>
            )}

            {rematchPrompt.status === 'declined' && (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 text-2xl font-black">
                  ✕
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-black text-xl text-red-400">Request Declined</h3>
                  <p className="text-xs text-neutral-300">
                    <span className="font-bold text-white">{opponentName || 'Computer'}</span> declined the {rematchPrompt.type === 'rematch' ? 'rematch' : 'restart'} request.
                  </p>
                  <p className="text-[11px] text-neutral-400 pt-1">
                    Returning to betting amount selection...
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- DEPOSIT PAYMENT PAGE (WHEN AMOUNT IS CLICKED) --- */}
      {depositPaymentAmount !== null && (
        <DepositPaymentPage
          amount={depositPaymentAmount}
          playerName={playerName}
          onBack={() => setDepositPaymentAmount(null)}
          onSuccessReturn={() => setDepositPaymentAmount(null)}
        />
      )}

      {/* --- ADMIN PANEL MODAL (ACCESSIBLE VIA URL OR SHORTCUT) --- */}
      {isAdminOpen && (
        <AdminPanel
          onClose={() => {
            setIsAdminOpen(false);
            if (window.location.hash.toLowerCase().includes('admin')) {
              history.pushState(null, '', window.location.pathname);
            }
          }}
        />
      )}
    </div>
  );
}
