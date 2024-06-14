// // NotificationServices.tsx
// import notifee, { AndroidImportance, EventType, AndroidStyle } from '@notifee/react-native';
// import messaging from '@react-native-firebase/messaging';
// import auth from '@react-native-firebase/auth';
// import NavigationServices from '../Navigators/NavigationServices';

// export async function requestUserPermission(): Promise<void> {
//   try {
//     const authStatus = await messaging().requestPermission();
//     const enabled =
//       authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//       authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//     if (!enabled) {
//       console.log('Permission not granted for FCM notifications.');
//     } else {
//       console.log('Authorization status:', authStatus);
//       await getFcmToken();
//     }
//   } catch (error) {
//     console.error('Error requesting FCM permission:', error);
//   }
// }

// const getFcmToken = async (): Promise<void> => {
//   try {
//     const token = await messaging().getToken();
//     console.log('FCM token:', token);
//     await subscribeToTopic('allDevices');
//   } catch (error) {
//     console.error('Error fetching FCM token:', error);
//   }
// };

// const subscribeToTopic = async (topic: string): Promise<void> => {
//   try {
//     await messaging().subscribeToTopic(topic);
//     console.log(`Subscribed to topic: ${topic}`);
//   } catch (error) {
//     console.error(`Error subscribing to topic ${topic}:`, error);
//   }
// };

// const handleNavigation = (data: any): void => {
//   if (data && data.redirect_to) {
//     const { redirect_to, postId } = data;

//     const user = auth().currentUser;
//     console.log('Current user:', user);
//     if (user) {
//       NavigationServices.navigate(redirect_to, { postId });
//     } else {
//       NavigationServices.navigate('LoginScreen', {
//         screen: redirect_to,
//         params: { postId },
//       });
//     }
//   }
// };

// const displayNotification = async (message: any): Promise<void> => {
//   const { notification, data } = message;

//   await notifee.displayNotification({
//     title: notification.title,
//     body: notification.body,
//     android: {
//       channelId: 'default',
//       smallIcon: 'ic_launcher', // Your app icon
//       largeIcon: data.imageUrl,
//       pressAction: {
//         id: 'default',
//       },
//       group: 'social',
//       groupSummary: false,
//       style: {
//         type: AndroidStyle.INBOX,
//         lines: [`${notification.title}: ${notification.body}`],
//       },
//       actions: [
//         {
//           title: 'View',
//           pressAction: { id: 'view' },
//         },
//         {
//           title: 'Dismiss',
//           pressAction: { id: 'dismiss' },
//         },
//       ],
//     },
//     data,
//   });
// };

// export const notificationListeners = async (): Promise<() => void> => {
//   // Ensure channel is created
//   await createNotificationChannel();

//   // Handle notification when app is in foreground
//   messaging().onMessage(async (remoteMessage) => {
//     console.log('Received in foreground:', remoteMessage);
//     await displayNotification(remoteMessage);
//   });

//   // Handle notification when app is opened from background or quit state
//   messaging().onNotificationOpenedApp((remoteMessage) => {
//     console.log('Notification opened app:', remoteMessage);
//     handleNavigation(remoteMessage.data);
//   });

//   // Handle notification when app is opened from quit state
//   messaging()
//     .getInitialNotification()
//     .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
//       if (remoteMessage) {
//         console.log('Initial notification opened app:', remoteMessage);
//         handleNavigation(remoteMessage.data);
//       }
//     });

//   // Handle Notifee foreground events
//   const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
//     switch (type) {
//       case EventType.ACTION_PRESS:
//         if (detail.pressAction.id === 'view' || detail.pressAction.id === 'dismiss') {
//           handleNotificationActionPress(detail.pressAction.id, detail.notification.data);
//         }
//         break;
//       case EventType.DISMISSED:
//         console.log('Notification dismissed:', detail.notification);
//         break;
//     }
//   });

//   // Return unsubscribe function
//   return unsubscribe;
// };

// // Function to handle notification action press
// const handleNotificationActionPress = async (actionId: string, data: any): Promise<void> => {
//   switch (actionId) {
//     case 'view':
//       handleNavigation(data);
//       break;
//     case 'dismiss':
//       console.log('Dismiss action pressed');
//       break;
//     default:
//       console.warn(`Unhandled notification action: ${actionId}`);
//       break;
//   }
// };

// // Call this function to create the notification channel
// export async function createNotificationChannel(): Promise<void> {
//   await notifee.createChannel({
//     id: 'default',
//     name: 'Default Channel',
//     importance: AndroidImportance.HIGH,
//   });
// }

// // Set up background event handler for Notifee
// const handleBackgroundEvent = async ({ type, detail }: any) => {
//   switch (type) {
//     case EventType.ACTION_PRESS:
//       if (detail.pressAction.id === 'view' || detail.pressAction.id === 'dismiss') {
//         handleNotificationActionPress(detail.pressAction.id, detail.notification.data);
//       }
//       break;
//     case EventType.DISMISSED:
//       console.log('Notification dismissed:', detail.notification);
//       break;
//   }
// };

// // Call this function to set up the background event handler
// export async function setupBackgroundHandler(): Promise<void> {
//   await notifee.onBackgroundEvent(handleBackgroundEvent);
// }

// // Call this function to display the group summary notification
// const displayGroupSummaryNotification = async (): Promise<void> => {
//   await notifee.displayNotification({
//     title: 'You have new notifications',
//     body: 'Open the app to view them',
//     android: {
//       channelId: 'default',
//       smallIcon: 'ic_launcher',
//       group: 'social',
//       groupSummary: true,
//     },
//   });
// };


import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import {Alert} from 'react-native';
import NavigationServices from '../Navigators/NavigationServices';

export async function requestUserPermission(): Promise<void> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Permission not granted for FCM notifications.');
    } else {
      console.log('Authorization status:', authStatus);
      await getFcmToken();
    }
  } catch (error) {
    console.error('Error requesting FCM permission:', error);
  }
}

const getFcmToken = async (): Promise<void> => {
  try {
    const token = await messaging().getToken();
    console.log('FCM token:', token);
    await subscribeToTopic('allDevices');
  } catch (error) {
    console.error('Error fetching FCM token:', error);
  }
};

const subscribeToTopic = async (topic: string): Promise<void> => {
  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
  }
};

export async function notificationListeners(): Promise<void> {
  messaging().onMessage(async remoteMessage => {
    console.log('Received in foreground:', remoteMessage);
    displayNotification(remoteMessage);
    handleNavigation(remoteMessage);
  });

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(
      'Notification caused app to open from background state:',
      remoteMessage,
    );
    handleNavigation(remoteMessage);
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
        handleNavigation(remoteMessage);
      }
    });
}

const displayNotification = (remoteMessage): void => {
  const {notification} = remoteMessage;
  if (notification && notification.title && notification.body) {
    Alert.alert(
      notification.title,
      notification.body,
      [
        {
          text: 'View',
          onPress: () => handleNavigation(remoteMessage),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => console.log('Notification dismissed'),
      },
    );
  }
};

const handleNavigation = (remoteMessage: any): void => {
  if (remoteMessage?.data && remoteMessage.data.redirect_to) {
    const {redirect_to, postId} = remoteMessage.data;

    const user = auth().currentUser;
    console.log('Current user:', user);
    if (user) {
      NavigationServices.navigate(redirect_to, {postId});
    } else {
      NavigationServices.navigate('LoginScreen', {
        screen: redirect_to,
        params: {postId},
      });
    }
  }
};