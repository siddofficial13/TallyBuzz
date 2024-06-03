import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
const ProfileScreen: React.FC = () => {

    const navigation = useNavigation();
    const handleUpdateProfile = () => {
        console.log('Profile updated');
    };

    const handleNotifyMe = () => {
        console.log('Notify me button pressed');
    };

    const handleLogout = async () => {
        try {
            await auth().signOut(); // Sign out the current user
            console.log('Logged out');

            // Log the user information after logout
            const currentUser = auth().currentUser;
            console.log('User after logout:', currentUser);

            // Navigate to the login screen or any other screen after logout
            // You can use navigation.navigate('LoginScreen') or any other navigation method you have
            navigation.navigate('LoginScreen');
        } catch (error) {
            console.error('Error logging out:', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>Update Profile</Text>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Image source={require('../assets/logout.png')} style={styles.logoutImage} />
                    </TouchableOpacity>
                </View>
                <TextInput style={styles.input} placeholder="Update emailId" placeholderTextColor="#999" keyboardType="email-address" />
                <TextInput style={styles.input} placeholder="Update Password" placeholderTextColor="#999" secureTextEntry={true} />
                <TouchableOpacity style={[styles.button, styles.elevatedButton]} onPress={handleUpdateProfile}>
                    <Text style={styles.buttonText}>Update Profile</Text>
                </TouchableOpacity>
                <View style={styles.spacing} />
                <View style={styles.notifySection}>
                    <Text style={styles.lightAppText}>We are working on a lighter version of the app</Text>
                    <Text style={styles.lightAppText}>Would you like to get notified when the app is ready to use</Text>
                    <TouchableOpacity style={[styles.notifyButton, styles.elevatedButton]} onPress={handleNotifyMe}>
                        <Text style={styles.buttonText}>Notify Me</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.poweredBy}>Powered by Tally Solutions</Text>
                <TouchableOpacity onPress={() => console.log('Visit our website')} style={styles.visitWebsite}>
                    <Text style={styles.visitText}>Visit our website</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        padding: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 20,
    },
    logoutButton: {
        padding: 10,
    },
    logoutImage: {
        width: 24,
        height: 24,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
    },
    button: {
        backgroundColor: '#000',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 20,
    },
    elevatedButton: {
        elevation: 5, // for Android
        shadowColor: '#000', // for iOS
        shadowOffset: { width: 0, height: 2 }, // for iOS
        shadowOpacity: 0.8, // for iOS
        shadowRadius: 2, // for iOS
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    notifySection: {
        backgroundColor: '#f0f0f0',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
    },
    lightAppText: {
        textAlign: 'center',
        color: '#000',
        marginVertical: 10,
    },
    notifyButton: {
        backgroundColor: '#000',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    spacing: {
        marginBottom: 20,
    },
    poweredBy: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 10,
    },
    visitWebsite: {
        alignItems: 'center',
    },
    visitText: {
        color: '#000',
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
