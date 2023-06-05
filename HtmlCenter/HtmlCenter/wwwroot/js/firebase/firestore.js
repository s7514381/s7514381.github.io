import { getAuth, signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from '/lib/firebase/gstatic.com_firebasejs_9.22.1_firebase-auth.js'
import { getFirestore, collection, addDoc, getDocs, doc, query, where, updateDoc, deleteDoc, onSnapshot } from "/lib/firebase/gstatic.com_firebasejs_9.22.1_firebase-firestore.js";
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

//const collectionRef = collection(db, 'LoginUser');
//onSnapshot(collectionRef, (snapshot) => {
//    snapshot.docChanges().forEach((change) => {
//        if (change.type === 'added') {
//            const newDocument = change.doc.data();
//            // 處理新文檔插入事件
//            console.log('新文檔插入:', newDocument);
//        } else if (change.type === 'modified') {
//            const modifiedDocument = change.doc.data();
//            // 處理文檔修改事件
//            console.log('文檔修改:', modifiedDocument);
//        } else if (change.type === 'removed') {
//            const removedDocument = change.doc.data();
//            // 處理文檔刪除事件
//            console.log('文檔刪除:', removedDocument);
//        }
//    });
//});

export const dbAssembly = {
    ready: true, db, collection, addDoc, getDocs, doc, query, where, updateDoc, googleSignIn, deleteDoc, getAuth, waitForAuthStateChange
    , signOut, onSnapshot
}
