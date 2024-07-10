const admin = require('firebase-admin');

const verifyToken = async idToken => {
  await admin.auth().verifyIdToken(idToken);
};

module.exports = verifyToken;
