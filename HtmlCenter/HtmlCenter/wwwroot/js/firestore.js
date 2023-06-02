// Import the functions you need from the SDKs you need
//import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { getAuth, signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js'
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, query, where, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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
//const analytics = getAnalytics(app);

const provider = new GoogleAuthProvider();
const auth = getAuth();

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

async function googleSignIn() {
    let result;

    await signInWithPopup(auth, provider)
        .then((res) => {
            const credential = GoogleAuthProvider.credentialFromResult(res);
            const token = credential.accessToken;
            const user = res.user;

            result = { credential, token, user }

        }).catch((error) => { console.log(error) });
    return result;
}

function waitForAuthStateChange() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // 停止監聽
            resolve(user);
        });
    });
}


export const dbAssembly = {
    ready: true, db, collection, addDoc, getDocs, doc, query, where, updateDoc, googleSignIn, deleteDoc, getAuth, waitForAuthStateChange
    , signOut
}
