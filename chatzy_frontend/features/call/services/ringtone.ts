export type RingtoneKind = "incoming" | "outgoing";

/** Browser-generated ringtones keep calls self-contained and avoid a media asset download. */
export function startRingtone(kind: RingtoneKind) {
  const Context = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return () => undefined;

  const context = new Context();
  const playTone = () => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const firstFrequency = kind === "incoming" ? 440 : 480;
    const secondFrequency = kind === "incoming" ? 554 : 620;
    oscillator.frequency.setValueAtTime(firstFrequency, now);
    oscillator.frequency.setValueAtTime(secondFrequency, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  };

  void context.resume().then(playTone).catch(() => undefined);
  const timer = window.setInterval(playTone, kind === "incoming" ? 1_500 : 2_000);
  return () => {
    window.clearInterval(timer);
    void context.close();
  };
}
