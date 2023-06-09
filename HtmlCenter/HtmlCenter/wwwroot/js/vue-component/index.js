var thisApp;
var component;

const baseMixin = {
    mixins: [firestoreMixin, realtimeDbMixin],
    data() {
        return {
            pageTitle: '',
            Layout: {
                headTitle: document.getElementsByTagName("title")[0].innerHTML,
            },
            authInfo: {
                ready: false,
                user: null,
            },
            visitId: null,
            connection: {
                name: 'connections',
                users: [],
                ready: false,
            },
            IpClient: null,
        }
    },
    beforeCreate() {
        thisApp = this;
    },
    async created() {
        
    },
    computed: {
        hasAuth() { return thisApp.authInfo.user != null; },
    },
    methods: {
        async websiteInit() {

        },
        async getIpClient() {
            if (!thisApp.IpClient) {
                await axios.get(`https://api.ipify.org?format=json`).then(function (res) {
                    thisApp.IpClient = res.data
                });
            }
            return thisApp.IpClient;
        },
        resetUserConnection: async function (userInfo, removeId) {
            let { removeConnection } = await thisApp.getRealtimeDb();

            removeConnection(thisApp.connection.name, removeId);
            thisApp.userConnection(userInfo);
        },
        userConnection: async function (userInfo) {
            let { addConnection, serverTimestamp } = await thisApp.getRealtimeDb();
            let users = thisApp.connection.users;

            let hasAuth = userInfo != null;
            let uid = hasAuth ? userInfo.uid : thisApp.visitId;
            let ipClien = await thisApp.getIpClient();
            let connectModel = {
                key: uid,
                displayName: hasAuth ? userInfo.displayName : "訪客",
                email: hasAuth ? userInfo.email : '',
                timestamp: serverTimestamp(),
                createDate: new Date(),
                ip: ipClien.ip,
            };

            addConnection(thisApp.connection.name, uid, connectModel, async (snapshot) => {
                //onChildAdded
                //這邊只做連線數增減
                let connectId = snapshot.key;
                let childData = snapshot.val();
                let filterArray = users.filter(x => x.key == childData.key);
                let user = thisApp.getObject(users, 'key', filterArray[0]?.key);
                let hasConnectId = user.connectIds.includes(connectId);

                if (!hasConnectId) { user.connectIds.push(connectId); }
            }, async (snapshot) => {
                //onChildAdded
                //這邊只做連線數增減
                let connectId = snapshot.key;
                let childData = snapshot.val();
                let filterArray = users.filter(x => x.key == childData.key);
                let user = thisApp.getObject(users, 'key', filterArray[0]?.key);
                let connectIndex = user.connectIds.indexOf(connectId);

                if (connectIndex != -1) { user.connectIds.splice(connectIndex, 1) }
            });
            thisApp.dbInsert("ConnectLog", connectModel);
        },
        signIn: async function () {
            let { googleSignIn, getAuth } = await thisApp.getDbAssembly();
            result = await googleSignIn();
            thisApp.authInfo.user = result.user;

            thisApp.resetUserConnection(thisApp.authInfo.user, thisApp.visitId);
        },
        signOut: async function () {
            if (!confirm("是否要登出?")) { return false; }

            let uid = thisApp.authInfo.user.uid;

            let { getAuth, signOut } = await thisApp.getDbAssembly();
            const auth = getAuth();

            await signOut(auth).then(() => {
                thisApp.authInfo.user = null;
            }).catch((error) => {
                console.log(error)
            });

            thisApp.resetUserConnection(null, uid);
        },
        newGuid: function () {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },
        setHeadTitle(title) {
            if (!title) { return; }
            document.getElementsByTagName("title")[0].innerHTML = title + ' - ' + thisApp.Layout.headTitle;
        },
        getObject(list, keyField, key) {
            let result = null;
            for (let i = 0; i < list.length; i++) {
                let data = list[i];
                if (data[keyField] == key) { result = data; break; }
            }
            return result;
        },
    },
    watch: {
    }
}

const formComponent = Vue.createApp({
    mixins: [baseMixin, routerMixin],
    data() {
        return {
            
        }
    },
    async created() {

        thisApp.visitId = thisApp.newGuid();
        thisApp.setHeadTitle(thisApp.pageTitle)

        let { waitForAuthStateChange } = await thisApp.getDbAssembly();
        thisApp.authInfo.user = await waitForAuthStateChange();
        thisApp.authInfo.ready = true;
        await thisApp.getIpClient();

        let { dbConnection } = await thisApp.getRealtimeDb();
        thisApp.connection.users = [];
        dbConnection(thisApp.connection.name, async (childData) => {
            //onValue(once)
            //不知道為甚麼初始讀資料會在add也觸發一次，直接在那邊做
            thisApp.userConnection(thisApp.authInfo.user);
        }, async (childData) => {
            //onChildAdded
            let keyArray = Object.keys(childData);
            let user = childData[keyArray[0]];
            user["connectIds"] = keyArray;

            thisApp.connection.users.push(user)
            if (!thisApp.connection.ready) { thisApp.connection.ready = true; }
        }, async (childData) => {
            //onChildRemoved
            let users = thisApp.connection.users;
            let keyArray = Object.keys(childData);
            let user = childData[keyArray[0]];
            user = thisApp.getObject(users, 'key', user.key)

            users.splice(users.indexOf(user), 1);
        })
    },
    methods: {

    },
});

const router = VueRouter.createRouter({ history: VueRouter.createWebHistory(), routes: [] });
const vApp = formComponent.use(router).mount('#app');