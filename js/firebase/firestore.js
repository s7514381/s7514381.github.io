import { getAuth, signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from '/lib/firebase/gstatic.com_firebasejs_9.22.1_firebase-auth.js'
import { getFirestore, collection, addDoc, getDocs, doc, query, where, updateDoc, deleteDoc, onSnapshot, limit, orderBy } from "/lib/firebase/gstatic.com_firebasejs_9.22.1_firebase-firestore.js";
import { app } from "/js/firebase/app.js";

const provider = new GoogleAuthProvider();
const auth = getAuth();
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
    , signOut, onSnapshot, orderBy, limit
}
