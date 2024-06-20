import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';
import {useUser} from '../context/UserContext';

interface Notification {
  body: string;
  redirect_to: string;
  postId: string;
  seen: boolean;
  title: string;
  timestamp: any; // Adjust the type according to your actual data structure
}

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // State to track whether the list is refreshing
  const navigation = useNavigation();
  const {checkUnseenNotifications} = useUser();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.log('User not authenticated');
      setLoading(false);
      return;
    }

    const userDoc = await firestore()
      .collection('Users')
      .doc(currentUser.uid)
      .get();
    const userData = userDoc.data();

    if (userData && userData.notifications) {
      const formattedNotifications = userData.notifications.map(
        (notification: any) => {
          let timestamp;
          if (notification.timestamp instanceof Date) {
            timestamp = notification.timestamp.toISOString();
          } else if (notification.timestamp && notification.timestamp.toDate) {
            timestamp = notification.timestamp.toDate().toISOString();
          } else {
            timestamp = new Date(notification.timestamp).toISOString();
          }

          return {
            ...notification,
            timestamp: timestamp,
          };
        },
      );

      const sortedNotifications = formattedNotifications.sort(
        (a: Notification, b: Notification) => {
          const aTimestamp = moment(a.timestamp);
          const bTimestamp = moment(b.timestamp);
          return bTimestamp.diff(aTimestamp);
        },
      );

      setNotifications(sortedNotifications);
    }

    setLoading(false);
  };

  const handleNotificationPress = async (
    notification: Notification,
    index: number,
  ) => {
    const {redirect_to, postId} = notification;

    // Check if postId exists in the posts collection
    const postSnapshot = await firestore()
      .collection('posts')
      .doc(postId)
      .get();
    if (!postSnapshot.exists) {
      // Update the seen status of the notification
      const updatedNotifications = [...notifications];
      updatedNotifications[index].seen = true;
      setNotifications(updatedNotifications);

      // Update the seen status in the Firestore
      const currentUser = auth().currentUser;
      await firestore().collection('Users').doc(currentUser?.uid).update({
        notifications: updatedNotifications,
      });

      // Re-check unseen notifications status
      await checkUnseenNotifications();

      // If postId doesn't exist, navigate to PageNotFoundScreen
      navigation.navigate('PageNotFoundScreen');
      return;
    }

    // Update the seen status of the notification
    const updatedNotifications = [...notifications];
    updatedNotifications[index].seen = true;
    setNotifications(updatedNotifications);

    // Update the seen status in the Firestore
    const currentUser = auth().currentUser;
    await firestore().collection('Users').doc(currentUser?.uid).update({
      notifications: updatedNotifications,
    });

    // Re-check unseen notifications status
    await checkUnseenNotifications();

    // Navigate to the appropriate screen
    if (redirect_to) {
      navigation.navigate(redirect_to as never, {postId} as never);
    }
  };

  const renderItem = ({item, index}: {item: Notification; index: number}) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {backgroundColor: item.seen ? '#d3d3d3' : '#fff'},
      ]}
      onPress={() => handleNotificationPress(item, index)}>
      <Text style={styles.notificationTitle}>{item.title}</Text>
      <Text style={styles.notificationText}>{item.body}</Text>
      <Text style={styles.notificationTimestamp}>
        {item.timestamp ? moment(item.timestamp).format('LLL') : 'Unknown date'}
      </Text>
    </TouchableOpacity>
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 10,
  },
  notificationItem: {
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    elevation: 3,
  },
  notificationTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  notificationText: {
    fontSize: 16,
    color: '#000',
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -25}, {translateY: -25}],
  },
});

export default NotificationPage;
