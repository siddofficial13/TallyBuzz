/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import messaging from '@react-native-firebase/messaging';
import notifee, {
  EventType,
  AndroidImportance,
  AndroidStyle,
} from '@notifee/react-native';
import auth from '@react-native-firebase/auth';
import firestore, {Timestamp} from '@react-native-firebase/firestore';
import NavigationServices from '../Navigators/NavigationServices';
import {useState} from 'react';
import apiUrl from './urls';
import * as Keychain from 'react-native-keychain';
import {handleNavigationFromBackground} from '../Screens/SplashScreen';

const USERS_KEY = 'logged_in_users';

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
// Get FCM token and subscribe to topic
const getFcmToken = async (): Promise<void> => {
  try {
    const token = await messaging().getToken();
    console.log('FCM token:', token);
    await subscribeToTopic('allDevices');
  } catch (error) {
    console.error('Error fetching FCM token:', error);
  }
};
// Subscribe to a topic
const subscribeToTopic = async (topic: string): Promise<void> => {
  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
  }
};
export const markNotificationAsSeen = async (userId: any, timestamp: any) => {
  try {
    const userRef = firestore().collection('Users').doc(userId);
    const userDoc = await userRef.get();
    console.log(timestamp);
    if (userDoc.exists) {
      const notifications = userDoc.data()?.notifications || [];

      // Find the notification with the same timestamp and seen status as false
      const notificationIndex = notifications.findIndex(
        (notification: any) =>
          notification.timestamp === timestamp && notification.seen === false,
      );

      if (notificationIndex !== -1) {
        // Update the seen status to true
        notifications[notificationIndex].seen = true;

        // Update the user's document
        await userRef.update({notifications: notifications});
        console.log(`Notification marked as seen for user: ${userId}`);
      } else {
        console.log(`No matching notification found for user: ${userId}`);
      }
    } else {
      console.error(`User document not found for user ID: ${userId}`);
    }
  } catch (error) {
    console.error(
      `Error marking notification as seen for user: ${userId}`,
      error,
    );
  }
};
// Function to handle navigation based on notification data
const handleNavigation = async (data: any) => {
  console.log('handleNavigation called with data:', data);

  if (data && data.redirect_to) {
    const {redirect_to, postId, userId, timestamp} = data;
    // console.log(timestamp);

    const user = auth().currentUser;
    const intended_user = data?.userId;
    console.log('Current user:', user);

    const navigateToLogin = (message: string) => {
      NavigationServices.navigate('LoginScreen', {
        screen: data.redirect_to,
        params: {postId},
        intended_user: data.userId,
        time: timestamp,
      });
    };
    const getUserCredentialsFromStorage = async (userId: any) => {
      const existingUsers = await Keychain.getGenericPassword({
        service: USERS_KEY,
      });
      if (existingUsers) {
        const users = JSON.parse(existingUsers.password);
        return users[userId];
      }
      return null;
    };
    if (user && intended_user && user.uid === intended_user) {
      markNotificationAsSeen(data.userId, timestamp);
      console.log('Navigating as current user to:', data.redirect_to);
      NavigationServices.navigate(redirect_to, {postId});
    } else if (
      (user && intended_user && user.uid !== intended_user) ||
      (!user && intended_user)
    ) {
      console.log('Checking storage for intended user:', intended_user);
      const storedCredentials = await getUserCredentialsFromStorage(
        intended_user,
      );
      if (storedCredentials) {
        try {
          const userCredential = await auth().signInWithEmailAndPassword(
            storedCredentials.email,
            storedCredentials.password,
          );
          console.log('Intended user signed in:', userCredential.user);

          console.log('Navigating as intended user to:', data.redirect_to);
          markNotificationAsSeen(data.userId, timestamp);
          NavigationServices.navigate(data.redirect_to, {postId});
        } catch (error) {
          console.error('Error logging in as intended user:', error);
        }
      } else {
        // No stored credentials for the intended user
        console.log(
          'No stored credentials for intended user. Navigating to login screen.',
        );
        navigateToLogin('');
      }
    } else {
      // Case 4: Other cases
      console.log('Navigating to Login with redirect to:', data.redirect_to);
      navigateToLogin('');
    }
  }
};

// Handle notification action press
export const handleNotificationActionPress = async (
  actionId: string,
  data: any,
): Promise<void> => {
  console.log('Notification action pressed:', actionId, 'with data:', data);
  const currentUser = auth().currentUser;
  const likerDoc = await firestore()
    .collection('Users')
    .doc(currentUser?.uid)
    .get();
  const likerName = likerDoc.exists ? likerDoc.data()?.name : 'TallyBuzz_User';

  const postDoc = await firestore().collection('posts').doc(data.postId).get();
  const postOwnerId = postDoc.exists ? postDoc.data()?.userId : '';
  console.log(postOwnerId);
  switch (actionId) {
    case 'like':
      await sendLikeNotificationToPostOwner(
        postOwnerId,
        likerName,
        data.postId,
        data.imageUrl,
      );
      break;
    case 'dismiss':
      console.log('Dismiss action pressed');
      break;
    case 'SwitchUser':
      NavigationServices.navigate('LoadingScreen');
      // const uid = data?.userId;
      // const storedCredentials = await getUserCredentialsFromStorage(
      //     uid,
      // );
      // const userCredential = await auth().signInWithEmailAndPassword(
      //     storedCredentials.email,
      //     storedCredentials.password,
      // );
      // const postId = data.postId;
      handleNavigationFromBackground(data);
      // console.log('Intended user signed in:', userCredential.user);
      // markNotificationAsSeen(data.userId, data.timestamp);
      // NavigationServices.navigate(data.redirect_to, { postId });

      //  handleNavigationFromBackground(data);
      break;
    default:
      console.warn(`Unhandled notification action: ${actionId}`);
      break;
  }
};

