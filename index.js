/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth'

messaging().onMessage(async (remoteMessage) => {
    console.log('Message received in foreground!', remoteMessage);
    const currentUser = auth().currentUser;

    if (currentUser.uid && remoteMessage.data?.userId && remoteMessage.data.userId !== currentUser.uid) {
        console.log('Notification userId does not match current user. Notification will not be displayed.');
        return;
    }

    if (remoteMessage.data.silentCheck === 'true') {
        console.log('Silent notification received');
    } else {
        displayNotification(remoteMessage);
    }
});

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Message handled in the background!', remoteMessage);

    if (remoteMessage.data.silentCheck === 'true') {
        console.log('Silent notification received');
    }
});
AppRegistry.registerComponent(appName, () => App);
