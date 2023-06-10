
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
    async created() {
        this.visitId = this.newGuid();
        this.setHeadTitle(this.pageTitle)

    },
    computed: {
        hasAuth() { return this.authInfo.user != null; },
    },
    methods: {
        async websiteInit() {

        },
        async getIpClient() {
            let $this = this;

            if (!this.IpClient) {
                await axios.get(`https://api.ipify.org?format=json`).then(function (res) {
                    $this.IpClient = res.data
                });
            }
            return this.IpClient;
        },
        resetUserConnection: async function (userInfo, removeId) {
            let { removeConnection } = await this.getRealtimeDb();

            removeConnection(this.connection.name, removeId);
            this.userConnection(userInfo);
        },
        userConnection: async function (userInfo) {
            let $this = this;
            let { addConnection, serverTimestamp } = await this.getRealtimeDb();
            let users = this.connection.users;

            let hasAuth = userInfo != null;
            let uid = hasAuth ? userInfo.uid : this.visitId;
            //let ipClien = await this.getIpClient();
            let connectModel = {
                key: uid,
                displayName: hasAuth ? userInfo.displayName : "訪客",
                email: hasAuth ? userInfo.email : '',
                timestamp: serverTimestamp(),
                createDate: new Date(),
                //ip: ipClien.ip,
            };

            addConnection(this.connection.name, uid, connectModel, async (snapshot) => {
                //onChildAdded
                //這邊只做連線數增減
                let connectId = snapshot.key;
                let childData = snapshot.val();
                let filterArray = users.filter(x => x.key == childData.key);
                let user = $this.getObject(users, 'key', filterArray[0]?.key);
                let hasConnectId = user.connectIds.includes(connectId);

                if (!hasConnectId) { user.connectIds.push(connectId); }
            }, async (snapshot) => {
                //onChildAdded
                //這邊只做連線數增減
                let connectId = snapshot.key;
                let childData = snapshot.val();
                let filterArray = users.filter(x => x.key == childData.key);
                let user = $this.getObject(users, 'key', filterArray[0]?.key);
                let connectIndex = user.connectIds.indexOf(connectId);

                if (connectIndex != -1) { user.connectIds.splice(connectIndex, 1) }
            });
            $this.dbInsert("ConnectLog", connectModel);
        },
        signIn: async function () {
            let { googleSignIn, getAuth } = await this.getDbAssembly();
            result = await googleSignIn();
            this.authInfo.user = result.user;

            this.resetUserConnection(this.authInfo.user, this.visitId);
        },
        signOut: async function () {
            let $this = this;
            if (!confirm("是否要登出?")) { return false; }

            let uid = this.authInfo.user.uid;

            let { getAuth, signOut } = await this.getDbAssembly();
            const auth = getAuth();

            await signOut(auth).then(() => {
                $this.authInfo.user = null;
            }).catch((error) => {
                console.log(error)
            });

            this.resetUserConnection(null, uid);
        },
        newGuid: function () {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },
        setHeadTitle(title) {
            if (!title) { return; }
            document.getElementsByTagName("title")[0].innerHTML = title + ' - ' + this.Layout.headTitle;
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

const appComponent = Vue.createApp({
    mixins: [baseMixin, routerMixin],
    data() {
        return {
            
        }
    },
    async created() {
        let $this = this;

        let { waitForAuthStateChange } = await $this.getDbAssembly();
        $this.authInfo.user = await waitForAuthStateChange();
        $this.authInfo.ready = true;

        let { dbConnection } = await $this.getRealtimeDb();
        $this.connection.users = [];
        dbConnection($this.connection.name, async (childData) => {
            //onValue(once)
            //不知道為甚麼初始讀資料會在add也觸發一次，直接在那邊做
            $this.userConnection($this.authInfo.user);
        }, async (childData) => {
            //onChildAdded
            let keyArray = Object.keys(childData);
            let user = childData[keyArray[0]];
            user["connectIds"] = keyArray;

            $this.connection.users.push(user)
            if (!$this.connection.ready) { $this.connection.ready = true; }
        }, async (childData) => {
            //onChildRemoved
            let users = $this.connection.users;
            let keyArray = Object.keys(childData);
            let user = childData[keyArray[0]];
            user = $this.getObject(users, 'key', user.key)

            users.splice(users.indexOf(user), 1);
        })
    },
    methods: {

    },
});

const router = VueRouter.createRouter({ history: VueRouter.createWebHistory(), routes: [] });
const vApp = appComponent.use(router).mount('#app');