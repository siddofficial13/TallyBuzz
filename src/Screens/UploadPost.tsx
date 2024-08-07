import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import {launchImageLibrary} from 'react-native-image-picker';
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

const UploadPost = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const handleChooseImage = () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 1080,
      maxHeight: 1080,
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const source = response.assets[0].uri;
        setImageUri(source);
      }
    });
  };

  const handleSubmit = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('You need to be logged in to upload a post');
      return;
    }

    if (title === '' || description === '' || imageUri === '') {
      Alert.alert('Please fill all the fields and select an image');
      return;
    }

    const imagePath = `images/${user.uid}/${Date.now()}.jpg`;

    try {
      await storage().ref(imagePath).putFile(imageUri);
      const imageUrl = await storage().ref(imagePath).getDownloadURL();

      const postRef = await firestore().collection('posts').add({
        title,
        description,
        imageUrl,
        userId: user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        likes: [],
      });

      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      const userName = userDoc.exists ? userDoc.data()?.name : 'TallyBuzz_User';
      const idToken = await auth().currentUser?.getIdToken(true);
      // Send notifications to all users except the one who posted
      const sendNotificationToUsers = async () => {
        const usersSnapshot = await firestore().collection('Users').get();
        usersSnapshot.forEach(doc => {
          const userId = doc.id;

          if (userId !== user.uid) {
            const userTokens = doc.data()?.fcmtoken;
            if (userTokens && Array.isArray(userTokens)) {
              const truncatedTimestamp = new Date().toISOString().toString();
              userTokens.forEach(token => {
                fetch(`${apiUrl}/send-broadcast`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                  },
                  body: JSON.stringify({
                    token: token,
                    data: {
                      title: 'New Post Alert',
                      body: `${userName} just uploaded a new post!`,
                      redirect_to: 'PostScreen',
                      postId: postRef.id,
                      userId: userId,
                      imageUrl: imageUrl,
                      showActions: 'true',
                      timestamp: truncatedTimestamp,
                      type: 'upload_post',
                    },
                    actions: [
                      {title: 'Like', pressAction: {id: 'like'}},
                      {title: 'Dismiss', pressAction: {id: 'dismiss'}},
                    ],
                  }),
                });
              });
            }
          }
        });
      };
      await sendNotificationToUsers();

      Alert.alert('Post uploaded successfully');
      setTitle('');
      setDescription('');
      setImageUri('');
    } catch (error) {
      console.error('Error uploading post: ', error);
      Alert.alert('Error uploading post');
    }
  };
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Upload Post</Text>
        <TextInput
          style={styles.input}
          placeholder="Post Title"
          placeholderTextColor="#aaa"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Post Description"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={handleChooseImage}>
          {imageUri ? (
            <Image source={{uri: imageUri}} style={styles.image} />
          ) : (
            <Text style={styles.imagePickerText}>Choose an Image</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Post</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#343a40',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
    color: '#495057',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    marginBottom: 10,
  },
  imagePickerText: {
    color: '#6c757d',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  post: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#343a40',
  },
  postImage: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 5,
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#343a40',
  },
  postDescription: {
    fontSize: 14,
    marginBottom: 8,
    color: '#495057',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  likeIcon: {
    width: 24,
    height: 24,
  },
  likeCount: {
    marginLeft: 8,
    color: '#495057',
  },
  postDate: {
    fontSize: 12,
    color: '#868e96',
    textAlign: 'right',
  },
});

export default UploadPost;
