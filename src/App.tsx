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
  QrCode
} from 'lucide-react';

import { subscribeToQuotaState, isQuotaExceeded, ensureFirebaseAuth } from './firebase';
import { AdminPanel } from './components/AdminPanel';
import { DepositPaymentPage } from './components/DepositPaymentPage';
import {
  checkIsAdminUrl,
  subscribeToSync,
  subscribeToUserWallet,
  submitWithdrawalRequest,
  getWithdrawalRequests,
  getAdminDepositConfig,
  WithdrawalRequest,
  DepositRequest,
  getPlayerWallet,
  savePlayerWallet,
  PlayerWalletData,
  PlayerTransaction,
  createMultiplayerRoom,
  joinMultiplayerRoom,
  cancelMultiplayerRoom,
  requestMultiplayerRematch,
  respondMultiplayerRematch,
  subscribeToRoom,
  updateRoomGameState,
  broadcastLiveStreamState,
  ServerGameRoom,
  AuthoritativeGameState,
  AuthoritativeCoin,
  AuthoritativeStriker,
  AuthoritativeShot,
  createInitialAuthoritativeGameState
} from './services/adminSync';

/* ==========================================================================
   WEB AUDIO API PROCEDURAL SOUND ENGINE
   ========================================================================== */
class CarromAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private cachedNoiseBuffer: AudioBuffer | null = null;
  private lastFirecrackerTime = 0;

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

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Rate-limit firecracker sound bursts to prevent web audio overload/lag
    if (now - this.lastFirecrackerTime < 0.38) return;
    this.lastFirecrackerTime = now;

    // Pre-allocated cached noise buffer
    if (!this.cachedNoiseBuffer) {
      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      this.cachedNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = this.cachedNoiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.035));
      }
    }

    // Low-frequency concussive chest thump
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(135, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.14);
    subGain.gain.setValueAtTime(0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.15);

    // Detonation noise blast
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.value = 1.4;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + 0.12);

    // Trailing micro-pops
    for (let c = 0; c < 3; c++) {
      const popTime = now + 0.04 + Math.random() * 0.12;
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(1600 + Math.random() * 1000, popTime);
      popGain.gain.setValueAtTime(0.15, popTime);
      popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.02);

      popOsc.connect(popGain);
      popGain.connect(ctx.destination);
      popOsc.start(popTime);
      popOsc.stop(popTime + 0.02);
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
// Maximum realistic speed (tuned for realistic carrom sliding)
const MAX_STRIKE_VELOCITY = 21.5;

// 6 Betting Options: 50, 100, 200, 500, 1000, 2000
const BETTING_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

type CoinType = 'white' | 'black' | 'queen';
type QueenState = 'on_board' | 'pending_player' | 'pending_bot' | 'covered_player' | 'covered_bot';

function toAuthoritativeQueenState(
  q: QueenState,
  isLocalHost: boolean
): 'on_board' | 'pending_host' | 'pending_guest' | 'covered_host' | 'covered_guest' {
  if (q === 'on_board') return 'on_board';
  if (q === 'pending_player') return isLocalHost ? 'pending_host' : 'pending_guest';
  if (q === 'pending_bot') return isLocalHost ? 'pending_guest' : 'pending_host';
  if (q === 'covered_player') return isLocalHost ? 'covered_host' : 'covered_guest';
  if (q === 'covered_bot') return isLocalHost ? 'covered_guest' : 'covered_host';
  return 'on_board';
}

function fromAuthoritativeQueenState(
  q: 'on_board' | 'pending_host' | 'pending_guest' | 'covered_host' | 'covered_guest',
  isLocalHost: boolean
): QueenState {
  if (q === 'on_board') return 'on_board';
  if (q === 'pending_host') return isLocalHost ? 'pending_player' : 'pending_bot';
  if (q === 'pending_guest') return isLocalHost ? 'pending_bot' : 'pending_player';
  if (q === 'covered_host') return isLocalHost ? 'covered_player' : 'covered_bot';
  if (q === 'covered_guest') return isLocalHost ? 'covered_bot' : 'covered_player';
  return 'on_board';
}

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

type WalletState = PlayerWalletData;

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
   OFFSCREEN 120 FPS STATIC CARROM BOARD PRE-RENDERER
   Pre-renders all heavy wood veneers, 3D shadows, pockets, and compass
   so the 120fps render loop completes in <0.2ms per frame.
   ========================================================================== */
