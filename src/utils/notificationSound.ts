export type SoundType = 'success' | 'warning' | 'crisis' | 'complete';

export function playNotificationSound(type: SoundType) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Resume context if suspended (browser security autoplays)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const sounds: Record<SoundType, { freq: number; duration: number }> = {
      success: { freq: 523, duration: 0.15 },  // C5
      warning: { freq: 349, duration: 0.2 },   // F4
      crisis: { freq: 220, duration: 0.3 },    // A3 (low, urgent)
      complete: { freq: 659, duration: 0.2 },  // E5 (satisfying)
    };

    const sound = sounds[type] || sounds.success;
    
    oscillator.frequency.value = sound.freq;
    oscillator.type = 'sine';

    // Smooth envelope to prevent audio pops
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + sound.duration
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + sound.duration);
  } catch (err) {
    console.warn('Web Audio API notification sound failed to play:', err);
  }
}
