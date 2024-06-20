import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PageNotFoundScreen = () => {
    const navigation = useNavigation();

    const goToHomePage = () => {
        navigation.navigate('HomePageScreen');
    };

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/pagenotfound.png')}
                style={styles.image}
            />
            <TouchableOpacity style={styles.button} onPress={goToHomePage}>
                <Text style={styles.buttonText}>Go to Home</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#000',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PageNotFoundScreen;
