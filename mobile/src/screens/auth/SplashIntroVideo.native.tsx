import React, { useEffect } from 'react';
import { Dimensions, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';

// Native-only module — web uses SplashIntroVideo.web.tsx instead.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const INTRO_VIDEO = require('@/assets/gm-logo.mp4');

const { width: SW, height: SH } = Dimensions.get('window');

type Props = {
  onDone: () => void;
  onFallback: () => void;
};

export default function SplashIntroVideo({ onDone, onFallback }: Props) {
  useEffect(() => {
    const t = setTimeout(onFallback, 45000);
    return () => clearTimeout(t);
  }, [onFallback]);

  return (
    <View style={styles.videoRoot}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Video
        source={INTRO_VIDEO}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={(status) => {
          if (!status.isLoaded) {
            if ('error' in status && status.error) onFallback();
            return;
          }
          if (status.didJustFinish) onDone();
        }}
        onError={onFallback}
      />
      <Pressable style={styles.skip} onPress={onDone} hitSlop={12}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  videoRoot: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: SW,
    height: SH,
  },
  skip: {
    position: 'absolute',
    top: 54,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(26,24,25,0.08)',
  },
  skipText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: F.sans,
  },
});
