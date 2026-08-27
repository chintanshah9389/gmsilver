import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';
import { API_BASE_URL } from '@/store/services/api';

export type AppUpdateDecision =
  | { status: 'ok' }
  | { status: 'skipped' }
  | {
      status: 'update';
      force: boolean;
      message: string;
      downloadUrl: string | null;
      latestVersionName: string;
      distributionMode: 'DIRECT_APK' | 'PLAY_STORE';
    };

function parseVersionCode(raw: string | number | null | undefined): number {
  const n = parseInt(String(raw ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Installed app version from native build (Android versionCode / iOS build). */
export function getInstalledAppVersion() {
  const versionName =
    Constants.nativeAppVersion ||
    Constants.expoConfig?.version ||
    '1.0.0';
  const versionCode = parseVersionCode(
    Constants.nativeBuildVersion ||
      Constants.expoConfig?.android?.versionCode ||
      1,
  );
  return { versionName, versionCode, platform: Platform.OS };
}

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

export async function fetchAppUpdateDecision(): Promise<AppUpdateDecision> {
  try {
    const res = await fetch(`${API_BASE_URL}/app-config`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { status: 'skipped' };
    }

    const json = await res.json();
    const cfg = json?.data ?? json;
    if (!cfg || cfg.enabled === false) {
      return { status: 'ok' };
    }

    const installed = getInstalledAppVersion();
    const message =
      typeof cfg.message === 'string' && cfg.message.trim()
        ? cfg.message.trim()
        : 'A new version of GM Silver is available. Please update to continue.';

    if (installed.platform === 'android') {
      const latestCode = parseVersionCode(cfg.android?.latestVersionCode);
      const minCode = parseVersionCode(cfg.android?.minVersionCode);
      const mode =
        cfg.android?.distributionMode === 'PLAY_STORE'
          ? 'PLAY_STORE'
          : 'DIRECT_APK';
      const downloadUrl =
        typeof cfg.android?.downloadUrl === 'string' &&
        cfg.android.downloadUrl.trim()
          ? cfg.android.downloadUrl.trim()
          : mode === 'PLAY_STORE'
            ? typeof cfg.android?.playStoreUrl === 'string'
              ? cfg.android.playStoreUrl.trim()
              : null
            : typeof cfg.android?.apkUrl === 'string'
              ? cfg.android.apkUrl.trim()
              : null;
      const forceFlag = Boolean(cfg.android?.forceUpdate);
      const latestName =
        cfg.android?.latestVersionName || String(latestCode);

      if (installed.versionCode >= latestCode) {
        return { status: 'ok' };
      }

      const force =
        installed.versionCode < minCode ||
        (forceFlag && installed.versionCode < latestCode);

      return {
        status: 'update',
        force,
        message,
        downloadUrl: downloadUrl || null,
        latestVersionName: latestName,
        distributionMode: mode,
      };
    }

    if (installed.platform === 'ios') {
      const latestName = cfg.ios?.latestVersionName || '1.0.0';
      const storeUrl =
        typeof cfg.ios?.storeUrl === 'string' && cfg.ios.storeUrl.trim()
          ? cfg.ios.storeUrl.trim()
          : null;
      const forceFlag = Boolean(cfg.ios?.forceUpdate);

      if (compareSemver(installed.versionName, latestName) >= 0) {
        return { status: 'ok' };
      }

      return {
        status: 'update',
        force: forceFlag,
        message,
        downloadUrl: storeUrl,
        latestVersionName: latestName,
        distributionMode: 'DIRECT_APK',
      };
    }

    return { status: 'ok' };
  } catch {
    // Fail open — offline / backend down should not block the app.
    return { status: 'skipped' };
  }
}

/** Shows update Alert when a newer build is published. */
export async function promptAppUpdateIfNeeded(): Promise<void> {
  const decision = await fetchAppUpdateDecision();
  if (decision.status !== 'update') {
    return;
  }

  const actionLabel =
    decision.distributionMode === 'PLAY_STORE'
      ? 'Open Play Store'
      : decision.downloadUrl
        ? 'Download & Install'
        : 'OK';

  await new Promise<void>((resolve) => {
    const openDownload = () => {
      if (decision.downloadUrl) {
        void Linking.openURL(decision.downloadUrl).catch(() => {
          Alert.alert(
            'Update',
            decision.distributionMode === 'PLAY_STORE'
              ? 'Could not open Play Store. Please update from Google Play manually.'
              : 'Could not open the download link. Ask your admin for the latest APK.',
          );
        });
      } else {
        Alert.alert(
          'Update',
          decision.distributionMode === 'PLAY_STORE'
            ? 'Play Store link is not configured yet. Please contact your admin.'
            : 'Download link is not configured yet. Please contact your admin.',
        );
      }
      resolve();
    };

    const buttons: Array<{
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }> = [
      {
        text: actionLabel,
        onPress: openDownload,
      },
    ];

    if (!decision.force) {
      buttons.unshift({
        text: 'Later',
        style: 'cancel',
        onPress: () => resolve(),
      });
    }

    Alert.alert(
      decision.force ? 'Update Required' : 'Update Available',
      `${decision.message}\n\nLatest: ${decision.latestVersionName}`,
      buttons,
      { cancelable: !decision.force },
    );
  });
}
