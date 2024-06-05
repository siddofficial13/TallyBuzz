import { StyleSheet, Text, View } from 'react-native'
import React from 'react'


export default function UploadPost() {
    return (
        <View style={styles.container}>

            <View style={styles.mainContent}>

            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // white background
    },
    mainContent: {
        flexGrow: 1,
        backgroundColor: '#fff', // white background
        padding: 16,
        borderWidth: 2,
        margin: 10,
        borderColor: 'black', // dark black border
    },
})
