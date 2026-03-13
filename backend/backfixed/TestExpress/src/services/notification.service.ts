import webpush from 'web-push';
import { query } from '../db';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:test@example.com';

const pushEnabled =
  vapidPublicKey.length > 0 &&
  vapidPrivateKey.length > 0 &&
  vapidSubject.length > 0;

if (pushEnabled) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (error) {
    console.error('Push disabled: invalid VAPID keys');
  }
}

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string
) => {
  const result = await query(
    `
      INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
      VALUES ($1, $2, $3, $4, false, NOW())
      RETURNING *
    `,
    [userId, type, title, message]
  );

  return result.rows[0];
};

export const getNotifications = async (userId: string) => {
  const result = await query(
    `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  const result = await query(
    `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `,
    [notificationId, userId]
  );

  return result.rows[0];
};

export const savePushSubscription = async (
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }
) => {
  const result = await query(
    `
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `,
    [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
  );

  return result.rows[0];
};

export const sendPushToUser = async (
  userId: string,
  payload: { title: string; message: string }
) => {
  if (!pushEnabled) {
    console.log('Push disabled: VAPID keys not configured');
    return;
  }

  const result = await query(
    `SELECT * FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );

  for (const sub of result.rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error('Push send error', error);
    }
  }
};