// import messaging from '@react-native-firebase/messaging';
// import auth from '@react-native-firebase/auth';
// import { Alert } from 'react-native';
// import NavigationServices from '../Navigators/NavigationServices';


// export async function requestUserPermission(): Promise<void> {
//     try {
//         const authStatus = await messaging().requestPermission();
//         const enabled =
//             authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//             authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//         if (!enabled) {
//             console.log('Permission not granted for FCM notifications.');
//         } else {
//             console.log('Authorization status:', authStatus);
//             await getFcmToken();
//         }
//     } catch (error) {
//         console.error('Error requesting FCM permission:', error);
//     }
// }

// const getFcmToken = async (): Promise<void> => {
//     try {
//         const token = await messaging().getToken();
//         console.log('FCM token:', token);
//         await subscribeToTopic('allDevices');
//     } catch (error) {
//         console.error('Error fetching FCM token:', error);
//     }
// };

// const subscribeToTopic = async (topic: string): Promise<void> => {
//     try {
//         await messaging().subscribeToTopic(topic);
//         console.log(`Subscribed to topic: ${topic}`);
//     } catch (error) {
//         console.error(`Error subscribing to topic ${topic}:`, error);
//     }
// };

// export async function notificationListeners(): Promise<void> {
//     messaging().onMessage(async remoteMessage => {
//         console.log('Received in foreground:', remoteMessage);
//         const currentUser = auth().currentUser;

//         if (currentUser?.uid && remoteMessage.data?.userId && remoteMessage.data.userId !== currentUser.uid) {
//             console.log('Notification userId does not match current user. Notification will not be displayed.');
//             return;
//         }
//         displayNotification(remoteMessage);
//         // handleNavigation(remoteMessage);
//     });

//     messaging().onNotificationOpenedApp(remoteMessage => {
//         console.log('Notification caused app to open from background state:', remoteMessage);
//         const currentUser = auth().currentUser;

//         if (currentUser?.uid && remoteMessage.data?.userId && remoteMessage.data.userId !== currentUser.uid) {
//             console.log('Notification userId does not match current user. Notification will not be displayed.');
//             NavigationServices.navigate('UnauthorisedLoginRedirectScreen');
//             return;
//         }
//         handleNavigation(remoteMessage);
//     });

//     messaging().getInitialNotification().then(remoteMessage => {
//         if (remoteMessage) {
//             console.log('Notification caused app to open from quit state:', remoteMessage.notification);
//             handleNavigation(remoteMessage);
//         }
//     });
// }

// const displayNotification = (remoteMessage: any): void => {
//     const { notification } = remoteMessage;
//     if (notification && notification.title && notification.body) {
//         Alert.alert(
//             notification.title,
//             notification.body,
//             [
//                 {
//                     text: 'View',
//                     onPress: () => handleNavigation(remoteMessage),
//                 },
//             ],
//             {
//                 cancelable: true,
//                 onDismiss: () => console.log('Notification dismissed'),
//             },
//         );
//     }
// };

// const handleNavigation = (remoteMessage: any): void => {
//     if (remoteMessage?.data && remoteMessage.data.redirect_to) {
//         const { redirect_to, postId, userId } = remoteMessage.data;

//         const user = auth().currentUser;
//         console.log('Current user:', user);
//         if (user) {
//             NavigationServices.navigate(redirect_to, { postId });
//         } else {
//             NavigationServices.navigate('LoginScreen', {
//                 screen: redirect_to,
//                 params: { postId },
//             });
//         }
//     }
// };

import messaging from '@react-native-firebase/messaging';
import notifee, { EventType, AndroidImportance, AndroidStyle } from '@notifee/react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import NavigationServices from '../Navigators/NavigationServices';
import { useState } from 'react';

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
// Function to handle navigation based on notification data
const handleNavigation = async (data: any) => {
    console.log('handleNavigation called with data:', data);

    if (data && data.redirect_to) {
        const { redirect_to, postId, userId } = data;

        const user = auth().currentUser;
        console.log('Current user:', user);
        if (user) {
            NavigationServices.navigate(redirect_to, { postId });
        }
        else {
            NavigationServices.navigate('LoginScreen', {
                screen: redirect_to,
                params: { postId },
            });
        }
    }
};

