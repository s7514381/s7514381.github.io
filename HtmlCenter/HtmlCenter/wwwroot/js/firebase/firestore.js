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


function dbSnapshot(dbName, addFunc = null, modifiedFunc = null, removeFunc = null) {
    const collectionRef = query(
        collection(db, dbName),
        orderBy("createDate", "desc"),
        limit(20)
    );

    onSnapshot(collectionRef, async (snapshot) => {
        let docChanges = snapshot.docChanges();
        for (let i = 0; i < docChanges.length; i++) {
            let change = docChanges[i];
            const document = change.doc.data();
            console.log(change.type, document)

            switch (change.type) {
                case 'added': // 處理新文檔插入事件
                    if (addFunc) { await addFunc(document); }
                    break;
                case 'modified': // 處理文檔修改事件
                    if (modifiedFunc) { await modifiedFunc(document); }
                    break;
                case 'removed': // 處理文檔刪除事件
                    if (removeFunc) { await removeFunc(document); }
                    break;
            }
        }
    });
}



export const dbAssembly = {
    ready: true, db, collection, addDoc, getDocs, doc, query, where, updateDoc, googleSignIn, deleteDoc, getAuth, waitForAuthStateChange
    , signOut, dbSnapshot
}
