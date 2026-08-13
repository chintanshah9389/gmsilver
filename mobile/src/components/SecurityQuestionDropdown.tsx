import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { C } from '@/theme/colors';
import { SECURITY_QUESTIONS } from '@/lib/security-questions';

type Props = {
  value: string;
  onChange: (key: string) => void;
};

export default function SecurityQuestionDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = SECURITY_QUESTIONS.find((q) => q.key === value);

  return (
    <>
      <TouchableOpacity style={s.trigger} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Text style={selected ? s.triggerText : s.placeholder} numberOfLines={2}>
          {selected?.label || 'Select a security question'}
        </Text>
        <Text style={s.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet}>
            <Text style={s.sheetTitle}>Security question</Text>
            <ScrollView style={s.list} keyboardShouldPersistTaps="handled">
              {SECURITY_QUESTIONS.map((q) => {
                const active = q.key === value;
                return (
                  <TouchableOpacity
                    key={q.key}
                    style={[s.option, active && s.optionActive]}
                    onPress={() => {
                      onChange(q.key);
                      setOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.optionText, active && s.optionTextActive]}>{q.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerText: { flex: 1, color: C.text, fontSize: 14 },
  placeholder: { flex: 1, color: C.textMuted, fontSize: 14 },
  chevron: { color: C.textSub, fontSize: 16 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    maxHeight: '70%',
    paddingVertical: 12,
  },
  sheetTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  list: { paddingHorizontal: 8 },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  optionActive: { backgroundColor: 'rgba(192,192,192,0.16)' },
  optionText: { color: C.text, fontSize: 14, lineHeight: 20 },
  optionTextActive: { fontWeight: '700' },
});