// Handle notification action press
const handleNotificationActionPress = async (actionId: string, data: any): Promise<void> => {
    console.log('Notification action pressed:', actionId, 'with data:', data);
    const currentUser = auth().currentUser;
    const likerDoc = await firestore().collection('Users').doc(currentUser?.uid).get();
    const likerName = likerDoc.exists ? likerDoc.data()?.name : 'TallyBuzz_User';

    const postDoc = await firestore().collection('posts').doc(data.postId).get();
    const postOwnerId = postDoc.exists ? postDoc.data()?.userId : '';
    console.log(postOwnerId);
    switch (actionId) {
        case 'like':
            await sendLikeNotificationToPostOwner(postOwnerId, likerName, data.postId, data.imageUrl);
            break;
        case 'dismiss':
            console.log('Dismiss action pressed');
            break;
        default:
            console.warn(`Unhandled notification action: ${actionId}`);
            break;
    }
};

// Display notification using Notifee
const displayNotification = async (message: any): Promise<void> => {
    const { data } = message;
    const actions = data.showActions === 'true' ? [
        {
            title: 'Like',
            pressAction: { id: 'like' },
        },
        {
            title: 'Dismiss',
            pressAction: { id: 'dismiss' },
        },
    ] : [];

    if (data.silentCheck !== 'true') {
        await notifee.displayNotification({
            title: data.title,
            body: data.body,
            android: {
                channelId: 'default',
                smallIcon: 'ic_launcher', // Your app icon
                pressAction: {
                    id: 'default',
                },
                style: (data.imageUrl !== undefined) ? {
                    type: AndroidStyle.BIGPICTURE,
                    picture: data.imageUrl,

                } : {
                    type: AndroidStyle.INBOX,
                    lines: [`${data.title}:${data.body}`],
                },
                actions,
            },
            data,
        });
    }
};


// Create notification channel
export async function createNotificationChannel(): Promise<void> {
    await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
    });
}

// Handle Notifee background events
const handleBackgroundEvent = async ({ type, detail }: any) => {
    console.log('Background event:', type, 'Detail:', detail);
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id) {
        await handleNotificationActionPress(detail.pressAction.id, detail.notification?.data);
    } else if (type === EventType.DISMISSED) {
        console.log('Notification dismissed:', detail.notification);
    } else if (type === EventType.DELIVERED) {
        // Handle delivery event if needed
    }
};

// Set up notification listeners
export const notificationListeners = async (): Promise<() => void> => {
    // Ensure channel is created
    await createNotificationChannel();

    // Handle notification when app is in foreground
    messaging().onMessage(async (remoteMessage) => {
        console.log('Received in foreground:', remoteMessage);
        await displayNotification(remoteMessage);
    });

    // Handle notification when app is opened from background or quit state
    messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('Notification opened app:', remoteMessage);
        handleNavigation(remoteMessage.data);
    });

    // Handle notification when app is opened from quit state
    messaging().getInitialNotification().then((remoteMessage) => {
        if (remoteMessage) {
            console.log('Initial notification opened app:', remoteMessage);
            handleNavigation(remoteMessage.data);
        }
    });

    // Handle Notifee foreground events
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
        console.log('Foreground event:', type, 'Detail:', detail);
        if (type === EventType.ACTION_PRESS && detail.pressAction?.id) {
            await handleNotificationActionPress(detail.pressAction.id, detail.notification?.data);
        } else if (type === EventType.DISMISSED) {
            console.log('Notification dismissed:', detail.notification);
        } else if (type === EventType.PRESS) {
            handleNavigation(detail.notification?.data);
        }
    });

    // Handle Notifee background events
    notifee.onBackgroundEvent(async (event) => {
        await handleBackgroundEvent(event);
        if (event.type === EventType.PRESS) {
            handleNavigation(event.detail.notification?.data);
        }
    });

    // Return unsubscribe function
    return unsubscribe;
};

// Function to send notification
const sendLikeNotificationToPostOwner = async (userId: any,
    likerName: string,
    postId: string,
    imageUrl: string) => {
    try {
        console.log(userId)
        const userDoc = await firestore().collection('Users').doc(userId).get();
        const userTokens = userDoc.data()?.fcmtoken;

        if (userTokens && Array.isArray(userTokens)) {
            userTokens.forEach(token => {
                fetch(
                    `https://baker-subscribers-exhibits-outlets.trycloudflare.com/send-noti-user`,
                    {
                        method: 'post',
                        headers: {
                            'Content-Type': 'application/json',
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
                            },
                        }),
                    },
                );
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
            await postRef.update({ likes: updatedLikes });
        }
    } catch (error) {
        console.error('Error updating likes:', error);
    }
};
export default notificationListeners;
