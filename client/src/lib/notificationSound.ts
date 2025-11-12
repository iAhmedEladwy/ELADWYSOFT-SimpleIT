/**
 * Notification Sound Utility
 * Plays sound when new notifications arrive
 */

// Create a reusable audio context
let audioContext: AudioContext | null = null;

// Initialize audio context on user interaction (required by browsers)
export function initAudioContext() {
  if (!audioContext && typeof window !== 'undefined') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a simple notification beep sound
 * Uses Web Audio API to generate a sound
 */
export function playNotificationSound() {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    // Create oscillator for the beep
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configure sound (pleasant notification tone)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime); // 800 Hz
    
    // Volume envelope (fade in and out)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

    // Play the sound
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}

/**
 * Play a two-tone notification sound (more pleasant)
 */
export function playNotificationTone() {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    // First tone (higher pitch)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Second tone (lower pitch)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
    gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.11);
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.25);
  } catch (error) {
    console.warn('Failed to play notification tone:', error);
  }
}

/**
 * Check if user has granted notification sound permission
 */
export function canPlaySound(): boolean {
  return typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext) !== undefined;
}

/**
 * Get sound preference from localStorage
 */
export function getSoundPreference(): boolean {
  if (typeof window === 'undefined') return true;
  const pref = localStorage.getItem('notificationSoundEnabled');
  return pref !== 'false'; // Default to true
}

/**
 * Set sound preference in localStorage
 */
export function setSoundPreference(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('notificationSoundEnabled', enabled ? 'true' : 'false');
}
