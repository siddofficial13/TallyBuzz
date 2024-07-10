const admin = require('firebase-admin');
const cron = require('node-cron');

const sendNotification = async (message, retry = false) => {
  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return {success: true, response};
  } catch (error) {
    console.error('Error sending message:', error);
    if (!retry) {
      console.log('Scheduling retry to send the message in 1 minute...');
      scheduleRetry(message);
      return {success: false, error: error.message};
    } else {
      return {success: false, error: error.message};
    }
  }
};

const scheduleRetry = message => {
  cron.schedule('*/1 * * * *', async () => {
    console.log('Retrying to send the message...');
    await sendNotification(message, true);
  });
};

module.exports = {sendNotification};
