import * as Speech from 'expo-speech';

export function speak(text: string): void {
  try {
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 1.0,
    });
  } catch (e) {
    console.warn('tts failed', e);
  }
}
