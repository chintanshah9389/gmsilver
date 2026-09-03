import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';

/** Original GM Silver LLP mark — transparent PNG for pearl / blush backgrounds. */
export const BRAND_LOGO = require('@/assets/gm-silver-mark-clear.png');

const ASPECT = 286 / 500;

type Props = {
  width?: number;
  style?: StyleProp<ImageStyle>;
};

export default function BrandLogo({ width = 160, style }: Props) {
  return (
    <Image
      source={BRAND_LOGO}
      style={[styles.logo, { width, height: width * ASPECT }, style]}
      resizeMode="contain"
      accessibilityLabel="G. M. Silver"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: 'transparent',
  },
});
