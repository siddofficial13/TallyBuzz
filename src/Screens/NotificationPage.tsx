// import React, {useEffect, useState} from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
// } from 'react-native';
// import {useNavigation} from '@react-navigation/native';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import {useUser} from '../context/UserContext';

// interface Notification {
//   body: string;
//   title: string;
//   redirect_to: string;
//   postId: string;
//   seen: boolean;
//   timestamp: string; // Assuming timestamp is a string in ISO format
// }

// const NotificationPage: React.FC = () => {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [loading, setLoading] = useState(true);
//   const navigation = useNavigation();
//   const {checkUnseenNotifications} = useUser();

//   useEffect(() => {
//     const fetchNotifications = async () => {
//       const currentUser = auth().currentUser;
//       if (!currentUser) {
//         console.log('User not authenticated');
//         return;
//       }

//       const userDoc = await firestore()
//         .collection('Users')
//         .doc(currentUser.uid)
//         .get();
//       const userData = userDoc.data();

//       if (userData && userData.notifications) {
//         // Convert timestamp strings to Date objects and add to notifications
//         const formattedNotifications = userData.notifications.map(
//           (notification: any) => ({
//             ...notification,
//             timestamp: new Date(notification.timestamp),
//           }),
//         );

//         // Sort notifications by timestamp in descending order
//         const sortedNotifications = formattedNotifications.sort(
//           (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
//         );

//         setNotifications(sortedNotifications);
//       }

//       setLoading(false);
//     };

//     fetchNotifications();
//   }, []);

//   const handleNotificationPress = async (
//     notification: Notification,
//     index: number,
//   ) => {
//     const {redirect_to, postId} = notification;

//     // Update the seen status of the notification
//     const updatedNotifications = [...notifications];
//     updatedNotifications[index].seen = true;
//     setNotifications(updatedNotifications);

//     // Update the seen status in Firestore
//     const currentUser = auth().currentUser;
//     await firestore().collection('Users').doc(currentUser?.uid).update({
//       notifications: updatedNotifications,
//     });

//     // Re-check unseen notifications status
//     await checkUnseenNotifications();

//     // Navigate to the appropriate screen
//     if (redirect_to) {
//       navigation.navigate(redirect_to as never, {postId} as never);
//     }
//   };

//   // Function to format timestamp dynamically
//   const timeAgo = (timestamp: Date): string => {
//     const now = new Date();
//     const seconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

//     let interval = Math.floor(seconds / 31536000);
//     if (interval >= 1) {
//       return interval + ' years ago';
//     }
//     interval = Math.floor(seconds / 2592000);
//     if (interval >= 1) {
//       return interval + ' months ago';
//     }
//     interval = Math.floor(seconds / 86400);
//     if (interval >= 1) {
//       return interval + ' days ago';
//     }
//     interval = Math.floor(seconds / 3600);
//     if (interval >= 1) {
//       return interval + ' hours ago';
//     }
//     interval = Math.floor(seconds / 60);
//     if (interval >= 1) {
//       return interval + ' minutes ago';
//     }
//     return Math.floor(seconds) + ' seconds ago';
//   };

//   const renderItem = ({item, index}: {item: Notification; index: number}) => (
//     <TouchableOpacity
//       style={[
//         styles.notificationItem,
//         {backgroundColor: item.seen ? '#d3d3d3' : '#fff'},
//       ]}
//       onPress={() => handleNotificationPress(item, index)}>
//       {/* Title, Body, and Timestamp */}
//       <Text style={styles.notificationTitle}>{item.title}</Text>
//       <Text style={styles.notificationText}>{item.body}</Text>
//       <Text style={styles.timestamp}>{timeAgo(item.timestamp)}</Text>
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={notifications}
//         renderItem={renderItem}
//         keyExtractor={(item, index) => index.toString()}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f8f8',
//     padding: 10,
//   },
//   notificationItem: {
//     padding: 15,
//     marginVertical: 8,
//     marginHorizontal: 16,
//     borderRadius: 10,
//     elevation: 3,
//   },
//   notificationTitle: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 4,
//   },
//   notificationText: {
//     fontSize: 16,
//     color: '#000',
//   },
//   timestamp: {
//     fontSize: 12,
//     color: '#999',
//     textAlign: 'right',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default NotificationPage;

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useUser} from '../context/UserContext';

interface Notification {
  body: string;
  redirect_to: string;
  postId: string;
  seen: boolean;
}

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const {checkUnseenNotifications} = useUser();

  useEffect(() => {
    const fetchNotifications = async () => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('User not authenticated');
        return;
      }

      const userDoc = await firestore()
        .collection('Users')
        .doc(currentUser.uid)
        .get();
      const userData = userDoc.data();

      if (userData && userData.notifications) {
        setNotifications(userData.notifications);
      }

      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const handleNotificationPress = async (
    notification: Notification,
    index: number,
  ) => {
    const {redirect_to, postId} = notification;

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
      <Text style={styles.notificationText}>{item.body}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
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
  notificationText: {
    fontSize: 16,
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationPage;
