import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { C, FONT } from '../constants/theme';

type Props = { visible: boolean; message: string; onClose: () => void };

export default function InsultModal({ visible, message, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.tag}>// budget_breach.exe</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>$ acknowledge</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  box: {
    backgroundColor: C.surface, borderRadius: 8,
    padding: 28, width: '100%',
    borderWidth: 1, borderColor: C.danger,
  },
  tag: { fontFamily: FONT.mono, fontSize: 11, color: C.danger, marginBottom: 14 },
  message: { fontFamily: FONT.mono, fontSize: 15, color: C.text, lineHeight: 24 },
  btn: {
    marginTop: 24, borderWidth: 1, borderColor: C.accent,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 6, alignSelf: 'flex-start',
  },
  btnText: { fontFamily: FONT.mono, color: C.accent, fontSize: 13 },
});
