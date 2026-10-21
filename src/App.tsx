/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, RotateCcw, Code, BookOpen, Wind, Sparkles, Download, Check, 
  Layers, Activity, Sun, Moon, Sliders, Zap, Cpu, Compass, Flame, HelpCircle, 
  Triangle, Info, Presentation, Volume2, VolumeX, Eye, ArrowRight, Gauge, 
  Crosshair, Radio, ShieldAlert, Award, Maximize2, Minimize2, PenTool, 
  Camera, Undo, Trash2, Circle, ArrowUpRight, Scale, Globe, Orbit, MessageSquare,
  FileText, Copy, ExternalLink, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';

// --- Particle Definition for Full 3D Multi-Geometry Vortex Math ---
interface Particle3D {
  x: number;
  y: number;
  z: number;
  radius: number;
  angle: number;
  height: number;
  rotSpeed: number;
  upSpeed: number;
  vx?: number;
  vy?: number;
  vz?: number;
  color: [number, number, number];
  size: number;
  alpha: number;
  coneLevel?: 'upper' | 'lower'; // For Schauberger double-cone
}

interface ChartPoint {
  time: number;
  count: number;
}

// Vortex Types (Specific physical phenomena with real proportions)
type VortexGeometryType = 'tornado' | 'schauberger' | 'water' | 'galaxy' | 'torus';

// Annotation line for whiteboard drawing
interface DrawingStroke {
  type: 'freehand' | 'arrow' | 'circle' | 'text';
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
  color: string;
  size: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Navigation & General state
  const [activeTab, setActiveTab] = useState<'simulator' | 'code-blocks' | 'geometry' | 'comparison' | 'script' | 'scales'>('simulator');
  const [theme, setTheme] = useState<'dark' | 'beamer'>('dark');
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Simulation Running State (Play / Pause)
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(0.12); // Calm, observable slow-mo default

  // Vortex Physical Geometry Type
  const [vortexType, setVortexType] = useState<VortexGeometryType>('schauberger');
  const [currentMode, setCurrentMode] = useState<'IMPLOSION' | 'EXPLOSION'>('IMPLOSION');
  const [particleStyle, setParticleStyle] = useState<'filigran' | 'fein' | 'normal'>('filigran');

