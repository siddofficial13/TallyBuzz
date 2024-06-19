import auth from '@react-native-firebase/auth';
import * as Keychain from 'react-native-keychain';

const USERS_KEY = 'logged_in_users';

// Store user credentials securely
async function storeUserCredentials(userId, email, password) {
    const existingUsers = await Keychain.getGenericPassword({ service: USERS_KEY });
    let users = existingUsers ? JSON.parse(existingUsers.password) : {};
    users[userId] = { email, password };
    await Keychain.setGenericPassword('users', JSON.stringify(users), { service: USERS_KEY });
}

// Retrieve user credentials securely
async function getUserCredentials(userId) {
    const existingUsers = await Keychain.getGenericPassword({ service: USERS_KEY });
    if (existingUsers) {
        const users = JSON.parse(existingUsers.password);
        return users[userId];
    }
    return null;
}

// Get all stored users
async function getAllStoredUsers() {
    const existingUsers = await Keychain.getGenericPassword({ service: USERS_KEY });
    if (existingUsers) {
        return JSON.parse(existingUsers.password);
    }
    return {};
}

// Delete user credentials
async function deleteUserCredentials(userId) {
    const existingUsers = await Keychain.getGenericPassword({ service: USERS_KEY });
    if (existingUsers) {
        let users = JSON.parse(existingUsers.password);
        delete users[userId];
        await Keychain.setGenericPassword('users', JSON.stringify(users), { service: USERS_KEY });
    }
}

// Login and store user credentials
async function loginUser(email, password) {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const userId = userCredential.user.uid;
    await storeUserCredentials(userId, email, password);
    return userId;
}

// Switch user by retrieving stored credentials and re-authenticating
async function switchUser(userId) {
    const credentials = await getUserCredentials(userId);
    if (credentials && credentials.email && credentials.password) {
        await auth().signInWithEmailAndPassword(credentials.email, credentials.password);
    } else {
        console.log('No credentials stored for this user');
    }
}

export { loginUser, switchUser, getAllStoredUsers, deleteUserCredentials };
