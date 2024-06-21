import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import apiUrl from '../Utils/urls';

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

const PAGE_SIZE = 6;

const HomePageScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPost, setLastPost] = useState<any>(null);
  const [allPostsLoaded, setAllPostsLoaded] = useState(false);
  const navigation = useNavigation();

  const userId = auth().currentUser?.uid;

  useEffect(() => {
    fetchPosts();

    const unsubscribeUsers = firestore().collection('Users').onSnapshot(snapshot => {
      const updatedUsers = {};
      snapshot.forEach(doc => {
        updatedUsers[doc.id] = doc.data().name;
      });
      setPosts(prevPosts => prevPosts.map(post => ({
        ...post,
        userName: updatedUsers[post.userId] || post.userName,
      })));
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    const snapshot = await firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(PAGE_SIZE)
      .get();

    const postsList: Post[] = [];
    for (const doc of snapshot.docs) {
      const postData = doc.data();
      const userDoc = await firestore().collection('Users').doc(postData.userId).get();
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

    if (snapshot.docs.length < PAGE_SIZE) {
      setAllPostsLoaded(true);
    } else {
      setLastPost(snapshot.docs[snapshot.docs.length - 1]);
    }
  }, []);

  const fetchMorePosts = useCallback(async () => {
    if (loadingMore || allPostsLoaded) return;

    setLoadingMore(true);

    const snapshot = await firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .startAfter(lastPost)
      .limit(PAGE_SIZE)
      .get();

    if (!snapshot.empty) {
      const postsList: Post[] = [];
      for (const doc of snapshot.docs) {
        const postData = doc.data();
        const userDoc = await firestore().collection('Users').doc(postData.userId).get();
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

      setPosts(prevPosts => [...prevPosts, ...postsList]);
      setLastPost(snapshot.docs[snapshot.docs.length - 1]);

      if (snapshot.docs.length < PAGE_SIZE) {
        setAllPostsLoaded(true);
      }
    }

    setLoadingMore(false);
  }, [lastPost, loadingMore, allPostsLoaded]);

  const refreshPosts = useCallback(async () => {
    setRefreshing(true);
    setAllPostsLoaded(false);
    setLastPost(null);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const sendNoti2 = async (
    userId: string,
    likerName: string,
    postId: string,
    imageUrl: string,
  ) => {
    try {
      const userDoc = await firestore().collection('Users').doc(userId).get();
      const userTokens = userDoc.data()?.fcmtoken;

      if (userTokens && Array.isArray(userTokens)) {
        const truncatedTimestamp = new Date().toISOString();
        userTokens.forEach(token => {
          fetch(`${apiUrl}/send-noti-user`, {
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
                timestamp: truncatedTimestamp.toString(),
                type: 'like_post',
              },
            }),
          });
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
          const likerDoc = await firestore().collection('Users').doc(userId).get();
          const likerName = likerDoc.exists ? likerDoc.data()?.name : 'TallyBuzz_User';
          sendNoti2(postData?.userId, likerName, postId, imageUrl);
        }
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  };

  const renderItem = ({ item }: { item: Post }) => (
    <View key={item.id} style={styles.post}>
      <Text style={styles.userName}>{item.userName}</Text>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('PostScreen', { postId: item.id })
        }>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
        ) : null}
      </TouchableOpacity>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postDescription}>{item.description}</Text>
      <View style={styles.likeContainer}>
        <TouchableOpacity onPress={() => handleLike(item.id, item.imageUrl)}>
          <Image
            source={
              item.likes.includes(userId)
                ? require('../assets/heartred.png')
                : require('../assets/heart.png')
            }
            style={{ width: 24, height: 24 }}
          />
        </TouchableOpacity>
        <Text style={styles.likeCount}>{item.likes.length}</Text>
      </View>
      <Text style={styles.postDate}>
        {item.createdAt && item.createdAt.toDate
          ? moment(item.createdAt.toDate()).format('LLL')
          : 'Unknown date'}
      </Text>
    </View>
  );

  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <Header /> */}
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListFooterComponent={renderFooter}
        onEndReached={fetchMorePosts}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshPosts}
          />
        }
      />
      {/* <Footer /> */}
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
    aspectRatio: 1, // Adjust the aspect ratio as needed to maintain the image's proportions
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
  loadingMoreContainer: {
    paddingVertical: 20,
  },
});

export default HomePageScreen;
