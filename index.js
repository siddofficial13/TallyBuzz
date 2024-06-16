/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './src/App';
import { name as appName } from './app.json';
import { createNotificationChannel } from './src/Utils/NotificationServices';
import notifee, { AndroidStyle } from '@notifee/react-native'

const displayNotification = async (message) => {
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
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
    await createNotificationChannel();

    await displayNotification(remoteMessage);
});


AppRegistry.registerComponent(appName, () => App);
