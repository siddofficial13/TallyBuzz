import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface User {
    name: string;
    email: string;
}

interface UserContextProps {
    user: User;
    setUser: React.Dispatch<React.SetStateAction<User>>;
    unseenNotifications: boolean;
    fetchUserData: () => void;
    checkUnseenNotifications: () => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>({ name: '', email: '' });
    const [unseenNotifications, setUnseenNotifications] = useState<boolean>(false);

    const fetchUserData = async () => {
        const currentUser = auth().currentUser;
        if (currentUser) {
            const userDoc = await firestore().collection('Users').doc(currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                setUser({
                    name: userData?.name || '',
                    email: currentUser.email || '',
                });
            }
        }
    };

    const checkUnseenNotifications = async () => {
        const currentUser = auth().currentUser;
        if (currentUser) {
            const userDoc = await firestore().collection('Users').doc(currentUser.uid).get();
            const userData = userDoc.data();
            if (userData && userData.notifications) {
                const unseen = userData.notifications.some((notification: any) => !notification.seen);
                setUnseenNotifications(unseen);
            }
        }
    };

    useEffect(() => {
        fetchUserData();
        checkUnseenNotifications();
        const unsubscribe = firestore()
            .collection('Users')
            .doc(auth().currentUser?.uid)
            .onSnapshot(checkUnseenNotifications);
        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, unseenNotifications, fetchUserData, checkUnseenNotifications }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
