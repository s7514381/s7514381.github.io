const baseMixin = {
    methods: {
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
}

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
                    case "chat":
                        //客製化
                        let importPath = `/js/vue-component/${controllerName}.js?timestamp=${Date.now()}`
                        await import(importPath).then(module => { component = module.default })
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

const threadMixin = {
    methods: {
        async runThreads(threadList) {
            let $this = this;
            return new Promise((resolve, reject) => {
                for (let i = 0; i < threadList.length; i++) {
                    let task = threadList[i];

                    task.func().then(async function () {
                        task.ready = true;
                        if (await $this.checkInitThread(threadList)) { resolve(true); }
                    })
                }
            });
        },
        async checkInitThread(threadList) {
            return new Promise((resolve, reject) => {
                let result = true;
                for (let i = 0; i < threadList.length; i++) {
                    let task = threadList[i];
                    if (!task.ready) { result = false; }
                }
                resolve(result)
            });
        },
    },
}

const connectMixin = {
    mixins: [baseMixin, firestoreMixin, realtimeDbMixin],
    data() {
        return {
            authInfo: {
                ready: false,
                user: null,
            },
        }
    },
    methods: {
        async getAuthUser() {
            let $this = this;

            return new Promise(async (resolve, reject) => {
                if (!$this.authInfo.ready) {
                    let { waitForAuthStateChange } = await $this.getDbAssembly();
                    let authUser = await waitForAuthStateChange();
                    $this.authInfo.user = authUser;
                    $this.authInfo.ready = true;
                }
                resolve($this.authInfo.user)
            });
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
            let connectModel = {
                key: uid,
                displayName: hasAuth ? userInfo.displayName : "訪客",
                email: hasAuth ? userInfo.email : '',
                timestamp: serverTimestamp(),
                createDate: new Date(),
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

            //ip可能會非常慢，只能另外處理，不然會卡畫面
            let ipClien = await this.getIpClient();
            connectModel = this.getObject(users, 'key', connectModel.key);
            connectModel["ip"] = ipClien.ip;
            $this.dbInsert("ConnectLog", connectModel);
        },
        signIn: async function () {
            let { googleSignIn } = await this.getDbAssembly();
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
    },
}

const mouseSyncMixin = {
    mixins: [realtimeDbMixin],
    data() {
        return {
            mouseSync: {
                ready: false,
                realtimeDb: null,
                connectName: 'mouseSync',
                userId: '',
                userName: '', 
                ref: null,
                workable: true,
                delay: 100,
                userMouse: [],
            },
        }
    },
    async created() {
        let $this = this;
        let model = this.mouseSync;

        let { dbConnection } = await this.getRealtimeDb();
        dbConnection(model.connectName, null, null, null, async (snapshot) => {
            if (snapshot.key == model.userId) return;

            let childData = snapshot.val();
            let user1 = $this.getObject(model.userMouse, 'uid', snapshot.key)
            if (user1) {
                user1.x = childData.x;
                user1.y = childData.y;
            } else {
                childData["uid"] = snapshot.key;
                model.userMouse.push(childData)
            }
        })
    },
    methods: {
        mouseMove(event) {
            let model = this.mouseSync;
            if (!model.ready) { return; }

            let { setRef } = model.realtimeDb;
            if (model.workable) {
                setRef(`${model.connectName}/${model.userId}`, {
                    x: event.clientX,
                    y: event.clientY,
                    name: model.userName,
                })
                
                if (model.delay > 0) {
                    model.workable = false;

                    setTimeout(function () {
                        model.workable = true;
                    }, model.delay)
                }
            }
        }
    },
}