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
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
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
      <PremiumBackground variant="auth" shimmer />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.brand}>
          <View style={s.medallion}>
            <View style={s.medallionInner}>
              <Text style={s.logo}>GM</Text>
            </View>
          </View>
          <Text style={s.brandName}>GM SILVER</Text>
          <Text style={s.brandTag}>Fine silver catalog</Text>
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
    paddingTop: 48,
    paddingBottom: 36,
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', marginBottom: 22 },
  medallion: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    ...E.softShadow,
  },
  medallionInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  logo: {
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandName: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3.2,
  },
  brandTag: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: 22,
    ...E.cardShadow,
  },
  title: {
    color: C.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: C.textSub,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  body: { marginTop: 20 },
  footer: { marginTop: 22, alignItems: 'center' },
});
