import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import { F } from '@/theme/typography';
import PremiumBackground from '@/components/PremiumBackground';

type AuthShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
};

export default function AuthShell({ children, title, subtitle, footer }: AuthShellProps) {
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PremiumBackground variant="auth" />
      <StatusBar barStyle="dark-content" backgroundColor={C.ivory} />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.brand}>
          <Image
            source={require('@/assets/gm-silver-mark.png')}
            style={s.mark}
            resizeMode="contain"
          />
        </View>

        <View style={s.card}>
          <Text style={s.title}>{title}</Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          <View style={s.body}>{children}</View>
        </View>

        {footer ? <View style={s.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ivory },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 36,
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', marginBottom: 28 },
  mark: {
    width: 220,
    height: 96,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: R.xs,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    ...E.cardShadow,
  },
  title: {
    color: C.text,
    fontSize: 28,
    fontFamily: F.serif,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: C.textSub,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 22,
    fontFamily: F.sans,
  },
  body: { marginTop: 22 },
  footer: { marginTop: 22, alignItems: 'center' },
});
