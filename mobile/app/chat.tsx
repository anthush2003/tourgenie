import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { API_BASE } from '@/services/config';


import { getSessionId } from '@/services/session';
import TourGenieLogo from '@/components/TourGenieLogo';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/auth';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: string[];
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: 'Best time to visit?', emoji: '☀️' },
  { label: 'Plan a 7-day itinerary', emoji: '🗓️' },
  { label: 'Local food to try?', emoji: '🍛' },
  { label: 'Budget travel tips', emoji: '💰' },
  { label: 'Safari recommendations', emoji: '🐆' },
  { label: 'Best beaches to visit', emoji: '🏖️' },
];

const ACTION_LABELS: Record<string, string> = {
  'create-tour': '🗺️ Create Tour',
  'daily-mode': '🧭 Daily Mode',
  'hotels': '🏨 Browse Hotels',
  'tours': '🏔️ Browse Tours',
  'profile': '👤 My Profile',
};

function genId() { return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Ayubowan! 🌿 I\'m TourGenie AI — your expert guide to Sri Lanka. Ask me about destinations, itineraries, hotels, food, transport, visas, or anything else about the Pearl of the Indian Ocean!',
  timestamp: new Date(),
};

export default function ChatScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = scheme === 'dark';

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [engine, setEngine] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) setMessages([WELCOME]);
  }, [isAuthenticated]);


  React.useEffect(() => {
    fetch(`${API_BASE}/ai/status`)
      .then(r => r.json())
      .then(d => setEngine(d.engine))
      .catch(() => setEngine('rule-based'));
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: genId(), role: 'user', content: text.trim(), timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {



      const sessionId = await getSessionId();
      const payload = {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        context: { sessionId },
      };
      
      const res = await apiFetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const assistantMsg: Message = {
        id: genId(),
        role: 'assistant',
        content: data.reply || 'Ayubowan! Something went wrong — please try again.',
        actions: data.meta?.actions || [],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (_) {
      setMessages(prev => [...prev, {
        id: genId(),
        role: 'assistant',
        content: 'Ayubowan! I\'m having trouble connecting to the server. Please check your connection and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [messages, loading, scrollToBottom]);

  const clearChat = useCallback(async () => {
    setMessages([WELCOME]);
    try {
      const sessionId = await getSessionId();
      await fetch(`${API_BASE}/ai/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch (_) {
      // Ignore errors when clearing chat
    }
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      { }
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.brand }}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TourGenieLogo size={32} />
            <View>
              <Text style={styles.headerTitle}>TourGenie AI</Text>
              <Text style={styles.headerSub}>
                {engine === 'gemini-2.0-flash' ? '⚡ Gemini 2.0 Flash' : '🧠 Smart Assistant'} · Sri Lanka Expert
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      { }
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 8 }}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} theme={theme} isDark={isDark} onAction={sendMessage} />
        ))}
        {loading && (
          <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: theme.backgroundElement }]}>
            <ActivityIndicator size="small" color={Colors.brand} />
            <Text style={[styles.typingText, { color: theme.textSecondary }]}>TourGenie is thinking...</Text>
          </View>
        )}
      </ScrollView>

      { }
      {messages.length <= 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {QUICK_PROMPTS.map(p => (
            <TouchableOpacity
              key={p.label}
              style={[styles.quickChip, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              onPress={() => sendMessage(p.label)}
            >
              <Text style={styles.quickEmoji}>{p.emoji}</Text>
              <Text style={[styles.quickLabel, { color: theme.text }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      { }
      <View style={[styles.inputBar, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about Sri Lanka..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.card }]}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage(input)}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: loading || !input.trim() ? theme.backgroundSelected : Colors.brand }]}
          onPress={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ msg, theme, isDark, onAction }: { msg: Message; theme: any; isDark: boolean; onAction: (t: string) => void }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && <View style={{ marginBottom: 4 }}><TourGenieLogo size={24} /></View>}
      <View style={[
        styles.bubble,
        isUser ? [styles.bubbleUser, { backgroundColor: Colors.brand }] : [styles.bubbleAssistant, { backgroundColor: isDark ? Colors.dark.backgroundElement : '#fff', borderColor: theme.border }]
      ]}>
        <Text style={[styles.bubbleText, { color: isUser ? '#fff' : theme.text }]}>{msg.content}</Text>
        {msg.actions && msg.actions.length > 0 && (
          <View style={styles.actionsRow}>
            {msg.actions.map(action => (
              <TouchableOpacity
                key={action}
                style={[styles.actionBtn, { borderColor: Colors.brand }]}
                onPress={() => onAction(`Tell me more about ${ACTION_LABELS[action] || action}`)}
              >
                <Text style={[styles.actionBtnText, { color: Colors.brand }]}>{ACTION_LABELS[action] || action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  clearBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  messages: { flex: 1 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowUser: { flexDirection: 'row-reverse' },
  bubble: { maxWidth: width * 0.78, borderRadius: 18, padding: 14 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderBottomLeftRadius: 4, borderWidth: 1 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  typingText: { fontSize: 13, marginLeft: 8 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  actionBtn: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  quickScroll: { maxHeight: 52, marginBottom: 8 },
  quickChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, gap: 6 },
  quickEmoji: { fontSize: 15 },
  quickLabel: { fontSize: 13, fontWeight: '500' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
