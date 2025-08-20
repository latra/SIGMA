import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDEENgDXYMxIgTPwEFbyRhw8z9JKd3BP_o",
  authDomain: "real-hospital-app.firebaseapp.com",
  projectId: "real-hospital-app",
  storageBucket: "real-hospital-app.firebasestorage.app",
  messagingSenderId: "1089927476854",
  appId: "1:1089927476854:web:dd6373267ceeefcfcdd157"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

export default app 