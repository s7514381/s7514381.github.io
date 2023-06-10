
const dragMixin = {
    data() {
        return {
        }
    },
    methods: {
        dragChange: function (list, sortField) {
            list.forEach(function (v, i) {
                v[sortField] = i
            })
        },
    },
    computed: {
        dragOptions() {
            return {
                animation: 200,
                group: "description",
                disabled: false,
                ghostClass: "ghost"
            };
        }
    }
}

const realtimeDbMixin = {
    data() {
        return {
            realtimeDb: null,
        }
    },
    methods: {
        realtimeDbInit: function () {
            return new Promise((resolve, reject) => {
                import("/js/firebase/database.js?timestamp=" + Date.now())
                    .then(module => {
                        resolve(module.exportModel);
                    })
            });
        },
        getRealtimeDb: async function () {
            if (this.realtimeDb == null) { this.realtimeDb = await this.realtimeDbInit(); }
            return this.realtimeDb;
        },
    }
}

const firestoreMixin = {
    data() {
        return {
            dbAssembly: {
                ready: false,
            },
        }
    },
    methods: {
        firestoreInit: function () {
            let $this = this;

            return new Promise((resolve, reject) => {
                import(`/js/firebase/firestore.js?timestamp=${ Date.now() }`)
                    .then(module => {
                        $this.dbAssembly = module.dbAssembly;
                        resolve(true);
                    })
            });
        },
        getDbAssembly: async function () {
            let { ready } = this.dbAssembly;

            if (!ready) { await this.firestoreInit(); }
            return this.dbAssembly;
        },
        dbInsert: async function (collectionName, data, docId = '') {
            let { addDoc, collection, db } = await this.getDbAssembly();

            if (docId != '') { return await setDoc(doc(db, collectionName, docId), data); }
            return await addDoc(collection(db, collectionName), data);
        },
        dbUpdate: async function (collectionName, docId, data) {
            let { doc, updateDoc, db } = await this.getDbAssembly();
            const docRef = doc(db, collectionName, docId);
            return await updateDoc(docRef, data);
        },
        dbDelete: async function (collectionName, docId) {
            let { doc, deleteDoc, db } = await this.getDbAssembly();
            await deleteDoc(doc(db, collectionName, docId));
        },
        dbQuery: async function (queryCondition) {
            let { getDocs } = await this.getDbAssembly();
            return await getDocs(queryCondition);
        },
    }
}

const routerMixin = {
    data() {
        return {
            pageLoading: false,
        }
    },
    created() {
        let $this = this;

        $this.$router.beforeEach(async to => {
            if (!this.$router.hasRoute(to.name)) {
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
                        await import(importPath).then(module => { component = module.component })
                        break;
                    default:
                        component = { data() { return $this.$data; }, template: null };
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
            $this.pageLoading = true;

            const routeComponent = to.matched[0]?.components?.default;

            if (routeComponent && !routeComponent?.template) {
                routeComponent.template = await this.getHtmlContent(to.name);
                routeComponent.template = routeComponent.template.replaceAll('@@', '@');
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

            let ipClien = await this.getIpClient();
            connectModel["ip"] = ipClien.ip;
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