import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { C, FONT } from '../constants/theme';

type Props = {
  value: string;        // "YYYY-MM-DD"
  onChange: (date: string) => void;
};

function toDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DatePicker({ value, onChange }: Props) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web: use native HTML <input type="date"> — RNDateTimePicker doesn't support web
  if (Platform.OS === 'web') {
    const handleChange = (e: any) => {
      const v: string = e.target.value;
      if (!v) {
        setError('date is required');
        return;
      }
      const picked = new Date(v);
      const today = new Date(); today.setHours(23, 59, 59, 999);
      if (isNaN(picked.getTime())) {
        setError('invalid date');
        return;
      }
      if (picked > today) {
        setError('date cannot be in the future');
        return;
      }
      setError(null);
      onChange(v);
    };

    return (
      <View>
        <View style={[styles.webWrapper, error ? styles.webWrapperError : null]}>
          {/* @ts-ignore – web-only element */}
          <input
            type="date"
            value={value}
            max={toStr(new Date())}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: 'none',
              color: '#eaeaea',
              fontFamily: 'monospace',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none',
              colorScheme: 'dark',
            }}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // Native: show picker in modal on press
  return (
    <>
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        <Text style={styles.label}>date</Text>
        <Text style={styles.value}>{value}</Text>
      </Pressable>

      {show && (
        <Modal transparent animationType="fade">
          <Pressable style={styles.overlay} onPress={() => setShow(false)}>
            <View style={styles.pickerBox}>
              <RNDateTimePicker
                value={toDate(value)}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_, d) => {
                  if (d) onChange(toStr(d));
                  setShow(false);
                }}
                themeVariant="dark"
              />
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, overflow: 'hidden',
  },
  webWrapperError: { borderColor: C.danger },
  errorText: { fontFamily: FONT.mono, fontSize: 11, color: C.danger, marginTop: 4 },
  field: {
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, padding: 12, flexDirection: 'row', justifyContent: 'space-between',
  },
  label: { fontFamily: FONT.mono, fontSize: 14, color: C.textMuted },
  value: { fontFamily: FONT.mono, fontSize: 14, color: C.accent },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerBox: {
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    paddingBottom: 30,
  },
});
