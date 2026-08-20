import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
import ScalePressable from '@/components/ScalePressable';

type RememberMeRowProps = {
  checked: boolean;
  onToggle: () => void;
  forgotLabel: string;
  onForgot: () => void;
};

export default function RememberMeRow({
  checked,
  onToggle,
  forgotLabel,
  onForgot,
}: RememberMeRowProps) {
  return (
    <View style={s.row}>
      <ScalePressable style={s.remember} scaleTo={0.97} onPress={onToggle}>
        <View style={[s.box, checked && s.boxOn]}>
          {checked ? <Icon source="check" size={14} color="#fff" /> : null}
        </View>
        <Text style={s.rememberText}>Remember me</Text>
      </ScalePressable>
      <ScalePressable onPress={onForgot} scaleTo={0.97}>
        <Text style={s.forgot}>{forgotLabel}</Text>
      </ScalePressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 2,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  box: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: C.borderHi,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  rememberText: {
    color: C.text,
    fontSize: 13,
    fontFamily: F.sans,
  },
  forgot: {
    color: C.primaryDim,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: F.sans,
  },
});
