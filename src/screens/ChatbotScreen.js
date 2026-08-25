import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { sendChatMessage } from '../services/geminiService';
import { addDocument, getDocuments } from '../services/firestoreService';
import { t } from '../styles/designSystem';

const ChatbotScreen = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const flatListRef = useRef(null);

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      try {
        const chats = await getDocuments('chat_history', [
          { field: 'user_id', operator: '==', value: user.uid },
        ]);
        if (chats.length > 0) {
          const latest = chats.sort((a, b) => b.created_at?.localeCompare(a.created_at))[0];
          setChatId(latest.id);
          setMessages(latest.messages || []);
        } else {
          // Add welcome message
          const welcomeMsg = {
            role: 'assistant',
            text: '👋 Hi! I\'m your KITA-LOG AI assistant. Ask me about your business, inventory, sales, or anything else!',
            timestamp: new Date().toISOString(),
          };
          setMessages([welcomeMsg]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [user]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message optimistically
    const tempUserMsg = {
      role: 'user',
      text: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const result = await sendChatMessage(userMessage, chatId);

      if (result.chatId && !chatId) {
        setChatId(result.chatId);
      }

      // Replace temp messages with actual ones from server
      setMessages(result.messages || [...messages, tempUserMsg, {
        role: 'assistant',
        text: result.response,
        timestamp: new Date().toISOString(),
      }]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Send message error:', error);
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.text}
          </Text>
          <Text style={styles.messageTime}>
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  if (loadingHistory) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={t.colors.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={20} color={t.colors.white} />
          </View>
          <Text style={styles.headerTitle}>KITA-LOG AI</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={() => {
          setMessages([]);
          setChatId(null);
        }}>
          <Ionicons name="refresh-outline" size={20} color={t.colors.medium} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor={t.colors.medium}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={t.colors.white} />
            ) : (
              <Ionicons name="send" size={20} color={t.colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: t.typography.body,
    color: t.colors.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: t.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: t.typography.heading,
    fontWeight: '800',
    color: t.colors.dark,
  },
  clearBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  messageList: {
    padding: t.spacing.lg,
    paddingBottom: t.spacing.xl,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: t.spacing.md,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  assistantRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    padding: t.spacing.lg,
    borderRadius: 16,
    ...t.shadows.sm,
  },
  userBubble: {
    backgroundColor: t.colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: t.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  messageText: {
    fontSize: 15,
    fontFamily: t.typography.body,
    lineHeight: 22,
  },
  userText: {
    color: t.colors.white,
  },
  assistantText: {
    color: t.colors.dark,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: t.typography.body,
    color: t.colors.medium,
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: t.spacing.lg,
    backgroundColor: t.colors.surface,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    gap: t.spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: t.colors.background,
    borderRadius: t.radius.input,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    paddingHorizontal: t.spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontFamily: t.typography.body,
    color: t.colors.dark,
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...t.shadows.md,
  },
  sendBtnDisabled: {
    backgroundColor: t.colors.medium,
    opacity: 0.5,
  },
});

export default ChatbotScreen;