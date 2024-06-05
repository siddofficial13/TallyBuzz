import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { launchImageLibrary } from 'react-native-image-picker';

export default function UploadPost() {
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

        launchImageLibrary(options, (response) => {
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

        try {
            await firestore().collection('posts').add({
                title,
                description,
                imageUri,
                userId: user.uid,
                createdAt: firestore.FieldValue.serverTimestamp(),
                likes: []
            });

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
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Upload Post</Text>
            <TextInput
                style={styles.input}
                placeholder="Post Title"
                placeholderTextColor='#aaa'
                value={title}
                onChangeText={setTitle}
            />
            <TextInput
                style={styles.input}
                placeholder="Post Description"
                placeholderTextColor='#aaa'
                value={description}
                onChangeText={setDescription}
                multiline
            />
            <TouchableOpacity style={styles.imagePicker} onPress={handleChooseImage}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.image} />
                ) : (
                    <Text style={styles.imagePickerText}>Choose an Image</Text>
                )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Submit Post</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        padding: 20,
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#000',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
        color: '#000',
    },
    imagePicker: {
        width: '100%',
        height: 300,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    imagePickerText: {
        color: '#000',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
        resizeMode: 'cover',
    },
    button: {
        backgroundColor: '#000',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
