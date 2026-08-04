import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface ScalePressableProps extends PressableProps {
  children: React.ReactNode;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

export default function ScalePressable({
  children,
  scaleTo = 0.98,
  style,
  ...rest
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...rest}
        style={style}
        onPressIn={(e) => {
          animateTo(scaleTo);
          rest.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          animateTo(1);
          rest.onPressOut?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
