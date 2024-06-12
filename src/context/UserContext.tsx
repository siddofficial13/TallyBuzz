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
    fetchUserData: () => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>({ name: '', email: '' });

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

    useEffect(() => {
        fetchUserData();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, fetchUserData }}>
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
