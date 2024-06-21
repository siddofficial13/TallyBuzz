/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './src/App';
import {name as appName} from './app.json';
import {createNotificationChannel} from './src/Utils/NotificationServices';
import notifee, {
  AndroidStyle,
  AndroidGroupAlertBehavior,
} from '@notifee/react-native';
import auth from '@react-native-firebase/auth';

const getGroupTitle = type => {
  console.log('Notification type:', type); // Debugging log

  switch (type) {
    case 'upload_post':
      return 'Uploaded Posts';
    case 'like_post':
      return 'Liked Post';
    default:
      return 'General';
  }
};
//   ((data.showActions === 'true') && (userId === data.userId))

const displayNotification = async message => {
  const {data} = message;
  const userId = auth().currentUser?.uid;
  const actions =
    data.showActions === 'true' && userId === data.userId
      ? [
          {
            title: 'Like',
            pressAction: {id: 'like'},
          },
          {
            title: 'Dismiss',
            pressAction: {id: 'dismiss'},
          },
        ]
      : [];

  if (data.silentCheck !== 'true') {
    const groupId = `com.example.NOTIFICATION.${data.type}`;
    const groupTitle = getGroupTitle(data.type);

    // Display the summary notification if it doesn't exist
    const existingNotifications = await notifee.getDisplayedNotifications();
    const summaryNotificationExists = existingNotifications.some(
      n => n.android?.groupSummary === true && n.android?.groupId === groupId,
    );

    if (!summaryNotificationExists) {
      await notifee.displayNotification({
        id: groupId, // Use the group ID as the notification ID for the summary
        title: groupTitle,
        subtitle: `${groupTitle} notifications`,
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
      id: `${data.type}-${Date.now()}`, // Use a unique ID for each child notification
      title: data.title,
      body: data.body,
      android: {
        channelId: 'default',
        groupId: groupId,
        groupAlertBehavior: AndroidGroupAlertBehavior.ALL,
        smallIcon: 'ic_launcher',
        timestamp: Date.now(),
        showTimestamp: true,
        pressAction: {
          id: 'default',
        },

        style:
          data.imageUrl !== undefined
            ? {
                type: AndroidStyle.BIGPICTURE,
                picture: data.imageUrl,
              }
            : {
                type: AndroidStyle.INBOX,
                lines: [`${data.title}: ${data.body}`],
              },
        actions,
      },
      data,
    });
  }
};

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  await createNotificationChannel();

  await displayNotification(remoteMessage);
});

messaging().onMessage(async remoteMessage => {
  console.log('Message handled in the foreground!', remoteMessage);
  await createNotificationChannel();

  await displayNotification(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