// Display notification using Notifee
// const displayNotification = async (message: any): Promise<void> => {
//     const userId = auth().currentUser?.uid;
//     const { data } = message;
//     const actions = ((data.showActions === 'true') && (userId === data.userId)) ? [
//         {
//             title: 'Like',
//             pressAction: { id: 'like' },
//         },
//         {
//             title: 'Dismiss',
//             pressAction: { id: 'dismiss' },
//         },
//     ] : [];

//     if (data.silentCheck !== 'true') {
//         await notifee.displayNotification({
//             title: data.title,
//             body: data.body,
//             android: {
//                 channelId: 'default',
//                 smallIcon: 'ic_launcher', // Your app icon
//                 pressAction: {
//                     id: 'default',
//                 },
//                 style: (data.imageUrl !== undefined) ? {
//                     type: AndroidStyle.BIGPICTURE,
//                     picture: data.imageUrl,

//                 } : {
//                     type: AndroidStyle.INBOX,
//                     lines: [`${data.title}:${data.body}`],
//                 },
//                 actions,
//             },
//             data,
//         });
//     }
// };

// Create notification channel
export async function createNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

// Handle Notifee background events
const handleBackgroundEvent = async ({type, detail}: any) => {
  console.log('Background event:', type, 'Detail:', detail);
  if (type === EventType.ACTION_PRESS && detail.pressAction?.id) {
    await handleNotificationActionPress(
      detail.pressAction.id,
      detail.notification?.data,
    );
  } else if (type === EventType.DISMISSED) {
    console.log('Notification dismissed:', detail.notification);
  }
};

// Set up notification listeners
export const notificationListeners = async (): Promise<() => void> => {
  // Ensure channel is created
  await createNotificationChannel();

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened app:', remoteMessage);
    handleNavigation(remoteMessage.data);
  });

  // Handle notification when app is opened from quit state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Initial notification opened app:', remoteMessage);
        handleNavigation(remoteMessage.data);
      }
    });

  // Handle Notifee foreground events
  const unsubscribe = notifee.onForegroundEvent(async ({type, detail}) => {
    console.log('Foreground event:', type, 'Detail:', detail);
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id) {
      await handleNotificationActionPress(
        detail.pressAction.id,
        detail.notification?.data,
      );
    } else if (type === EventType.DISMISSED) {
      console.log('Notification dismissed:', detail.notification);
    } else if (type === EventType.PRESS) {
      handleNavigation(detail.notification?.data);
    }
  });

  // Handle Notifee background events
  notifee.onBackgroundEvent(async event => {
    console.log('main notification services ke andar hu');
    await handleBackgroundEvent(event);
    if (event.type === EventType.PRESS) {
      handleNavigation(event.detail.notification?.data);
    }
  });

  // Return unsubscribe function
  return unsubscribe;
};

// Function to send notification
const sendLikeNotificationToPostOwner = async (
  userId: any,
  likerName: string,
  postId: string,
  imageUrl: string,
) => {
  try {
    console.log(userId);
    const userDoc = await firestore().collection('Users').doc(userId).get();
    const userTokens = userDoc.data()?.fcmtoken;
    const idToken = await auth().currentUser?.getIdToken(true);
    if (userTokens && Array.isArray(userTokens)) {
      const truncatedTimestamp = new Date().toISOString().toString();
      userTokens.forEach(token => {
        fetch(`${apiUrl}/send-noti-user`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            token: token,
            data: {
              title: 'New Like',
              body: `${likerName} liked your post!`,
              redirect_to: 'PostScreen',
              postId: postId,
              userId: userId,
              imageUrl: imageUrl,
              timestamp: truncatedTimestamp,
              type: 'like_post',
            },
          }),
        });
      });

      handleLike(postId);
    } else {
      console.error('User tokens not found or not an array');
    }
  } catch (error) {
    console.error('Error fetching user tokens: ', error);
  }
};

const handleLike = async (postId: string) => {
  const userId = auth().currentUser?.uid;
  if (!userId) {
    console.error('User not authenticated');
    return;
  }

  try {
    const postRef = firestore().collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (postDoc.exists) {
      const postData = postDoc.data();
      const userHasLiked = postData?.likes.includes(userId);

      // If the user has already liked the post, do nothing
      if (userHasLiked) {
        console.log('User has already liked this post');
        return;
      }

      const updatedLikes = [...postData?.likes, userId];
      await postRef.update({likes: updatedLikes});
    }
  } catch (error) {
    console.error('Error updating likes:', error);
  }
};
export default notificationListeners;
