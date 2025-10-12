import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function Support() {
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const faqs = [
    {
      q: 'How do I reset my PIN?',
      a: 'Go to profile > PIN > Reset PIN and follow the prompts.',
    },
    {
      q: 'How can I fund my wallet?',
      a: 'On the dashboard, tap “Add Funds” and choose your payment method.',
    },
    {
      q: 'Is my personal data secure?',
      a: 'Yes. All transactions are encrypted end-to-end and stored securely.',
    },
  ];

  if (showChat) {
    // ✅ Show Tawk.to chat if user tapped “Chat with us”
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.background} />
        <WebView
          source={{
            uri: 'https://tawk.to/chat/68cc84edf60acf19289766fd/1j5feego6',
          }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
        />
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ✅ Default view: FAQ list
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Frequently Asked Questions</Text>

        {faqs.map((item, idx) => (
          <View key={idx} style={styles.faqItem}>
            <TouchableOpacity
              onPress={() => setExpanded(expanded === idx ? null : idx)}
            >
              <Text style={styles.question}>{item.q}</Text>
            </TouchableOpacity>
            {expanded === idx && <Text style={styles.answer}>{item.a}</Text>}
          </View>
        ))}

        <TouchableOpacity style={styles.chatButton} onPress={() => setShowChat(true)}>
          <Text style={styles.chatButtonText}>Still need help? Chat with us</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  scroll: { padding: 16 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 20, color: '#333' },

  faqItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingBottom: 12,
  },
  question: { fontSize: 16, fontWeight: '600', color: '#333' },
  answer: { marginTop: 8, fontSize: 14, color: '#555', lineHeight: 20 },

  chatButton: {
    marginTop: 30,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  chatButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // WebView styles
  background: { ...StyleSheet.absoluteFillObject, backgroundColor: '#f2f2f2' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
});
