const admin = require('firebase-admin');

const initializeFirebase = () => {
  admin.initializeApp({
    credential: admin.credential.cert(require('../service-account.json')),
  });
};

module.exports = {initializeFirebase};
