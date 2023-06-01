// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js'
import { getFirestore, collection, addDoc, getDocs, doc, query, where } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCiB4u5tiUzB1UqdwoN32li8HNVe25UBpI",
    authDomain: "timwu19950429.firebaseapp.com",
    projectId: "timwu19950429",
    storageBucket: "timwu19950429.appspot.com",
    messagingSenderId: "639668876397",
    appId: "1:639668876397:web:0305ce60d2b328cf22bb64",
    measurementId: "G-P49511Z8S9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
vApp.dbInit(db, collection, addDoc, getDocs, doc, query, where);
