require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const {firestore} = require('firebase-admin');
const cron = require('node-cron');
const {initializeFirebase} = require('./config/firebaseConfig.js');
const {sendNotification} = require('./services/notificationService.js');
const sendEmail = require('./services/userService.js');
const {
  sendSilentNotificationsAndRemoveInvalidTokens,
  cleanUpSeenNotifications,
  sendNotificationToNotifyUsers,
} = require('./services/scheduler.js');
const verifyToken = require('./middlewares/verifyToken.js');

const app = express();
const port = 3000;

initializeFirebase();

app.use(bodyParser.json());

app.post('/send-reset-pass-mail', async (req, res) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  const {email} = req.body;
  try {
    await verifyToken(idToken);
    try {
      const link = await admin.auth().generatePasswordResetLink(email);

      await sendEmail(email, link);

      console.log('Password reset link sent:', link);
      res.status(200).send('Password reset link sent');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      res.status(500).send('Error sending password reset email');
    }
  } catch (error) {
    console.log('Authorization Required:', error);
    res.status(401).send('Authorization Required');
  }
});

app.post('/send-noti-user', async (req, res) => {
  const {token, data} = req.body;
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  const message = {
    token: token,
    data: {
      title: data.title || 'Notification Title',
      body: data.body || 'Notification Body',
      redirect_to: data.redirect_to || 'PostScreen',
      postId: data.postId,
      userId: data.userId,
      imageUrl: data.imageUrl,
      timestamp: data.timestamp,
      type: 'like_post',
    },
    android: {
      priority: 'high',
    },
  };

  try {
    await verifyToken(idToken);
    try {
      const result = await sendNotification(message);

      if (result.success) {
        try {
          const userRef = firestore().collection('Users').doc(data.userId);
          await userRef.update({
            notifications: firestore.FieldValue.arrayUnion({
              title: data.title || 'Notification Title',
              body: data.body || 'Notification Body',
              postId: data.postId,
              redirect_to: data.redirect_to,
              seen: false,
              timestamp: data.timestamp,
            }),
          });
          res.status(200).send({
            success: true,
            message:
              "Notification sent successfully and stored in user's document",
          });
        } catch (error) {
          console.error('Error storing notification:', error);
          res.status(500).send({
            success: false,
            message: "Error storing notification in user's document",
            error: error.message,
          });
        }
      } else {
        res.status(500).send({
          success: false,
          message: 'Error sending notification',
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).send({
        success: false,
        message: 'Error sending notification',
        error: error.message,
      });
    }
  } catch (error) {
    console.log('Authorization Required:', error);
    res.status(401).send('Authorization Required');
  }
});

app.post('/send-notification-user-update-profile', async (req, res) => {
  const {token, data} = req.body;
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  const message = {
    token: token,
    data: {
      title: 'Profile Updates',
      body: data.body || 'Your profile has been updated successfully',
      redirect_to: data.redirect_to || 'ProfileScreen',
      userId: data.userId,
      timestamp: data.timestamp,
    },
    android: {
      priority: 'high',
    },
  };

  try {
    await verifyToken(idToken);
    try {
      const result = await sendNotification(message);
      if (result.success) {
        try {
          const userRef = firestore().collection('Users').doc(data.userId);
          await userRef.update({
            notifications: firestore.FieldValue.arrayUnion({
              title: 'Profile Updates',
              body: data.body || 'Your profile has been updated successfully',
              redirect_to: data.redirect_to || 'ProfileScreen',
              seen: false,
              timestamp: data.timestamp,
            }),
          });
          res.status(200).send({
            success: true,
            message:
              "Notification sent successfully and stored in user's document",
          });
        } catch (error) {
          console.error('Error storing notification:', error);
          res.status(500).send({
            success: false,
            message: "Error storing notification in user's document",
            error: error.message,
          });
        }
      } else {
        res.status(500).send({
          success: false,
          message: 'Error sending notification',
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).send({
        success: false,
        message: 'Error sending notification',
        error: error.message,
      });
    }
  } catch (error) {
    console.log('Authorization Required:', error);
    res.status(401).send('Authorization Required');
  }
});

app.post('/send-broadcast', async (req, res) => {
  const {token, data} = req.body;
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  const message = {
    token: token,
    data: data || {
      title: 'Notification Title',
      body: 'Notification Body',
      redirect_to: 'PostScreen',
      timestamp: data.timestamp,
      type: 'upload_post',
    },
    android: {
      priority: 'high',
    },
  };

  try {
    await verifyToken(idToken);
    try {
      const result = await sendNotification(message);

      if (result.success) {
        try {
          const userRef = admin
            .firestore()
            .collection('Users')
            .doc(data.userId);

          await userRef.update({
            notifications: admin.firestore.FieldValue.arrayUnion({
              title: data.title,
              body: data.body,
              redirect_to: data.redirect_to || 'PostScreen',
              postId: data.postId,
              seen: false,
              timestamp: data.timestamp,
            }),
          });
          res.status(200).send({
            success: true,
            message:
              "Notification sent successfully and stored in user's document",
          });
        } catch (error) {
          console.error('Error storing notification:', error);
          res.status(500).send({
            success: false,
            message: "Error storing notification in user's document",
            error: error.message,
          });
        }
      } else {
        res.status(500).send({
          success: false,
          message: 'Error sending notification',
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).send({
        success: false,
        message: 'Error sending notification',
        error: error.message,
      });
    }
  } catch (error) {
    console.log('Authorization Required:', error);
    res.status(401).send('Authorization Required');
  }
});

cron.schedule('*/1 * * * *', sendSilentNotificationsAndRemoveInvalidTokens);

cron.schedule('*/1 * * * *', cleanUpSeenNotifications);

cron.schedule('*/1 8-22 * * *', sendNotificationToNotifyUsers);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
