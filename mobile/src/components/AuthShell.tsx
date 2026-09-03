import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { C } from '@/theme/colors';
import { E } from '@/theme/effects';
import { F } from '@/theme/typography';
import PremiumBackground from '@/components/PremiumBackground';
import BrandLogo from '@/components/BrandLogo';

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
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.brand}>
          <BrandLogo width={200} />
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
  root: { flex: 1, backgroundColor: C.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', marginBottom: 22 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    ...E.cardShadow,
  },
  title: {
    color: C.text,
    fontSize: 24,
    fontFamily: F.serif,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: C.textSub,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: F.sans,
  },
  body: { marginTop: 20 },
  footer: { marginTop: 18, alignItems: 'center' },
});
