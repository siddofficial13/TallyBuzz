import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import moment from 'moment';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { StackActions, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  userId: string;
  likes: string[];
  createdAt: any;
  userName: string;
}

const HomePageScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const userId = auth().currentUser?.uid;

  useEffect(() => {
    const unsubscribePosts = firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        async snapshot => {
          const postsList: Post[] = [];
          for (const doc of snapshot.docs) {
            const postData = doc.data();
            const userDoc = await firestore()
              .collection('Users')
              .doc(postData.userId)
              .get();
            const userName = userDoc.exists ? userDoc.data()?.name : 'Unknown';

            const likes = postData.likes || [];
            postsList.push({
              id: doc.id,
              title: postData.title,
              description: postData.description,
              imageUrl: postData.imageUrl,
              userId: postData.userId,
              likes: likes,
              createdAt: postData.createdAt,
              userName: userName,
            });
          }
          setPosts(postsList);
          setLoading(false);
        },
        error => {
          console.error('Error fetching posts:', error);
          setLoading(false);
        },
      );

    const unsubscribeUsers = firestore()
      .collection('Users')
      .onSnapshot(snapshot => {
        setPosts(prevPosts =>
          prevPosts.map(post => {
            const userDoc = snapshot.docs.find(doc => doc.id === post.userId);
            if (userDoc) {
              return { ...post, userName: userDoc.data().name };
            }
            return post;
          }),
        );
      });

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
    };
  }, []);

  const sendNoti2 = async (
    userId: string,
    likerName: string,
    postId: string,
    imageUrl: string
  ) => {
    try {
      const userDoc = await firestore().collection('Users').doc(userId).get();
      const userTokens = userDoc.data()?.fcmtoken;

      if (userTokens && Array.isArray(userTokens)) {
        userTokens.forEach(token => {
          fetch(
            'https://peaceful-consumption-indicating-gods.trycloudflare.com/send-noti-user',
            {
              method: 'post',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: token,
                title: 'New Like',
                body: `${likerName} liked your post!`,
                data: { redirect_to: 'PostScreen', postId: postId, type:'Like_post',imageUrl: imageUrl },
                
                actions: [
                  { title: 'View', pressAction: { id: 'view' } },
                  { title: 'Dismiss', pressAction: { id: 'dismiss' } },
                ],
                
              }),
            },
          );
        });
      } else {
        console.error('User tokens not found or not an array');
      }
    } catch (error) {
      console.error('Error fetching user tokens: ', error);
    }
  };

  const handleLike = async (postId: string, imageUrl: string) => {
    try {
      const postRef = firestore().collection('posts').doc(postId);
      const postDoc = await postRef.get();

      if (postDoc.exists) {
        const postData = postDoc.data();
        const updatedLikes = postData?.likes.includes(userId)
          ? postData.likes.filter((id: string) => id !== userId)
          : [...postData?.likes, userId];

        await postRef.update({ likes: updatedLikes });

        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId ? { ...post, likes: updatedLikes } : post,
          ),
        );

        // Send notification to the post owner
        if (!postData?.likes.includes(userId)) {
          const likerDoc = await firestore()
            .collection('Users')
            .doc(userId)
            .get();
          const likerName = likerDoc.exists ? likerDoc.data()?.name : 'Someone';
          sendNoti2(postData?.userId, likerName, postId, imageUrl);
        }
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#000' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.mainContent}>
        {posts.map(post => (
          <View key={post.id} style={styles.post}>
            <Text style={styles.userName}>{post.userName}</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PostScreen', { postId: post.id })
              }>
              {post.imageUrl ? (
                <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
              ) : null}
            </TouchableOpacity>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postDescription}>{post.description}</Text>
            <View style={styles.likeContainer}>
              <TouchableOpacity
                onPress={() => handleLike(post.id, post.imageUrl)}>
                <Image
                  source={
                    post.likes.includes(userId)
                      ? require('../assets/heartred.png')
                      : require('../assets/heart.png')
                  }
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>
              <Text style={styles.likeCount}>{post.likes.length}</Text>
            </View>
            <Text style={styles.postDate}>
              {post.createdAt && post.createdAt.toDate
                ? moment(post.createdAt.toDate()).format('LLL')
                : 'Unknown date'}
            </Text>
          </View>
        ))}
      </ScrollView>
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // white background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flexGrow: 1,
    padding: 16,
  },
  post: {
    backgroundColor: '#fff', // white background
    padding: 16,
    marginBottom: 16,
    elevation: 2, // for Android
    shadowColor: '#000', // black shadow color for iOS
    shadowOffset: { width: 0, height: 1 }, // for iOS
    shadowOpacity: 0.8, // for iOS
    shadowRadius: 1, // for iOS
    borderRadius: 5,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  postImage: {
    width: '100%',
    aspectRatio: 0.75, // Adjust the aspect ratio as needed to maintain the image's proportions
    borderRadius: 5,
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  postDescription: {
    fontSize: 14,
    color: '#000', // black text color
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 8,
    color: '#000',
  },
  postDate: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 8,
  },
});

export default HomePageScreen;