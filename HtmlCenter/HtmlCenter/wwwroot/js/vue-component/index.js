
const appComponent = Vue.createApp({
    mixins: [baseMixin, firestoreMixin, realtimeDbMixin, threadMixin, routerMixin],
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
            initThreads: [
                { name: "realtimeDb", func: this.getDbAssembly, ready: false },
                { name: "firestore", func: this.getRealtimeDb, ready: false },
                /*{ name: "ipClient", func: this.getIpClient, ready: false },*/
            ],
            
        }
    },
    async created() {
        let $this = this;

        await this.runThreads(this.initThreads);

        this.visitId = this.newGuid();
        this.setHeadTitle(this.pageTitle)

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
    computed: {
        hasAuth() { return this.authInfo.user != null; },
    },
    methods: {

    },
});

const router = VueRouter.createRouter({ history: VueRouter.createWebHistory(), routes: [] });
const vApp = appComponent.use(router).mount('#app');