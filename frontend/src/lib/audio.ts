let audioContext: AudioContext | null = null;
let ambientSource: AudioBufferSourceNode | null = null;
let ambientGainNode: GainNode | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const createOscillatorSound = (
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
): void => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

const createNoiseBuffer = (ctx: AudioContext, duration: number): AudioBuffer => {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  return buffer;
};

export const playAmbientSound = (): void => {
  try {
    const ctx = getAudioContext();

    if (ambientSource) {
      ambientSource.stop();
    }

    const noiseBuffer = createNoiseBuffer(ctx, 2);
    ambientSource = ctx.createBufferSource();
    ambientSource.buffer = noiseBuffer;
    ambientSource.loop = true;

    ambientGainNode = ctx.createGain();
    ambientGainNode.gain.setValueAtTime(0.02, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.Q.setValueAtTime(1, ctx.currentTime);

    const convolver = ctx.createConvolver();
    const reverbBuffer = createNoiseBuffer(ctx, 2);
    convolver.buffer = reverbBuffer;

    ambientSource.connect(filter);
    filter.connect(convolver);
    convolver.connect(ambientGainNode);
    ambientGainNode.connect(ctx.destination);

    ambientSource.start(ctx.currentTime);
  } catch (error) {
    console.error('Failed to play ambient sound:', error);
  }
};

export const stopAmbientSound = (): void => {
  if (ambientSource && ambientGainNode) {
    const ctx = getAudioContext();
    ambientGainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    setTimeout(() => {
      if (ambientSource) {
        ambientSource.stop();
        ambientSource = null;
      }
    }, 500);
  }
};

export const playHoverSound = (): void => {
  try {
    createOscillatorSound(800, 0.1, 0.05, 'sine');
  } catch (error) {
    console.error('Failed to play hover sound:', error);
  }
};

export const playClickSound = (): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (error) {
    console.error('Failed to play click sound:', error);
  }
};