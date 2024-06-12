import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';
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
        const currentUser = auth().currentUser;

        if (currentUser?.uid && remoteMessage.data?.userId && remoteMessage.data.userId !== currentUser.uid) {
            console.log('Notification userId does not match current user. Notification will not be displayed.');
            return;
        }
        displayNotification(remoteMessage);
        // handleNavigation(remoteMessage);
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification caused app to open from background state:', remoteMessage);
        const currentUser = auth().currentUser;

        if (currentUser?.uid && remoteMessage.data?.userId && remoteMessage.data.userId !== currentUser.uid) {
            console.log('Notification userId does not match current user. Notification will not be displayed.');
            NavigationServices.navigate('UnauthorisedLoginRedirectScreen');
            return;
        }
        handleNavigation(remoteMessage);
    });

    messaging().getInitialNotification().then(remoteMessage => {
        if (remoteMessage) {
            console.log('Notification caused app to open from quit state:', remoteMessage.notification);
            handleNavigation(remoteMessage);
        }
    });
}

const displayNotification = (remoteMessage: any): void => {
    const { notification } = remoteMessage;
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
        const { redirect_to, postId, userId } = remoteMessage.data;

        const user = auth().currentUser;
        console.log('Current user:', user);
        if (user) {
            NavigationServices.navigate(redirect_to, { postId });
        } else {
            NavigationServices.navigate('LoginScreen', {
                screen: redirect_to,
                params: { postId },
            });
        }
    }
};
