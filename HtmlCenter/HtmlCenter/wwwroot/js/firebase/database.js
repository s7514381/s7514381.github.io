import { app } from "/js/firebase/app.js";
import { getDatabase, ref, onValue, set, serverTimestamp, onDisconnect, remove } from "/lib/firebase/gstatic.com_firebasejs_9.22.1_firebase-database.js";

// 獲取 Realtime Database 的根節點引用
const database = getDatabase(app);

// 監聽用戶連接狀態
function trackUserConnections() {
    const connectionsRef = ref(database, "connections");

    // 當節點數據變化時觸發的回調函數
    onValue(connectionsRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const userId = childSnapshot.key;
            console.log(`User connected: ${userId}`);
        });
    });
}

// 添加用戶連接
function addUserConnection(userId) {
    const connectionsRef = ref(database, `connections/${userId}`);

    set(connectionsRef, {
        connected: true,
        timestamp: serverTimestamp(),
    }); 

    // 在用戶斷開連接時刪除用戶連接信息
    onDisconnect(connectionsRef).remove();
}

// 測試用戶連接狀態追踪
trackUserConnections();

//// 添加用戶連接
//addUserConnection("user1");
//addUserConnection("user2");

// 假裝斷開 user1 的連接（模擬用戶離線）
//setTimeout(() => {
//    remove(ref(database, "connections/user1"));
//}, 5000);

//export const rdAssembly