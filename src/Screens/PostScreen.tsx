import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, Image, ScrollView} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {RouteProp, useRoute} from '@react-navigation/native';
import storage from '@react-native-firebase/storage';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Post {
  title: string;
  description: string;
  imageUrl: string; // Updated to imageUrl to match the upload structure
  likes: string[];
  createdAt: any;
}

interface User {
  name: string;
}

type RootStackParamList = {
  PostScreen: {postId: string};
};

type PostScreenRouteProp = RouteProp<RootStackParamList, 'PostScreen'>;

const PostScreen: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [likedUsers, setLikedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const route = useRoute<PostScreenRouteProp>();
  const {postId} = route.params;

  useEffect(() => {
    const fetchPostAndLikes = async () => {
      try {
        const postDoc = await firestore().collection('posts').doc(postId).get();
        if (!postDoc.exists) {
          console.error('Post not found');
          setLoading(false);
          return;
        }

        const postData = postDoc.data() as Post;

        // Fetch user names who liked the post
        const likesPromises = postData.likes.map(async userId => {
          const userDoc = await firestore()
            .collection('Users')
            .doc(userId)
            .get();
          return userDoc.exists ? (userDoc.data() as User).name : 'Unknown';
        });

        const likes = await Promise.all(likesPromises);
        setPost(postData);
        setLikedUsers(likes);
      } catch (error) {
        console.error('Error fetching post or likes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndLikes();
  }, [postId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Post not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scontainer}>
        <Text style={styles.postTitle}>{post.title}</Text>
        {post.imageUrl ? (
          <Image source={{uri: post.imageUrl}} style={styles.postImage} />
        ) : null}
        <Text style={styles.postDescription}>{post.description}</Text>
        <Text style={styles.postDate}>
          {post.createdAt && post.createdAt.toDate
            ? new Date(post.createdAt.toDate()).toLocaleString()
            : 'Unknown date'}
        </Text>
        <Text style={styles.likesTitle}>Liked by:</Text>
        {likedUsers.length > 0 ? (
          likedUsers.map((userName, index) => (
            <Text key={index} style={styles.userName}>
              {userName}
            </Text>
          ))
        ) : (
          <Text style={styles.noLikes}>No likes yet</Text>
        )}
      </ScrollView>
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  scontainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  postImage: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 5,
    marginBottom: 16,
  },
  postDescription: {
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  postDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    textAlign: 'right',
  },
  likesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  userName: {
    fontSize: 16,
    color: '#000',
  },
  noLikes: {
    fontSize: 16,
    color: '#888',
  },
});

export default PostScreen;
