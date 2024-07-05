require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const { firestore } = require("firebase-admin");
const cron = require("node-cron");
const nodemailer = require("nodemailer");

admin.initializeApp({
    credential: admin.credential.cert(require("./service-account.json")),
    // databaseURL: https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com
});

const app = express();
const port = 3000;

app.use(bodyParser.json());

const verifyToken = async (idToken) => {
    await admin.auth().verifyIdToken(idToken);

}
const sendNotification = async (message, retry = false) => {
    try {
        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
        return { success: true, response };
    } catch (error) {
        console.error("Error sending message:", error);
        if (!retry) {
            console.log("Scheduling retry to send the message in 1 minutes...");
            scheduleRetry(message);
            return { success: false, error: error.message };
        } else {
            return { success: false, error: error.message };
        }
    }
};

const scheduleRetry = (message) => {
    cron.schedule("*/1 * * * *", async () => {
        console.log("Retrying to send the message...");
        await sendNotification(message, true);
    });
};

app.post("/send-reset-pass-mail", async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    const { email } = req.body;
    try {
        await verifyToken(idToken)
        try {

            const link = await admin.auth().generatePasswordResetLink(email);

            await sendEmail(email, link);

            console.log("Password reset link sent:", link);
            res.status(200).send("Password reset link sent");
        } catch (error) {
            console.error("Error sending password reset email:", error);
            res.status(500).send("Error sending password reset email");
        }
    } catch (error) {
        console.log('Authorization Required:', error);
        res.status(401).send('Authorization Required');
    }
});

