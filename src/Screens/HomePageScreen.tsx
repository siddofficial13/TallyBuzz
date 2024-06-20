import React, {useEffect, useState, useCallback} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import apiUrl from '../Utils/urls.js';

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

const PAGE_SIZE = 5;

const HomePageScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPost, setLastPost] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigation = useNavigation();

  const userId = auth().currentUser?.uid;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(PAGE_SIZE)
      .onSnapshot(
        snapshot => {
          const newPosts: Post[] = [];
          snapshot.forEach(async doc => {
            const postData = doc.data();
            const userDoc = await firestore()
              .collection('Users')
              .doc(postData.userId)
              .get();
            const userName = userDoc.exists ? userDoc.data()?.name : 'Unknown';

            const likes = postData.likes || [];
            newPosts.push({
              id: doc.id,
              title: postData.title,
              description: postData.description,
              imageUrl: postData.imageUrl,
              userId: postData.userId,
              likes: likes,
              createdAt: postData.createdAt,
              userName: userName,
            });
          });
          setPosts(newPosts);
          setLastPost(snapshot.docs[snapshot.docs.length - 1]);
          setLoading(false);
        },
        error => {
          console.error('Error fetching posts:', error);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, []);

  const fetchMorePosts = async () => {
    if (!lastPost || loadingMore) return;

    setLoadingMore(true);
    try {
      const query = firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .startAfter(lastPost)
        .limit(PAGE_SIZE);

      const snapshot = await query.get();
      const postsList: Post[] = await processSnapshot(snapshot);
      setPosts(prevPosts => [...prevPosts, ...postsList]);
      setLastPost(snapshot.docs[snapshot.docs.length - 1]);
    } catch (error) {
      console.error('Error fetching more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const processSnapshot = async snapshot => {
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
    return postsList;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const query = firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(PAGE_SIZE);

      const snapshot = await query.get();
      const postsList: Post[] = await processSnapshot(snapshot);
      setPosts(postsList);
      setLastPost(snapshot.docs[snapshot.docs.length - 1]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  const sendNoti2 = async (
    userId: string,
    likerName: string,
    postId: string,
    imageUrl: string, // Add imageUrl as a parameter
  ) => {
    try {
      const userDoc = await firestore().collection('Users').doc(userId).get();
      const userTokens = userDoc.data()?.fcmtoken;

      if (userTokens && Array.isArray(userTokens)) {
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

        await postRef.update({likes: updatedLikes});

        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId ? {...post, likes: updatedLikes} : post,
          ),
        );

        // Send notification to the post owner
        if (!postData?.likes.includes(userId)) {
          const likerDoc = await firestore()
            .collection('Users')
            .doc(userId)
            .get();
          const likerName = likerDoc.exists
            ? likerDoc.data()?.name
            : 'TallyBuzz_User';
          sendNoti2(postData?.userId, likerName, postId, imageUrl);
        }
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const renderPost = useCallback(
    ({item: post}: {item: Post}) => (
      <View key={post.id} style={styles.post}>
        <Text style={styles.userName}>{post.userName}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('PostScreen', {postId: post.id})}>
          {post.imageUrl ? (
            <Image source={{uri: post.imageUrl}} style={styles.postImage} />
          ) : null}
        </TouchableOpacity>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postDescription}>{post.description}</Text>
        <View style={styles.likeContainer}>
          <TouchableOpacity onPress={() => handleLike(post.id, post.imageUrl)}>
            <Image
              source={
                post.likes.includes(userId)
                  ? require('../assets/heartred.png')
                  : require('../assets/heart.png')
              }
              style={{width: 24, height: 24}}
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
    ),
    [posts],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.mainContent}
        onEndReached={fetchMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="large" color="#000" /> : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
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
    shadowOffset: {width: 0, height: 1}, // for iOS
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
    aspectRatio: 1.2, // Adjust the aspect ratio as needed to maintain the image's proportions
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
