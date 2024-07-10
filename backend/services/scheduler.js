const admin = require('firebase-admin');

const sendSilentNotificationsAndRemoveInvalidTokens = async () => {
  try {
    const notifySnapshot = await admin.firestore().collection('Notify').get();
    const userSnapshot = await admin.firestore().collection('Users').get();

    // Set to accumulate all unique tokens
    const tokens = new Set();

    // Batch to update documents in Firestore
    const notifyBatch = admin.firestore().batch();
    const userBatch = admin.firestore().batch();

    // Process Notify collection
    notifySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
        data.fcmtoken.forEach(token => {
          tokens.add(token); // Add token to set
        });

        // Remove fcmtoken from Notify document
        notifyBatch.update(doc.ref, {
          fcmtoken: admin.firestore.FieldValue.delete(),
        });
      }
    });

    // Process Users collection
    userSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
        data.fcmtoken.forEach(token => {
          tokens.add(token); // Add token to set
        });

        // Remove fcmtoken from Users document
        userBatch.update(doc.ref, {
          fcmtoken: admin.firestore.FieldValue.delete(),
        });
      }
    });

    // Convert set to array of unique tokens
    const uniqueTokens = Array.from(tokens);

    if (uniqueTokens.length > 0) {
      const invalidTokens = new Set();

      // Send notifications individually
      for (const token of uniqueTokens) {
        const message = {
          data: {
            silentCheck: 'true',
          },
          android: {
            priority: 'high',
          },
          apns: {
            payload: {
              aps: {
                'content-available': 1,
              },
            },
          },
          token: token,
        };

        try {
          await admin.messaging().send(message);
        } catch (error) {
          if (
            error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.add(token);
          }
        }
      }

      // Handle invalid tokens
      if (invalidTokens.size > 0) {
        notifySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
            const validTokens = data.fcmtoken.filter(
              token => !invalidTokens.has(token),
            );
            notifyBatch.update(doc.ref, {fcmtoken: validTokens});
          }
        });

        userSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
            const validTokens = data.fcmtoken.filter(
              token => !invalidTokens.has(token),
            );
            userBatch.update(doc.ref, {fcmtoken: validTokens});
          }
        });

        // Commit batch updates to Firestore
        await notifyBatch.commit();
        await userBatch.commit();

        console.log(
          'Invalid tokens removed from Notify and Users collections.',
        );
      }

      console.log('Successfully sent messages.');
    } else {
      console.log('No tokens found to send notifications.');
    }
  } catch (error) {
    console.error(
      'Error sending silent notifications and removing invalid tokens:',
      error,
    );
  }
};

const cleanUpSeenNotifications = async () => {
  try {
    const usersSnapshot = await admin.firestore().collection('Users').get();
    const batch = admin.firestore().batch();

    usersSnapshot.forEach(userDoc => {
      const userRef = admin.firestore().collection('Users').doc(userDoc.id);
      const notifications = userDoc.data().notifications;

      if (notifications && notifications.length > 0) {
        const updatedNotifications = notifications.filter(
          notification => !notification.seen,
        );

        batch.update(userRef, {notifications: updatedNotifications});
      }
    });

    await batch.commit();

    console.log('Clean up of seen notifications completed successfully.');
  } catch (error) {
    console.error('Error cleaning up seen notifications:', error);
  }
};

const sendNotificationToNotifyUsers = async () => {
  try {
    const notifySnapshot = await admin.firestore().collection('Notify').get();
    const tokens = [];
    const userNotificationPromises = [];
    const userTokenMap = new Map();
    const batch = admin.firestore().batch();

    notifySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
        if (data.fcmtoken.length > 0) {
          tokens.push(...data.fcmtoken); // Add all tokens from the array
          data.fcmtoken.forEach(token => {
            userTokenMap.set(token, data.userId);
          });

          // Prepare to delete the fcmtoken field from the document
          batch.update(doc.ref, {
            fcmtoken: admin.firestore.FieldValue.delete(),
          });
        } else {
          console.log(`FCM tokens array is empty for user: ${doc.id}`);
        }
      } else {
        console.log(`FCM tokens not found or not an array for user: ${doc.id}`);
      }
    });

    if (tokens.length > 0) {
      const truncatedTimestamp = new Date().toISOString();

      // Split tokens into chunks of 500 (FCM supports up to 500 tokens per request)
      const chunkSize = 500;
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const tokenChunk = tokens.slice(i, i + chunkSize);

        // Create a separate message for each chunk with user-specific data
        const messages = tokenChunk.map(token => {
          const userId = userTokenMap.get(token);
          return {
            token: token,
            data: {
              title: 'App Update Available',
              body: 'A new app update is available for you to use',
              redirect_to: 'NotifyMeRedirectScreen',
              timestamp: truncatedTimestamp,
              userId: userId ? userId : '',
            },
            android: {
              priority: 'high',
            },
          };
        });

        const response = await admin.messaging().sendAll(messages);

        console.log(`Successfully sent messages: ${response.successCount}`);
        console.log(`Failed messages: ${response.failureCount}`);

        response.responses.forEach((resp, idx) => {
          const token = tokenChunk[idx];
          const userId = userTokenMap.get(token);

          if (resp.success) {
            if (userId) {
              const userRef = admin.firestore().collection('Users').doc(userId);
              const notification = {
                title: 'App Update Available',
                body: 'A new app update is available for you to use',
                redirect_to: 'NotifyMeRedirectScreen',
                seen: false, // Initially set as unseen
                timestamp: truncatedTimestamp,
                userId: userId, // Include userId in the notification object
              };

              // Add a promise to the array
              userNotificationPromises.push(
                userRef
                  .update({
                    notifications:
                      admin.firestore.FieldValue.arrayUnion(notification),
                  })
                  .then(() => {
                    console.log(
                      `Notification stored successfully for user: ${userId}`,
                    );
                  })
                  .catch(error => {
                    console.error(
                      `Error storing notification for user: ${userId}`,
                      error,
                    );
                  }),
              );
            } else {
              console.error(`User ID not found for token: ${token}`);
            }
          } else {
            console.error(`Failed to send to ${token}: ${resp.error}`);
          }
        });
      }

      // Commit the batch to delete the fcmtoken fields
      await batch.commit();
      console.log('fcmtoken fields cleared from Notify collection.');

      // Wait for all promises to resolve
      await Promise.all(userNotificationPromises);
    } else {
      console.log('No tokens found in the Notify collection.');
    }
  } catch (error) {
    console.error('Error sending notifications to Notify users:', error);
  }
};

module.exports = {
  sendSilentNotificationsAndRemoveInvalidTokens,
  cleanUpSeenNotifications,
  sendNotificationToNotifyUsers,
};
