import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';

const Header: React.FC = () => {
    const { user, unseenNotifications } = useUser();
    const navigation = useNavigation();

    const handleNotificationPress = () => {
        navigation.navigate('NotificationPage');
    };

    return (
        <View style={styles.header}>
            <Image
                source={require('../assets/logo.png')}
                style={styles.headerImage}
                resizeMode="contain"
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <TouchableOpacity onPress={handleNotificationPress}>
                    <View style={styles.notificationContainer}>
                        <Image
                            source={require('../assets/notification.png')} // Add your notification image
                            style={styles.notificationIcon}
                            resizeMode="contain"
                        />
                        {unseenNotifications && (
                            <Text style={styles.redDot} ></Text>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        width: '100%',
        height: 80,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    notificationContainer: {
        position: 'relative',
    },
    notificationIcon: {
        width: 20,
        height: 20,
        marginLeft: 10,
    },
    redDot: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'red',
        top: -4,
        right: -1,
    },
    headerImage: {
        width: 100,
        height: 40,
    },
});

export default Header;
