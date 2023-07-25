import {
    baseMixin, dragMixin, realtimeDbMixin, firestoreMixin, threadMixin, connectMixin
} from '../vue-mixin.js'

import jsMouseSync from './mouse-sync.js'
import jsChat from './chat.js'

const publicComponents = {
    'v-mouse-sync': jsMouseSync,
    'v-chat': jsChat,
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
            $this.$refs.navbarToggle.click();

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
                        //客製化 => 舊式頁面，不再追加
                        let importPath = `/js/vue-component/${controllerName}.js?timestamp=${Date.now()}`
                        await import(importPath).then(module => { component = module.default })
                        break;
                    default:
                        //console.log($this.$options)
                        component = {
                            data() { return $this.$data; },
                            components: publicComponents,
                            template: null,
                            methods: $this.$options.methods
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
            initThreads: [
                { name: "realtimeDb", func: this.getDbAssembly, ready: false },
                { name: "firestore", func: this.getRealtimeDb, ready: false },
            ],
            chat: {
                content: [
                    { message: '安安', self: false, },
                    { message: '安三小', self: true, }
                ]
            },
        }
    },
    async created() {
        let $this = this;

        await this.runThreads(this.initThreads);

        this.visitId = this.newGuid();
        this.setHeadTitle(this.pageTitle)

        //登入帳號
        await this.authUserInit();

        //大廳登入
        await this.connectInit();
    },
    methods: {
        qqw() { this.chat.content.push({ message: '安三小三小', self: false, }) },
    },
});

const router = VueRouter.createRouter({ history: VueRouter.createWebHistory(), routes: [] });
const vApp = appComponent.use(router).mount('#app');