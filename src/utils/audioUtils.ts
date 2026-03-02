let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3
): void {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start();
    osc.stop(ac.currentTime + duration);
  } catch {
    // Audio not supported — silent fallback
  }
}

export const Sounds = {
  correct() {
    playTone(523, 0.15);
    setTimeout(() => playTone(659, 0.15), 150);
    setTimeout(() => playTone(784, 0.3), 300);
  },
  incorrect() {
    playTone(220, 0.4, 'sawtooth', 0.2);
  },
  click() {
    playTone(440, 0.08, 'triangle', 0.15);
  },
  flip() {
    playTone(330, 0.12, 'triangle', 0.15);
  },
  star() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.2), i * 100)
    );
  },
  draw() {
    playTone(600, 0.04, 'sine', 0.08);
  },
};
