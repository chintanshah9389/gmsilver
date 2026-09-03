import React, { createElement, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Asset } from 'expo-asset';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const INTRO_VIDEO_MODULE = require('@/assets/gm-logo.mp4');

const { width: SW, height: SH } = Dimensions.get('window');

type Props = {
  onDone: () => void;
  onFallback: () => void;
};

/**
 * Web intro — native HTML5 <video> on pearl cream (same canvas as the app).
 */
export default function SplashIntroVideo({ onDone, onFallback }: Props) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof INTRO_VIDEO_MODULE === 'string') {
          if (!cancelled) setUri(INTRO_VIDEO_MODULE);
          return;
        }
        const asset = Asset.fromModule(INTRO_VIDEO_MODULE);
        await asset.downloadAsync();
        const next = asset.localUri || asset.uri;
        if (!cancelled) {
          if (next) setUri(next);
          else onFallback();
        }
      } catch {
        if (!cancelled) onFallback();
      }
    })();

    const safety = setTimeout(onFallback, 45000);
    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, [onFallback]);

  const videoStyle = useMemo(
    () => ({
      width: Math.min(SW, 960),
      height: Math.min(SH * 0.85, 640),
      objectFit: 'contain' as const,
      backgroundColor: 'transparent',
    }),
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      {uri
        ? createElement('video', {
            src: uri,
            autoPlay: true,
            playsInline: true,
            // Browsers block autoplay with sound — mute so the intro actually starts.
            muted: true,
            controls: false,
            style: videoStyle,
            onEnded: onDone,
            onError: onFallback,
          })
        : null}
      <Pressable style={styles.skip} onPress={onDone} hitSlop={12}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    position: 'absolute',
    top: 24,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(26,24,25,0.08)',
    zIndex: 2,
  },
  skipText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: F.sans,
  },
});
