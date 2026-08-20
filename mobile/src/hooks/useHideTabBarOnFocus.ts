import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/theme/colors';

export function getFloatingTabBarStyle(bottomInset: number) {
  const pad = Math.max(bottomInset, 8);
  return {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: 58 + pad,
    borderRadius: 0,
    backgroundColor: C.ivory,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    borderWidth: 0,
    paddingBottom: pad,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  };
}

/** Space reserved by the tab bar (for sticky footers above it). */
export function getTabBarClearance(bottomInset: number, gap = 8) {
  return 58 + Math.max(bottomInset, 8) + gap;
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
