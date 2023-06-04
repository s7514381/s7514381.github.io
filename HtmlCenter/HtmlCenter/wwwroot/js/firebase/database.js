import { app } from "/js/firebase/app.js";
import { getDatabase, ref, onValue, set, serverTimestamp, onDisconnect, remove, push } from "/lib/firebase/gstatic.com_firebasejs_9.22.1_firebase-database.js";

// 獲取 Realtime Database 的根節點引用
const db = getDatabase(app);

function dbConnection(dbName, func) {
    const connectionsRef = ref(db, dbName);

    // 當節點數據變化時觸發的回調函數
    onValue(connectionsRef, async (snapshot) => {
        const snapshotVal = snapshot.val();
        for (const key in snapshotVal) {
            await func(key, snapshotVal[key]);
        }
    });
}

// 添加用戶連接
function addUserConnection(dbName, userId, data) {
    const connectionsRef = ref(db, `${dbName}/${userId}`);
    const lastOnlineRef = ref(db, 'users/joe/lastOnline');

    set(connectionsRef, data);

    //onDisconnect(connectionsRef).update({ connections: false }).then(function (v) {
    //    set(lastOnlineRef, true);
    //    //remove(connectionsRef);
    //});
    onDisconnect(connectionsRef).remove()
    //onDisconnect(connectionsRef).remove().then(() => {
    //    //set(connectionsRef, null).the n(() => {
    //    //    console.log('使用者移除成功');
    //    //}).catch((error) => {
    //    //    console.log('使用者移除時發生錯誤：', error);
    //    //});

    //    set(lastOnlineRef, {qq: 123});

    //    //if (error) {
    //    //    console.log('移除斷線時出現錯誤：', error);
    //    //} else {
    //    //    console.log('成功設定斷線事件');
    //    //}
    //});
}





function removeConnection(dbName, userId) {
    remove(ref(db, `${dbName}/${userId}`));
}

export const exportModel = {
    addUserConnection, dbConnection, serverTimestamp, onDisconnect, removeConnection
}
