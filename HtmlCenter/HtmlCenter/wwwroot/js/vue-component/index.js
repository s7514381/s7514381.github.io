import {
    baseMixin, dragMixin, realtimeDbMixin, firestoreMixin, threadMixin
    , connectMixin, mouseSyncMixin
} from '../vue-mixin.js'

import chat from './chat.js'

const publicComponents = {
    'v-chat': chat,
}

const routerMixin = {
    data() {
        return {
            pageLoading: false,
            navbar: [
                { to: '/chat', name: '互動大廳', newTag: false },
                { to: '/imagecoverframe', name: '圖片框選器', newTag: false },
                { to: '/dynamicform', name: '動態表單v1.0', newTag: false },
                { to: '/interest', name: '利息計算機', newTag: false },
                { to: '/unitywebgl', name: 'Unity遊戲', newTag: false },
                { to: '/aboutme', name: '關於我', newTag: false },
            ],
        }
    },
    created() {
        let $this = this;

        $this.navbar.forEach(function (v) {
            let log = localStorage.getItem(`navbar-${v.to}`);
            if (!Number(log)) { v.newTag = true; }
        })

        $this.$router.beforeEach(async to => {
            if (!this.$router.hasRoute(to.name)) {
                $this.pageLoading = true;

                let navItem = $this.getObject($this.navbar, 'to', to.path);
                if (navItem && navItem.newTag) {
                    localStorage.setItem(`navbar-${to.path}`, 1);
                    navItem.newTag = false;
                }

                let pathArray = to.path.split('/');
                let controllerName = pathArray[1];
                if (controllerName == '') { controllerName = "home"; }

                let component;

                switch (controllerName) {
                    case "imagecoverframe":
                    case "dynamicform":
                    case "interest":
                        //客製化
                        let importPath = `/js/vue-component/${controllerName}.js?timestamp=${Date.now()}`
                        await import(importPath).then(module => { component = module.default })
                        break;
                    default:
                        component = {
                            data() { return $this.$data; }, components: publicComponents, template: null
                        };
                        break;
                }

                $this.$router.addRoute({
                    name: controllerName,
                    path: to.path,
                    component: component,
                })
                return to.fullPath;
            }
        })

        $this.$router.beforeResolve(async to => {
            const routeComponent = to.matched[0]?.components?.default;

            if (routeComponent && !routeComponent?.template) {
                let htmlContent = await this.getHtmlContent(to.name);
                htmlContent = htmlContent.replaceAll('@@', '@');

                routeComponent.template = htmlContent;
            }
            $this.pageLoading = false;
        })
    },
    methods: {
        async getHtmlContent(controllerName) {
            let result;
            result = await axios.get(`/${controllerName}/htmlContent`);
            return result.data;
        }
    },
}

const appComponent = Vue.createApp({
    mixins: [connectMixin, threadMixin, routerMixin],
    components: publicComponents,
    data() {
        return {
            pageTitle: '',
            Layout: {
                headTitle: document.getElementsByTagName("title")[0].innerHTML,
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

        let authUser = await $this.getAuthUser();
        $this.authInfo.user = authUser;
        $this.authInfo.ready = true;
        
        let { dbConnection } = await $this.getRealtimeDb();
        $this.connection.users = [];
        dbConnection($this.connection.name, async (snapshot) => {
            //onValue(once)
            //不知道為甚麼初始讀資料會在add也觸發一次，直接在那邊做
            $this.userConnection($this.authInfo.user);
        }, async (snapshot) => {
            //onChildAdded
            let childData = snapshot.val();
            let keyArray = Object.keys(childData);
            let user = childData[keyArray[0]];
            user["connectIds"] = keyArray;

            $this.connection.users.push(user)
            if (!$this.connection.ready) { $this.connection.ready = true; }
        }, async (snapshot) => {
            //onChildRemoved
            let childData = snapshot.val();
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