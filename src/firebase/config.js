import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBX7wHQYFsFigjBzqLlRCwNVKOKTcicD8Y",
  authDomain: "gold-91bf2.firebaseapp.com",
  databaseURL: "https://gold-91bf2-default-rtdb.firebaseio.com",
  projectId: "gold-91bf2",
  storageBucket: "gold-91bf2.firebasestorage.app",
  messagingSenderId: "682981574300",
  appId: "1:682981574300:web:b8429dae1ef9e3455d0f59",
  measurementId: "G-Y13BE77JH0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database }; 