const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// =============================================
// GEMINI AI CHATBOT
// =============================================
exports.geminiChat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { message, chatId } = data;
  if (!message) {
    throw new functions.https.HttpsError('invalid-argument', 'Message is required');
  }

  const userId = context.auth.uid;

  try {
    let history = [];
    if (chatId) {
      const historyDoc = await db.collection('chat_history').doc(chatId).get();
      if (historyDoc.exists) {
        const data = historyDoc.data();
        if (data.user_id !== userId) {
          throw new functions.https.HttpsError('permission-denied', 'Not authorized to access this chat');
        }
        history = data.messages || [];
      }
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const businessesSnapshot = await db
        .collection('businesses')
        .where('owner_uid', '==', userId)
        .get();

    const businesses = [];
    businessesSnapshot.forEach((doc) => {
      businesses.push({ id: doc.id, ...doc.data() });
    });

    const contextPrompt = `
You are KITA-LOG AI Assistant, a business management expert for small businesses in the Philippines.
You help with Sari-sari stores, ukay-ukay, online sellers, and micro-enterprises.

User Information:
- Name: ${userData.username || 'User'}
- Has ${businesses.length} business(es)

Business Summary:
${businesses.map((b) => `- ${b.business_name} (${b.business_type})`).join('\n')}

Provide helpful, practical advice in English or Tagalog based on the user's language.
Keep responses concise (2-3 paragraphs max) and actionable.

Previous conversation:
${history.slice(-6).map((m) => `${m.role}: ${m.text}`).join('\n')}

User: ${message}
Assistant:`;

    const result = await model.generateContent(contextPrompt);
    const response = result.response.text();

    const messages = [
      ...history,
      { role: 'user', text: message, timestamp: new Date().toISOString() },
      { role: 'assistant', text: response, timestamp: new Date().toISOString() },
    ];

    let docRef;
    if (chatId) {
      await db.collection('chat_history').doc(chatId).update({
        messages,
        updated_at: new Date().toISOString(),
      });
      docRef = chatId;
    } else {
      const newDoc = await db.collection('chat_history').add({
        user_id: userId,
        messages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        title: message.substring(0, 50),
      });
      docRef = newDoc.id;
    }

    return {
      chatId: docRef,
      response,
      messages,
    };
  } catch (error) {
    console.error('Gemini chat error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate response');
  }
});

// =============================================
// DAILY SUMMARY
// =============================================
exports.generateDailySummary = functions.pubsub
    .schedule('0 20 * * *')
    .timeZone('Asia/Manila')
    .onRun(async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      try {
        const settingsSnapshot = await db
            .collection('user_settings')
            .where('notification_token', '!=', null)
            .get();

        const users = [];
        settingsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.notifications_enabled !== false) {
            users.push({ uid: doc.id, token: data.notification_token });
          }
        });

        for (const user of users) {
          try {
            const businessesSnapshot = await db
                .collection('businesses')
                .where('owner_uid', '==', user.uid)
                .get();

            const businessIds = [];
            businessesSnapshot.forEach((doc) => {
              businessIds.push(doc.id);
            });

            if (businessIds.length === 0) continue;

            let totalSales = 0;
            let totalExpenses = 0;
            let transactionCount = 0;

            for (const businessId of businessIds) {
              const txSnapshot = await db
                  .collection('transactions')
                  .where('business_id', '==', businessId)
                  .where('date', '==', yesterday)
                  .get();

              txSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.type === 'sale') {
                  totalSales += data.amount || 0;
                } else {
                  totalExpenses += data.amount || 0;
                }
                transactionCount++;
              });
            }

            const netIncome = totalSales - totalExpenses;

            const message = {
              notification: {
                title: '📊 KITA-LOG Daily Summary',
                body: `Yesterday: ${transactionCount} transactions • ` +
                      `₱${totalSales.toLocaleString()} sales • ` +
                      `₱${netIncome >= 0 ? '+' : '-'}${Math.abs(netIncome).toLocaleString()} net`,
              },
              token: user.token,
              data: {
                screen: 'Dashboard',
                type: 'daily_summary',
              },
              android: {
                priority: 'high',
              },
              apns: {
                headers: {
                  'apns-priority': '10',
                },
              },
            };

            try {
              await admin.messaging().send(message);
            } catch (e) {
              console.error(`Failed to send notification to ${user.uid}:`, e);
            }
          } catch (e) {
            console.error(`Failed to process user ${user.uid}:`, e);
          }
        }

        console.log('Daily summary completed successfully');
        return null;
      } catch (error) {
        console.error('Daily summary error:', error);
        return null;
      }
    });

