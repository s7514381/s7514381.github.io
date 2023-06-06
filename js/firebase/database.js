import { app } from "/js/firebase/app.js";
import {
    getDatabase, ref, onValue, set, serverTimestamp, onDisconnect, remove
    , push, onChildAdded, onChildChanged, onChildRemoved, child, get
} from "/lib/firebase/gstatic.com_firebasejs_9.22.1_firebase-database.js";

// 獲取 Realtime Database 的根節點引用
const db = getDatabase(app);

function dbConnection(dbName, valueFunc = null, addFunc = null, removeFunc = null, updateFunc = null) {
    const connectionsRef = ref(db, dbName);

    if (valueFunc) {
        onValue(connectionsRef, async (snapshot) => {
            await valueFunc(snapshot.val());
        }, {
            onlyOnce: true
        });
    }

    if (addFunc) {
        onChildAdded(connectionsRef, async (snapshot) => {
            await addFunc(snapshot.val());
        });
    }

    if (removeFunc) {
        onChildRemoved(connectionsRef, async (snapshot) => {
            await removeFunc(snapshot.val())
        });
    }
    
    if (updateFunc) {
        onChildChanged(connectionsRef, async (snapshot) => {
            await updateFunc(snapshot.val());
        });
    }
 
}

// 添加用戶連接
function addConnection(dbName, userId, data, addFunc = null, removeFunc = null, updateFunc = null) {
    const connectionsRef = ref(db, `${dbName}/${userId}`);
    const con = push(connectionsRef);
    onDisconnect(con).remove()
    set(con, data);

    if (addFunc) {
        onChildAdded(connectionsRef, async (snapshot) => {
            await addFunc(snapshot.val());
        });
    }

    if (removeFunc) {
        onChildRemoved(connectionsRef, async (snapshot) => {
            await removeFunc(snapshot.val())
        });
    }

    if (updateFunc) {
        onChildChanged(connectionsRef, async (snapshot) => {
            await updateFunc(snapshot.val());
        });
    }
}

async function removeConnection(dbName, userId) {
    await remove(ref(db, `${dbName}/${userId}`))
}


export const exportModel = {
    addConnection, dbConnection, serverTimestamp, onDisconnect, removeConnection
}
