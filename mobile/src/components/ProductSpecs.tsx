import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { C, R } from '@/theme/colors';
import { F } from '@/theme/typography';
import ScalePressable from '@/components/ScalePressable';

type Props = {
  purity?: string | null;
  weight?: number | string | null;
};

function clean(value?: string | number | null): string {
  if (value == null) return '';
  return String(value).trim();
}

type Metric = {
  label: string;
  value: string;
  icon: string;
};

/** Interactive purity / weight tiles. */
export default function ProductSpecs({ purity, weight }: Props) {
  const metrics = useMemo(() => {
    const next: Metric[] = [];
    const purityVal = clean(purity);
    const weightVal = clean(weight);
    if (purityVal) next.push({ label: 'Purity', value: purityVal, icon: 'shield-check-outline' });
    if (weightVal) next.push({ label: 'Weight', value: `${weightVal} g`, icon: 'weight-gram' });
    return next;
  }, [purity, weight]);

  if (!metrics.length) return null;

  return (
    <View style={s.wrap}>
      <Text style={s.sectionLabel}>Specifications</Text>
      <View style={s.metrics}>
        {metrics.map((m) => (
          <ScalePressable
            key={m.label}
            scaleTo={0.97}
            style={[s.metric, metrics.length === 1 && s.metricSolo]}
          >
            <View style={s.iconWrap}>
              <Icon source={m.icon} size={18} color={C.goldDim} />
            </View>
            <Text style={s.metricLabel}>{m.label}</Text>
            <Text style={s.metricValue} numberOfLines={2}>
              {m.value}
            </Text>
          </ScalePressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginTop: 4,
    gap: 10,
  },
  sectionLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  metricSolo: {
    flex: 0,
    minWidth: '48%',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: F.sans,
    marginBottom: 4,
  },
  metricValue: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: F.serif,
    lineHeight: 22,
  },
});
