import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  message: string;
  onClose: () => void;
};

export default function InsultModal({ visible, message, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.emoji}>💸</Text>
          <Text style={styles.title}>Budget Breached</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>I'll do better</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#ef4444', marginBottom: 10 },
  message: { fontSize: 15, color: '#334155', textAlign: 'center', lineHeight: 22 },
  btn: {
    marginTop: 20,
    backgroundColor: '#ef4444',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
