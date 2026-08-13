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
import { LinearGradient } from 'expo-linear-gradient';
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
          <LinearGradient
            colors={[C.metalGradStart, C.metalGradEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.mark}
          >
            <Text style={s.markText}>GM</Text>
          </LinearGradient>
          <Text style={s.brandName}>GM SILVER</Text>
          <Text style={s.brandTag}>Crystal origami catalog</Text>
        </View>

        <View style={s.card}>
          <LinearGradient
            colors={[C.facetA, C.facetB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.foldCorner}
          />
          <View style={s.foldEdge} />
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
    paddingHorizontal: 22,
    paddingTop: 48,
    paddingBottom: 36,
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', marginBottom: 22 },
  mark: {
    width: 76,
    height: 76,
    borderRadius: 22,
    transform: [{ rotate: '10deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    ...E.softShadow,
  },
  markText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.5,
    transform: [{ rotate: '-10deg' }],
  },
  brandName: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3.5,
  },
  brandTag: {
    color: C.accent,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: 22,
    overflow: 'hidden',
    ...E.cardShadow,
  },
  foldCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 72,
    height: 72,
    borderBottomLeftRadius: 28,
  },
  foldEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    backgroundColor: C.gold,
  },
  title: {
    color: C.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  subtitle: {
    color: C.textSub,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  body: { marginTop: 20 },
  footer: { marginTop: 22, alignItems: 'center' },
});