function drawStaticCarromBoard(ctx: CanvasRenderingContext2D, centerImg: HTMLImageElement | null) {
  // 1. SOLID POLISHED ROSEWOOD OUTER FRAME
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

  // 2. PLAYING SURFACE (Real Warm Indian Carrom Beechwood Veneer)
  ctx.save();
  const plyGrad = ctx.createRadialGradient(400, 400, 40, 400, 400, 490);
  plyGrad.addColorStop(0, '#E8CBA0');
  plyGrad.addColorStop(0.55, '#DDB681');
  plyGrad.addColorStop(1, '#C89D62');
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

  // 3D INNER FRAME SHADOWS & REBOUND CUSHION BUMPERS
  const topShadow = ctx.createLinearGradient(0, PLAY_MIN, 0, PLAY_MIN + 26);
  topShadow.addColorStop(0, 'rgba(12, 5, 2, 0.72)');
  topShadow.addColorStop(0.35, 'rgba(20, 8, 3, 0.42)');
  topShadow.addColorStop(1, 'rgba(25, 12, 4, 0)');
  ctx.fillStyle = topShadow;
  ctx.fillRect(PLAY_MIN, PLAY_MIN, PLAY_MAX - PLAY_MIN, 26);

  const leftShadow = ctx.createLinearGradient(PLAY_MIN, 0, PLAY_MIN + 26, 0);
  leftShadow.addColorStop(0, 'rgba(12, 5, 2, 0.72)');
  leftShadow.addColorStop(0.35, 'rgba(20, 8, 3, 0.42)');
  leftShadow.addColorStop(1, 'rgba(25, 12, 4, 0)');
  ctx.fillStyle = leftShadow;
  ctx.fillRect(PLAY_MIN, PLAY_MIN, 26, PLAY_MAX - PLAY_MIN);

  const bottomShadow = ctx.createLinearGradient(0, PLAY_MAX, 0, PLAY_MAX - 18);
  bottomShadow.addColorStop(0, 'rgba(15, 6, 2, 0.52)');
  bottomShadow.addColorStop(1, 'rgba(20, 10, 4, 0)');
  ctx.fillStyle = bottomShadow;
  ctx.fillRect(PLAY_MIN, PLAY_MAX - 18, PLAY_MAX - PLAY_MIN, 18);

  const rightShadow = ctx.createLinearGradient(PLAY_MAX, 0, PLAY_MAX - 18, 0);
  rightShadow.addColorStop(0, 'rgba(15, 6, 2, 0.52)');
  rightShadow.addColorStop(1, 'rgba(20, 10, 4, 0)');
  ctx.fillStyle = rightShadow;
  ctx.fillRect(PLAY_MAX - 18, PLAY_MIN, 18, PLAY_MAX - PLAY_MIN);

  // Rubber Cushion Strips
  ctx.strokeStyle = '#220D04';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(PLAY_MIN, PLAY_MIN, PLAY_MAX - PLAY_MIN, PLAY_MAX - PLAY_MIN);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PLAY_MIN + 2, PLAY_MIN + 2, PLAY_MAX - PLAY_MIN - 4, PLAY_MAX - PLAY_MIN - 4);
  ctx.restore();

  // 3. AUTHENTIC CIRCULAR NET HOLES WITH WOVEN NET MESH
  for (const pocket of POCKETS) {
    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS + 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#180B05';
    ctx.fill();

    const holeGrad = ctx.createRadialGradient(pocket.x - 6, pocket.y - 6, 2, pocket.x, pocket.y, POCKET_HOLE_RADIUS);
    holeGrad.addColorStop(0, '#020305');
    holeGrad.addColorStop(0.8, '#080A0E');
    holeGrad.addColorStop(1, '#1A0E08');
    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = holeGrad;
    ctx.fill();

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

    ctx.lineWidth = 2.2;
    ctx.strokeStyle = 'rgba(196, 142, 54, 0.55)';
    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, POCKET_HOLE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. CENTER CIRCULAR COMPASS DESIGN
  ctx.save();
  if (centerImg && centerImg.complete && centerImg.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(400, 400, 114, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(centerImg, 400 - 114, 400 - 114, 228, 228);
    ctx.restore();
  }

  const compassBrown = '#361807';
  const compassLight = '#F3E2C7';
  const compassDark = '#251004';

  ctx.strokeStyle = compassBrown;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(400, 400, 108, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(400, 400, 104, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#4A230A';
  ctx.arc(400, 400, 86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = compassBrown;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(400, 400, 64, 0, Math.PI * 2);
  ctx.stroke();

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

    ctx.beginPath();
    ctx.moveTo(400, 400);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = '#1E0D04';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.strokeStyle = compassBrown;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(400, 400, 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(400, 400, 16, 0, Math.PI * 2);
  ctx.stroke();

  // Central Bullseye
  ctx.beginPath();
  ctx.arc(400, 400, 9.5, 0, Math.PI * 2);
  ctx.fillStyle = '#C02626';
  ctx.fill();
  ctx.strokeStyle = '#260E03';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 5. IDENTICAL 4 BASELINES
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

  drawBaseline(false, 400 + BASELINE_OFFSET);
  drawBaseline(false, 400 - BASELINE_OFFSET);
  drawBaseline(true, 400 - BASELINE_OFFSET);
  drawBaseline(true, 400 + BASELINE_OFFSET);

  // 6. FOUL POINTER ARROWS TOWARDS 4 CORNERS
  for (const pocket of POCKETS) {
    const ang = Math.atan2(pocket.y - 400, pocket.x - 400);
    const arrowStartDist = 120;
    const arrowEndDist = 265;

    const startX = 400 + Math.cos(ang) * arrowStartDist;
    const startY = 400 + Math.sin(ang) * arrowStartDist;
    const endX = 400 + Math.cos(ang) * arrowEndDist;
    const endY = 400 + Math.sin(ang) * arrowEndDist;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(75, 32, 10, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const hookRadius = 26;
    ctx.save();
    ctx.translate(endX, endY);
    ctx.rotate(ang);

    ctx.beginPath();
    ctx.arc(0, 0, hookRadius, -Math.PI * 0.72, Math.PI * 0.72);
    ctx.strokeStyle = 'rgba(75, 32, 10, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

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

    interface Shockwave {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      color: string;
      alpha: number;
    }

    interface Rocket {
      x: number;
      y: number;
      vx: number;
      vy: number;
      targetY: number;
      color: string;
    }

    const sparks: Spark[] = [];
    const shockwaves: Shockwave[] = [];
    const rockets: Rocket[] = [];
    const palette = [
      '#FFD700', // Gold
      '#FF1744', // Vivid Red
      '#00E5FF', // Bright Cyan
      '#00E676', // Emerald
      '#FF9100', // Neon Amber
      '#E040FB', // Purple Neon
      '#FFFFFF', // Bright White Core
      '#FFEA00'  // Solar Yellow
    ];

    const launchRocket = () => {
      if (rockets.length >= 3) return; // Cap simultaneous rockets
      const startX = width * 0.2 + Math.random() * (width * 0.6);
      const targetY = height * 0.12 + Math.random() * (height * 0.38);
      const targetX = startX + (Math.random() - 0.5) * (width * 0.15);
      const dy = targetY - height;
      const vy = -(12 + Math.random() * 4);
      const frames = dy / vy;
      const vx = (targetX - startX) / Math.max(1, frames);

      rockets.push({
        x: startX,
        y: height,
        vx,
        vy,
        targetY,
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    };

    const explode = (x: number, y: number, color: string) => {
      soundEngine.playFirecracker();

      shockwaves.push({
        x,
        y,
        radius: 3,
        maxRadius: 55 + Math.random() * 25,
        color,
        alpha: 0.85,
      });

      // 24 lightweight sparks per explosion
      const count = 22 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        if (sparks.length > 70) sparks.shift(); // Enforce hard cap on active particles
        const ang = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5.8 + 1.8;
        sparks.push({
          x,
          y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          color: Math.random() > 0.3 ? color : '#FFFFFF',
          alpha: 1,
          decay: Math.random() * 0.022 + 0.016,
          radius: Math.random() * 2.2 + 1.2,
        });
      }
    };

    launchRocket();
    launchRocket();

    const interval = setInterval(launchRocket, 520);

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      // Render shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 3.8;
        sw.alpha -= 0.045;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2.5 * sw.alpha;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.stroke();
      }

      // Render ascending rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;

        ctx.beginPath();
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.globalAlpha = 1;
        ctx.fill();

        if (r.y <= r.targetY || r.vy >= 0) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Render sparks as fast vector lines
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const oldX = s.x;
        const oldY = s.y;

        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.09; // Gravity
        s.vx *= 0.975; // Air drag
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(oldX, oldY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.radius;
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[70] w-full h-full" />;
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
  const [activeModal, setActiveModal] = useState<'menu' | 'deposit' | 'withdraw' | 'rules' | 'chat' | 'confirm_leave' | null>(null);

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

  // Matchmaking mode: PRIVATE_ROOM Real-Time Multiplayer Only
  const [matchmakingMode, setMatchmakingMode] = useState<'PRIVATE_ROOM'>('PRIVATE_ROOM');

  // Create Game Selection State (Betting Options: 50, 100, 200, 500, 1000, 2000)
  const [selectedBet, setSelectedBet] = useState<number>(500);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joinRoomErrorMsg, setJoinRoomErrorMsg] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);

  // Economy state - strictly permanent player wallet, zero hardcoded balance
  const [wallet, setWallet] = useState<WalletState>(() => {
    return getPlayerWallet(playerName);
  });

  const [insufficientBalanceNotice, setInsufficientBalanceNotice] = useState<{ required: number; available: number } | null>(null);

  const [soundMuted, setSoundMuted] = useState(false);

  // Admin Panel, Deposit Config & Deposit Payment Page state
  const [adminConfig, setAdminConfig] = useState(getAdminDepositConfig);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [depositPaymentAmount, setDepositPaymentAmount] = useState<number | null>(null);
  const [customDepositInput, setCustomDepositInput] = useState<string>('');

  // Local Player Role ('host' | 'guest') - Explicit role tracking for cross-device multiplayer
  const [localRole, setLocalRole] = useState<'host' | 'guest'>('host');
  const localRoleRef = useRef<'host' | 'guest'>('host');
  useEffect(() => {
    localRoleRef.current = localRole;
  }, [localRole]);

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
  const [isStrikerAnimating, setIsStrikerAnimating] = useState(false);
  const [strikerX, setStrikerX] = useState<number>(400);

  // Smooth Striker Return-to-Baseline Animation Ref (~380ms)
  const strikerReturnAnimRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    startTime: number;
    duration: number;
  }>({
    active: false,
    startX: 400,
    startY: PLAYER_BASELINE_Y,
    targetX: 400,
    targetY: PLAYER_BASELINE_Y,
    startTime: 0,
    duration: 380,
  });

  const triggerStrikerReturnAnimation = useCallback((targetX: number, targetY: number) => {
    const s = strikerRef.current;
    const anim = strikerReturnAnimRef.current;
    if (anim.active && Math.abs(anim.targetX - targetX) < 1 && Math.abs(anim.targetY - targetY) < 1) {
      return;
    }

    const dist = Math.hypot(s.x - targetX, s.y - targetY);
    if (dist < 2) {
      s.x = targetX;
      s.y = targetY;
      anim.active = false;
      setIsStrikerAnimating(false);
      return;
    }

    strikerReturnAnimRef.current = {
      active: true,
      startX: s.x,
      startY: s.y,
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 380,
    };
    setIsStrikerAnimating(true);
  }, []);

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

  // Opponent Live Motion & Drag Aiming State (Request 1 & 4)
  const [opponentStrikerX, setOpponentStrikerX] = useState<number>(400);
  const [opponentDragForce, setOpponentDragForce] = useState<{
    active: boolean;
    power: number;
    dirX: number;
    dirY: number;
    pullX: number;
    pullY: number;
    pullDist: number;
  }>({
    active: false,
    power: 0,
    dirX: 0,
    dirY: 1,
    pullX: 0,
    pullY: 0,
    pullDist: 0,
  });

  const isBotThinkingRef = useRef<boolean>(false);
  const lastLiveBroadcastTimeRef = useRef<number>(0);

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
    requestedBy?: string;
  } | null>(null);

  // Firestore Quota Exceeded banner state
  const [isQuotaExceededState, setIsQuotaExceededState] = useState<boolean>(() => isQuotaExceeded());

  useEffect(() => {
    const unsub = subscribeToQuotaState((exceeded) => {
      if (exceeded) {
        setIsQuotaExceededState(true);
      }
    });
    return () => unsub();
  }, []);

  const authoritativeSequenceRef = useRef<number>(0);
  const authoritativeDeadlineRef = useRef<number>(Date.now() + 20000);
  const lastShotSequenceRef = useRef<number>(0);
  const shotStartTimeRef = useRef<number>(0);
  const targetOpponentStrikerXRef = useRef<number>(400);
  const lastSliderBroadcastRef = useRef<number>(0);
  const lastDragBroadcastRef = useRef<number>(0);
  const lastOpponentAimTimeRef = useRef<number>(0);

  // 120 FPS Offscreen Board Pre-rendering & Opponent Aiming Interpolation Refs
  const offscreenBoardRef = useRef<HTMLCanvasElement | null>(null);
  const boardDprRef = useRef<number>(0);
  const isFirstRoomSnapshotRef = useRef<boolean>(true);

  // Flawlessly smooth 120 FPS interpolated opponent aiming state
  const targetOpponentAimRef = useRef<{
    active: boolean;
    power: number;
    dirX: number;
    dirY: number;
    pullDist: number;
    pullX: number;
    pullY: number;
  }>({
    active: false,
    power: 0,
    dirX: 0,
    dirY: 1,
    pullDist: 0,
    pullX: 0,
    pullY: 0,
  });

  const visualOpponentAimRef = useRef<{
    active: boolean;
    power: number;
    dirX: number;
    dirY: number;
    pullDist: number;
    pullX: number;
    pullY: number;
  }>({
    active: false,
    power: 0,
    dirX: 0,
    dirY: 1,
    pullDist: 0,
    pullX: 0,
    pullY: 0,
  });

  // Activity tracking for idle timer (does NOT reset turn deadline)
  const notifyActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    setIdleSeconds(0);
  }, []);

  // Refs for 120fps canvas loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isTurnInProgressRef = useRef(false);
  const currentTurnRef = useRef<'player' | 'bot'>('player');
  const pocketsInTurnRef = useRef<Coin[]>([]);
  const strikerPocketedInTurnRef = useRef(false);
  const botAimLineRef = useRef<{ startX: number; startY: number; endX: number; endY: number; power: number } | null>(null);

  // Global drag handling tracking refs with strict anti-auto-shoot guarantees
  const dragTrackingRef = useRef<{
    active: boolean;
    touchStartX: number;
    touchStartY: number;
    currentPointerX: number;
    currentPointerY: number;
    touchStartTime: number;
    hasDragged: boolean;
  }>({
    active: false,
    touchStartX: 0,
    touchStartY: 0,
    currentPointerX: 0,
    currentPointerY: 0,
    touchStartTime: 0,
    hasDragged: false,
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

  // Permanent Wallet persistence (debounced to prevent LocalStorage quota overflow while typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      savePlayerWallet(wallet, playerName, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [wallet, playerName]);

  // Real-Time Cross-Device User Wallet Balance Listener from Firestore
  useEffect(() => {
    let unsubWallet: (() => void) | null = null;
    ensureFirebaseAuth().then((user) => {
      unsubWallet = subscribeToUserWallet(user.uid, (data) => {
        setWallet((prev) => {
          if (prev.realBalance === data.withdrawableCoins) return prev;
          return {
            ...prev,
            realBalance: data.withdrawableCoins,
            matchesPlayed: data.totalMatches || prev.matchesPlayed,
            matchesWon: data.wins || prev.matchesWon,
          };
        });
      });
    });
    return () => {
      if (unsubWallet) unsubWallet();
    };
  }, [playerName]);

  // Player Name persistence & data binding
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

  // URL route detection for Admin Panel & real-time server security sync
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
        msg.type === 'DEPOSIT_STATUS_UPDATED' ||
        msg.type === 'DEPOSIT_REQUESTED' ||
        msg.type === 'WITHDRAWAL_REQUESTED'
      ) {
        const fresh = getPlayerWallet(playerName);
        setWallet((prev) => {
          if (
            prev.realBalance === fresh.realBalance &&
            prev.totalWon === fresh.totalWon &&
            prev.matchesPlayed === fresh.matchesPlayed &&
            prev.matchesWon === fresh.matchesWon &&
            prev.transactions.length === fresh.transactions.length &&
            JSON.stringify(prev.transactions) === JSON.stringify(fresh.transactions)
          ) {
            return prev;
          }
          return fresh;
        });

        const freshWithdrawals = getWithdrawalRequests().filter((r) => r.playerName === playerName);
        setRecentWithdrawals((prev) => {
          if (
            prev.length === freshWithdrawals.length &&
            JSON.stringify(prev) === JSON.stringify(freshWithdrawals)
          ) {
            return prev;
          }
          return freshWithdrawals;
        });
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
    targetOpponentStrikerXRef.current = 400;
    lastShotSequenceRef.current = 0;
    const now = Date.now();
    authoritativeDeadlineRef.current = now + 20000;
    // At start, 9 white and 9 black on board -> 0 pocketed!
    setPlayerWhitePocketed(0);
    setBotBlackPocketed(0);
    setQueenState('on_board');
    const isHost = localRoleRef.current === 'host';
    const initTurn: 'player' | 'bot' = isHost ? 'player' : 'bot';
    setCurrentTurn(initTurn);
    currentTurnRef.current = initTurn;
    strikerRef.current.y = initTurn === 'player' ? PLAYER_BASELINE_Y : BOT_BASELINE_Y;
    setTurnTimeLeft(20);
    setIdleSeconds(0);
    lastActivityTimeRef.current = now;
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
      boardDprRef.current = 0; // Invalidate offscreen board cache so center artwork is drawn
    };
  }, []);

  /* ==========================================================================
     STARTING MATCH WITH WALLET DEDUCTION & COMMISSION RAKE
     ========================================================================== */
  const startMatchWithBet = (room: GameRoom) => {
    if (room.betAmount > 0) {
      if (wallet.realBalance < room.betAmount) {
        setInsufficientBalanceNotice({
          required: room.betAmount,
          available: wallet.realBalance,
        });
        return;
      }

      setWallet((prev) => {
        const updated: WalletState = {
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
        };
        savePlayerWallet(updated, playerName);
        return updated;
      });
    }

    const startTime = Date.now();
    authoritativeDeadlineRef.current = startTime + 20000;
    setTurnTimeLeft(20);
    lastTickedSecondRef.current = -1;
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
      setInsufficientBalanceNotice({
        required: activeRoom.betAmount,
        available: wallet.realBalance,
      });
      return;
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
    if (matchmakingMode === 'PRIVATE_ROOM' && activeRoom.gameId) {
      setRematchPrompt({
        type,
        status: 'requesting',
        requestedBy: playerName,
      });
      requestMultiplayerRematch(activeRoom.gameId, playerName, localRoleRef.current);
    } else {
      setRematchPrompt({
        type,
        status: 'requesting',
        requestedBy: playerName,
      });

      // Simulated opponent review response after a realistic delay for computer mode
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
    }
  };


  /* ==========================================================================
     CREATE REAL-TIME MULTIPLAYER GAME ROOM (FIRESTORE BACKED)
     ========================================================================== */
  const handleCreateRoom = async () => {
    if (wallet.realBalance < selectedBet) {
      setInsufficientBalanceNotice({
        required: selectedBet,
        available: wallet.realBalance,
      });
      return;
    }

    try {
      setIsCreatingRoom(true);
      setMatchmakingMode('PRIVATE_ROOM');
      setLocalRole('host');
      localRoleRef.current = 'host';
      const serverRoom = await createMultiplayerRoom(playerName, selectedBet);
      console.log(`[HOST] Room created: ${serverRoom.roomId}`);
      const newRoom: GameRoom = {
        gameId: serverRoom.roomId,
        hostName: serverRoom.hostName,
        opponentName: 'Waiting for player...',
        betAmount: serverRoom.entryFee,
        totalPot: serverRoom.totalPot,
        winnerPrize: serverRoom.winnerPrize,
        platformRake: serverRoom.platformRake,
        status: 'waiting',
      };

      setActiveRoom(newRoom);
      setScreen('room_waiting');
    } catch (err) {
      console.error('Failed to create server room:', err);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Host Listener: Auto-transition Player 1 into the match as soon as Player 2 joins!
  useEffect(() => {
    if (screen !== 'room_waiting' || !activeRoom.gameId) return;

    let isTransitioned = false;
    console.log(`[HOST] Room subscription initialized`);
    console.log(`[HOST] Listening for room changes`);

    const unsub = subscribeToRoom(activeRoom.gameId, (serverRoom) => {
      console.log(`[HOST] Room update received`);

      const isMatchedStatus =
        serverRoom.status === 'READY' ||
        serverRoom.status === 'ready' ||
        serverRoom.status === 'MATCHED' ||
        serverRoom.status === 'matched' ||
        serverRoom.status === 'STARTING' ||
        serverRoom.status === 'IN_PROGRESS' ||
        serverRoom.status === 'active' ||
        serverRoom.status === 'playing' ||
        serverRoom.playerCount >= 2;

      const hasGuestName = Boolean(serverRoom.guestName && serverRoom.guestName.trim());

      if (!isTransitioned && isMatchedStatus && hasGuestName) {
        isTransitioned = true;
        console.log(`[HOST] Player 2 detected: ${serverRoom.guestName}`);
        console.log(`[HOST] Room status: ${serverRoom.status}`);
        console.log(`[HOST] Both players verified`);
        console.log(`[HOST] Transitioning to multiplayer game`);

        setMatchmakingMode('PRIVATE_ROOM');
        setOpponentName(serverRoom.guestName!);
        const fullRoom: GameRoom = {
          gameId: serverRoom.roomId,
          hostName: serverRoom.hostName,
          opponentName: serverRoom.guestName!,
          betAmount: serverRoom.entryFee,
          totalPot: serverRoom.totalPot,
          winnerPrize: serverRoom.winnerPrize,
          platformRake: serverRoom.platformRake,
          status: 'playing',
        };
        startMatchWithBet(fullRoom);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [screen, activeRoom.gameId]);

  /* ==========================================================================
     JOIN REAL-TIME MULTIPLAYER GAME ROOM (FIRESTORE BACKED)
     ========================================================================== */
  const handleJoinRoomWithCode = async () => {
    setJoinRoomErrorMsg(null);
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinRoomErrorMsg('Please enter a valid 6-digit Room Code.');
      return;
    }

    if (wallet.realBalance < selectedBet) {
      setInsufficientBalanceNotice({
        required: selectedBet,
        available: wallet.realBalance,
      });
      return;
    }

    try {
      setIsJoiningRoom(true);
      setMatchmakingMode('PRIVATE_ROOM');
      setLocalRole('guest');
      localRoleRef.current = 'guest';
      console.log(`[JOINER] Entered Room ID: ${code}`);

      const res = await joinMultiplayerRoom(code, playerName);
      if (!res.success || !res.room) {
        console.warn(`[JOINER] Room join failed for code "${code}": ${res.error}`);
        setJoinRoomErrorMsg(res.error || 'Failed to join room. Please check the code.');
        return;
      }

      const sRoom = res.room;
      console.log(`[JOINER] Room found: game_rooms/${sRoom.roomId}`);
      console.log(`[JOINER] Room availability verified`);
      console.log(`[JOINER] Player registration successful`);
      console.log(`[JOINER] Room status updated: ${sRoom.status}`);
      console.log(`[JOINER] Waiting for authoritative game confirmation`);

      const joinedRoom: GameRoom = {
        gameId: sRoom.roomId,
        hostName: sRoom.hostName,
        opponentName: playerName.trim() || 'Player',
        betAmount: sRoom.entryFee,
        totalPot: sRoom.totalPot,
        winnerPrize: sRoom.winnerPrize,
        platformRake: sRoom.platformRake,
        status: 'playing',
      };

      setOpponentName(sRoom.hostName);
      console.log(`[JOINER] Multiplayer session confirmed`);
      console.log(`[JOINER] Entering game`);
      startMatchWithBet(joinedRoom);
    } catch (err) {
      console.error('Failed to join server room:', err);
      setJoinRoomErrorMsg('Error joining room. Please try again.');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Authoritative Real-Time Multiplayer State & Opponent Shot Listener during gameplay
  useEffect(() => {
    if ((screen !== 'gameplay' && screen !== 'room_waiting') || !activeRoom.gameId || matchmakingMode !== 'PRIVATE_ROOM') return;

    const unsub = subscribeToRoom(activeRoom.gameId, (serverRoom) => {
      // Point 4: Room Cancellation / Abandonment Listener
      if (serverRoom.status === 'CANCELLED' || serverRoom.status === 'ABANDONED') {
        setActiveModal(null);
        setGameOverResult(null);
        setRematchPrompt(null);
        setScreen('create_game');
        alert('Match Cancelled! The other player left the game. Returning to betting selection.');
        return;
      }

      // Point 5: Rematch Approval / Rejection Listener in Multiplayer
      if (serverRoom.rematchState && matchmakingMode === 'PRIVATE_ROOM') {
        const rem = serverRoom.rematchState;
        if (rem.status === 'PENDING' && rem.requestedBy !== playerName) {
          // Opponent requested rematch -> Show approval popup
          setRematchPrompt({
            type: 'rematch',
            status: 'requesting',
            requestedBy: rem.requestedBy,
          });
        } else if (rem.status === 'APPROVED') {
          setRematchPrompt({ type: 'rematch', status: 'approved' });
          setTimeout(() => {
            setGameOverResult(null);
            setRematchPrompt(null);
            initializeBoard();
            setScreen('gameplay');
          }, 800);
        } else if (rem.status === 'REJECTED') {
          setRematchPrompt({ type: 'rematch', status: 'declined' });
          setTimeout(() => {
            setGameOverResult(null);
            setRematchPrompt(null);
            setScreen('create_game');
          }, 1500);
        }
      }

      if (!serverRoom.gameState) return;

      try {
        const parsed: AuthoritativeGameState = typeof serverRoom.gameState === 'string'
          ? JSON.parse(serverRoom.gameState)
          : serverRoom.gameState;

        const isHost = localRoleRef.current === 'host';

        // Fast-forward sequence number on initial room subscription snapshot so historical shots never auto-play
        if (isFirstRoomSnapshotRef.current) {
          isFirstRoomSnapshotRef.current = false;
          if (parsed.lastShot) {
            lastShotSequenceRef.current = parsed.lastShot.sequenceNumber;
          }
        }

        // 1. Sync turn deadline
        if (parsed.turnDeadline) {
          authoritativeDeadlineRef.current = parsed.turnDeadline;
        }

        // 2. Sync turn & trigger smooth striker return animation on turn transition
        if (parsed.currentTurn) {
          const isMyTurn = parsed.currentTurn === localRoleRef.current;
          const newTurn: 'player' | 'bot' = isMyTurn ? 'player' : 'bot';

          if (currentTurnRef.current !== newTurn) {
            currentTurnRef.current = newTurn;
            setCurrentTurn(newTurn);

            // ALWAYS reset striker state completely on turn change so striker is 100% available and visible
            strikerRef.current = {
              id: 99,
              type: 'white',
              x: 400,
              y: newTurn === 'player' ? PLAYER_BASELINE_Y : BOT_BASELINE_Y,
              vx: 0,
              vy: 0,
              radius: STRIKER_RADIUS,
              mass: 3.5,
              isSinking: false,
              sinkScale: 1,
              isPocketed: false,
            };

            setStrikerX(400);
            targetOpponentStrikerXRef.current = 400;
            isTurnInProgressRef.current = false;
            setIsStrikerMoving(false);

            const targetY = newTurn === 'player' ? PLAYER_BASELINE_Y : BOT_BASELINE_Y;
            triggerStrikerReturnAnimation(400, targetY);
          }
        }

        // 3. Sync coin positions & derive exact ground truth pocketed counts
        if (Array.isArray(parsed.coins) && parsed.coins.length > 0) {
          if (!isTurnInProgressRef.current) {
            const currentCoins = coinsRef.current;
            parsed.coins.forEach((authCoin) => {
              const match = currentCoins.find((c) => c.id === authCoin.id);
              if (match) {
                match.x = isHost ? authCoin.x : 800 - authCoin.x;
                match.y = isHost ? authCoin.y : 800 - authCoin.y;
                match.vx = isHost ? authCoin.vx : -authCoin.vx;
                match.vy = isHost ? authCoin.vy : -authCoin.vy;
                match.isPocketed = authCoin.isPocketed;
                if (authCoin.isPocketed) match.isSinking = false;
              }
            });
            // Re-derive exact score directly from actual pocketed coins on board
            const syncWhite = currentCoins.filter((c) => c.type === 'white' && c.isPocketed).length;
            const syncBlack = currentCoins.filter((c) => c.type === 'black' && c.isPocketed).length;
            setPlayerWhitePocketed(syncWhite);
            setBotBlackPocketed(syncBlack);
          }
        } else if (typeof parsed.hostScore === 'number' && typeof parsed.guestScore === 'number') {
          setPlayerWhitePocketed(parsed.hostScore);
          setBotBlackPocketed(parsed.guestScore);
        }

        if (parsed.queenState) {
          setQueenState(fromAuthoritativeQueenState(parsed.queenState, isHost));
        }

        // 4. Game Over Sync Listener
        const syncWhiteScore = typeof parsed.hostScore === 'number' ? parsed.hostScore : coinsRef.current.filter((c) => c.type === 'white' && c.isPocketed).length;
        const syncBlackScore = typeof parsed.guestScore === 'number' ? parsed.guestScore : coinsRef.current.filter((c) => c.type === 'black' && c.isPocketed).length;

        if (parsed.gameStatus === 'finished' || syncWhiteScore >= 9 || syncBlackScore >= 9) {
          const whiteWon = syncWhiteScore >= 9;
          const blackWon = syncBlackScore >= 9;
          const localPlayerWon = isHost ? whiteWon : blackWon;

          if (!gameOverResult) {
            const winnerRole: 'player' | 'bot' = localPlayerWon ? 'player' : 'bot';
            const prizeWon = localPlayerWon ? activeRoom.winnerPrize : 0;
            const rakeDeducted = localPlayerWon ? activeRoom.platformRake : 0;

            if (localPlayerWon) {
              soundEngine.playVictory();
              if (prizeWon > 0) {
                setWallet((prev) => {
                  const updated: WalletState = {
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
                  };
                  savePlayerWallet(updated, playerName);
                  return updated;
                });
              }
            } else {
              soundEngine.playDefeat();
            }

            setGameOverResult({
              winner: winnerRole,
              winnerName: localPlayerWon ? playerName : opponentName,
              loserName: localPlayerWon ? opponentName : playerName,
              prizeWon,
              rakeDeducted,
              whiteScore: syncWhiteScore,
              blackScore: syncBlackScore,
            });
          }
        }

        // 5. Sync live opponent slider movement & drag aiming in real-time (Interpolated 120 FPS targets)
        if (parsed.liveAiming && parsed.liveAiming.shooterRole !== localRoleRef.current) {
          const live = parsed.liveAiming;
          const oppStrikerX = isHost ? live.strikerX : 800 - live.strikerX;
          setOpponentStrikerX(oppStrikerX);
          targetOpponentStrikerXRef.current = oppStrikerX;

          const isAimingActive = Boolean(
            live.isDragging &&
            (live.power || 0) > 0.02 &&
            !isTurnInProgressRef.current &&
            (!live.timestamp || Date.now() - live.timestamp < 450)
          );

          if (isAimingActive) {
            lastOpponentAimTimeRef.current = Date.now();
            const oppDirX = isHost ? live.dirX : -live.dirX;
            const oppDirY = isHost ? live.dirY : -live.dirY;
            const oppPullX = isHost ? live.pullX : -live.pullX;
            const oppPullY = isHost ? live.pullY : -live.pullY;

            targetOpponentAimRef.current = {
              active: true,
              power: live.power,
              dirX: oppDirX,
              dirY: oppDirY,
              pullX: oppPullX,
              pullY: oppPullY,
              pullDist: live.pullDist,
            };

            setOpponentDragForce({
              active: true,
              power: live.power,
              dirX: oppDirX,
              dirY: oppDirY,
              pullX: oppPullX,
              pullY: oppPullY,
              pullDist: live.pullDist,
            });
          } else {
            lastOpponentAimTimeRef.current = 0;
            targetOpponentAimRef.current = {
              active: false,
              power: 0,
              dirX: 0,
              dirY: 1,
              pullX: 0,
              pullY: 0,
              pullDist: 0,
            };
            visualOpponentAimRef.current.active = false;
            setOpponentDragForce({
              active: false,
              power: 0,
              dirX: 0,
              dirY: 1,
              pullX: 0,
              pullY: 0,
              pullDist: 0,
            });
          }
        } else if (!isTurnInProgressRef.current) {
          lastOpponentAimTimeRef.current = 0;
          targetOpponentAimRef.current.active = false;
          visualOpponentAimRef.current.active = false;
          setOpponentDragForce({
            active: false,
            power: 0,
            dirX: 0,
            dirY: 1,
            pullX: 0,
            pullY: 0,
            pullDist: 0,
          });
        }

        // 6. Sync live physics simulation motion from active shooter in real-time
        if (parsed.livePhysics && parsed.livePhysics.shooterRole !== localRoleRef.current) {
          const phys = parsed.livePhysics;
          if (phys.striker) {
            strikerRef.current.x = isHost ? phys.striker.x : 800 - phys.striker.x;
            strikerRef.current.y = isHost ? phys.striker.y : 800 - phys.striker.y;
            strikerRef.current.vx = isHost ? phys.striker.vx : -phys.striker.vx;
            strikerRef.current.vy = isHost ? phys.striker.vy : -phys.striker.vy;
            strikerRef.current.isPocketed = false;
            strikerRef.current.isSinking = false;
            isTurnInProgressRef.current = true;
            setIsStrikerMoving(true);
          }
          if (Array.isArray(phys.coins) && phys.coins.length > 0) {
            const currentCoins = coinsRef.current;
            phys.coins.forEach((c) => {
              const match = currentCoins.find((m) => m.id === c.id);
              if (match) {
                match.x = isHost ? c.x : 800 - c.x;
                match.y = isHost ? c.y : 800 - c.y;
                match.vx = isHost ? c.vx : -c.vx;
                match.vy = isHost ? c.vy : -c.vy;
                match.isPocketed = c.isPocketed;
                if (c.isPocketed) match.isSinking = false;
              }
            });
            isTurnInProgressRef.current = true;
            setIsStrikerMoving(true);
          }
        }

        // 7. Process opponent shot (STRICT REALTIME OPPONENT SHOT EXECUTION - RULE 1: NEVER AUTO-SHOOT STALE)
        if (parsed.lastShot && parsed.lastShot.sequenceNumber > lastShotSequenceRef.current) {
          const shotSeq = parsed.lastShot.sequenceNumber;
          lastShotSequenceRef.current = shotSeq; // Consume sequence immediately

          const shotAge = Date.now() - (parsed.lastShot.timestamp || 0);

          // Only simulate motion if this shot was executed by the OPPONENT and is fresh (< 3500ms)
          // RULE 1: Stale shots must never auto-shoot under any condition
          if (parsed.lastShot.shooterRole !== localRoleRef.current && shotAge < 3500) {
            const shot = parsed.lastShot;
            const startX = isHost ? shot.strikerX : 800 - shot.strikerX;
            const startY = isHost
              ? (shot.strikerY ?? BOT_BASELINE_Y)
              : 800 - (shot.strikerY ?? (800 - BOT_BASELINE_Y));
            const shotVx = isHost ? shot.vx : -shot.vx;
            const shotVy = isHost ? shot.vy : -shot.vy;

            // Immediately cancel any remaining opponent drag line
            lastOpponentAimTimeRef.current = 0;
            targetOpponentAimRef.current.active = false;
            visualOpponentAimRef.current.active = false;
            setOpponentDragForce({
              active: false,
              power: 0,
              dirX: 0,
              dirY: 1,
              pullX: 0,
              pullY: 0,
              pullDist: 0,
            });

            // Sync coins to pre-shot positions if included
            if (Array.isArray(shot.coins) && shot.coins.length > 0) {
              const currentCoins = coinsRef.current;
              shot.coins.forEach((authCoin) => {
                const match = currentCoins.find((c) => c.id === authCoin.id);
                if (match) {
                  match.x = isHost ? authCoin.x : 800 - authCoin.x;
                  match.y = isHost ? authCoin.y : 800 - authCoin.y;
                  match.vx = isHost ? authCoin.vx : -authCoin.vx;
                  match.vy = isHost ? authCoin.vy : -authCoin.vy;
                  match.isPocketed = authCoin.isPocketed;
                  if (authCoin.isPocketed) match.isSinking = false;
                }
              });
            }

            const s = strikerRef.current;
            s.x = startX;
            s.y = startY;
            s.vx = shotVx;
            s.vy = shotVy;
            s.isPocketed = false;
            s.isSinking = false;
            s.sinkScale = 1;

            shotStartTimeRef.current = Date.now();
            isTurnInProgressRef.current = true;
            setIsStrikerMoving(true);
            soundEngine.playStrikerHit(shot.power || 0.8);
          }
        }
      } catch (e) {
        console.warn('Failed to parse authoritative room gameState:', e);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [screen, activeRoom.gameId, playerName, activeRoom.hostName, matchmakingMode]);

  /* ==========================================================================
     PHYSICS SIMULATION STEP (RULE 1: STRONGER FRAME LOGIC & RULE 2: FAIR POCKETS)
     ========================================================================== */
  const runPhysicsStep = useCallback((dt: number) => {
    const RESTITUTION_COIN = 0.82;
    const RESTITUTION_WALL = 0.78;
    const STOP_VELOCITY = 0.16;

    const coins = coinsRef.current;
    const striker = strikerRef.current;
    const allDiscs = [striker, ...coins].filter((c) => !c.isPocketed);

    // 0. Smooth 60fps lerp interpolation for opponent's striker slider positioning on baseline (Request 2)
    if (!isTurnInProgressRef.current && currentTurnRef.current === 'bot') {
      const diff = targetOpponentStrikerXRef.current - striker.x;
      if (Math.abs(diff) > 0.5) {
        striker.x += diff * 0.45;
      } else {
        striker.x = targetOpponentStrikerXRef.current;
      }
      striker.y = BOT_BASELINE_Y;
    }

    // Broadcast live physics positions during shot motion (Request 1 & Request 2)
    if (matchmakingMode === 'PRIVATE_ROOM' && activeRoom.gameId && isTurnInProgressRef.current && currentTurnRef.current === 'player') {
      const now = Date.now();
      if (now - lastLiveBroadcastTimeRef.current > 45) {
        lastLiveBroadcastTimeRef.current = now;
        const isHost = localRoleRef.current === 'host';
        const liveCoins = coinsRef.current.map((c) => ({
          id: c.id,
          x: Math.round((isHost ? c.x : 800 - c.x) * 10) / 10,
          y: Math.round((isHost ? c.y : 800 - c.y) * 10) / 10,
          vx: Math.round((isHost ? c.vx : -c.vx) * 10) / 10,
          vy: Math.round((isHost ? c.vy : -c.vy) * 10) / 10,
          isPocketed: c.isPocketed,
        }));
        const s = strikerRef.current;
        broadcastLiveStreamState(activeRoom.gameId, {
          livePhysics: {
            shooterRole: localRoleRef.current,
            striker: {
              x: Math.round((isHost ? s.x : 800 - s.x) * 10) / 10,
              y: Math.round((isHost ? s.y : 800 - s.y) * 10) / 10,
              vx: Math.round((isHost ? s.vx : -s.vx) * 10) / 10,
              vy: Math.round((isHost ? s.vy : -s.vy) * 10) / 10,
            },
            coins: liveCoins,
            timestamp: now,
          },
        });
      }
    }

    // 1. Move & apply authentic fine-powder sliding friction & deceleration (Requirement 1 & Request 2)
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
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate(35); } catch {}
            }

            spawnFloatingScore(
              d.x,
              d.y,
              isQueen ? '+3' : d.type === 'white' ? '+1' : '+1',
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

      // Natural, smooth board sliding & realistic deceleration
      const currentSpeed = Math.hypot(d.vx, d.vy);
      if (currentSpeed > 0) {
        const kineticDecel = 0.068 * dt;
        const airResistance = 1.0 - 0.0042 * dt;

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

      // STRICT NATURAL CARROM NET HOLE POCKET DETECTION (Requirement 1 & Request 3)
      // A coin is captured strictly when >50% of the coin's total size has crossed the edge of the nethole (dist < POCKET_HOLE_RADIUS)
      for (const pocket of POCKETS) {
        const dist = Math.hypot(d.x - pocket.x, d.y - pocket.y);
        if (dist < POCKET_HOLE_RADIUS && !d.isSinking) {
          d.isSinking = true;
          // Retain natural momentum while being smoothly pulled into the net hole center
          d.vx = d.vx * 0.45 + (pocket.x - d.x) * 0.14;
          d.vy = d.vy * 0.45 + (pocket.y - d.y) * 0.14;
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
    const shotElapsed = Date.now() - shotStartTimeRef.current;

    // Point 3: Hard 4.2-second timeout guard to prevent striker/coins from getting stuck vibrating
    if (isTurnInProgressRef.current && shotElapsed > 4200) {
      allDiscs.forEach((d) => {
        d.vx = 0;
        d.vy = 0;
        d.spinVel = 0;
        d.isSinking = false;
      });
    }

    // Guard: A shot in flight must run for at least 400ms before checking for settlement (prevents premature aborts)
    if (isTurnInProgressRef.current && shotElapsed < 400) {
      setIsStrikerMoving(true);
      return;
    }

    const moving = allDiscs.some(
      (d) => Math.hypot(d.vx, d.vy) > 0.18 || d.isSinking
    );

    if (moving && (!isTurnInProgressRef.current || shotElapsed <= 4200)) {
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

    const isHost = localRoleRef.current === 'host';

    // Coins pocketed this turn
    const whitePocketedThisTurn = pocketedCoins.filter((c) => c.type === 'white').length;
    const blackPocketedThisTurn = pocketedCoins.filter((c) => c.type === 'black').length;
    const queenPocketedThisTurn = pocketedCoins.some((c) => c.type === 'queen');

    const playerPocketedThisTurn = isHost ? whitePocketedThisTurn : blackPocketedThisTurn;
    const botPocketedThisTurn = isHost ? blackPocketedThisTurn : whitePocketedThisTurn;

    // Point 1: Calculate actual total pocketed coins directly from the board state to guarantee 100% accuracy
    const actualWhiteTotal = coinsRef.current.filter((c) => c.type === 'white' && c.isPocketed).length;
    const actualBlackTotal = coinsRef.current.filter((c) => c.type === 'black' && c.isPocketed).length;

    let newWhiteTotal = actualWhiteTotal;
    let newBlackTotal = actualBlackTotal;

    let nextWho: 'player' | 'bot' = currentWho === 'player' ? 'bot' : 'player';

    // -------------------------------------------------------------
    // RULE 3: STRIKER FOUL LOGIC (REQUIREMENT 3: ONLY IF SCORE >= 1, NEVER BELOW 0)
    // -------------------------------------------------------------
    if (strikerPocketed) {
      soundEngine.playFoul();

      if (currentWho === 'player') {
        const playerOwnTotal = isHost ? newWhiteTotal : newBlackTotal;
        if (playerOwnTotal >= 1) {
          if (isHost) {
            newWhiteTotal = Math.max(0, newWhiteTotal - 1);
            returnCoinToCenter('white');
          } else {
            newBlackTotal = Math.max(0, newBlackTotal - 1);
            returnCoinToCenter('black');
          }
          spawnFloatingScore(400, PLAYER_BASELINE_Y, 'FOUL! -1 COIN DEDUCTED', '#EF4444');
        } else {
          spawnFloatingScore(400, PLAYER_BASELINE_Y, 'STRIKER SINK (SCORE 0 - NO PENALTY)', '#F59E0B');
        }

        if (queenState === 'pending_player') {
          returnCoinToCenter('queen');
          setQueenState('on_board');
        }
      } else {
        const botOwnTotal = isHost ? newBlackTotal : newWhiteTotal;
        if (botOwnTotal >= 1) {
          if (isHost) {
            newBlackTotal = Math.max(0, newBlackTotal - 1);
            returnCoinToCenter('black');
          } else {
            newWhiteTotal = Math.max(0, newWhiteTotal - 1);
            returnCoinToCenter('white');
          }
          spawnFloatingScore(400, BOT_BASELINE_Y, 'BOT FOUL!', '#EF4444');
        }

        if (queenState === 'pending_bot') {
          returnCoinToCenter('queen');
          setQueenState('on_board');
        }
      }

      nextWho = currentWho === 'player' ? 'bot' : 'player';
    } else {
      // -------------------------------------------------------------
      // NO FOUL: RULE 8 QUEEN COVER + RULE 6 TURN HANDOFF LOGIC
      // -------------------------------------------------------------

      if (currentWho === 'player') {
        // Player's turn (Owns own coin type based on role)
        if (queenPocketedThisTurn) {
          if (playerPocketedThisTurn >= 1) {
            setQueenState('covered_player');
            spawnFloatingScore(400, 400, '+3 SECURED', '#FBBF24');
            nextWho = 'player';
          } else {
            setQueenState('pending_player');
            nextWho = 'player';
          }
        } else if (queenState === 'pending_player') {
          if (playerPocketedThisTurn >= 1) {
            setQueenState('covered_player');
            spawnFloatingScore(400, 400, '+3 SECURED', '#FBBF24');
            nextWho = 'player';
          } else {
            returnCoinToCenter('queen');
            setQueenState('on_board');
            nextWho = 'bot';
          }
        } else {
          if (playerPocketedThisTurn >= 1) {
            nextWho = 'player';
          } else {
            nextWho = 'bot';
          }
        }
      } else {
        // Opponent's turn (Owns opponent coin type based on role)
        if (queenPocketedThisTurn) {
          if (botPocketedThisTurn >= 1) {
            setQueenState('covered_bot');
            spawnFloatingScore(400, 400, '+3 SECURED', '#FBBF24');
            nextWho = 'bot';
          } else {
            setQueenState('pending_bot');
            nextWho = 'bot';
          }
        } else if (queenState === 'pending_bot') {
          if (botPocketedThisTurn >= 1) {
            setQueenState('covered_bot');
            spawnFloatingScore(400, 400, '+3 SECURED', '#FBBF24');
            nextWho = 'bot';
          } else {
            returnCoinToCenter('queen');
            setQueenState('on_board');
            nextWho = 'player';
          }
        } else {
          if (botPocketedThisTurn >= 1) {
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
      const isHost = localRoleRef.current === 'host';
      const whiteWon = newWhiteTotal >= 9;
      const blackWon = newBlackTotal >= 9;
      const localPlayerWon = isHost ? whiteWon : blackWon;
      const winnerRole: 'player' | 'bot' = localPlayerWon ? 'player' : 'bot';
      const prizeWon = localPlayerWon ? activeRoom.winnerPrize : 0;
      const rakeDeducted = localPlayerWon ? activeRoom.platformRake : 0;

      if (localPlayerWon) {
        soundEngine.playVictory();
        if (prizeWon > 0) {
          setWallet((prev) => {
            const updated: WalletState = {
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
            };
            savePlayerWallet(updated, playerName);
            return updated;
          });
        }
      } else {
        soundEngine.playDefeat();
      }

      setGameOverResult({
        winner: winnerRole,
        winnerName: localPlayerWon ? playerName : opponentName,
        loserName: localPlayerWon ? opponentName : playerName,
        prizeWon,
        rakeDeducted,
        whiteScore: newWhiteTotal,
        blackScore: newBlackTotal,
      });
      return;
    }

    setCurrentTurn(nextWho);
    currentTurnRef.current = nextWho;
    const newDeadline = Date.now() + 20000;
    authoritativeDeadlineRef.current = newDeadline;
    setTurnTimeLeft(20);
    setIdleSeconds(0);
    lastActivityTimeRef.current = Date.now();
    lastTickedSecondRef.current = -1;

    // ALWAYS reset striker state completely on turn change so striker is 100% available and visible
    const nextBaseY = nextWho === 'player' ? PLAYER_BASELINE_Y : BOT_BASELINE_Y;
    strikerRef.current = {
      id: 99,
      type: 'white',
      x: 400,
      y: nextBaseY,
      vx: 0,
      vy: 0,
      radius: STRIKER_RADIUS,
      mass: 3.5,
      isSinking: false,
      sinkScale: 1,
      isPocketed: false,
    };

    if (nextWho === 'player') {
      isBotThinkingRef.current = false;
      setStrikerX(400);
    }

    triggerStrikerReturnAnimation(400, nextBaseY);

    // Synchronize Authoritative Game State to Firestore ONLY if it was the local player's turn
    if (matchmakingMode === 'PRIVATE_ROOM' && activeRoom.gameId && currentWho === 'player') {
      const isHost = localRoleRef.current === 'host';
      const newSeq = (authoritativeSequenceRef.current || 0) + 1;
      authoritativeSequenceRef.current = newSeq;

      // Host Score is ALWAYS total White coins pocketed, Guest Score is ALWAYS total Black coins pocketed
      const hostScore = newWhiteTotal;
      const guestScore = newBlackTotal;

      const nextTurnRole: 'host' | 'guest' = nextWho === 'player'
        ? localRoleRef.current
        : (localRoleRef.current === 'host' ? 'guest' : 'host');

      const gameStatus = (newWhiteTotal >= 9 || newBlackTotal >= 9) ? 'finished' : 'playing';
      const now = Date.now();

      const authCoins: AuthoritativeCoin[] = coinsRef.current.map((c) => ({
        id: c.id,
        type: c.type,
        x: Math.round((isHost ? c.x : 800 - c.x) * 100) / 100,
        y: Math.round((isHost ? c.y : 800 - c.y) * 100) / 100,
        vx: Math.round((isHost ? c.vx : -c.vx) * 100) / 100,
        vy: Math.round((isHost ? c.vy : -c.vy) * 100) / 100,
        isPocketed: c.isPocketed,
      }));

      const newGameState: AuthoritativeGameState = {
        version: 1,
        sequenceNumber: newSeq,
        gameStatus,
        currentTurn: nextTurnRole,
        turnStartedAt: now,
        turnDeadline: now + 20000,
        turnDuration: 20,
        hostScore,
        guestScore,
        queenState: toAuthoritativeQueenState(queenState, isHost),
        coins: authCoins,
        striker: {
          x: isHost ? strikerRef.current.x : 800 - strikerRef.current.x,
          y: isHost ? strikerRef.current.y : 800 - strikerRef.current.y,
          vx: 0,
          vy: 0,
          isPocketed: false,
        },
        winnerRole: gameStatus === 'finished' ? (hostScore >= 9 ? 'host' : 'guest') : undefined,
      };

      updateRoomGameState(activeRoom.gameId, newGameState, nextTurnRole, gameStatus === 'playing' ? 'active' : gameStatus);
    }

  }, [playerWhitePocketed, botBlackPocketed, queenState, activeRoom, playerName, opponentName, returnCoinToCenter, spawnFloatingScore]);

  /* ==========================================================================
     STRICT 20-SECOND TURN TIMER & TICKING AUDIO LIFECYCLE
     ========================================================================== */
  const lastTickedSecondRef = useRef<number>(-1);

  useEffect(() => {
    if (screen !== 'gameplay' || gameOverResult) {
      lastTickedSecondRef.current = -1;
      return;
    }

    const interval = setInterval(() => {
      // Pause countdown while striker or coins are in active physical motion
      if (isStrikerMoving || isTurnInProgressRef.current) {
        lastTickedSecondRef.current = -1;
        return;
      }

      const now = Date.now();
      const isMyTurnActive = currentTurnRef.current === 'player';
      const isStrikerStill = !isStrikerMoving && !isTurnInProgressRef.current;

      const deadline = authoritativeDeadlineRef.current || (now + 20000);
      const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
      setTurnTimeLeft(remaining);

      // Strict Ticking Audio Lifecycle (Starts at 10s ONLY for active local player's turn, stops on turn change/expiration/shot)
      if (isMyTurnActive && isStrikerStill && remaining <= 10 && remaining > 0) {
        if (lastTickedSecondRef.current !== remaining) {
          lastTickedSecondRef.current = remaining;
          soundEngine.playTick(remaining <= 3);
        }
      } else {
        lastTickedSecondRef.current = -1;
      }

      // Timeout turn transfer
      if (remaining <= 0 && isMyTurnActive) {
        soundEngine.playFoul();
        lastTickedSecondRef.current = -1;
        const isHost = localRoleRef.current === 'host';
        const nextTurnRole: 'host' | 'guest' = isHost ? 'guest' : 'host';
        setCurrentTurn('bot');
        currentTurnRef.current = 'bot';

        const ownScore = isHost ? playerWhitePocketed : botBlackPocketed;
        if (ownScore >= 1) {
          if (isHost) {
            setPlayerWhitePocketed((prev) => Math.max(0, prev - 1));
            returnCoinToCenter('white');
          } else {
            setBotBlackPocketed((prev) => Math.max(0, prev - 1));
            returnCoinToCenter('black');
          }
          spawnFloatingScore(400, PLAYER_BASELINE_Y, 'TIMEOUT! -1 FOUL', '#EF4444');
        } else {
          spawnFloatingScore(400, PLAYER_BASELINE_Y, 'TIMEOUT! TURN PASSED', '#F59E0B');
        }

        if (queenState === 'pending_player') {
          returnCoinToCenter('queen');
          setQueenState('on_board');
        }

        const authCoins: AuthoritativeCoin[] = coinsRef.current.map((c) => ({
          id: c.id,
          type: c.type,
          x: Math.round((isHost ? c.x : 800 - c.x) * 100) / 100,
          y: Math.round((isHost ? c.y : 800 - c.y) * 100) / 100,
          vx: 0,
          vy: 0,
          isPocketed: c.isPocketed,
        }));

        const newSeq = (authoritativeSequenceRef.current || 0) + 1;
        authoritativeSequenceRef.current = newSeq;
        const newDeadline = Date.now() + 20000;
        authoritativeDeadlineRef.current = newDeadline;
        setTurnTimeLeft(20);

        const newGameState: AuthoritativeGameState = {
          version: 1,
          sequenceNumber: newSeq,
          gameStatus: 'playing',
          currentTurn: nextTurnRole,
          turnStartedAt: Date.now(),
          turnDeadline: newDeadline,
          turnDuration: 20,
          hostScore: coinsRef.current.filter((c) => c.type === 'white' && c.isPocketed).length,
          guestScore: coinsRef.current.filter((c) => c.type === 'black' && c.isPocketed).length,
          queenState: toAuthoritativeQueenState(queenState, isHost),
          coins: authCoins,
          striker: {
            x: 400,
            y: nextTurnRole === 'host' ? PLAYER_BASELINE_Y : BOT_BASELINE_Y,
            vx: 0,
            vy: 0,
            isPocketed: false,
          },
        };

        if (activeRoom.gameId) {
          updateRoomGameState(activeRoom.gameId, newGameState, nextTurnRole);
        }
      }
    }, 250);

    return () => {
      clearInterval(interval);
      lastTickedSecondRef.current = -1;
    };
  }, [screen, isStrikerMoving, gameOverResult, spawnFloatingScore, activeRoom, playerName, playerWhitePocketed, botBlackPocketed, queenState]);

  /* ==========================================================================
     MATCH CONCLUDED SOUND EFFECTS (FIRECRACKERS FOR WINNER, SOMBRE FOR LOSER)
     ========================================================================== */
  useEffect(() => {
    if (!gameOverResult) return;
    if (gameOverResult.winner === 'player') {
      soundEngine.playVictory();
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

    if (pullDist > 12) {
      dragTrackingRef.current.hasDragged = true;
    }

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

      if (matchmakingMode === 'PRIVATE_ROOM' && activeRoom.gameId) {
        const now = Date.now();
        if (now - lastDragBroadcastRef.current >= 35) {
          lastDragBroadcastRef.current = now;
          const isHost = localRoleRef.current === 'host';
          const worldStrikerX = isHost ? s.x : 800 - s.x;
          const worldDirX = isHost ? dirX : -dirX;
          const worldDirY = isHost ? dirY : -dirY;
          const worldPullX = isHost ? pullX : -pullX;
          const worldPullY = isHost ? pullY : -pullY;

          broadcastLiveStreamState(activeRoom.gameId, {
            liveAiming: {
              shooterRole: localRoleRef.current,
              strikerX: worldStrikerX,
              isDragging: true,
              power,
              dirX: worldDirX,
              dirY: worldDirY,
              pullX: worldPullX,
              pullY: worldPullY,
              pullDist: clampedPull,
              timestamp: now,
            },
          });
        }
      }
    } else {
      setDragForce({
        pullDist: 0,
        power: 0,
        dirX: 0,
        dirY: -1,
        pullX: 0,
        pullY: 0,
      });

      if (matchmakingMode === 'PRIVATE_ROOM' && activeRoom.gameId) {
        const isHost = localRoleRef.current === 'host';
        const worldStrikerX = isHost ? s.x : 800 - s.x;

        broadcastLiveStreamState(
          activeRoom.gameId,
          {
            liveAiming: {
              shooterRole: localRoleRef.current,
              strikerX: worldStrikerX,
              isDragging: false,
              power: 0,
              dirX: 0,
              dirY: isHost ? -1 : 1,
              pullX: 0,
              pullY: 0,
              pullDist: 0,
              timestamp: Date.now(),
            },
            isReleaseEvent: true,
          },
          true
        );
      }
    }
  }, [matchmakingMode, activeRoom.gameId, notifyActivity]);

  const handlePointerDownOnCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    notifyActivity();
    if (currentTurn !== 'player' || isStrikerMoving || isStrikerAnimating) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = BOARD_SIZE / rect.width;
    const clickX = (e.clientX - rect.left) * scale;
    const clickY = (e.clientY - rect.top) * scale;

    const s = strikerRef.current;
    const distToStriker = Math.hypot(clickX - s.x, clickY - s.y);

    // Require touching/clicking directly on or within close proximity of the striker
    if (distToStriker <= STRIKER_RADIUS * 2.5) {
      dragTrackingRef.current = {
        active: true,
        touchStartX: e.clientX,
        touchStartY: e.clientY,
        currentPointerX: e.clientX,
        currentPointerY: e.clientY,
        touchStartTime: Date.now(),
        hasDragged: false,
      };

      setIsDraggingStriker(true);
      updateDragFromPointer(e.clientX, e.clientY);
    }
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!dragTrackingRef.current.active) return;
      notifyActivity();
      dragTrackingRef.current.currentPointerX = e.clientX;
      dragTrackingRef.current.currentPointerY = e.clientY;
      updateDragFromPointer(e.clientX, e.clientY);
    };

    // Strict pointer cancel handler: never ever shoots!
    const handleGlobalPointerCancel = () => {
      if (!dragTrackingRef.current.active) return;
      dragTrackingRef.current.active = false;
      dragTrackingRef.current.hasDragged = false;
      setIsDraggingStriker(false);
      setDragForce({
        pullDist: 0,
        power: 0,
        dirX: 0,
        dirY: -1,
        pullX: 0,
        pullY: 0,
      });

      if (matchmakingMode === 'PRIVATE_ROOM' && activeRoom.gameId) {
        const isHost = localRoleRef.current === 'host';
        const worldStrikerX = isHost ? strikerRef.current.x : 800 - strikerRef.current.x;
        broadcastLiveStreamState(
          activeRoom.gameId,
          {
            liveAiming: {
              shooterRole: localRoleRef.current,
              strikerX: worldStrikerX,
              isDragging: false,
              power: 0,
              dirX: 0,
              dirY: isHost ? -1 : 1,
              pullX: 0,
              pullY: 0,
              pullDist: 0,
              timestamp: Date.now(),
            },
            isReleaseEvent: true,
          },
          true
        );
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (!dragTrackingRef.current.active) return;
      const wasActive = dragTrackingRef.current.active;
      const hadDragged = dragTrackingRef.current.hasDragged;
      dragTrackingRef.current.active = false;
      dragTrackingRef.current.hasDragged = false;
      setIsDraggingStriker(false);

      if (!wasActive) return;

      // RULE 1: THE STRIKER SHOULD NEVER EVER AUTOMATICALLY SHOOT AT ANY CONDITION
      if (currentTurnRef.current !== 'player' || isStrikerMoving || isTurnInProgressRef.current) {
        setDragForce({
          pullDist: 0,
          power: 0,
          dirX: 0,
          dirY: -1,
          pullX: 0,
          pullY: 0,
        });
        return;
      }

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

      // Strict intentional shot release criteria:
      // - Pointer was actively dragged (hadDragged === true)
      // - Substantial pullback distance (pullDist >= 26)
      // - Pulling backward toward player baseline (pullY >= 4)
      const isIntentionalShot =
        hadDragged &&
        pullDist >= 26 &&
        pullY >= 4;

      if (isIntentionalShot) {
        const clampedPull = Math.min(MAX_DRAG_DIST, pullDist);
        const t = clampedPull / MAX_DRAG_DIST;
        const power = Math.pow(t, 1.35);

        if (power >= 0.08) {
          const impulseSpeed = power * MAX_STRIKE_VELOCITY;
          const pullAngle = Math.atan2(pullY, pullX);
          const shotAngle = pullAngle + Math.PI;

          isTurnInProgressRef.current = true;
          setIsStrikerMoving(true);
          shotStartTimeRef.current = Date.now();

          strikerRef.current.vx = Math.cos(shotAngle) * impulseSpeed;
          strikerRef.current.vy = Math.sin(shotAngle) * impulseSpeed;

          soundEngine.playStrikerHit(power);

          // Broadcast shot to Firestore for real-time 2-player multiplayer
          if (activeRoom.gameId && screen === 'gameplay') {
            const isHost = localRoleRef.current === 'host';
            const shooterRole: 'host' | 'guest' = localRoleRef.current;
            const newShotSeq = (lastShotSequenceRef.current || 0) + 1;
            lastShotSequenceRef.current = newShotSeq;

            const worldStrikerX = isHost ? s.x : 800 - s.x;
            const worldStrikerY = isHost ? s.y : 800 - s.y;
            const worldVx = isHost ? strikerRef.current.vx : -strikerRef.current.vx;
            const worldVy = isHost ? strikerRef.current.vy : -strikerRef.current.vy;

            const authCoins: AuthoritativeCoin[] = coinsRef.current.map((c) => ({
              id: c.id,
              type: c.type,
              x: Math.round((isHost ? c.x : 800 - c.x) * 100) / 100,
              y: Math.round((isHost ? c.y : 800 - c.y) * 100) / 100,
              vx: Math.round((isHost ? c.vx : -c.vx) * 100) / 100,
              vy: Math.round((isHost ? c.vy : -c.vy) * 100) / 100,
              isPocketed: c.isPocketed,
            }));

            const lastShotObj: AuthoritativeShot = {
              shooterName: playerName,
              shooterRole,
              strikerX: worldStrikerX,
              strikerY: worldStrikerY,
              vx: worldVx,
              vy: worldVy,
              coins: authCoins,
              power,
              timestamp: Date.now(),
              sequenceNumber: newShotSeq,
            };

            const currentSeq = (authoritativeSequenceRef.current || 0) + 1;
            authoritativeSequenceRef.current = currentSeq;

            const hostScore = isHost ? playerWhitePocketed : botBlackPocketed;
            const guestScore = isHost ? botBlackPocketed : playerWhitePocketed;

            const now = Date.now();
            const gameStateWithShot: AuthoritativeGameState = {
              version: 1,
              sequenceNumber: currentSeq,
              gameStatus: 'playing',
              currentTurn: shooterRole,
              turnStartedAt: now,
              turnDeadline: now + 20000,
              turnDuration: 20,
              hostScore,
              guestScore,
              queenState: toAuthoritativeQueenState(queenState, isHost),
              coins: authCoins,
              striker: {
                x: worldStrikerX,
                y: worldStrikerY,
                vx: worldVx,
                vy: worldVy,
                isPocketed: false,
              },
              lastShot: lastShotObj,
              liveAiming: {
                shooterRole,
                strikerX: worldStrikerX,
                isDragging: false,
                power: 0,
                dirX: 0,
                dirY: isHost ? -1 : 1,
                pullX: 0,
                pullY: 0,
                pullDist: 0,
                timestamp: now,
              },
            };

            updateRoomGameState(activeRoom.gameId, gameStateWithShot);
          }
        }
      }

      setDragForce({
        pullDist: 0,
        power: 0,
        dirX: 0,
        dirY: -1,
        pullX: 0,
        pullY: 0,
      });

      // If no intentional shot was released, immediately clear aiming on opponent's screen
      if (!isIntentionalShot && matchmakingMode === 'PRIVATE_ROOM' && activeRoom.gameId) {
        const isHost = localRoleRef.current === 'host';
        const worldStrikerX = isHost ? s.x : 800 - s.x;
        broadcastLiveStreamState(
          activeRoom.gameId,
          {
            liveAiming: {
              shooterRole: localRoleRef.current,
              strikerX: worldStrikerX,
              isDragging: false,
              power: 0,
              dirX: 0,
              dirY: isHost ? -1 : 1,
              pullX: 0,
              pullY: 0,
              pullDist: 0,
              timestamp: Date.now(),
            },
            isReleaseEvent: true,
          },
          true
        );
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerCancel);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerCancel);
    };
  }, [updateDragFromPointer]);

  // Baseline positioning slider
  const handleBaselineSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    notifyActivity();
    if (currentTurn !== 'player' || isStrikerMoving || isStrikerAnimating) return;
    const newX = parseFloat(e.target.value);
    setStrikerX(newX);
    strikerRef.current.x = newX;
    strikerRef.current.y = PLAYER_BASELINE_Y;

    if (matchmakingMode === 'PRIVATE_ROOM' && activeRoom.gameId) {
      const now = Date.now();
      if (now - lastSliderBroadcastRef.current >= 45) {
        lastSliderBroadcastRef.current = now;
        const isHost = localRoleRef.current === 'host';
        const worldStrikerX = isHost ? newX : 800 - newX;
        broadcastLiveStreamState(activeRoom.gameId, {
          liveAiming: {
            shooterRole: localRoleRef.current,
            strikerX: worldStrikerX,
            isDragging: false,
            power: 0,
            dirX: 0,
            dirY: isHost ? -1 : 1,
            pullX: 0,
            pullY: 0,
            pullDist: 0,
            timestamp: now,
          },
        });
      }
    }
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

      // Update smooth striker return animation if active
      const anim = strikerReturnAnimRef.current;
      if (anim.active) {
        const elapsed = performance.now() - anim.startTime;
        const progress = Math.min(1, elapsed / anim.duration);
        const easeProgress = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const s = strikerRef.current;
        s.x = anim.startX + (anim.targetX - anim.startX) * easeProgress;
        s.y = anim.startY + (anim.targetY - anim.startY) * easeProgress;

        if (progress >= 1) {
          s.x = anim.targetX;
          s.y = anim.targetY;
          anim.active = false;
          setIsStrikerAnimating(false);
        }
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
      // REQUEST 1 & 2: AIM TRAJECTORY WITH EXACTLY 4 WHITE DOTS
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

        // Backward pull indicator line
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

        // Power Arrow
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

        // REQUEST 2: EXACTLY 4 WHITE DOTS IN AIM TRAJECTORY LINE
        const dotStartDist = STRIKER_RADIUS + arrowLength + 14;
        const dotSpacing = 22;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#FFFFFF';

        for (let i = 0; i < 4; i++) {
          const dist = dotStartDist + i * dotSpacing;
          const dotX = striker.x + dragForce.dirX * dist;
          const dotY = striker.y + dragForce.dirY * dist;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // OPPONENT AIM TRAJECTORY WITH EXACTLY 4 WHITE DOTS (Real-time live multiplayer)
      const isOpponentAimFresh = opponentDragForce.active && (Date.now() - (lastOpponentAimTimeRef.current || 0) < 400);
      if (opponentDragForce.active && !isOpponentAimFresh) {
        setOpponentDragForce({
          active: false,
          power: 0,
          dirX: 0,
          dirY: 1,
          pullX: 0,
          pullY: 0,
          pullDist: 0,
        });
      }
      if (isOpponentAimFresh && opponentDragForce.power > 0.02 && currentTurnRef.current === 'bot' && !isStrikerMoving) {
        ctx.save();

        const oppStriker = strikerRef.current;
        const minCircleRadius = STRIKER_RADIUS + 8;
        const maxCircleRadius = 138;
        const currentCircleRadius = minCircleRadius + opponentDragForce.power * (maxCircleRadius - minCircleRadius);

        const circleGrad = ctx.createRadialGradient(
          oppStriker.x,
          oppStriker.y,
          STRIKER_RADIUS,
          oppStriker.x,
          oppStriker.y,
          currentCircleRadius
        );
        circleGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        circleGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0.32)');
        circleGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');

        ctx.beginPath();
        ctx.arc(oppStriker.x, oppStriker.y, currentCircleRadius, 0, Math.PI * 2);
        ctx.fillStyle = circleGrad;
        ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.stroke();

        // Backward pull indicator line
        const oppPullTargetX = oppStriker.x + (opponentDragForce.pullX || 0);
        const oppPullTargetY = oppStriker.y + (opponentDragForce.pullY || 0);

        ctx.beginPath();
        ctx.setLineDash([6, 5]);
        ctx.moveTo(oppStriker.x, oppStriker.y);
        ctx.lineTo(oppPullTargetX, oppPullTargetY);
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.7)';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Power Arrow
        const arrowLength = 34 + opponentDragForce.power * 68;
        const arrowStartX = oppStriker.x + opponentDragForce.dirX * (STRIKER_RADIUS + 2);
        const arrowStartY = oppStriker.y + opponentDragForce.dirY * (STRIKER_RADIUS + 2);
        const arrowEndX = oppStriker.x + opponentDragForce.dirX * (STRIKER_RADIUS + arrowLength);
        const arrowEndY = oppStriker.y + opponentDragForce.dirY * (STRIKER_RADIUS + arrowLength);

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

        const oppShotAngle = Math.atan2(opponentDragForce.dirY, opponentDragForce.dirX);
        const headSize = 13;
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowEndY);
        ctx.lineTo(
          arrowEndX - Math.cos(oppShotAngle - 0.45) * headSize,
          arrowEndY - Math.sin(oppShotAngle - 0.45) * headSize
        );
        ctx.lineTo(
          arrowEndX - Math.cos(oppShotAngle + 0.45) * headSize,
          arrowEndY - Math.sin(oppShotAngle + 0.45) * headSize
        );
        ctx.closePath();
        ctx.fillStyle = '#FFE600';
        ctx.fill();

        // EXACTLY 4 WHITE DOTS IN OPPONENT AIM TRAJECTORY LINE
        const dotStartDist = STRIKER_RADIUS + arrowLength + 14;
        const dotSpacing = 22;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#FFFFFF';

        for (let i = 0; i < 4; i++) {
          const dist = dotStartDist + i * dotSpacing;
          const dotX = oppStriker.x + opponentDragForce.dirX * dist;
          const dotY = oppStriker.y + opponentDragForce.dirY * dist;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
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
  }, [runPhysicsStep, checkTurnSettlement, isDraggingStriker, dragForce, opponentDragForce, isStrikerMoving]);

  /* ==========================================================================
     WALLET DEPOSIT & WITHDRAW HANDLERS
     ========================================================================== */
  const handleStartDepositPayment = (amount: number) => {
    setDepositPaymentAmount(amount);
    setActiveModal(null);
  };

  const handleCustomWithdrawalSubmit = async (e: React.FormEvent) => {
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

    const res = await submitWithdrawalRequest({
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
          <div
            className={`w-12 h-12 rounded-lg bg-[#2768A3] border-2 flex items-center justify-center shadow-md overflow-hidden relative transition-all ${
              currentTurn === 'bot'
                ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/30'
                : 'border-[#5497D7]'
            }`}
          >
            <User className="w-8 h-8 text-neutral-200 fill-neutral-200" />
            {/* Turn countdown badge on opponent card */}
            {currentTurn === 'bot' && !isStrikerMoving && (
              <div className="absolute top-0 right-0 bg-neutral-950/85 text-amber-300 border-b border-l border-amber-500/80 text-[10px] font-black rounded-bl px-1 py-0.5 tabular-nums leading-none shadow">
                {turnTimeLeft}s
              </div>
            )}
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
          {/* Coin Counter: Styled to match authentic board coin for Opponent */}
          <div className="flex items-center gap-1.5 pl-0.5 mt-0.5">
            <span className="font-display font-black text-base text-white tabular-nums">
              {localRole === 'host' ? botBlackPocketed : playerWhitePocketed}
            </span>
            <ScoreboardCarromCoin type={localRole === 'host' ? 'black' : 'white'} size={20} />
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
            {/* Turn countdown badge on player card */}
            {currentTurn === 'player' && !isStrikerMoving && (
              <div className="absolute top-0 right-0 bg-neutral-950/85 text-emerald-300 border-b border-l border-emerald-500/80 text-[10px] font-black rounded-bl px-1 py-0.5 tabular-nums leading-none shadow">
                {turnTimeLeft}s
              </div>
            )}
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
          {/* Coin Counter: Styled to match authentic board coin for Player */}
          <div className="flex items-center gap-1.5 pr-0.5 mt-0.5">
            {queenState === 'covered_player' && (
              <ScoreboardCarromCoin type="queen" size={16} />
            )}
            <ScoreboardCarromCoin type={localRole === 'host' ? 'white' : 'black'} size={20} />
            <span className="font-display font-black text-base text-white tabular-nums">
              {localRole === 'host' ? playerWhitePocketed : botBlackPocketed}
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

          {/* CENTER CANVAS COUNTDOWN CARD - EXCLUSIVE TO ACTIVE LOCAL PLAYER'S TURN */}
          {!isStrikerMoving && !isTurnInProgressRef.current && currentTurn === 'player' && turnTimeLeft <= 10 && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
              <div className="flex flex-col items-center justify-center rounded-3xl px-8 py-5 bg-[#3c1414]/90 border-2 border-red-500/90 text-red-100 ring-4 ring-red-500/40 scale-105 animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.6)] backdrop-blur-md min-w-[230px]">
                <span className="text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-0.5 drop-shadow-sm">
                  YOUR TURN
                </span>
                <div className="flex items-baseline justify-center gap-1 my-1">
                  <span className="font-display font-black text-7xl tracking-tight tabular-nums drop-shadow-2xl text-white">
                    {turnTimeLeft}
                  </span>
                  <span className="text-2xl font-black text-neutral-300">s</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-red-200">
                  <span className="text-amber-400 text-sm">⚠️</span>
                  <span>Striking timer running out!</span>
                </div>
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
      <div className="relative z-10 w-full max-w-[460px] mx-auto px-5 pb-5 pt-1 flex items-center justify-end">

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

            {/* Matchmaking Status CTA */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-center gap-2 text-amber-400 font-semibold text-xs animate-pulse bg-amber-400/10 border border-amber-400/20 py-2.5 rounded-xl">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Waiting for Player 2 to join...</span>
              </div>
              <div>
                <button
                  onClick={async () => {
                    if (activeRoom.gameId) {
                      await cancelMultiplayerRoom(activeRoom.gameId);
                    }
                    setScreen('create_game');
                  }}
                  className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs border border-neutral-700 transition-all active:scale-95 shadow-md"
                >
                  Cancel / Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- JOIN GAME MODAL --- */}
      {screen === 'join_game' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <div className="border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-display font-extrabold text-xl text-white">Join Game Room</h3>
                <p className="text-xs text-neutral-400">Enter the unique Game ID provided by your opponent</p>
              </div>
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
                  placeholder="Enter 6-digit Room Code"
                  value={joinCodeInput}
                  onChange={(e) => {
                    setJoinCodeInput(e.target.value);
                    setJoinRoomErrorMsg(null);
                  }}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 font-mono font-bold tracking-widest uppercase focus:border-amber-400 focus:outline-none"
                />
                {joinRoomErrorMsg && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 animate-shake">
                    ⚠️ {joinRoomErrorMsg}
                  </p>
                )}
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
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xs w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-2xl relative cursor-default"
          >
            <div className="border-b border-neutral-800 pb-2">
              <h3 className="font-display font-bold text-lg text-white">Game Menu</h3>
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
                  Deposit Funds
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

              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2 px-3 mt-1 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition-colors"
              >
                Close Menu
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
                onClick={async () => {
                  if (matchmakingMode === 'PRIVATE_ROOM' && activeRoom.gameId) {
                    await cancelMultiplayerRoom(activeRoom.gameId);
                  }
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

          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all ${
            gameOverResult.winner === 'player' ? 'bg-black/55 backdrop-blur-sm' : 'bg-black/85 backdrop-blur-md'
          }`}>
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
                {rematchPrompt.requestedBy && rematchPrompt.requestedBy !== playerName ? (
                  <>
                    <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                      <RotateCcw className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-black text-xl text-white">
                        {rematchPrompt.type === 'rematch' ? 'Rematch Requested' : 'Restart Requested'}
                      </h3>
                      <p className="text-xs text-neutral-300">
                        <span className="font-bold text-amber-400">{rematchPrompt.requestedBy}</span> wants to {rematchPrompt.type === 'rematch' ? 'rematch' : 'restart'} for ₹{activeRoom.betAmount || selectedBet}!
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={async () => {
                          if (activeRoom.gameId) {
                            await respondMultiplayerRematch(activeRoom.gameId, 'APPROVED');
                          }
                          setRematchPrompt({ type: 'rematch', status: 'approved' });
                          setTimeout(() => {
                            setGameOverResult(null);
                            setRematchPrompt(null);
                            handleRematch();
                          }, 800);
                        }}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                      >
                        APPROVE REMATCH
                      </button>
                      <button
                        onClick={async () => {
                          if (activeRoom.gameId) {
                            await respondMultiplayerRematch(activeRoom.gameId, 'REJECTED');
                          }
                          setRematchPrompt({ type: 'rematch', status: 'declined' });
                          setTimeout(() => {
                            setGameOverResult(null);
                            setRematchPrompt(null);
                            setScreen('create_game');
                          }, 1200);
                        }}
                        className="w-full py-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs transition-all active:scale-95"
                      >
                        REJECT
                      </button>
                    </div>
                  </>
                ) : (
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

                    {/* Opponent Decision Banner */}
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

      {/* --- INSUFFICIENT BALANCE NOTIFICATION MODAL --- */}
      {insufficientBalanceNotice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
              <Coins className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-xl text-white">Insufficient Real Balance</h3>
              <p className="text-xs text-neutral-300">
                You need ₹{insufficientBalanceNotice.required} to play this match, but your current balance is ₹{insufficientBalanceNotice.available}.
              </p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 text-xs text-left space-y-2">
              <div className="flex justify-between items-center text-neutral-400">
                <span>Required Entry Fee</span>
                <span className="font-bold text-white">₹{insufficientBalanceNotice.required}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-400">
                <span>Available Real Balance</span>
                <span className="font-bold text-amber-400">₹{insufficientBalanceNotice.available}</span>
              </div>
              <div className="border-t border-neutral-800 pt-1.5 flex justify-between items-center text-red-400 font-bold">
                <span>Shortfall Needed</span>
                <span>₹{insufficientBalanceNotice.required - insufficientBalanceNotice.available}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const shortfall = Math.max(50, insufficientBalanceNotice.required - insufficientBalanceNotice.available);
                  setInsufficientBalanceNotice(null);
                  setDepositPaymentAmount(shortfall);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/25 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Add Cash & Deposit Now
              </button>
              <button
                onClick={() => setInsufficientBalanceNotice(null)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white font-bold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
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
            if (window.location.pathname !== '/' || window.location.hash || window.location.search) {
              try {
                window.history.pushState(null, '', '/');
              } catch {
                // Ignore history error
              }
            }
          }}
        />
      )}
    </div>
  );
}
