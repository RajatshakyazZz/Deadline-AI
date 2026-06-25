import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, AlertCircle, EyeOff, Eye, Moon, Sun } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { callGemini } from '../services/gemini';

export const FocusMode: React.FC = () => {
  const { tasks, addFocusSession } = useApp();

  // Timer constants
  const WORK_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  // State configurations
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(3); // Mock initial of 3/4
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [ambientMode, setAmbientMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [encouragement, setEncouragement] = useState('Select a task, initiate the timer, and let’s get focused.');

  // Confetti canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  const activeTasks = tasks.filter(t => !t.completed);

  // Sound effect synthesizer (Web Audio API)
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Chime sequence
      const now = ctx.currentTime;
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.start(start);
        osc.stop(start + dur);
      };

      if (!isBreak) {
        // High double chime on work complete
        playTone(523.25, now, 0.4); // C5
        playTone(659.25, now + 0.15, 0.5); // E5
      } else {
        // Soft calming double tone on break complete
        playTone(349.23, now, 0.4); // F4
        playTone(440.00, now + 0.15, 0.5); // A4
      }
    } catch (err) {
      console.warn('AudioContext sound blocked or unsupported until interaction:', err);
    }
  };

  // Canvas Confetti Particles Simulation
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#63B3ED', '#9F7AEA', '#FC8181', '#68D391', '#F6AD55'];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vRot: number;
    }> = [];

    // Spawn particles from left and right corners
    const spawnCount = 120;
    for (let i = 0; i < spawnCount; i++) {
      const fromLeft = i < spawnCount / 2;
      particles.push({
        x: fromLeft ? 0 : canvas.width,
        y: canvas.height * 0.8,
        vx: fromLeft ? Math.random() * 8 + 5 : -(Math.random() * 8 + 5),
        vy: -(Math.random() * 15 + 10),
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }

    let frames = 0;
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravity
        p.vx *= 0.98; // wind resistance
        p.rotation += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        // Remove out-of-bounds
        if (p.y > canvas.height) {
          particles.splice(idx, 1);
        }
      });

      frames++;
      if (particles.length > 0 && frames < 180) {
        requestAnimationFrame(drawParticles);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    drawParticles();
  };

  // Timer loop effect
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isRunning, isBreak, selectedTaskId]);

  const fetchEncouragement = async (breakComplete: boolean) => {
    const prompt = `You are DeadlineAI. Synthesize a single sentence of extreme focus encouragement for a developer completing a 25-minute pomodoro block. Keep it high-energy, punchy, and modern. No emojis, no markdown wrapper. Current mode: ${breakComplete ? 'Entering BREAK mode' : 'Entering WORK focus mode'}`;
    try {
      const response = await callGemini(prompt, false);
      if (response) setEncouragement(response.trim());
    } catch (err) {
      setEncouragement(breakComplete ? "Focus session complete. Stand up, stretch, and let's rest." : "Clock initialized. Zero distractions. Go!");
    }
  };

  // Timer complete logic
  const handleTimerComplete = async () => {
    playAlertSound();

    if (!isBreak) {
      // Work session complete
      triggerConfetti();
      const updatedSessionsCount = (sessionsCompleted % 4) + 1;
      setSessionsCompleted(updatedSessionsCount);
      
      // Save focus minutes to Firestore/context (25 minutes)
      const tasksToLog = selectedTaskId ? [selectedTaskId] : [];
      await addFocusSession(25, tasksToLog);

      // Transition to BREAK mode
      setIsBreak(true);
      setTimeLeft(BREAK_TIME);
      await fetchEncouragement(true);
    } else {
      // Break session complete
      setIsBreak(false);
      setTimeLeft(WORK_TIME);
      await fetchEncouragement(false);
    }
  };

  // Control handlers
  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(WORK_TIME);
    setEncouragement("Timer reset. Ready to launch another focus block?");
  };

  const formatTime = (secs: number) => {
    const mm = Math.floor(secs / 60);
    const ss = secs % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  // SVG parameters
  const strokeDash = 283; // 2 * pi * r (r=45)
  const maxTime = isBreak ? BREAK_TIME : WORK_TIME;
  const strokeOffset = strokeDash - (strokeDash * timeLeft) / maxTime;

  // If Ambient focus is turned on, we inject a body overlay to mask sidebars
  useEffect(() => {
    if (ambientMode) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [ambientMode]);

  return (
    <div className={`relative w-full min-h-[70vh] flex flex-col items-center justify-center select-none transition-all duration-500 ${
      ambientMode ? 'fixed inset-0 bg-[#080B14] z-50 p-6 flex flex-col justify-center items-center' : 'space-y-6'
    }`}>
      
      {/* Confetti canvas helper */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-40" />

      {/* Ambient exit button */}
      {ambientMode && (
        <button
          onClick={() => setAmbientMode(false)}
          className="absolute top-6 right-6 p-3 rounded-2xl bg-[#131929] hover:bg-[#1A2235] border border-white/5 text-[#A0AEC0] hover:text-[#F7FAFC] flex items-center gap-2 text-xs font-bold transition-all z-50 cursor-pointer shadow-lg"
        >
          <Eye className="w-4 h-4 text-[#63B3ED]" />
          <span>Exit Ambient Focus</span>
        </button>
      )}

      {/* Main Focus UI container */}
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-8">
        
        {/* Top Header details (Only show if not ambient) */}
        {!ambientMode && (
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-[#9F7AEA]/15 border border-[#9F7AEA]/20 text-[#9F7AEA] tracking-wider">
              POMODORO ENGINE
            </span>
            <h2 className="text-2xl font-bold text-[#F7FAFC] font-sans">Distraction-Free Focus</h2>
            <p className="text-xs text-[#A0AEC0] max-w-xs font-sans">
              Filter out the clutter. Put your eyes on the clock and crush this interval.
            </p>
          </div>
        )}

        {/* Ambient indicator message */}
        {ambientMode && (
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase text-[#A0AEC0] tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <Moon className="w-3.5 h-3.5 text-[#9F7AEA] animate-pulse" />
            <span>Ambient Zen Zone</span>
          </div>
        )}

        {/* Focus Timer SVG Ring */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          
          {/* Subtle rotation ring effect */}
          {isRunning && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
              className={`absolute inset-0 border border-dashed rounded-full pointer-events-none ${
                isBreak ? 'border-[#63B3ED]/10' : 'border-[#9F7AEA]/10'
              }`}
            />
          )}

          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="stroke-white/5" strokeWidth="3.5" fill="none" />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              className={`transition-all duration-300 ${
                isBreak ? 'stroke-[#63B3ED]' : 'stroke-[#9F7AEA]'
              }`}
              strokeWidth="4"
              strokeDasharray={strokeDash}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ duration: 0.1, ease: 'linear' }}
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Time & State Indicator */}
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-mono font-extrabold tracking-tight text-[#F7FAFC]">
              {formatTime(timeLeft)}
            </span>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest mt-1.5 ${
              isBreak ? 'text-[#63B3ED] animate-pulse' : 'text-[#9F7AEA]'
            }`}>
              {isBreak ? '☕ Rest Interval' : '🔥 Focus Work'}
            </span>
          </div>
        </div>

        {/* Control row */}
        <div className="flex items-center gap-5 justify-center relative z-20">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 rounded-xl bg-[#131929] hover:bg-[#1A2235] border border-white/5 text-[#A0AEC0] hover:text-[#F7FAFC] transition-all cursor-pointer"
            title={soundEnabled ? 'Mute chimes' : 'Enable chimes'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-[#63B3ED]" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Main Play/Pause */}
          <button
            onClick={handlePlayPause}
            className={`p-5 rounded-full text-[#080B14] shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ${
              isBreak 
                ? 'bg-[#63B3ED] hover:shadow-[0_0_20px_rgba(99,179,237,0.4)]' 
                : 'bg-[#9F7AEA] hover:shadow-[0_0_20px_rgba(159,122,234,0.4)]'
            }`}
          >
            {isRunning ? <Pause className="w-6 h-6 stroke-[3]" /> : <Play className="w-6 h-6 stroke-[3] translate-x-0.5" />}
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-3 rounded-xl bg-[#131929] hover:bg-[#1A2235] border border-white/5 text-[#A0AEC0] hover:text-[#FC8181] transition-all cursor-pointer"
            title="Reset interval"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Active Task Selector Selector */}
        {!ambientMode && (
          <div className="w-full space-y-1 flex flex-col items-center">
            <span className="text-[10px] font-mono font-bold text-[#A0AEC0] uppercase tracking-wider">Focus Task Target</span>
            <select
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                setEncouragement("Task targeted. Begin the clock block when ready.");
              }}
              className="w-full max-w-xs px-4 py-3 rounded-xl bg-[#131929] border border-white/5 focus:border-[#9F7AEA]/40 focus:outline-none text-xs text-[#F7FAFC] text-center"
            >
              <option value="">No Active Task (General Focus)</option>
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Ambient toggle (Only show if not already ambient) */}
        {!ambientMode && (
          <button
            onClick={() => setAmbientMode(true)}
            className="px-4 py-2.5 rounded-xl bg-[#131929] hover:bg-[#1A2235] border border-white/5 text-xs font-bold text-[#A0AEC0] hover:text-[#F7FAFC] flex items-center gap-2 transition-all cursor-pointer"
          >
            <EyeOff className="w-4 h-4 text-[#9F7AEA]" />
            <span>Enter Ambient Zen Mode</span>
          </button>
        )}

        {/* Sessions indicator & AI message card */}
        <div className="w-full p-4 rounded-2xl bg-[#131929] border border-white/5 relative overflow-hidden flex flex-col gap-2.5 text-left">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A0AEC0]">Interval Status</span>
            <span className="text-xs font-bold text-[#F6AD55] flex items-center gap-1 font-mono">
              🔥 {sessionsCompleted}/4 sessions completed
            </span>
          </div>
          
          <div className="flex items-start gap-2 text-xs text-[#A0AEC0] leading-relaxed">
            <Sparkles className="w-4.5 h-4.5 text-[#9F7AEA] flex-shrink-0 mt-0.5 animate-pulse" />
            <p className="font-sans font-medium">{encouragement}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
