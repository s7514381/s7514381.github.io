﻿
const appComponent = Vue.createApp({
    mixins: [baseMixin, routerMixin],
    data() {
        return {
            
        }
    },
    async created() {
        let $this = this;

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
    methods: {

    },
});

const router = VueRouter.createRouter({ history: VueRouter.createWebHistory(), routes: [] });
const vApp = appComponent.use(router).mount('#app');