  // Visual Overlays & Toggles
  const [showGroundGrid, setShowGroundGrid] = useState(true);
  const [showCenterAxis, setShowCenterAxis] = useState(true);
  const [showFunnelEnvelope, setShowFunnelEnvelope] = useState(true);
  const [showForceVectors, setShowForceVectors] = useState(true); // Centripetal vs Centrifugal arrows
  const [showEnergyLines, setShowEnergyLines] = useState(true);
  const [showProfileHUD, setShowProfileHUD] = useState(true);
  const [comicFilter, setComicFilter] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Whiteboard / Annotation Drawing Mode
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawTool, setDrawTool] = useState<'pen' | 'arrow' | 'circle' | 'text'>('pen');
  const [drawColor, setDrawColor] = useState('#00f0ff');
  const [drawSize, setDrawSize] = useState(2.5);
  const [selectedStampText, setSelectedStampText] = useState('F_z = m·v²/r');
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const currentStroke = useRef<DrawingStroke | null>(null);
  const isDrawing = useRef(false);

  // Interactive 3D Camera Angles
  const [cameraPreset, setCameraPreset] = useState<'3d-orbit' | 'oben' | 'seite' | 'ride'>('3d-orbit');
  const [camPitch, setCamPitch] = useState(0.35); // Pitch (X tilt)
  const [camYaw, setCamYaw] = useState(0.3);      // Yaw (Y rotation)
  const isDraggingCam = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Fun physics sliders
  const [spawnRate, setSpawnRate] = useState<number>(6);
  const [rotSpeedVal, setRotSpeedVal] = useState<number>(0.045);
  const [pullFactor, setPullFactor] = useState<number>(0.993);
  const [upwardSpeed, setUpwardSpeed] = useState<number>(1.2);
  const [hoveredSlider, setHoveredSlider] = useState<string | null>(null);

  // Metrics
  const [particleCount, setParticleCount] = useState<number>(0);
  const [fps, setFps] = useState<number>(60);
  const [history, setHistory] = useState<ChartPoint[]>([]);

  // Avatar SproutBot State
  const [avatarSpeech, setAvatarSpeech] = useState<string>(
    'Willkommen im IT-AG Vortex-Labor! Hier erforschen wir die Geometrie und das Kräftepaar aus Zentripetal- und Zentrifugalkraft.'
  );
  const [isAvatarTalking, setIsAvatarTalking] = useState<boolean>(false);
  const [avatarMood, setAvatarMood] = useState<'happy' | 'thinking' | 'explaining'>('happy');

  // NotebookLM / Student Notes Integration
  const [showNotebookModal, setShowNotebookModal] = useState<boolean>(false);
  const [notebookNotes, setNotebookNotes] = useState<string>('');

  // Python-Baukasten Code Tier
  const [selectedCodeTier, setSelectedCodeTier] = useState<'35-lines' | '90-lines' | 'unity'>('35-lines');
  const [copiedCode, setCopiedCode] = useState(false);

  // Slide Deck Presentation Mode
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Audio Synthesizer
  const playSynthSound = (type: 'spawn' | 'whoosh' | 'click' | 'toggle') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'spawn') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'whoosh') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
      }
    } catch {
      // AudioContext unavailable
    }
  };

  // Text-To-Speech (TTS) for German student explanations
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.onstart = () => setIsAvatarTalking(true);
    utterance.onend = () => setIsAvatarTalking(false);
    utterance.onerror = () => setIsAvatarTalking(false);
    window.speechSynthesis.speak(utterance);
  };

  // High-contrast color palettes (Crucial: Diaprojektor-Modus has crisp dark lines on white/blueprint ground!)
  const currentPalette = useMemo(() => {
    if (theme === 'beamer') {
      // High-contrast School Projector Mode (Dark lines on light background)
      return {
        bg: '#f8fafc',
        grid: '#cbd5e1',
        gridMajor: '#94a3b8',
        axis: '#0f172a',
        funnel: '#0284c7',
        funnelFill: 'rgba(2, 132, 199, 0.06)',
        centripetal: '#2563eb',  // Deep Blue
        centrifugal: '#dc2626',  // Vivid Red
        energy: '#4338ca',       // Indigo
        particles: [
          [15, 23, 42],    // Dark Slate
          [37, 99, 235],   // Vivid Blue
          [220, 38, 38],   // Crimson
          [13, 148, 136]   // Deep Teal
        ] as [number, number, number][]
      };
    }
    // Dark Sci-Fi Cyber Mode
    return {
      bg: '#04060a',
      grid: '#1e293b',
      gridMajor: '#334155',
      axis: '#38bdf8',
      funnel: '#00f0ff',
      funnelFill: 'rgba(0, 240, 255, 0.04)',
      centripetal: '#00f0ff',  // Cyan
      centrifugal: '#ff0055',  // Bright Red / Magenta
      energy: '#818cf8',       // Indigo Neon
      particles: [
        [0, 240, 255],     // Cyan
        [255, 0, 128],     // Fuchsia
        [255, 220, 0],     // Gold
        [100, 255, 150]    // Emerald
      ] as [number, number, number][]
    };
  }, [theme]);

  // Real-world Physical Scale Profiles for the selected vortex geometry
  const geometryProfile = useMemo(() => {
    switch (vortexType) {
      case 'schauberger':
        return {
          title: 'Schauberger Doppeltrichter (Sanduhr-Prinzip)',
          subtitle: 'Zwei spiegelbildliche Kegel (Konvergenz & Divergenz)',
          h1: 150, // Upper funnel height mm
          h2: 150, // Lower funnel height mm
          H: 300,  // Total height mm
          rTop: 150, // Opening top mm
          rBottom: 150, // Opening bottom mm
          rMin: 15,  // Throat / Waist constriction mm
          unit: 'mm',
          physicsNote: 'Am engsten Querschnitt (Waist r_min) steigt die Drehzahl drastisch an: Pirouetten-Effekt L = m·v·r = konst.',
          forceText: 'Oben überwiegt Implosion (Zentripetal), unten Expansion (Zentrifugal).'
        };
      case 'tornado':
        return {
          title: 'F5-Tornado (Atmosphärischer Wirbelsturm)',
          subtitle: 'Hoher, steiler Trichter von Wolkenbasis zum Boden',
          h1: 300,
          h2: 0,
          H: 300,
          rTop: 200,
          rBottom: 18,
          rMin: 18,
          unit: 'm',
          physicsNote: 'Unten am Bodenkontakt herrscht maximaler Sog & zerstörerische Fliehkraft.',
          forceText: 'Zentripetal-Sog zieht feuchte Warmluft ein, Zentrifugalkraft schleudert Trümmer aus.'
        };
      case 'water':
        return {
          title: 'Badewannen- & Abflusswirbel',
          subtitle: 'Freier Oberflächenwirbel mit Wirbelkern',
          h1: 120,
          h2: 0,
          H: 120,
          rTop: 90,
          rBottom: 10,
          rMin: 10,
          unit: 'cm',
          physicsNote: 'Potentialwirbel: v(r) ~ 1/r. Im Kern fällt der Druck extrem ab (Luftröhre).',
          forceText: 'Schwerkraft zieht nach unten, Zentrifugalkraft drückt den Wasserspiegel nach außen.'
        };
      case 'galaxy':
        return {
          title: 'Spiralgalaxie (Milchstraße)',
          subtitle: 'Flache kosmische Akkretionsscheibe',
          h1: 15,
          h2: 15,
          H: 30,
          rTop: 260,
          rBottom: 260,
          rMin: 20,
          unit: 'kpc',
          physicsNote: 'Differentieller Umlauf mit supermassivem Schwarzem Loch im Zentrum.',
          forceText: 'Gravitation wirkt als universelle Zentripetalkraft.'
        };
      case 'torus':
      default:
        return {
          title: 'Rauchring & Wirbelring (Torus)',
          subtitle: 'Geschlossene selbsterhaltende Wirbelröhre',
          h1: 80,
          h2: 80,
          H: 160,
          rTop: 140,
          rBottom: 140,
          rMin: 50,
          unit: 'cm',
          physicsNote: 'Zirkulation erzeugt stabilen Vorticity-Ring ohne Druckverlust.',
          forceText: 'Rotationsenergie im Ringkern stabilisiert die Vorwärtsbewegung.'
        };
    }
  }, [vortexType]);

  // 3D Projection Engine: Projects (x, y, z) into 2D screen coordinates
  const project3D = (
    x: number, y: number, z: number,
    pitch: number, yaw: number,
    centerX: number, centerY: number
  ) => {
    // 1. Yaw rotation around Y axis
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // 2. Pitch rotation around X axis
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const y2 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;

    // Perspective foreshortening
    const cameraDist = 650;
    const scale = cameraDist / (cameraDist + z2);

    return {
      x: centerX + x1 * scale,
      y: centerY + y2 * scale,
      z: z2,
      scale: Math.max(0, scale)
    };
  };

  // Main 3D Simulation Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle3D[] = [];
    let lastTime = performance.now();
    let vortexAngleTime = 0;

    // Preset camera angles
    let activePitch = camPitch;
    let activeYaw = camYaw;

    if (cameraPreset === 'oben') {
      activePitch = Math.PI / 2 - 0.05; // Bird's eye
      activeYaw = 0;
    } else if (cameraPreset === 'seite') {
      activePitch = 0.05; // Horizontal side view
      activeYaw = 0;
    }

    // Interactive mouse drag for rotating camera
    const onMouseDown = (e: MouseEvent) => {
      if (isDrawingMode) return;
      isDraggingCam.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingCam.current || isDrawingMode) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setCamYaw(prev => prev + dx * 0.007);
      setCamPitch(prev => Math.max(-1.4, Math.min(1.4, prev + dy * 0.007)));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingCam.current = false;
    };

    // Keyboard controls (Space to toggle pause)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);

    // Particle size mapping
    const getParticlePixelSize = () => {
      if (particleStyle === 'filigran') return 0.9;
      if (particleStyle === 'fein') return 1.4;
      return 2.2;
    };

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (!isPaused) {
        vortexAngleTime += rotSpeedVal * (speedMultiplier / 0.15);
      }

      // Spawning new particles
      if (!isPaused) {
        const pSize = getParticlePixelSize();
        const spawnCount = Math.ceil(spawnRate * (speedMultiplier / 0.15));

        for (let i = 0; i < spawnCount; i++) {
          const color = currentPalette.particles[Math.floor(Math.random() * currentPalette.particles.length)];
          const angle = Math.random() * Math.PI * 2;

          if (vortexType === 'schauberger') {
            // Schauberger Hourglass Double Cone: Spawn in upper or lower cone
            const isUpper = Math.random() > 0.5;
            const startH = isUpper ? -150 - Math.random() * 20 : 150 + Math.random() * 20;
            const startR = 150 + Math.random() * 40;

            particles.push({
              x: 0,
              y: startH,
              z: 0,
              radius: startR,
              angle: angle,
              height: startH,
              rotSpeed: (rotSpeedVal + Math.random() * 0.02) * (currentMode === 'EXPLOSION' ? -1 : 1),
              upSpeed: (isUpper ? upwardSpeed : -upwardSpeed) * (0.8 + Math.random() * 0.4),
              color: color,
              size: pSize,
              alpha: 220,
              coneLevel: isUpper ? 'upper' : 'lower'
            });
          } else if (vortexType === 'galaxy') {
            // Flat galactic accretion disk
            const dist = 30 + Math.random() * 250;
            particles.push({
              x: 0,
              y: (Math.random() - 0.5) * 8,
              z: 0,
              radius: dist,
              angle: angle,
              height: (Math.random() - 0.5) * 8,
              rotSpeed: (0.12 / Math.sqrt(dist / 30)) * rotSpeedVal, // Keplerian orbital speed
              upSpeed: 0,
              color: color,
              size: pSize,
              alpha: 230
            });
          } else {
            // Standard single funnel (Tornado / Water Drain)
            const startR = 170 + Math.random() * 40;
            const startH = 160 + Math.random() * 20;

            particles.push({
              x: 0,
              y: startH,
              z: 0,
              radius: startR,
              angle: angle,
              height: startH,
              rotSpeed: (rotSpeedVal + Math.random() * 0.02) * (currentMode === 'EXPLOSION' ? -1 : 1),
              upSpeed: upwardSpeed * (0.8 + Math.random() * 0.4),
              color: color,
              size: pSize,
              alpha: 240
            });
          }
        }
      }

      // Physics update
      if (!isPaused) {
        const nextParticles: Particle3D[] = [];
        for (const p of particles) {
          if (vortexType === 'schauberger') {
            // Schauberger Double Cone: move toward waist (y=0)
            p.angle += p.rotSpeed * (dt * 60) * (speedMultiplier / 0.15);
            if (p.coneLevel === 'upper') {
              p.height += Math.abs(p.upSpeed) * (dt * 60) * (speedMultiplier / 0.15);
              p.radius *= Math.pow(pullFactor, (dt * 60) * (speedMultiplier / 0.15));
            } else {
              p.height -= Math.abs(p.upSpeed) * (dt * 60) * (speedMultiplier / 0.15);
              p.radius *= Math.pow(pullFactor, (dt * 60) * (speedMultiplier / 0.15));
            }
            p.alpha -= 0.8 * (dt * 60);
          } else if (vortexType === 'galaxy') {
            p.angle += p.rotSpeed * (dt * 60) * (speedMultiplier / 0.15);
            p.radius *= 0.9999;
            p.alpha -= 0.25 * (dt * 60);
          } else {
            // Standard upward / inward spiral
            p.angle += p.rotSpeed * (dt * 60) * (speedMultiplier / 0.15);
            p.height -= p.upSpeed * (dt * 60) * (speedMultiplier / 0.15);
            p.radius *= Math.pow(pullFactor, (dt * 60) * (speedMultiplier / 0.15));
            p.alpha -= 1.1 * (dt * 60);
          }

          p.x = Math.cos(p.angle) * p.radius;
          p.z = Math.sin(p.angle) * p.radius;
          p.y = p.height;

          if (p.alpha > 0 && p.radius >= 3) {
            nextParticles.push(p);
          }
        }
        particles = nextParticles;
        setParticleCount(particles.length);
      }

      // Clear Canvas
      ctx.fillStyle = currentPalette.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const originX = canvas.width / 2;
      const originY = canvas.height / 2 + 15;

      // 1. Perspective 3D Ground Coordinate Grid & Concentric Rings (NO distracting cutting horizon line!)
      if (showGroundGrid) {
        ctx.save();
        const groundY = 170;
        const ringRadii = [60, 120, 180, 240, 300];
        for (const ringR of ringRadii) {
          ctx.beginPath();
          ctx.strokeStyle = currentPalette.grid;
          ctx.lineWidth = 1.0;
          let first = true;
          for (let th = 0; th <= Math.PI * 2 + 0.1; th += 0.15) {
            const rx = Math.cos(th) * ringR;
            const rz = Math.sin(th) * ringR;
            const proj = project3D(rx, groundY, rz, activePitch, activeYaw, originX, originY);
            if (first) { ctx.moveTo(proj.x, proj.y); first = false; }
            else { ctx.lineTo(proj.x, proj.y); }
          }
          ctx.stroke();

          if (ringR === 120 || ringR === 240) {
            const labelProj = project3D(ringR, groundY, 0, activePitch, activeYaw, originX, originY);
            ctx.fillStyle = theme === 'beamer' ? '#334155' : 'rgba(148, 163, 184, 0.7)';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`r = ${ringR}m`, labelProj.x + 4, labelProj.y - 2);
          }
        }

        // Radial coordinate cross
        const axisR = 300;
        for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
          ctx.beginPath();
          ctx.strokeStyle = currentPalette.gridMajor;
          ctx.lineWidth = 1.2;
          const p1 = project3D(0, groundY, 0, activePitch, activeYaw, originX, originY);
          const p2 = project3D(Math.cos(a) * axisR, groundY, Math.sin(a) * axisR, activePitch, activeYaw, originX, originY);
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Trichter-Drahtgitter-Hülle (Envelope matching the vortex type)
      if (showFunnelEnvelope) {
        ctx.save();
        ctx.strokeStyle = currentPalette.funnel;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);

        if (vortexType === 'schauberger') {
          // Hourglass double cone (Upper cone: -160 to 0, Lower cone: 0 to 160)
          for (let h = -160; h <= 160; h += 40) {
            const distFromWaist = Math.abs(h);
            const rAtH = 15 + Math.pow(distFromWaist / 160, 0.8) * 190;
            ctx.beginPath();
            let first = true;
            for (let th = 0; th <= Math.PI * 2 + 0.1; th += 0.25) {
              const fx = Math.cos(th) * rAtH;
              const fz = Math.sin(th) * rAtH;
              const proj = project3D(fx, h, fz, activePitch, activeYaw, originX, originY);
              if (first) { ctx.moveTo(proj.x, proj.y); first = false; }
              else { ctx.lineTo(proj.x, proj.y); }
            }
            ctx.stroke();
          }
        } else if (vortexType === 'tornado') {
          // Narrow tall funnel
          for (let h = -170; h <= 170; h += 35) {
            const normH = (h + 170) / 340;
            const rAtH = 18 + Math.pow(normH, 0.6) * 160;
            ctx.beginPath();
            let first = true;
            for (let th = 0; th <= Math.PI * 2 + 0.1; th += 0.25) {
              const proj = project3D(Math.cos(th) * rAtH, h, Math.sin(th) * rAtH, activePitch, activeYaw, originX, originY);
              if (first) { ctx.moveTo(proj.x, proj.y); first = false; }
              else { ctx.lineTo(proj.x, proj.y); }
            }
            ctx.stroke();
          }
        } else if (vortexType === 'galaxy') {
          // Flat disks
          for (const r of [80, 160, 240, 320]) {
            ctx.beginPath();
            let first = true;
            for (let th = 0; th <= Math.PI * 2 + 0.1; th += 0.2) {
              const proj = project3D(Math.cos(th) * r, 0, Math.sin(th) * r, activePitch, activeYaw, originX, originY);
              if (first) { ctx.moveTo(proj.x, proj.y); first = false; }
              else { ctx.lineTo(proj.x, proj.y); }
            }
            ctx.stroke();
          }
        } else {
          // Standard funnel
          for (let h = -140; h <= 160; h += 45) {
            const normH = (h + 140) / 300;
            const rAtH = 18 + Math.pow(normH, 0.75) * 220;
            ctx.beginPath();
            let first = true;
            for (let th = 0; th <= Math.PI * 2 + 0.1; th += 0.25) {
              const proj = project3D(Math.cos(th) * rAtH, h, Math.sin(th) * rAtH, activePitch, activeYaw, originX, originY);
              if (first) { ctx.moveTo(proj.x, proj.y); first = false; }
              else { ctx.lineTo(proj.x, proj.y); }
            }
            ctx.stroke();
          }
        }
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 3. Central Vertical Rotation Axis (z-Achse / Drehachse)
      if (showCenterAxis) {
        ctx.save();
        const axisTop = project3D(0, -180, 0, activePitch, activeYaw, originX, originY);
        const axisBottom = project3D(0, 190, 0, activePitch, activeYaw, originX, originY);

        ctx.beginPath();
        ctx.strokeStyle = currentPalette.axis;
        ctx.lineWidth = 2.0;
        ctx.moveTo(axisBottom.x, axisBottom.y);
        ctx.lineTo(axisTop.x, axisTop.y);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.fillStyle = currentPalette.axis;
        ctx.moveTo(axisTop.x, axisTop.y - 8);
        ctx.lineTo(axisTop.x - 5, axisTop.y + 6);
        ctx.lineTo(axisTop.x + 5, axisTop.y + 6);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = currentPalette.axis;
        ctx.fillText('z (Drehachse)', axisTop.x + 8, axisTop.y);

        // Center Waist Node
        const centerNode = project3D(0, 0, 0, activePitch, activeYaw, originX, originY);
        ctx.beginPath();
        ctx.arc(centerNode.x, centerNode.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'beamer' ? '#0284c7' : '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      // 4. Force Vectors (Kräftepaar: Zentripetal vs. Zentrifugal)
      if (showForceVectors) {
        ctx.save();
        const sampleR = 140;
        const testAngles = [vortexAngleTime, vortexAngleTime + Math.PI / 2, vortexAngleTime + Math.PI, vortexAngleTime + (3 * Math.PI) / 2];

        for (const ta of testAngles) {
          const px = Math.cos(ta) * sampleR;
          const pz = Math.sin(ta) * sampleR;
          const pt = project3D(px, 0, pz, activePitch, activeYaw, originX, originY);

          // Inward Centripetal Force Vector (F_z -> towards center 0,0,0)
          const inX = Math.cos(ta) * (sampleR - 45);
          const inZ = Math.sin(ta) * (sampleR - 45);
          const ptIn = project3D(inX, 0, inZ, activePitch, activeYaw, originX, originY);

          ctx.beginPath();
          ctx.strokeStyle = currentPalette.centripetal;
          ctx.lineWidth = 2.5;
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(ptIn.x, ptIn.y);
          ctx.stroke();

          // Outward Centrifugal Force Vector (F_cf -> outward)
          const outX = Math.cos(ta) * (sampleR + 45);
          const outZ = Math.sin(ta) * (sampleR + 45);
          const ptOut = project3D(outX, 0, outZ, activePitch, activeYaw, originX, originY);

          ctx.beginPath();
          ctx.strokeStyle = currentPalette.centrifugal;
          ctx.lineWidth = 2.5;
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(ptOut.x, ptOut.y);
          ctx.stroke();

          // Vector labels on first angle
          if (ta === testAngles[0]) {
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = currentPalette.centripetal;
            ctx.fillText('F_z (Sog)', ptIn.x - 22, ptIn.y - 4);

            ctx.fillStyle = currentPalette.centrifugal;
            ctx.fillText('F_cf (Fliehkraft)', ptOut.x + 4, ptOut.y - 4);
          }
        }
        ctx.restore();
      }

      // 5. Distinct Smooth Mathematical Energy Lines (Spiral Streamlines)
      if (showEnergyLines) {
        ctx.save();
        const streamCount = 8;
        for (let s = 0; s < streamCount; s++) {
          const baseA = vortexAngleTime * 0.75 + (s * (2 * Math.PI) / streamCount);

          ctx.beginPath();
          ctx.strokeStyle = currentPalette.energy;
          ctx.lineWidth = 1.2;
          let started = false;

          for (let r = 10; r <= 270; r += 12) {
            const w = baseA + r * 0.012;
            let h = 0;
            if (vortexType === 'schauberger') {
              h = (r - 140) * 0.9;
            } else if (vortexType === 'tornado') {
              h = (270 - r) * 1.1 - 100;
            } else {
              h = (270 - r) * 0.65 - 50;
            }

            const proj = project3D(Math.cos(w) * r, h, Math.sin(w) * r, activePitch, activeYaw, originX, originY);
            if (!started) { ctx.moveTo(proj.x, proj.y); started = true; }
            else { ctx.lineTo(proj.x, proj.y); }
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Clean, Translucent Filigree Stardust Particles
      ctx.save();
      for (const p of particles) {
        const proj = project3D(p.x, p.y, p.z, activePitch, activeYaw, originX, originY);
        if (proj.scale > 0) {
          const drawRadius = Math.max(0.6, p.size * proj.scale);
          ctx.globalAlpha = Math.max(0.2, Math.min(0.9, p.alpha / 255));
          ctx.fillStyle = `rgb(${p.color[0]}, ${p.color[1]}, ${p.color[2]})`;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, drawRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    isPaused, speedMultiplier, vortexType, currentMode, particleStyle,
    showGroundGrid, showCenterAxis, showFunnelEnvelope, showForceVectors,
    showEnergyLines, comicFilter, currentPalette, theme, spawnRate,
    rotSpeedVal, pullFactor, upwardSpeed, camPitch, camYaw, cameraPreset,
    isDrawingMode
  ]);

  // Whiteboard / Annotation Drawing Logic
  const redrawWhiteboard = (ctx: CanvasRenderingContext2D, strokeList: DrawingStroke[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const s of strokeList) {
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.type === 'freehand' && s.points && s.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
      } else if (s.type === 'arrow' && s.start && s.end) {
        ctx.beginPath();
        ctx.moveTo(s.start.x, s.start.y);
        ctx.lineTo(s.end.x, s.end.y);
        ctx.stroke();

        const angle = Math.atan2(s.end.y - s.start.y, s.end.x - s.start.x);
        const headlen = 12;
        ctx.beginPath();
        ctx.moveTo(s.end.x, s.end.y);
        ctx.lineTo(s.end.x - headlen * Math.cos(angle - Math.PI / 6), s.end.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(s.end.x - headlen * Math.cos(angle + Math.PI / 6), s.end.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // Distance text
        const dist = Math.round(Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y));
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`r = ${dist}px`, (s.start.x + s.end.x) / 2 + 5, (s.start.y + s.end.y) / 2 - 5);
      } else if (s.type === 'circle' && s.start && s.end) {
        const radius = Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y);
        ctx.beginPath();
        ctx.arc(s.start.x, s.start.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        const area = Math.round(Math.PI * radius * radius);
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`A = ${area}px²`, s.start.x - 30, s.start.y + radius + 15);
      } else if (s.type === 'text' && s.start && s.text) {
        ctx.font = 'bold 13px monospace';
        ctx.fillText(s.text, s.start.x, s.start.y);
      }
    }
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawing.current = true;
    if (drawTool === 'pen') {
      currentStroke.current = { type: 'freehand', points: [{ x, y }], color: drawColor, size: drawSize };
    } else if (drawTool === 'arrow') {
      currentStroke.current = { type: 'arrow', start: { x, y }, end: { x, y }, color: drawColor, size: drawSize };
    } else if (drawTool === 'circle') {
      currentStroke.current = { type: 'circle', start: { x, y }, end: { x, y }, color: drawColor, size: drawSize };
    } else if (drawTool === 'text') {
      const newStroke: DrawingStroke = { type: 'text', start: { x, y }, text: selectedStampText, color: drawColor, size: drawSize };
      setStrokes(prev => [...prev, newStroke]);
      const ctx = canvas.getContext('2d');
      if (ctx) redrawWhiteboard(ctx, [...strokes, newStroke]);
      isDrawing.current = false;
    }
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentStroke.current) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentStroke.current.type === 'freehand' && currentStroke.current.points) {
      currentStroke.current.points.push({ x, y });
    } else {
      currentStroke.current.end = { x, y };
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      redrawWhiteboard(ctx, [...strokes, currentStroke.current]);
    }
  };

  const handleDrawEnd = () => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    setStrokes(prev => [...prev, currentStroke.current!]);
    currentStroke.current = null;
  };

  // High-Resolution Composite Screenshot
  const captureCompositeScreenshot = () => {
    const mainCanvas = canvasRef.current;
    const drawCanvas = drawingCanvasRef.current;
    if (!mainCanvas) return;

    const merged = document.createElement('canvas');
    merged.width = mainCanvas.width;
    merged.height = mainCanvas.height;
    const mctx = merged.getContext('2d');
    if (!mctx) return;

    // Draw main 3D background
    mctx.drawImage(mainCanvas, 0, 0);
    // Draw whiteboard annotation layer
    if (drawCanvas) {
      mctx.drawImage(drawCanvas, 0, 0);
    }

    // Add watermark
    mctx.fillStyle = theme === 'beamer' ? '#0f172a' : '#ffffff';
    mctx.font = 'bold 12px sans-serif';
    mctx.fillText('IT-AG Vortex Lab 3D • 8. Klasse Physik & Geometrie', 20, merged.height - 20);

    const link = document.createElement('a');
    link.download = `vortex-lab-${vortexType}-${Date.now()}.png`;
    link.href = merged.toDataURL('image/png');
    link.click();
    playSynthSound('click');
  };

  // Fun Math Facts cycling card
  const [funFactIndex, setFunFactIndex] = useState(0);
  const funFacts = useMemo(() => [
    { title: '📐 Kegel vs. Zylinder', text: 'Ein Wirbeltrichter hat das Volumen V = ⅓·π·r²·h. Er fasst exakt ein Drittel eines geraden Zylinders!', icon: 'cone' },
    { title: '⛸️ Pirouetten-Effekt', text: 'Wenn der Eiskunstläufer die Arme anzieht (r halbiert), verdoppelt sich seine Rotationsgeschwindigkeit. Drehimpulserhaltung L = m·v·r!', icon: 'ice' },
    { title: '🌪️ F5-Tornado', text: 'In der Trichterwand rotieren Luftmassen mit über 450 km/h. Die Zentrifugalkraft drückt Trümmer nach außen.', icon: 'wind' },
    { title: '⏳ Schauberger Doppelkonus', text: 'Zwei Trichter begegnen sich an der Kehle: Implosion oben trifft auf Expansion unten!', icon: 'hourglass' },
    { title: '🌌 Kosmische Galaxien', text: 'Auch unsere Milchstraße ist ein rotierender Wirbel mit 100.000 Lichtjahren Durchmesser!', icon: 'galaxy' }
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFunFactIndex(prev => (prev + 1) % funFacts.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [funFacts.length]);

  // Calculated geometry values for the live Trichter-Profil HUD
  const calculatedRadius = Math.round(geometryProfile.rTop * (pullFactor));
  const calculatedArea = Math.round(Math.PI * Math.pow(calculatedRadius, 2));
  const calculatedCircumference = Math.round(2 * Math.PI * calculatedRadius);
  const funnelHeightMeters = geometryProfile.H;

  // Beginner Python Code (35 Lines)
  const pythonMinimal = `# 1. Python Tornado - Minimaler 35-Zeilen Kern (8. Klasse)
import pygame, math, random

pygame.init()
screen = pygame.display.set_mode((800, 600))
clock = pygame.time.Clock()

particles = [] # Liste fuer aktive Partikel

running = True
while running:
    clock.tick(60)
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # Neuen Partikel am Aussenrand erzeugen
    particles.append({
        'r': 200.0,
        'a': random.uniform(0, math.pi * 2),
        'h': 500.0
    })

    # Bewegung berechnen & zeichnen
    screen.fill((10, 15, 25))
    for p in particles[:]:
        p['a'] += 0.05       # Winkel vergroessern (Drehung)
        p['h'] -= 1.8        # Vertikal aufsteigen
        p['r'] *= 0.994      # Sog nach innen (Zentripetalkraft)

        # Polarkoordinaten in X und Y umrechnen
        x = 400 + math.cos(p['a']) * p['r']
        y = p['h']
        pygame.draw.circle(screen, (0, 220, 255), (int(x), int(y)), 2)

        if p['r'] < 5 or p['h'] < 100:
            particles.remove(p) # Speicher freigeben!

    pygame.display.flip()
pygame.quit()`;

  // Standard IT-AG Code (90 Lines Pygame Sprite Engine)
  const pythonPygameEngine = `# 2. Python Pygame Engine - 90 Zeilen mit OOP & Sprites
import pygame, math, random

pygame.init()
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
clock = pygame.time.Clock()

class TornadoParticle(pygame.sprite.Sprite):
    def __init__(self, cx, cy):
        super().__init__()
        self.cx = cx
        self.cy = cy
        self.radius = random.uniform(160, 220)
        self.angle = random.uniform(0, math.pi * 2)
        self.h = HEIGHT - 50
        self.rot_speed = random.uniform(0.04, 0.07)
        self.lift_speed = random.uniform(1.2, 2.0)
        self.pull = 0.993
        self.alpha = 255

        # Visuelles Sprite erstellen
        self.image = pygame.Surface((6, 6), pygame.SRCALPHA)
        pygame.draw.circle(self.image, (0, 240, 255, self.alpha), (3, 3), 3)
        self.rect = self.image.get_rect()

    def update(self):
        self.angle += self.rot_speed
        self.radius *= self.pull
        self.h -= self.lift_speed
        self.alpha -= 1.5

        # Mathematische Koordinatentransformation
        x = self.cx + math.cos(self.angle) * self.radius
        y = self.h
        self.rect.center = (int(x), int(y))

        # Automatisches Aufraeumen (Garbage Collection)
        if self.radius < 4 or self.alpha <= 0 or self.h < 50:
            self.kill() # Entfernt sich selbst aus allen Gruppen!

particle_group = pygame.sprite.Group()

running = True
while running:
    clock.tick(60)
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # Spawn 4 Partikel pro Frame
    for _ in range(4):
        particle_group.add(TornadoParticle(WIDTH // 2, HEIGHT // 2))

    particle_group.update()

    screen.fill((5, 10, 20))
    # Bodenkreis zeichnen
    pygame.draw.ellipse(screen, (30, 45, 70), (WIDTH//2 - 200, HEIGHT - 70, 400, 40), 1)
    particle_group.draw(screen)

    pygame.display.flip()
pygame.quit()`;

  // Unity C# / VFX Graph Breakdown
  const unityBreakdownCode = `// 3. Unity Engine (C# & ComputeShader VFX Graph)
// Im Vergleich zu Python: 35 GB Download, 1.200+ Zeilen Code & Shader-Nodes!
using UnityEngine;
using UnityEngine.VFX;

public class VortexVFXController : MonoBehaviour
{
    [SerializeField] private VisualEffect vfxGraph;
    [SerializeField] private float centripetalPull = 5.4f;
    [SerializeField] private float vortexSpeed = 12.0f;
    [SerializeField] private float funnelHeight = 15.0f;

    void Update()
    {
        // Parameter muessen per String-ID an den GPU-Shader geschickt werden
        vfxGraph.SetFloat("CentripetalForce", centripetalPull);
        vfxGraph.SetFloat("AngularVelocity", vortexSpeed);
        vfxGraph.SetVector3("VortexAxis", Vector3.up);
        
        // GPU Compute Shader berechnet 100.000 Partikel parallel
        // Nachteil fuer die Schule: Formeln liegen versteckt in Shader-Graphen!
    }
}`;

  // Interactive Presentation Slides (with rich SVG illustrations)
  const presentationSlides = useMemo(() => [
    {
      title: 'Folie 1: Was ist ein Wirbelsturm?',
      subtitle: 'Naturphänomen, Drehimpuls & Warum sich Wirbel bilden',
      bulletPoints: [
        'Aufsteigende Warmluft erzeugt starken Unterdruck am Boden (Kamineffekt).',
        'Durch die Erdrotation (Corioliskraft) wird die einströmende Luft in Drehung versetzt.',
        'Im Auge des Wirbels herrscht fast Windstille, in der Trichterwand maximale Verwüstung.'
      ],
      speech: 'Herzlich willkommen zu unserem Vortrag über die Physik und Simulation von Wirbelstürmen. Heute erforschen wir, wie aus einfacher Luftbewegung faszinierende Wirbel entstehen und wie wir sie in Python programmieren.',
      illustration: 'tornado'
    },
    {
      title: 'Folie 2: Der Schauberger Doppeltrichter',
      subtitle: 'Zwei spiegelbildliche Kegel im Kräftegleichgewicht (Sanduhr)',
      bulletPoints: [
        'Ein Trichter steht selten allein: Oben Konvergenz (Implosion), unten Expansion (Zentrifugal).',
        'An der engsten Einschnürung (Waist / Kehle) erreicht das Medium die höchste Drehzahl.',
        'Viktor Schauberger erforschte Wirbel in Gebirgsbächen und Holzschwemmanlagen.'
      ],
      speech: 'Auf dieser Folie sehen wir das Schauberger-Doppeltrichter-Prinzip. Wie bei einer Sanduhr begegnen sich zwei Konusse: Der obere Trichter saugt nach innen, der untere entlässt den Wirbel wieder nach außen.',
      illustration: 'schauberger'
    },
    {
      title: 'Folie 3: Das Kräftepaar (8. Klasse Physik)',
      subtitle: 'Zentripetalkraft vs. Zentrifugalkraft (Sog vs. Fliehkraft)',
      bulletPoints: [
        'Zentripetalkraft F_z = m · v² / r : Zieht die Partikel radial nach innen zum Auge.',
        'Zentrifugalkraft F_cf = m · v² / r : Scheinbare Fliehkraft, die Partikel nach außen drückt.',
        'Kräftegleichgewicht bestimmt den Trichterradius r auf jeder Höhe z.'
      ],
      speech: 'In der 8. Klasse lernen wir das Kräftepaar kennen: Die Zentripetalkraft zieht jeden Körper auf eine Kreisbahn. Halbiert sich der Radius, vervierfacht sich die nötige Kraft! Die Trägheit spüren wir als Fliehkraft.',
      illustration: 'forces'
    },
    {
      title: 'Folie 4: Die Geometrie des Trichters',
      subtitle: 'Querschnittsfläche A = π · r² & Kegelvolumen V = ⅓ · π · r² · h',
      bulletPoints: [
        'Kreisfläche: A = π · r² (Quadratische Flächenverdichtung beim Einschnüren).',
        'Kreisumfang: U = 2 · π · r (Umlaufweg der Partikel).',
        'Kegelvolumen: V = ⅓ · π · r² · h (Exakt ein Drittel eines Zylinders gleicher Höhe).'
      ],
      speech: 'Kommen wir zur Mathematik: Wenn sich der Trichterdurchmesser halbiert, schrumpft die Querschnittsfläche auf ein Viertel! Dadurch müssen die Luftmassen viermal so schnell strömen, um durch das Nadelöhr zu passen.',
      illustration: 'geometry'
    },
    {
      title: 'Folie 5: Der 35-Zeilen Python-Code',
      subtitle: 'Wie wir Wirbel mit Schulmathematik auf den Bildschirm zaubern',
      bulletPoints: [
        'Polarkoordinaten in Kartesische Koordinaten: x = cos(Winkel) · r und y = sin(Winkel) · r.',
        'Drehung: winkel += 0.05 pro Bildwiederholung (Frame).',
        'Sog: radius *= 0.994 (Zentripetalkraft schrumpft den Radius stetig nach innen).'
      ],
      speech: 'Für unsere IT-AG reichen 35 Zeilen reines Python mit Pygame! Mit Sinus und Kosinus berechnen wir in jedem Frame die neue Position. Das ist pure Schulmathematik direkt in Aktion.',
      illustration: 'code'
    },
    {
      title: 'Folie 6: Unity vs. Python – Der Reality Check',
      subtitle: 'Warum Skripting im Unterricht schneller zum Erfolg führt',
      bulletPoints: [
        'Python: 35 Zeilen, 25 MB RAM, läuft auf jedem Schul-Laptop ohne Installation.',
        'Unity: 35 GB Download, 4 GB RAM, 1.200 Zeilen C# & Shader-Nodes, teure Grafikkarten nötig.',
        'Fazit: Für das Verstehen physikalischer Grundformeln schlägt Python jede Game-Engine!'
      ],
      speech: 'Zum Abschluss vergleichen wir Python mit Unity: Unity ist spitze für kommerzielle 3D-Spiele, aber für unsere IT-AG ist Python der König: Wir sehen jede Formel direkt vor uns und verstehen, was im Computer passiert.',
      illustration: 'comparison'
    }
  ], []);

  const activeSlide = presentationSlides[currentSlideIndex];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${theme === 'dark' ? 'bg-[#04060a] text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Top Banner Header */}
      <header className={`border-b px-6 py-4 flex items-center justify-between backdrop-blur sticky top-0 z-50 ${theme === 'dark' ? 'border-slate-800 bg-[#04060a]/90' : 'border-slate-300 bg-white/95 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-500/30">
            <Wind className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-black tracking-tight flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                IT-AG Vortex Lab 3D
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 tracking-wider">
                8. Klasse Physik & Geometrie
              </span>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              Kräftepaar (Zentripetal vs. Zentrifugal) • Schauberger-Doppelwirbel • 3-Stufen Python-Baukasten
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playSynthSound('click');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              soundEnabled 
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 shadow-md shadow-cyan-500/20' 
                : theme === 'dark' ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300'
            }`}
            title="Audio-Synthesizer an/aus"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-500" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">Sound</span>
          </button>

          {/* Diaprojektor- / Hellmodus Toggle */}
          <button
            onClick={() => {
              playSynthSound('click');
              setTheme(theme === 'dark' ? 'beamer' : 'dark');
            }}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-sm ${
              theme === 'beamer' 
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-300' 
                : 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
            }`}
            title="Zwischen Dark Mode und Diaprojektor-Hellmodus wechseln"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-950" />}
            <span>{theme === 'beamer' ? 'Projektor AN' : 'Diaprojektor'}</span>
          </button>

          {/* Navigation Tabs */}
          <nav className={`flex items-center gap-1 p-1 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-200/90 border-slate-300'}`}>
            <button
              onClick={() => { playSynthSound('click'); setActiveTab('simulator'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> 3D-Simulator
            </button>
            <button
              onClick={() => { playSynthSound('click'); setActiveTab('code-blocks'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'code-blocks'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Python-Baukasten
            </button>
            <button
              onClick={() => { playSynthSound('click'); setActiveTab('script'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'script'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" /> Vortragsfolien
            </button>
            <button
              onClick={() => { playSynthSound('click'); setActiveTab('geometry'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'geometry'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Triangle className="w-3.5 h-3.5" /> Geometrie
            </button>
            <button
              onClick={() => { playSynthSound('click'); setActiveTab('comparison'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Unity vs. Python
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 w-full max-w-7xl mx-auto gap-6">

        {/* --- TAB 1: 3D SIMULATOR VIEW --- */}
        {activeTab === 'simulator' && (
          <div className="w-full flex flex-col items-center gap-4">

            {/* Quick Physics Preset Selector & Playback Control Bar */}
            <div className={`w-full border rounded-3xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-300'}`}>
              
              {/* Play / Pause & Speed Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsPaused(!isPaused);
                    playSynthSound('click');
                  }}
                  className={`px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-md ${
                    isPaused 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-300' 
                      : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white'
                  }`}
                  title="Simulation anhalten / fortsetzen (Leertaste)"
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                  <span>{isPaused ? 'Fortsetzen' : 'Pause (Stopp)'}</span>
                </button>

                {/* Speed Multiplier (Cosmic Slow-mo to Real-time) */}
                <div className={`flex items-center rounded-2xl border p-1 text-xs font-bold ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
                  {[
                    { label: '0.05x Zeitlupe', val: 0.05 },
                    { label: '0.12x Ruhig', val: 0.12 },
                    { label: '0.3x Standard', val: 0.3 }
                  ].map(s => (
                    <button
                      key={s.val}
                      onClick={() => {
                        setSpeedMultiplier(s.val);
                        playSynthSound('click');
                      }}
                      className={`px-2.5 py-1 rounded-xl transition-all ${
                        speedMultiplier === s.val 
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-sm' 
                          : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vortex Geometry Switcher */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs font-bold mr-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Form:</span>
                {[
                  { id: 'schauberger', label: '⏳ Doppeltrichter (Schauberger)', hint: '2 Konusse aneinander' },
                  { id: 'tornado', label: '🌪️ F5-Tornado', hint: 'Steil & Schmal' },
                  { id: 'water', label: '🚰 Abflusswirbel', hint: 'Flache Wanne' },
                  { id: 'galaxy', label: '🌌 Milchstraße', hint: 'Flache Scheibe' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVortexType(v.id as VortexGeometryType);
                      playSynthSound('whoosh');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      vortexType === v.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400'
                        : theme === 'dark' ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                    title={v.hint}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Particle Style Switcher */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center rounded-2xl border p-1 text-xs ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
                  {(['filigran', 'fein', 'normal'] as const).map(style => (
                    <button
                      key={style}
                      onClick={() => {
                        setParticleStyle(style);
                        playSynthSound('click');
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize transition-all ${
                        particleStyle === style 
                          ? 'bg-cyan-500 text-slate-950 font-black' 
                          : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {style === 'filigran' ? '✨ Filigran' : style === 'fein' ? '🔹 Fein' : '⚪ Normal'}
                    </button>
                  ))}
                </div>

                {/* Whiteboard / Tafelstift Toggle */}
                <button
                  onClick={() => {
                    setIsDrawingMode(!isDrawingMode);
                    playSynthSound('click');
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isDrawingMode 
                      ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400 ring-2 ring-cyan-300' 
                      : theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  }`}
                  title="Tafelstift zum Reinmalen & Radien messen"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isDrawingMode ? 'Stift AN' : '✏️ Malen'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsTheaterMode(!isTheaterMode);
                    playSynthSound('click');
                  }}
                  className={`p-2 rounded-xl border transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300'}`}
                  title={isTheaterMode ? 'Verkleinern' : 'Ganz groß ansehen'}
                >
                  {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>

            </div>

            {/* Whiteboard Tool Toolbar (Visible when isDrawingMode is ON) */}
            {isDrawingMode && (
              <div className={`w-full border-2 border-cyan-500/50 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-cyan-600 dark:text-cyan-300 flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5" /> Tafelwerkzeuge:
                  </span>
                  
                  <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
                    <button
                      onClick={() => setDrawTool('pen')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${drawTool === 'pen' ? 'bg-cyan-500 text-slate-950 font-black' : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      ✏️ Stift
                    </button>
                    <button
                      onClick={() => setDrawTool('arrow')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${drawTool === 'arrow' ? 'bg-cyan-500 text-slate-950 font-black' : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      title="Pfeil ziehen und Radius in Pixeln messen"
                    >
                      📏 Radius-Pfeil
                    </button>
                    <button
                      onClick={() => setDrawTool('circle')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${drawTool === 'circle' ? 'bg-cyan-500 text-slate-950 font-black' : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      title="Kreis aufziehen und Fläche A = π·r² berechnen"
                    >
                      ⭕ Kreisfläche
                    </button>
                    <button
                      onClick={() => setDrawTool('text')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${drawTool === 'text' ? 'bg-cyan-500 text-slate-950 font-black' : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      title="Klicke auf den Canvas, um Formelstempel zu platzieren"
                    >
                      🔤 Formel-Stempel
                    </button>
                  </div>

                  {drawTool === 'text' && (
                    <select
                      value={selectedStampText}
                      onChange={e => setSelectedStampText(e.target.value)}
                      className={`border text-xs px-2.5 py-1.5 rounded-xl font-mono ${theme === 'dark' ? 'bg-slate-950 border-slate-700 text-cyan-300' : 'bg-slate-100 border-slate-300 text-slate-900 font-bold'}`}
                    >
                      <option value="F_z = m·v²/r (Zentripetalkraft)">F_z = m·v²/r (Zentripetal)</option>
                      <option value="F_cf = m·v²/r (Zentrifugalkraft)">F_cf = m·v²/r (Zentrifugal)</option>
                      <option value="A = π · r² (Querschnitt)">A = π · r² (Querschnitt)</option>
                      <option value="r (Radius)">r (Radius)</option>
                      <option value="z (Drehachse)">z (Drehachse)</option>
                      <option value="Nullpunkt / Kehle (r_min)">Nullpunkt / Kehle (r_min)</option>
                    </select>
                  )}

                  <div className="flex items-center gap-1.5 ml-2">
                    {['#00f0ff', '#ffe600', '#ff0055', '#22c55e', '#0f172a'].map(c => (
                      <button
                        key={c}
                        onClick={() => setDrawColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${drawColor === c ? 'scale-125 border-cyan-400 shadow-md' : 'border-transparent opacity-80'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStrokes(prev => prev.slice(0, -1));
                      const canvas = drawingCanvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) redrawWhiteboard(ctx, strokes.slice(0, -1));
                      }
                      playSynthSound('click');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border ${theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'}`}
                  >
                    <Undo className="w-3.5 h-3.5" /> Rückgängig
                  </button>
                  <button
                    onClick={() => {
                      setStrokes([]);
                      const canvas = drawingCanvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                      }
                      playSynthSound('click');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border ${theme === 'dark' ? 'bg-slate-800 text-rose-300 border-slate-700' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Leeren
                  </button>
                  <button
                    onClick={captureCompositeScreenshot}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow-lg shadow-emerald-500/25"
                  >
                    <Camera className="w-3.5 h-3.5" /> 📸 Screenshot speichern
                  </button>
                </div>
              </div>
            )}

            {/* 3D Canvas Screen + Drawing Overlay */}
            <div className={`relative rounded-3xl overflow-hidden shadow-2xl border w-full ${isTheaterMode ? 'h-[640px]' : 'h-[530px]'} ${theme === 'dark' ? 'border-slate-800 bg-[#04060a]' : 'border-slate-300 bg-white'}`}>
              
              <canvas
                ref={canvasRef}
                width={1080}
                height={isTheaterMode ? 640 : 530}
                className={`absolute inset-0 block w-full h-full select-none ${isDrawingMode ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`}
              />

              <canvas
                ref={drawingCanvasRef}
                width={1080}
                height={isTheaterMode ? 640 : 530}
                onMouseDown={handleDrawStart}
                onMouseMove={handleDrawMove}
                onMouseUp={handleDrawEnd}
                onMouseLeave={handleDrawEnd}
                className={`absolute inset-0 block w-full h-full select-none ${isDrawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
              />

              {/* In-Canvas Top Left Status HUD */}
              <div className={`absolute top-4 left-4 backdrop-blur-md border rounded-2xl px-3.5 py-2 text-xs flex items-center gap-3 pointer-events-none shadow-xl ${theme === 'dark' ? 'bg-slate-950/85 border-slate-800 text-slate-300' : 'bg-white/95 border-slate-300 text-slate-900'}`}>
                <span className={`flex items-center gap-1.5 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                  <Activity className="w-3.5 h-3.5 text-cyan-500" /> {particleCount} Partikel
                </span>
                <span>•</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">60 FPS</span>
                <span>•</span>
                <span className="text-[11px] font-mono font-bold">
                  {isPaused ? '⏸️ PAUSIERT' : `${speedMultiplier}x Tempo`}
                </span>
                <span>•</span>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-300 capitalize font-bold">
                  {vortexType}
                </span>
              </div>

              {/* Live Trichter-Profil HUD (Links mit technischer Bemaßungszeichnung) */}
              {showProfileHUD && (
                <div className={`absolute top-16 left-4 backdrop-blur-md border rounded-2xl p-3.5 w-72 shadow-2xl z-10 flex flex-col gap-2 ${theme === 'dark' ? 'bg-slate-950/95 border-sky-500/40 text-slate-200' : 'bg-white/95 border-blue-400 text-slate-900'}`}>
                  <div className={`flex items-center justify-between border-b pb-1.5 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-300 flex items-center gap-1.5">
                      <Triangle className="w-3.5 h-3.5" /> Bemaßtes Trichterprofil
                    </span>
                    <button onClick={() => setShowProfileHUD(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                  </div>

                  {/* Technische Schnittzeichnung mit Bemaßungspfeilen (Mathebuch Klasse 8) */}
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 110 130" className={`w-24 h-28 rounded-xl border shrink-0 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>
                      {vortexType === 'schauberger' ? (
                        // Doppeltrichter (Sanduhr) mit exakten Bemaßungslinien
                        <g>
                          {/* Trichterflächen */}
                          <path d="M 20,15 Q 55,50 55,65 Q 55,80 20,115 L 90,115 Q 55,80 55,65 Q 55,50 90,15 Z" fill={theme === 'dark' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(2, 132, 199, 0.15)'} stroke={theme === 'dark' ? '#00f0ff' : '#0284c7'} strokeWidth="1.5" />
                          {/* Mittelachse z */}
                          <line x1="55" y1="5" x2="55" y2="125" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                          {/* Bemaßung oben r1 */}
                          <line x1="55" y1="15" x2="90" y2="15" stroke="#ff0055" strokeWidth="1.5" />
                          <circle cx="90" cy="15" r="2" fill="#ff0055" />
                          <text x="65" y="12" fill={theme === 'dark' ? '#f43f5e' : '#be123c'} fontSize="8" fontWeight="bold">r₁</text>
                          {/* Bemaßung Kehle r_min */}
                          <circle cx="55" cy="65" r="3" fill="#22c55e" />
                          <text x="60" y="68" fill={theme === 'dark' ? '#4ade80' : '#15803d'} fontSize="7" fontWeight="bold">r_min</text>
                          {/* Höhenbemaßung H */}
                          <line x1="10" y1="15" x2="10" y2="115" stroke="#3b82f6" strokeWidth="1" />
                          <path d="M 8,17 L 10,15 L 12,17 M 8,113 L 10,115 L 12,113" stroke="#3b82f6" strokeWidth="1" fill="none" />
                          <text x="3" y="68" fill="#3b82f6" fontSize="7" fontWeight="bold">H</text>
                        </g>
                      ) : (
                        // Standard Kegeltrichter mit Bemaßung
                        <g>
                          <path d="M 15,15 Q 55,85 45,115 L 65,115 Q 55,85 95,115 Z" fill={theme === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.15)'} stroke="#2563eb" strokeWidth="1.5" />
                          <line x1="55" y1="5" x2="55" y2="125" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                          <line x1="55" y1="15" x2="95" y2="15" stroke="#ff0055" strokeWidth="1.5" />
                          <text x="65" y="12" fill="#be123c" fontSize="8" fontWeight="bold">r_oben</text>
                          <line x1="10" y1="15" x2="10" y2="115" stroke="#3b82f6" strokeWidth="1" />
                          <text x="3" y="68" fill="#3b82f6" fontSize="7" fontWeight="bold">h</text>
                        </g>
                      )}
                    </svg>

                    <div className="flex flex-col gap-1 text-[11px] font-mono leading-tight">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Gesamthöhe H:</span>
                        <strong className="font-bold">{geometryProfile.H} {geometryProfile.unit}</strong>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Öffnung r:</span>
                        <strong className="text-cyan-600 dark:text-cyan-300 font-bold">{geometryProfile.rTop} {geometryProfile.unit}</strong>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Engstelle r_min:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{geometryProfile.rMin} {geometryProfile.unit}</strong>
                      </div>
                      <div className="flex justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Fläche A = π·r²:</span>
                        <strong className="text-amber-600 dark:text-amber-300 font-bold">~{calculatedArea} {geometryProfile.unit}²</strong>
                      </div>
                    </div>
                  </div>

                  <div className={`p-2 rounded-xl text-[10px] leading-snug border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800 font-medium'}`}>
                    💡 <em>{geometryProfile.physicsNote}</em>
                  </div>
                </div>
              )}

              {/* Bottom In-Canvas Controls Bar */}
              <div className={`absolute bottom-4 left-4 backdrop-blur-md border rounded-2xl px-3 py-1.5 text-xs flex items-center gap-2 z-10 ${theme === 'dark' ? 'bg-slate-950/85 border-slate-800 text-slate-300' : 'bg-white/95 border-slate-300 text-slate-900 shadow-md'}`}>
                <span className="text-[11px] text-slate-500 font-bold">Kamera:</span>
                {(['3d-orbit', 'oben', 'seite'] as const).map(preset => (
                  <button
                    key={preset}
                    onClick={() => { playSynthSound('click'); setCameraPreset(preset); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                      cameraPreset === preset 
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-sm' 
                        : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {preset === '3d-orbit' ? '🔄 3D-Orbit' : preset === 'oben' ? '🛰️ Oben' : '📏 Seite'}
                  </button>
                ))}
                <span className="text-slate-400">|</span>
                <button
                  onClick={() => { setShowEnergyLines(!showEnergyLines); playSynthSound('click'); }}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${showEnergyLines ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'text-slate-400'}`}
                >
                  8 Vektoren {showEnergyLines ? 'AN' : 'AUS'}
                </button>
                <button
                  onClick={() => { setShowGroundGrid(!showGroundGrid); playSynthSound('click'); }}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${showGroundGrid ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300' : 'text-slate-400'}`}
                >
                  Bodennetz
                </button>
                <button
                  onClick={() => { setShowCenterAxis(!showCenterAxis); playSynthSound('click'); }}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${showCenterAxis ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300' : 'text-slate-400'}`}
                >
                  Drehachse z
                </button>
              </div>

              {/* SproutBot Floating Interactive Avatar Widget (Rechts unten) */}
              <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 max-w-[340px]">
                {/* Speech Bubble */}
                <div className={`backdrop-blur-md border-2 rounded-3xl p-3.5 shadow-2xl flex flex-col gap-2 text-xs relative ${theme === 'dark' ? 'bg-slate-950/95 border-emerald-500/60 text-slate-200' : 'bg-white/95 border-emerald-500 text-slate-900'}`}>
                  <div className={`flex items-center justify-between border-b pb-1.5 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      🌱 SproutBot • Physik-Tutor
                    </span>
                    <button
                      onClick={() => speakText(avatarSpeech)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isAvatarTalking 
                          ? 'bg-rose-500 text-white animate-pulse' 
                          : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                      title="Sprachausgabe vorlesen (TTS)"
                    >
                      <Volume2 className="w-3 h-3" /> Vorlesen
                    </button>
                  </div>

                  <p className="text-[11px] leading-snug">
                    {avatarSpeech}
                  </p>

                  {/* Quick question prompts for students */}
                  <div className={`grid grid-cols-2 gap-1 pt-1 border-t text-[10px] ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                    <button
                      onClick={() => {
                        const txt = 'Beim Schauberger-Doppelwirbel stehen sich zwei Kegel gegenüber: Einströmende Implosion (Zentripetal) trifft auf ausströmende Expansion (Zentrifugal). Im Nullpunkt entsteht maximale Dichte!';
                        setAvatarSpeech(txt);
                        setAvatarMood('explaining');
                        speakText(txt);
                      }}
                      className={`p-1.5 text-left rounded-lg transition-colors ${theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300' : 'bg-slate-100 hover:bg-slate-200 text-cyan-800 font-semibold'}`}
                    >
                      ⏳ Schauberger-Prinzip?
                    </button>
                    <button
                      onClick={() => {
                        const txt = 'Die Zentripetalkraft zieht nach innen: F_z = m·v²/r. Die Zentrifugalkraft drückt nach außen. Wenn sich der Radius halbiert, vervierfacht sich die Kraft!';
                        setAvatarSpeech(txt);
                        setAvatarMood('explaining');
                        speakText(txt);
                      }}
                      className={`p-1.5 text-left rounded-lg transition-colors ${theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 text-rose-300' : 'bg-slate-100 hover:bg-slate-200 text-rose-800 font-semibold'}`}
                    >
                      ⚖️ Zentripetal vs. Zentrifugal?
                    </button>
                    <button
                      onClick={() => {
                        const txt = 'In Python brauchst du nur 35 Zeilen für einen flinken Wirbel. In Unity müsstest du 35 Gigabyte downloaden und über 1000 Zeilen C-Sharp und Shader-Graphen konfigurieren!';
                        setAvatarSpeech(txt);
                        setAvatarMood('happy');
                        speakText(txt);
                      }}
                      className={`p-1.5 text-left rounded-lg transition-colors ${theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 text-emerald-300' : 'bg-slate-100 hover:bg-slate-200 text-emerald-800 font-semibold'}`}
                    >
                      🐍 Python vs. Unity?
                    </button>
                    <button
                      onClick={() => setShowNotebookModal(true)}
                      className={`p-1.5 text-left rounded-lg font-bold transition-colors ${theme === 'dark' ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800'}`}
                    >
                      📝 Notizen einfügen
                    </button>
                  </div>
                </div>

                {/* Animated Mascot Character */}
                <div 
                  onClick={() => {
                    const txt = 'Klicke auf die Leertaste zum Pausieren und nutze den Tafelstift oben, um die Radien und Flächen direkt nachzumessen!';
                    setAvatarSpeech(txt);
                    speakText(txt);
                  }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-2xl cursor-pointer hover:scale-110 transition-transform active:scale-95 flex items-center justify-center border-2 border-emerald-300"
                  title="Ich bin dein SproutBot! Klicke mich an für Tipps."
                >
                  <div className="w-full h-full bg-slate-950 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="text-xs absolute -top-0.5">🌱</div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                    <div className="w-3 h-0.5 bg-emerald-400 rounded-full mt-1" />
                  </div>
                </div>
              </div>

            </div>

            {/* Performance & Physics Sliders (with clear descriptions) */}
            <div className={`w-full border rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className={`flex items-center gap-2 font-black text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Sliders className="w-4 h-4 text-cyan-500" /> Physik-Kräfte & KPI-Regler (8. Klasse)
                </span>
                <span>Passe Radius, Winkelgeschwindigkeit und Sogfaktor an</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Spawning-Rate */}
                <div 
                  onMouseEnter={() => setHoveredSlider('spawn')}
                  onMouseLeave={() => setHoveredSlider(null)}
                  className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${theme === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">Partikel / Frame</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{spawnRate}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={spawnRate}
                    onChange={e => setSpawnRate(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">Dichte des Wirbelmaterials</span>
                </div>

                {/* 2. Rotationsgeschwindigkeit */}
                <div 
                  onMouseEnter={() => setHoveredSlider('rot')}
                  onMouseLeave={() => setHoveredSlider(null)}
                  className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${theme === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">Drehgeschwindigkeit ω</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{(rotSpeedVal * 100).toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={0.12}
                    step={0.005}
                    value={rotSpeedVal}
                    onChange={e => setRotSpeedVal(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">Winkelgeschwindigkeit dα / dt</span>
                </div>

                {/* 3. Sog-Faktor (Zentripetalkraft) */}
                <div 
                  onMouseEnter={() => setHoveredSlider('pull')}
                  onMouseLeave={() => setHoveredSlider(null)}
                  className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${theme === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">Sog-Faktor (Zentripetal)</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{pullFactor}</span>
                  </div>
                  <input
                    type="range"
                    min={0.98}
                    max={0.999}
                    step={0.001}
                    value={pullFactor}
                    onChange={e => setPullFactor(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">Multiplikator r_neu = r · faktor</span>
                </div>

                {/* 4. Vertikale Strömung */}
                <div 
                  onMouseEnter={() => setHoveredSlider('up')}
                  onMouseLeave={() => setHoveredSlider(null)}
                  className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${theme === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">Auftrieb v_z</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{upwardSpeed.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={3.0}
                    step={0.1}
                    value={upwardSpeed}
                    onChange={e => setUpwardSpeed(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">Steiggeschwindigkeit im Kamin</span>
                </div>
              </div>
            </div>

            {/* Persistent Fun Math Facts floating card */}
            <div className={`w-full border rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-indigo-500/40 text-slate-200' : 'bg-indigo-50/80 border-indigo-200 text-slate-900'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                    {funFacts[funFactIndex].title}
                  </h4>
                  <p className="text-xs mt-0.5">
                    {funFacts[funFactIndex].text}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFunFactIndex((funFactIndex + 1) % funFacts.length)}
                className={`p-2 rounded-xl text-xs font-bold transition-all border ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-indigo-100 border-indigo-200 text-indigo-900'}`}
                title="Nächster Mathe-Fakt"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* --- TAB 2: PYTHON-BAUKASTEN (35 vs. 90 vs. UNITY) --- */}
        {activeTab === 'code-blocks' && (
          <div className={`w-full max-w-5xl border rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}>
            <div className={`border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <Code className="w-7 h-7 text-cyan-500" /> Python-Baukasten: Scripting vs. Engine
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Vom einfachen 35-Zeilen-Schulcode bis zur 35-Gigabyte-Game-Engine
                </p>
              </div>

              {/* Tier Switcher Buttons */}
              <div className={`flex items-center gap-1 p-1 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
                {[
                  { id: '35-lines', label: '1. Minimal (35 Zeilen)', badge: 'Schule' },
                  { id: '90-lines', label: '2. Pygame Engine (90 Zeilen)', badge: 'OOP' },
                  { id: 'unity', label: '3. Unity Engine (1200+ Zeilen)', badge: 'Game Engine' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedCodeTier(t.id as '35-lines' | '90-lines' | 'unity');
                      playSynthSound('click');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedCodeTier === t.id
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Screen: Left = Code, Right = Explanation & KPI Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Left Column: Code Block */}
              <div className={`rounded-2xl border overflow-hidden flex flex-col shadow-xl ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 text-slate-100 border-slate-700'}`}>
                <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-cyan-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {selectedCodeTier === '35-lines' ? 'tornado_minimal.py (35 Zeilen)' : selectedCodeTier === '90-lines' ? 'tornado_pygame_engine.py (90 Zeilen)' : 'VortexController.cs (Unity)'}
                  </span>
                  <button
                    onClick={() => {
                      const codeToCopy = selectedCodeTier === '35-lines' ? pythonMinimal : selectedCodeTier === '90-lines' ? pythonPygameEngine : unityBreakdownCode;
                      navigator.clipboard.writeText(codeToCopy);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center gap-1"
                  >
                    {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Kopiert!' : 'Kopieren'}
                  </button>
                </div>

                <pre className="p-4 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed max-h-[460px] overflow-y-auto">
                  {selectedCodeTier === '35-lines' ? pythonMinimal : selectedCodeTier === '90-lines' ? pythonPygameEngine : unityBreakdownCode}
                </pre>

                {/* Direct Simulator Action Button */}
                <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Direkt ausprobieren?</span>
                  <button
                    onClick={() => {
                      setActiveTab('simulator');
                      if (selectedCodeTier === '35-lines') {
                        setVortexType('tornado');
                        setSpeedMultiplier(0.12);
                      } else {
                        setVortexType('schauberger');
                      }
                      playSynthSound('whoosh');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black shadow-md flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Im 3D-Simulator anzeigen!
                  </button>
                </div>
              </div>

              {/* Right Column: Didactic Explanation & KPI Breakdown */}
              <div className="flex flex-col gap-4">
                
                {/* Didactic Step Breakdown */}
                <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h3 className="text-sm font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Was hier mathematisch passiert (8. Klasse):
                  </h3>

                  {selectedCodeTier === '35-lines' && (
                    <ul className="text-xs space-y-2.5 leading-relaxed text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                        <span><strong>Polarkoordinaten:</strong> Jedes Partikel wird durch einen Winkel <em>a</em> und einen Radius <em>r</em> definiert statt durch starre X/Y-Werte.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                        <span><strong>Kreis-Formeln:</strong> Mit <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">x = cos(a) * r</code> und <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">y = sin(a) * r</code> rechnen wir den Winkel in Pixelkoordinaten um.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                        <span><strong>Zentripetalkraft (Sog):</strong> <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">r *= 0.994</code> verkleinert den Radius in jedem Frame um 0.6% – das erzeugt die Spiralbahn!</span>
                      </li>
                    </ul>
                  )}

                  {selectedCodeTier === '90-lines' && (
                    <ul className="text-xs space-y-2.5 leading-relaxed text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                        <span><strong>Objektorientierung (OOP):</strong> Jedes Partikel ist ein eigenständiges Objekt einer <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">TornadoParticle</code>-Klasse.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                        <span><strong>Speicherverwaltung:</strong> Mit <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">self.kill()</code> löscht sich das Partikel automatisch aus dem Arbeitsspeicher, wenn es den Trichter verlässt.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                        <span><strong>Transparenz:</strong> Fading Alpha-Kanal für weichen Nebel-Look.</span>
                      </li>
                    </ul>
                  )}

                  {selectedCodeTier === 'unity' && (
                    <ul className="text-xs space-y-2.5 leading-relaxed text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                        <span><strong>GPU-Compute-Shader:</strong> Unity berechnet Partikel parallel auf der Grafikkarte. Mächtig, aber die elementaren Formeln sind in Nodes versteckt.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                        <span><strong>Overhead:</strong> Man benötigt Unity Hub, Editor, C#-Compiler, Asset-Importer und dedizierte GPUs.</span>
                      </li>
                    </ul>
                  )}
                </div>

                {/* KPI Comparison Matrix */}
                <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" /> Ressourcen- & KPI-Vergleich:
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-500">Programmier-Aufwand</span>
                      <strong className="text-cyan-600 dark:text-cyan-400 font-bold mt-0.5">
                        {selectedCodeTier === '35-lines' ? '1 Schulstunde (35 Zeilen)' : selectedCodeTier === '90-lines' ? '2 Schulstunden (90 Zeilen)' : 'Wochen (1.200+ Zeilen)'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-500">RAM-Verbrauch</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        {selectedCodeTier === '35-lines' ? '~25 Megabyte' : selectedCodeTier === '90-lines' ? '~38 Megabyte' : '4 bis 8 Gigabyte'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-500">Hardware-Anforderung</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">
                        {selectedCodeTier === 'unity' ? 'Gamer-PC / Rechenzentrum' : 'Jeder normale Schul-Laptop'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-500">Didaktischer Nutzen</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                        {selectedCodeTier === 'unity' ? 'Game-Entwicklung' : 'Maximale Transparenz der Formeln'}
                      </strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* --- TAB 3: VORTRAGSFOLIEN & BEAMER-PRÄSENTATION --- */}
        {activeTab === 'script' && (
          <div className={`w-full max-w-5xl border rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}>
            
            {/* Header with Slide Navigation */}
            <div className={`border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold">
                  IT-AG Präsentation • Folie {currentSlideIndex + 1} von {presentationSlides.length}
                </span>
                <h2 className="text-2xl font-black mt-1">
                  {activeSlide.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {activeSlide.subtitle}
                </p>
              </div>

              {/* Prev / Next Slide Controls */}
              <div className="flex items-center gap-2">
                <button
                  disabled={currentSlideIndex === 0}
                  onClick={() => {
                    setCurrentSlideIndex(prev => Math.max(0, prev - 1));
                    playSynthSound('click');
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all ${
                    currentSlideIndex === 0 
                      ? 'opacity-40 cursor-not-allowed border-slate-300' 
                      : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Zurück
                </button>

                <div className="flex items-center gap-1">
                  {presentationSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentSlideIndex(idx);
                        playSynthSound('click');
                      }}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                        currentSlideIndex === idx
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                          : theme === 'dark' ? 'bg-slate-950 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentSlideIndex === presentationSlides.length - 1}
                  onClick={() => {
                    setCurrentSlideIndex(prev => Math.min(presentationSlides.length - 1, prev + 1));
                    playSynthSound('click');
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all ${
                    currentSlideIndex === presentationSlides.length - 1 
                      ? 'opacity-40 cursor-not-allowed border-slate-300' 
                      : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                  }`}
                >
                  Weiter <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide Presentation Canvas (Rich Visual Diagram on every slide) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Left Column: Visual Diagram / SVG Illustration */}
              <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center min-h-[320px] shadow-lg relative overflow-hidden ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                {activeSlide.illustration === 'tornado' && (
                  <svg viewBox="0 0 240 240" className="w-full h-56 max-w-xs">
                    <defs>
                      <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <ellipse cx="120" cy="35" rx="90" ry="22" fill="url(#cloudGrad)" stroke="#38bdf8" strokeWidth="2" />
                    <text x="120" y="38" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="bold">Wolkenbasis (Niederdruckgebiet)</text>
                    
                    {/* Funnel curves */}
                    <path d="M 50,45 Q 115,140 110,210 L 130,210 Q 125,140 190,45 Z" fill="rgba(56, 189, 248, 0.15)" stroke="#0284c7" strokeWidth="2" />
                    
                    {/* Vortex eye */}
                    <line x1="120" y1="45" x2="120" y2="210" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3,3" />
                    <text x="128" y="130" fill="#f43f5e" fontSize="9" fontWeight="bold">Auge (Ruhezone)</text>
                    
                    {/* Spiral arrows */}
                    <ellipse cx="120" cy="100" rx="35" ry="12" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                    <ellipse cx="120" cy="155" rx="20" ry="8" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                    
                    {/* Ground plane */}
                    <line x1="20" y1="210" x2="220" y2="210" stroke="#64748b" strokeWidth="2" />
                    <text x="120" y="228" textAnchor="middle" fill="#64748b" fontSize="10">Bodenkontakt (Trümmerfeld)</text>
                  </svg>
                )}

                {activeSlide.illustration === 'schauberger' && (
                  <svg viewBox="0 0 240 240" className="w-full h-56 max-w-xs">
                    {/* Upper cone (Implosion) */}
                    <path d="M 40,30 L 200,30 L 125,120 L 115,120 Z" fill="rgba(0, 240, 255, 0.15)" stroke="#00f0ff" strokeWidth="2" />
                    <text x="120" y="24" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="bold">1. Oberer Trichter (Sog / Implosion)</text>

                    {/* Throat constriction */}
                    <circle cx="120" cy="120" r="6" fill="#f43f5e" />
                    <text x="135" y="124" fill="#f43f5e" fontSize="9" fontWeight="bold">r_min (Nullpunkt)</text>

                    {/* Lower cone (Expansion) */}
                    <path d="M 115,120 L 125,120 L 200,210 L 40,210 Z" fill="rgba(244, 63, 94, 0.15)" stroke="#f43f5e" strokeWidth="2" />
                    <text x="120" y="226" textAnchor="middle" fill="#f43f5e" fontSize="10" fontWeight="bold">2. Unterer Trichter (Ausstoß / Fliehkraft)</text>

                    {/* Rotation spirals */}
                    <path d="M 80,60 Q 120,75 160,60" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="3,3" />
                    <path d="M 80,180 Q 120,165 160,180" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="3,3" />
                  </svg>
                )}

                {activeSlide.illustration === 'forces' && (
                  <svg viewBox="0 0 240 240" className="w-full h-56 max-w-xs">
                    {/* Circle orbit */}
                    <circle cx="120" cy="120" r="70" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" />
                    <circle cx="120" cy="120" r="4" fill="#64748b" />
                    <text x="120" y="112" textAnchor="middle" fill="#64748b" fontSize="9">Zentrum (r = 0)</text>

                    {/* Particle on orbit */}
                    <circle cx="190" cy="120" r="7" fill="#f59e0b" />
                    
                    {/* Inward Centripetal Arrow */}
                    <line x1="190" y1="120" x2="135" y2="120" stroke="#0284c7" strokeWidth="3" />
                    <path d="M 142,116 L 135,120 L 142,124" stroke="#0284c7" strokeWidth="3" fill="none" />
                    <text x="155" y="112" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="bold">F_z (Sog)</text>

                    {/* Outward Centrifugal Arrow */}
                    <line x1="190" y1="120" x2="230" y2="120" stroke="#dc2626" strokeWidth="3" />
                    <path d="M 223,116 L 230,120 L 223,124" stroke="#dc2626" strokeWidth="3" fill="none" />
                    <text x="212" y="112" textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="bold">F_cf (Fliehkraft)</text>

                    {/* Tangential velocity */}
                    <line x1="190" y1="120" x2="190" y2="65" stroke="#22c55e" strokeWidth="2" />
                    <path d="M 186,72 L 190,65 L 194,72" stroke="#22c55e" strokeWidth="2" fill="none" />
                    <text x="200" y="80" fill="#22c55e" fontSize="9" fontWeight="bold">v (Bahngeschw.)</text>
                  </svg>
                )}

                {activeSlide.illustration === 'geometry' && (
                  <svg viewBox="0 0 240 240" className="w-full h-56 max-w-xs">
                    {/* Cylinder background ghost */}
                    <rect x="50" y="30" width="140" height="150" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="120" y="22" textAnchor="middle" fill="#94a3b8" fontSize="9">Zylinder V_zyl = π·r²·h</text>

                    {/* Inscribed Cone */}
                    <path d="M 50,30 L 190,30 L 120,180 Z" fill="rgba(37, 99, 235, 0.15)" stroke="#2563eb" strokeWidth="2" />
                    <text x="120" y="85" textAnchor="middle" fill="#2563eb" fontSize="12" fontWeight="bold">V = ⅓ · π · r² · h</text>

                    {/* Radius line */}
                    <line x1="120" y1="30" x2="190" y2="30" stroke="#f43f5e" strokeWidth="2" />
                    <text x="155" y="45" fill="#f43f5e" fontSize="10" fontWeight="bold">Radius r</text>

                    {/* Height line */}
                    <line x1="35" y1="30" x2="35" y2="180" stroke="#059669" strokeWidth="1.5" />
                    <text x="22" y="110" fill="#059669" fontSize="10" fontWeight="bold">h</text>
                  </svg>
                )}

                {activeSlide.illustration === 'code' && (
                  <div className="w-full font-mono text-[11px] leading-relaxed p-4 rounded-xl bg-slate-900 text-cyan-300 border border-slate-800">
                    <div className="text-slate-500"># 3-Zeilen-Mathematik:</div>
                    <div>winkel += 0.05 <span className="text-slate-400"># Drehung</span></div>
                    <div>radius *= 0.994 <span className="text-slate-400"># Zentripetal-Sog</span></div>
                    <div>x = 400 + cos(winkel) * radius</div>
                    <div>y = sin(winkel) * radius</div>
                  </div>
                )}

                {activeSlide.illustration === 'comparison' && (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center flex flex-col justify-center">
                      <span className="text-2xl font-black text-cyan-500">35</span>
                      <span className="text-xs font-bold mt-1">Zeilen Python</span>
                      <span className="text-[10px] text-slate-500 mt-1">25 MB RAM</span>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center flex flex-col justify-center">
                      <span className="text-2xl font-black text-purple-500">35 GB</span>
                      <span className="text-xs font-bold mt-1">Unity Engine</span>
                      <span className="text-[10px] text-slate-500 mt-1">4.000 MB RAM</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Key Takeaways & TTS Narration */}
              <div className="flex flex-col justify-between gap-4">
                
                {/* Bullet points */}
                <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Kernaussagen für Schülerinnen & Schüler:
                  </h4>
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeSlide.bulletPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Spoken Text (Vortragsskript) + Audio TTS Button */}
                <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-500" /> Vorzulesender Folientext:
                    </span>
                    <button
                      onClick={() => speakText(activeSlide.speech)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-sm"
                    >
                      <Volume2 className="w-3 h-3" /> Laut vorlesen
                    </button>
                  </div>
                  <p className="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed">
                    „{activeSlide.speech}“
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* --- TAB 4: GEOMETRIE-LABOR (8. KLASSE) --- */}
        {activeTab === 'geometry' && (
          <div className={`w-full max-w-4xl border rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}>
            <div className={`border-b pb-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <h2 className="text-2xl font-black mb-1 flex items-center gap-3">
                <Triangle className="w-7 h-7 text-cyan-500" /> 📐 8. Klasse Geometrie: Der Trichter-Querschnitt
              </h2>
              <p className="text-xs text-slate-500">
                Verändere Radius r und Höhe h, um die quadratische Flächenverdichtung A = π · r² zu verstehen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 ${theme === 'dark' ? 'bg-slate-950 border-cyan-500/30' : 'bg-slate-50 border-cyan-200'}`}>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 w-max font-bold">1. Kreisfläche (Querschnitt)</span>
                <div>
                  <h3 className="text-2xl font-black font-mono">A = π · r²</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Wenn der Radius um die Hälfte schrumpft, sinkt die Fläche um 75%!
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl border text-[11px] ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                  💡 <em>Quadratische Verdichtung: r → r/2 ⟹ A → A/4</em>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 ${theme === 'dark' ? 'bg-slate-950 border-indigo-500/30' : 'bg-slate-50 border-indigo-200'}`}>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 w-max font-bold">2. Kreisumfang (Umlaufbahn)</span>
                <div>
                  <h3 className="text-2xl font-black font-mono">U = 2 · π · r</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Je kleiner der Radius, desto kürzer der Umlaufweg der Partikel.
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl border text-[11px] ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                  💡 <em>Pirouetten-Effekt: L = m · v · r = konstant</em>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 ${theme === 'dark' ? 'bg-slate-950 border-purple-500/30' : 'bg-slate-50 border-purple-200'}`}>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 w-max font-bold">3. Trichter-Volumen (Kegel)</span>
                <div>
                  <h3 className="text-2xl font-black font-mono">V = ⅓ · π · r² · h</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Ein Kegeltrichter fasst exakt ein Drittel eines geraden Zylinders.
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl border text-[11px] ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                  💡 <em>Die restlichen ⅔ bieten Freiraum für den aufsteigenden Sog.</em>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 5: UNITY VS. PYTHON KPI ARENA --- */}
        {activeTab === 'comparison' && (
          <div className={`w-full max-w-4xl border rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}>
            <div className={`border-b pb-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <h2 className="text-2xl font-black mb-1 flex items-center gap-3">
                <Cpu className="w-7 h-7 text-cyan-500" /> ⚔️ Unity vs. Python: Der IT-AG Reality Check
              </h2>
              <p className="text-xs text-slate-500">
                Warum starten wir in der 8. Klasse mit Python und nicht sofort mit einer 35-GB-Engine?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`border-2 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4 ${theme === 'dark' ? 'bg-slate-950 border-cyan-500/50' : 'bg-slate-50 border-cyan-500'}`}>
                <div>
                  <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-extrabold uppercase">
                    🐍 Python & Pygame
                  </span>
                  <h3 className="text-xl font-black mt-3">Der flinke Ninja</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Schlank, transparent, in 1–2 Schulstunden komplett verstanden.
                  </p>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Code-Zeilen:</span>
                    <strong className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">35 bis 90 Zeilen</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Installation:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">pip install pygame (20 Sek.)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RAM-Verbrauch:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">&lt; 35 Megabyte</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Schul-Tauglichkeit:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">100% (auch offline)</strong>
                  </div>
                </div>
              </div>

              <div className={`border-2 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4 ${theme === 'dark' ? 'bg-slate-950 border-purple-500/50' : 'bg-slate-50 border-purple-400'}`}>
                <div>
                  <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-extrabold uppercase">
                    🎮 Unity Engine (C#)
                  </span>
                  <h3 className="text-xl font-black mt-3">Das 35-GB-Schwergewicht</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Grandios für AAA-3D-Spiele, aber extrem steile Lernkurve für Anfänger.
                  </p>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Code & Shader:</span>
                    <strong className="text-purple-600 dark:text-purple-400 font-mono font-bold">1.200+ Zeilen & Nodes</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Download-Größe:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-mono font-bold">~35 Gigabyte</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RAM-Verbrauch:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-mono font-bold">4 bis 8 Gigabyte</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Schul-Tauglichkeit:</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-bold">Überfordert alte Laptops</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* NotebookLM / Student Notes Modal */}
      {showNotebookModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border-2 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 ${theme === 'dark' ? 'bg-slate-900 border-indigo-500/60 text-slate-100' : 'bg-white border-indigo-500 text-slate-900'}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className="font-black text-base flex items-center gap-2">
                📝 Notizen & NotebookLM-Artefakte einfügen
              </h3>
              <button onClick={() => setShowNotebookModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-xs text-slate-500">
              Füge hier deine Unterrichtsnotizen, Folien oder Exzerpte aus NotebookLM ein. Der SproutBot fasst sie zusammen und erklärt sie für deine IT-AG-Präsentation!
            </p>
            <textarea
              value={notebookNotes}
              onChange={e => setNotebookNotes(e.target.value)}
              placeholder="Füge hier Notizen aus NotebookLM ein..."
              rows={6}
              className={`w-full border rounded-2xl p-3 text-xs font-mono outline-none focus:border-cyan-500 ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowNotebookModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'}`}
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowNotebookModal(false);
                  const summary = notebookNotes.trim()
                    ? `Notiz erfasst (${notebookNotes.slice(0, 70)}...): Das passt genau zu unserem 3D-Simulator! Wir können diese Punkte direkt in den Vortrag einbinden.`
                    : 'Deine Notizen wurden gespeichert!';
                  setAvatarSpeech(summary);
                  speakText(summary);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-black shadow-lg"
              >
                In Avatar übernehmen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
