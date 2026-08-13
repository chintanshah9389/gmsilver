import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';

export function getFloatingTabBarStyle(bottomInset: number) {
  const bottom = Math.max(bottomInset, 8);
  return {
    position: 'absolute' as const,
    left: 16,
    right: 16,
    bottom,
    height: 68,
    borderRadius: R.xl,
    backgroundColor: C.surface,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: C.borderHi,
    paddingBottom: 0,
    paddingTop: 6,
    ...E.floatShadow,
    ...(Platform.OS === 'android' ? { elevation: 14 } : null),
  };
}

/** Space reserved by the floating tab bar (for sticky footers above it). */
export function getTabBarClearance(bottomInset: number, gap = 10) {
  return 68 + Math.max(bottomInset, 8) + gap;
}

function findTabNavigator(navigation: any) {
  let current = navigation;
  for (let i = 0; i < 4 && current; i += 1) {
    const state = current.getState?.();
    if (state?.type === 'tab') return current;
    // Sometimes the navigator that owns tab options is the parent of a tab state child
    const parent = current.getParent?.();
    if (!parent) break;
    const parentState = parent.getState?.();
    if (parentState?.type === 'tab') return parent;
    current = parent;
  }
  return navigation.getParent?.() ?? null;
}

/** Hide the parent tab bar while this screen is focused so sticky CTAs stay visible. */
export function useHideTabBarOnFocus() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const restoredStyle = useMemo(
    () => getFloatingTabBarStyle(insets.bottom),
    [insets.bottom],
  );

  useFocusEffect(
    useCallback(() => {
      const tabNav = findTabNavigator(navigation);
      tabNav?.setOptions?.({ tabBarStyle: { display: 'none' } });

      return () => {
        tabNav?.setOptions?.({ tabBarStyle: restoredStyle });
      };
    }, [navigation, restoredStyle]),
  );
}