// =============================================
// LOW STOCK ALERTS
// =============================================
exports.checkLowStock = functions.pubsub
    .schedule('0 9 * * *')
    .timeZone('Asia/Manila')
    .onRun(async () => {
      try {
        const inventorySnapshot = await db.collection('inventory').get();
        const lowStockItems = {};

        inventorySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.current_stock <= data.low_stock_threshold) {
            const businessId = data.business_id;
            if (!lowStockItems[businessId]) {
              lowStockItems[businessId] = [];
            }
            lowStockItems[businessId].push({
              name: data.item_name,
              stock: data.current_stock,
              threshold: data.low_stock_threshold,
            });
          }
        });

        for (const [businessId, items] of Object.entries(lowStockItems)) {
          if (items.length === 0) continue;

          const businessDoc = await db.collection('businesses').doc(businessId).get();
          if (!businessDoc.exists) continue;

          const ownerUid = businessDoc.data().owner_uid;
          const settingsDoc = await db.collection('user_settings').doc(ownerUid).get();
          const token = settingsDoc.data()?.notification_token;

          if (!token) continue;

          const itemsList = items.slice(0, 5).map((i) => `${i.name} (${i.stock} left)`).join('\n');
          const remaining = items.length > 5 ? `\n+ ${items.length - 5} more items` : '';

          const message = {
            notification: {
              title: '⚠️ Low Stock Alert',
              body: `${items.length} item(s) running low:\n${itemsList}${remaining}`,
            },
            token,
            data: {
              screen: 'Stock',
              type: 'low_stock',
            },
            android: { priority: 'high' },
            apns: { headers: { 'apns-priority': '10' } },
          };

          try {
            await admin.messaging().send(message);
          } catch (e) {
            console.error(`Failed to send low stock alert to ${ownerUid}:`, e);
          }
        }

        console.log('Low stock check completed');
        return null;
      } catch (error) {
        console.error('Low stock check error:', error);
        return null;
      }
    });

// =============================================
// BUSINESS DELETION (Cascade)
// =============================================
exports.deleteBusinessCascade = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { businessId } = data;
  if (!businessId) {
    throw new functions.https.HttpsError('invalid-argument', 'Business ID is required');
  }

  const userId = context.auth.uid;

  try {
    const businessDoc = await db.collection('businesses').doc(businessId).get();
    if (!businessDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Business not found');
    }

    if (businessDoc.data().owner_uid !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to delete this business');
    }

    const collections = ['inventory', 'transactions', 'budgets', 'recurring_transactions'];

    for (const collection of collections) {
      const snapshot = await db
          .collection(collection)
          .where('business_id', '==', businessId)
          .get();

      const batch = db.batch();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      if (snapshot.size > 0) {
        await batch.commit();
      }
    }

    const membersSnapshot = await db
        .collection('business_members')
        .doc(businessId)
        .collection('members')
        .get();

    const batch2 = db.batch();
    membersSnapshot.forEach((doc) => {
      batch2.delete(doc.ref);
    });

    if (membersSnapshot.size > 0) {
      await batch2.commit();
    }

    await db.collection('businesses').doc(businessId).delete();
    await db.collection('business_members').doc(businessId).delete();

    return { success: true, message: 'Business deleted successfully' };
  } catch (error) {
    console.error('Business deletion error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete business');
  }
});

// =============================================
// RECURRING TRANSACTIONS GENERATOR
// =============================================
exports.generateRecurringTransactions = functions.pubsub
    .schedule('0 6 * * *')
    .timeZone('Asia/Manila')
    .onRun(async () => {
      const today = new Date().toISOString().split('T')[0];

      try {
        const snapshot = await db
            .collection('recurring_transactions')
            .where('next_due', '<=', today)
            .get();

        const batch = db.batch();
        let generatedCount = 0;

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const businessId = data.business_id;

          const txRef = db.collection('transactions').doc();
          batch.set(txRef, {
            business_id: businessId,
            type: data.type || 'expense',
            amount: data.amount,
            description: data.name,
            date: today,
            time: '06:00',
            items: [],
            recurring_id: doc.id,
            created_at: new Date().toISOString(),
          });

          const nextDue = calculateNextDue(data.frequency, data.day_of_month);
          batch.update(doc.ref, { next_due: nextDue });

          generatedCount++;
        }

        if (generatedCount > 0) {
          await batch.commit();
          console.log(`Generated ${generatedCount} recurring transactions`);
        }

        return null;
      } catch (error) {
        console.error('Recurring transactions error:', error);
        return null;
      }
    });

function calculateNextDue(frequency, dayOfMonth) {
  const today = new Date();
  let next = new Date(today);

  if (frequency === 'monthly') {
    next = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
  } else if (frequency === 'yearly') {
    next = new Date(today.getFullYear() + 1, today.getMonth(), dayOfMonth);
  } else if (frequency === 'weekly') {
    next.setDate(today.getDate() + 7);
  } else {
    next.setDate(today.getDate() + 1);
  }

  return next.toISOString().split('T')[0];
}

// =============================================
// DATA CLEANUP (30 days old)
// =============================================
exports.cleanupOldData = functions.pubsub
    .schedule('0 2 * * 0')
    .timeZone('Asia/Manila')
    .onRun(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      try {
        const notificationsSnapshot = await db
            .collection('notifications')
            .where('created_at', '<', cutoffStr)
            .get();

        const batch = db.batch();
        notificationsSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        if (notificationsSnapshot.size > 0) {
          await batch.commit();
          console.log(`Cleaned up ${notificationsSnapshot.size} old notifications`);
        }

        return null;
      } catch (error) {
        console.error('Cleanup error:', error);
        return null;
      }
    });