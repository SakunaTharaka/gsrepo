import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCzgxWhmeMqfJgJxTWS0tDkfc3p7NqkkgQ",
  authDomain: "multilinkcloud-eba73.firebaseapp.com",
  projectId: "multilinkcloud-eba73",
  storageBucket: "multilinkcloud-eba73.firebasestorage.app",
  messagingSenderId: "69831308507",
  appId: "1:69831308507:web:41a351d783a4c2af1ec8fe",
  measurementId: "G-VEL8SQZHLN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testSubmit() {
  const dummyWhatsApp = {
    name: "Test Group",
    category: "Crypto", // Assumes category exists
    country: "USA",
    language: "English",
    link: "https://chat.whatsapp.com/invite/12345678901234567890qw",
    description: "",
    tags: [],
    iconUrl: "",
    createdAt: new Date(),
    approved: 0,
    views: 0,
    members: 0
  };

  try {
    console.log("Testing WhatsApp group submission...");
    await addDoc(collection(db, 'whatsapp'), dummyWhatsApp);
    console.log("WhatsApp submission SUCCESS!");
  } catch (err) {
    console.error("WhatsApp submission FAILED:", err.message);
  }

  const dummyTelegram = {
    name: "Test Telegram",
    category: "Crypto",
    country: "USA",
    language: "English",
    link: "https://t.me/testgroupxyz",
    description: "",
    tags: [],
    iconUrl: "",
    createdAt: new Date(),
    members: 0,
    rating: 0,
    reviews: []
  };

  try {
    console.log("Testing Telegram group submission...");
    await addDoc(collection(db, 'telegramGroups'), dummyTelegram);
    console.log("Telegram submission SUCCESS!");
  } catch (err) {
    console.error("Telegram submission FAILED:", err.message);
  }
  
  process.exit();
}

testSubmit();
