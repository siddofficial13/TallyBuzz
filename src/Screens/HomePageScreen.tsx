import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import moment from 'moment'; // Import moment for date formatting

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  userId: string;
  likes: string[];
  createdAt: any; // Use any type to store Firestore timestamp
  userName: string; // Add userName to the interface
}

const HomePageScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = auth().currentUser?.uid;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .onSnapshot(async (snapshot) => {
        const postsList: Post[] = [];
        for (const doc of snapshot.docs) {
          const postData = doc.data();
          const userDoc = await firestore().collection('Users').doc(postData.userId).get();
          const userName = userDoc.exists ? userDoc.data()?.name : 'Unknown'; // Fetch user name

          const likes = postData.likes || []; // Handle undefined likes
          postsList.push({
            id: doc.id,
            title: postData.title,
            description: postData.description,
            imageUri: postData.imageUri,
            userId: postData.userId,
            likes: likes, // Initialize likes with empty array if undefined
            createdAt: postData.createdAt, // Add createdAt field
            userName: userName, // Add userName field
          });
        }
        setPosts(postsList);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching posts:', error);
        setLoading(false);
      });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const postRef = firestore().collection('posts').doc(postId);
      const postDoc = await postRef.get();

      if (postDoc.exists) {
        const postData = postDoc.data();
        const updatedLikes = postData.likes.includes(userId)
          ? postData.likes.filter((id: string) => id !== userId)
          : [...postData.likes, userId];

        await postRef.update({ likes: updatedLikes });

        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId ? { ...post, likes: updatedLikes } : post
          )
        );
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.mainContent}>
        {posts.map(post => (
          <View key={post.id} style={styles.post}>
            <Text style={styles.userName}>{post.userName}</Text>
            {post.imageUri ? (
              <Image source={{ uri: post.imageUri }} style={styles.postImage} />
            ) : null}
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postDescription}>{post.description}</Text>
            <View style={styles.likeContainer}>
              <TouchableOpacity onPress={() => handleLike(post.id)}>
                <Image
                  source={post.likes.includes(userId) ? require('../assets/heartred.png') : require('../assets/heart.png')}
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>
              <Text style={styles.likeCount}>{post.likes.length}</Text>
            </View>
            <Text style={styles.postDate}>
              {post.createdAt && post.createdAt.toDate ? moment(post.createdAt.toDate()).format('LLL') : 'Unknown date'}
            </Text>
          </View>
        ))}
      </ScrollView>
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
