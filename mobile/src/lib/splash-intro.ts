import AsyncStorage from '@react-native-async-storage/async-storage';

/** Bump when intro media changes so users see the new video once. */
const INTRO_KEY = 'gmsilver.hasSeenSplashIntro.v2';

export async function hasSeenSplashIntro(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(INTRO_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function markSplashIntroSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(INTRO_KEY, '1');
  } catch {
    // ignore storage failures
  }
}
