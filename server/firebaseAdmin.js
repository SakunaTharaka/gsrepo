// server/firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'multilinks-cloud.appspot.com', // ✅ Use this bucket name
});

const bucket = admin.storage().bucket();
module.exports = bucket;
