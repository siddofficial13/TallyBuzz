import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';

const Header: React.FC = () => {
    const { user, unseenNotifications } = useUser();
    const navigation = useNavigation();
    const [modalVisible, setModalVisible] = useState(false);

    const handleNotificationPress = () => {
        navigation.navigate('NotificationPage');
    };

    const handleUserNamePress = () => {
        setModalVisible(true);
    };

    const handleAccountsPress = () => {
        setModalVisible(false);
        navigation.navigate('SwitchUserScreen');
    };

    const handleOutsidePress = () => {
        setModalVisible(false);
    };

    return (
        <View style={styles.header}>
            <Image
                source={require('../assets/logo.png')}
                style={styles.headerImage}
                resizeMode="contain"
            />
            <View style={styles.userInfo}>
                <TouchableOpacity onPress={handleUserNamePress}>
                    <Text style={styles.userName}>{user.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNotificationPress}>
                    <View style={styles.notificationContainer}>
                        <Image
                            source={require('../assets/notification.png')}
                            style={styles.notificationIcon}
                            resizeMode="contain"
                        />
                        {unseenNotifications && (
                            <Text style={styles.redDot}></Text>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <Modal
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={handleOutsidePress}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity onPress={handleAccountsPress}>
                                <Text style={styles.modalOption}>Your Accounts</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalOption: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default Header;