// Function to send email using nodemailer
async function sendEmail(recipientEmail, resetLink) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.APP_PASS,
        },
    });

    let mailOptions = {
        from: process.env.GMAIL_USER,
        to: recipientEmail,
        subject: "Password Reset",
        text: `Click the following link to reset your password: ${resetLink}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Password reset email sent successfully");
    } catch (error) {
        console.error("Error sending password reset email:", error);
    }
}

//  on like
app.post("/send-noti-user", async (req, res) => {
    const { token, data } = req.body;
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    const message = {
        token: token,
        // notification: {
        //     title: 'someone liked ur post',
        // },
        data: {
            title: data.title || "Notification Title",
            body: data.body || "Notification Body",
            redirect_to: data.redirect_to || "PostScreen",
            postId: data.postId,
            userId: data.userId,
            imageUrl: data.imageUrl,
            timestamp: data.timestamp,
            type: "like_post",
        },
        android: {
            priority: "high",
        },
    };

    try {
        await verifyToken(idToken);
        try {
            const result = await sendNotification(message);

            if (result.success) {
                // Notification sent successfully, now store it in the user's document
                try {
                    const userRef = firestore().collection("Users").doc(data.userId);
                    // const truncatedTimestamp = new Date().toISOString().slice(0, -5);

                    await userRef.update({
                        notifications: firestore.FieldValue.arrayUnion({
                            title: data.title || "Notification Title",
                            body: data.body || "Notification Body",
                            postId: data.postId,
                            redirect_to: data.redirect_to,
                            seen: false, // Initially set as unseen
                            timestamp: data.timestamp,
                        }),
                    });
                    res.status(200).send({
                        success: true,
                        message:
                            "Notification sent successfully and stored in user's document",
                    });
                } catch (error) {
                    console.error("Error storing notification:", error);
                    res.status(500).send({
                        success: false,
                        message: "Error storing notification in user's document",
                        error: error.message,
                    });
                }
            } else {
                res.status(500).send({
                    success: false,
                    message: "Error sending notification",
                    error: result.error,
                });
            }
        } catch (error) {
            console.error("Error sending notification:", error);
            res.status(500).send({
                success: false,
                message: "Error sending notification",
                error: error.message,
            });
        };
    } catch (error) {
        console.log('Authorization Required:', error);
        res.status(401).send('Authorization Required');
    }
});
// on profile updation.
app.post("/send-notification-user-update-profile", async (req, res) => {
    const { token, data } = req.body;
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    // const truncatedTimestamp = new Date().toISOString().slice(0, -2);
    const message = {
        token: token,

        data: {
            title: "Profile Updates",
            body: data.body || "Your profile has been updated successfully",
            redirect_to: data.redirect_to || "ProfileScreen",
            userId: data.userId,
            timestamp: data.timestamp,
        },
        android: {
            priority: "high",
        },
    };

    try {
        await verifyToken(idToken)
        try {
            const result = await sendNotification(message); // Await the result

            if (result.success) {
                try {
                    const userRef = firestore().collection("Users").doc(data.userId);
                    // const truncatedTimestamp = new Date().toISOString().slice(0, -5);
                    await userRef.update({
                        notifications: firestore.FieldValue.arrayUnion({
                            title: "Profile Updates",
                            body: data.body || "Your profile has been updated successfully",
                            redirect_to: data.redirect_to || "ProfileScreen",
                            seen: false, // Initially set as unseen
                            timestamp: data.timestamp,
                        }),
                    });
                    res.status(200).send({
                        success: true,
                        message:
                            "Notification sent successfully and stored in user's document",
                    });
                } catch (error) {
                    console.error("Error storing notification:", error);
                    res.status(500).send({
                        success: false,
                        message: "Error storing notification in user's document",
                        error: error.message,
                    });
                }
            } else {
                res.status(500).send({
                    success: false,
                    message: "Error sending notification",
                    error: result.error,
                });
            }
        } catch (error) {
            console.error("Error sending notification:", error);
            res.status(500).send({
                success: false,
                message: "Error sending notification",
                error: error.message,
            });
        }
    } catch (error) {
        console.log('Authorization Required:', error);
        res.status(401).send('Authorization Required');
    }
});

// app.post("/send-notification-unauthorised-login", (req, res) => {
//     const { token, data, title, body } = req.body;

//     const message = {
//         token: token,
//         data: {
//             title: title || "Notification Title",
//             body: body || "Notification Body",
//             redirect_to: data.redirect_to || "UnauthorisedLoginRedirectScreen",
//         },
//         android: {
//             priority: "high",
//         },
//     };

//     const result = sendNotification(message);

//     if (result.success) {
//         res.status(200).send({
//             success: true,
//             message: "Notification sent successfully",
//         });
//     } else {
//         res.status(500).send({
//             success: false,
//             message: "Error sending notification",
//             error: result.error,
//         });
//     }
// });

// app.post("/send-notification-authorised-login", (req, res) => {
//     const { token, data, title, body } = req.body;

//     const message = {
//         token: token,
//         // notification: {
//         //   title: title || "Notification Title",
//         //   body: body || "Notification Body",
//         // },
//         data: {
//             title: title || "Notification Title",
//             body: body || "Notification Body",
//             redirect_to: "HomePageScreen",
//             type: "authorized",
//         },
//         android: {
//             priority: "high",
//         },
//     };
//     const result = sendNotification(message);

//     if (result.success) {
//         res.status(200).send({
//             success: true,
//             message: "Notification sent successfully",
//         });
//     } else {
//         res.status(500).send({
//             success: false,
//             message: "Error sending notification",
//             error: result.error,
//         });
//     }
// });

// Broadcast notification on post upload

// on upload post
app.post("/send-broadcast", async (req, res) => { // upload post
    const { token, data } = req.body;
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    const message = {
        token: token,
        data: data || {
            title: "Notification Title",
            body: "Notification Body",
            redirect_to: "PostScreen",
            timestamp: data.timestamp,
            type: "upload_post",
        },
        android: {
            priority: "high",
        },
    };

    try {
        await verifyToken(idToken)
        try {
            const result = await sendNotification(message); // Await the result

            if (result.success) {
                try {
                    const userRef = admin.firestore().collection("Users").doc(data.userId);
                    // const truncatedTimestamp = new Date().toISOString().slice(0, -5);

                    await userRef.update({
                        notifications: admin.firestore.FieldValue.arrayUnion({
                            title: data.title,
                            body: data.body,
                            redirect_to: data.redirect_to || "PostScreen",
                            postId: data.postId,
                            seen: false, // Initially set as unseen
                            timestamp: data.timestamp,
                        }),
                    });
                    res.status(200).send({
                        success: true,
                        message:
                            "Notification sent successfully and stored in user's document",
                    });
                } catch (error) {
                    console.error("Error storing notification:", error);
                    res.status(500).send({
                        success: false,
                        message: "Error storing notification in user's document",
                        error: error.message,
                    });
                }
            } else {
                res.status(500).send({
                    success: false,
                    message: "Error sending notification",
                    error: result.error,
                });
            }
        } catch (error) {
            console.error("Error sending notification:", error);
            res.status(500).send({
                success: false,
                message: "Error sending notification",
                error: error.message,
            });
        }
    } catch (error) {
        console.log('Authorization Required:', error);
        res.status(401).send('Authorization Required');
    }
});
// broadcast notification on post upload
// app.post("/send-broadcast-multiple-login", (req, res) => {
//     const { token, title, body, data } = req.body;

//     const message = {
//         token: token,
//         data: {
//             title: title || "Notification Title",
//             body: body || "Notification Body",
//             redirect_to: "MultipleLoginRedirectScreen",
//         },
//         android: {
//             priority: "high",
//         },
//     };

//     const result = sendNotification(message);

//     if (result.success) {
//         res.status(200).send({
//             success: true,
//             message: "Notification sent successfully",
//         });
//     } else {
//         res.status(500).send({
//             success: false,
//             message: "Error sending notification",
//             error: result.error,
//         });
//     }
// });

// const sendNotificationToNotifyUsers = async () => {
//   try {
//     const notifySnapshot = await admin.firestore().collection("Notify").get();
//     const tokens = [];
//     const batch = admin.firestore().batch();

//     notifySnapshot.forEach((doc) => {
//       const data = doc.data();
//       if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
//         if (data.fcmtoken.length > 0) {
//           tokens.push(...data.fcmtoken); // Add all tokens from the array
//           // Prepare to delete the fcmtoken field from the document
//           batch.update(doc.ref, {
//             fcmtoken: admin.firestore.FieldValue.delete(),
//           });
//         } else {
//           console.log(`FCM tokens array is empty for user: ${doc.id}`);
//         }
//       } else {
//         console.log(`FCM tokens not found or not an array for user: ${doc.id}`);
//       }
//     });

//     if (tokens.length > 0) {
//       const message = {
//         tokens: tokens,
//         notification: {
//           title: "App Update Available",
//           body: "A new app update is available for you to use",
//         },
//         data: {
//           redirect_to: "NotifyMeRedirectScreen",
//         },
//       };

//       const response = await admin.messaging().sendMulticast(message);
//       console.log(`Successfully sent messages: ${response.successCount}`);
//       console.log(`Failed messages: ${response.failureCount}`);

//       // Commit the batch to delete the fcmtoken fields
//       await batch.commit();
//       console.log("fcmtoken fields cleared from Notify collection.");
//     } else {
//       console.log("No tokens found in the Notify collection.");
//     }
//   } catch (error) {
//     console.error("Error sending notifications to Notify users:", error);
//   }
// };
const sendNotificationToNotifyUsers = async () => {
    try {
        const notifySnapshot = await admin.firestore().collection("Notify").get();
        const tokens = [];
        const userNotificationPromises = [];
        const userTokenMap = new Map();
        const batch = admin.firestore().batch();

        notifySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
                if (data.fcmtoken.length > 0) {
                    tokens.push(...data.fcmtoken); // Add all tokens from the array
                    data.fcmtoken.forEach((token) => {
                        userTokenMap.set(token, data.userId);
                    });

                    // Prepare to delete the fcmtoken field from the document
                    batch.update(doc.ref, {
                        fcmtoken: admin.firestore.FieldValue.delete(),
                    });
                } else {
                    console.log(`FCM tokens array is empty for user: ${doc.id}`);
                }
            } else {
                console.log(`FCM tokens not found or not an array for user: ${doc.id}`);
            }
        });

        if (tokens.length > 0) {
            const truncatedTimestamp = new Date().toISOString();

            // Split tokens into chunks of 500 (FCM supports up to 500 tokens per request)
            const chunkSize = 500;
            for (let i = 0; i < tokens.length; i += chunkSize) {
                const tokenChunk = tokens.slice(i, i + chunkSize);

                // Create a separate message for each chunk with user-specific data
                const messages = tokenChunk.map((token) => {
                    const userId = userTokenMap.get(token);
                    return {
                        token: token,
                        data: {
                            title: "App Update Available",
                            body: "A new app update is available for you to use",
                            redirect_to: "NotifyMeRedirectScreen",
                            timestamp: truncatedTimestamp,
                            userId: userId ? userId : "",
                        },
                        android: {
                            priority: "high",
                        },
                    };
                });

                const response = await admin.messaging().sendAll(messages);

                console.log(`Successfully sent messages: ${response.successCount}`);
                console.log(`Failed messages: ${response.failureCount}`);

                response.responses.forEach((resp, idx) => {
                    const token = tokenChunk[idx];
                    const userId = userTokenMap.get(token);

                    if (resp.success) {
                        if (userId) {
                            const userRef = admin.firestore().collection("Users").doc(userId);
                            const notification = {
                                title: "App Update Available",
                                body: "A new app update is available for you to use",
                                redirect_to: "NotifyMeRedirectScreen",
                                seen: false, // Initially set as unseen
                                timestamp: truncatedTimestamp,
                                userId: userId, // Include userId in the notification object
                            };

                            // Add a promise to the array
                            userNotificationPromises.push(
                                userRef
                                    .update({
                                        notifications:
                                            admin.firestore.FieldValue.arrayUnion(notification),
                                    })
                                    .then(() => {
                                        console.log(
                                            `Notification stored successfully for user: ${userId}`
                                        );
                                    })
                                    .catch((error) => {
                                        console.error(
                                            `Error storing notification for user: ${userId}`,
                                            error
                                        );
                                    })
                            );
                        } else {
                            console.error(`User ID not found for token: ${token}`);
                        }
                    } else {
                        console.error(`Failed to send to ${token}: ${resp.error}`);
                    }
                });
            }

            // Commit the batch to delete the fcmtoken fields
            await batch.commit();
            console.log("fcmtoken fields cleared from Notify collection.");

            // Wait for all promises to resolve
            await Promise.all(userNotificationPromises);
        } else {
            console.log("No tokens found in the Notify collection.");
        }
    } catch (error) {
        console.error("Error sending notifications to Notify users:", error);
    }
};

// Function to send silent notifications and remove invalid tokens
const sendSilentNotificationsAndRemoveInvalidTokens = async () => {
    try {
        const notifySnapshot = await admin.firestore().collection("Notify").get();
        const userSnapshot = await admin.firestore().collection("Users").get();

        // Set to accumulate all unique tokens
        const tokens = new Set();

        // Batch to update documents in Firestore
        const notifyBatch = admin.firestore().batch();
        const userBatch = admin.firestore().batch();

        // Process Notify collection
        notifySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
                data.fcmtoken.forEach((token) => {
                    tokens.add(token); // Add token to set
                });

                // Remove fcmtoken from Notify document
                notifyBatch.update(doc.ref, {
                    fcmtoken: admin.firestore.FieldValue.delete(),
                });
            }
        });

        // Process Users collection
        userSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
                data.fcmtoken.forEach((token) => {
                    tokens.add(token); // Add token to set
                });

                // Remove fcmtoken from Users document
                userBatch.update(doc.ref, {
                    fcmtoken: admin.firestore.FieldValue.delete(),
                });
            }
        });

        // Convert set to array of unique tokens
        const uniqueTokens = Array.from(tokens);

        if (uniqueTokens.length > 0) {
            const invalidTokens = new Set();

            // Send notifications individually
            for (const token of uniqueTokens) {
                const message = {
                    data: {
                        silentCheck: "true",
                    },
                    android: {
                        priority: "high",
                    },
                    apns: {
                        payload: {
                            aps: {
                                "content-available": 1,
                            },
                        },
                    },
                    token: token,
                };

                try {
                    await admin.messaging().send(message);
                } catch (error) {
                    // console.error(`Error sending message to token ${token}:`, error);
                    if (
                        error.code === "messaging/registration-token-not-registered" ||
                        error.code === "messaging/invalid-registration-token"
                    ) {
                        invalidTokens.add(token);
                    }
                }
            }

            // Handle invalid tokens
            if (invalidTokens.size > 0) {
                notifySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
                        const validTokens = data.fcmtoken.filter(
                            (token) => !invalidTokens.has(token)
                        );
                        notifyBatch.update(doc.ref, { fcmtoken: validTokens });
                    }
                });

                userSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.fcmtoken && Array.isArray(data.fcmtoken)) {
                        const validTokens = data.fcmtoken.filter(
                            (token) => !invalidTokens.has(token)
                        );
                        userBatch.update(doc.ref, { fcmtoken: validTokens });
                    }
                });

                // Commit batch updates to Firestore
                await notifyBatch.commit();
                await userBatch.commit();

                console.log(
                    "Invalid tokens removed from Notify and Users collections."
                );
            }

            console.log("Successfully sent messages.");
        } else {
            console.log("No tokens found to send notifications.");
        }
    } catch (error) {
        console.error(
            "Error sending silent notifications and removing invalid tokens:",
            error
        );
    }
};

// removing seen notifications
async function cleanUpSeenNotifications() {
    try {
        const usersSnapshot = await admin.firestore().collection("Users").get();

        const batch = admin.firestore().batch();

        usersSnapshot.forEach((userDoc) => {
            const userRef = admin.firestore().collection("Users").doc(userDoc.id);
            const notifications = userDoc.data().notifications;

            if (notifications && notifications.length > 0) {
                const updatedNotifications = notifications.filter(
                    (notification) => !notification.seen
                );

                batch.update(userRef, { notifications: updatedNotifications });
            }
        });

        await batch.commit();

        console.log("Clean up of seen notifications completed successfully.");
    } catch (error) {
        console.error("Error cleaning up seen notifications:", error);
    }
}

// Schedule the sendSilentNotificationAndRemoveInvalidTokens function to run every 100 minute
cron.schedule("*/100 * * * *", () => {
    sendSilentNotificationsAndRemoveInvalidTokens();
});
//schedule clean notifications
cron.schedule("*/10 * * * *", () => {
    cleanUpSeenNotifications();
});
// Existing sendNotificationToNotifyUsers function

// Schedule the sendNotificationToNotifyUsers function to run every 1 minute from 8 AM to 8 PM
cron.schedule("*/100 8-22 * * *", () => {
    sendNotificationToNotifyUsers();
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
