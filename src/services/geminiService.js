import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

const functions = getFunctions(getApp());

export async function sendChatMessage(message, chatId = null) {
  try {
    const geminiChat = httpsCallable(functions, 'geminiChat');
    const result = await geminiChat({ message, chatId });
    return result.data;
  } catch (error) {
    console.error('Gemini chat error:', error);
    throw error;
  }
}

export async function getChatHistory(chatId) {
  // This is handled client-side via Firestore
  // Chat history is stored in the chat_history collection
  return null;
}