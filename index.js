/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidGroupAlertBehavior,
} from '@notifee/react-native';

const createNotificationChannel = async () => {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
};

const displayGroupedNotification = async remoteMessage => {
  const {notification, data} = remoteMessage;
  const groupId = `com.example.NOTIFICATION.${data.type}`;

  // Display the summary notification if it doesn't exist
  const existingNotifications = await notifee.getDisplayedNotifications();
  const summaryNotificationExists = existingNotifications.some(
    n => n.android?.groupSummary === true && n.android?.groupId === groupId,
  );

  if (!summaryNotificationExists) {
    await notifee.displayNotification({
      id: groupId, // Use the group ID as the notification ID for the summary
      title: 'Grouped Notifications',
      subtitle: 'New notifications',
      body: 'Tap to view details',
      android: {
        channelId: 'default',
        groupSummary: true,
        groupId: groupId,
        groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
        smallIcon: 'ic_launcher', // Ensure this matches your app's icon
      },
    });
  }

  // Display the child notification
  await notifee.displayNotification({
    id: `${data.notificationId}-${Date.now()}`, // Use a unique ID for each child notification
    title: notification.title,
    body: notification.body,
    android: {
      channelId: 'default',
      groupId: groupId,
      groupAlertBehavior: AndroidGroupAlertBehavior.ALL,
      smallIcon: 'ic_launcher',
      timestamp: Date.now(),
      showTimestamp: true,
    },
  });
};
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  await createNotificationChannel();

  // Display grouped notification
  await displayGroupedNotification(remoteMessage);
});
AppRegistry.registerComponent(appName, () => App);
