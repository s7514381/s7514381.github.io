
//套用此Mixin之後可以直接使用v-model="value"
export const bindModelMixin = {
    emits: ['update:modelValue'],
    computed: {
        value: {
            get() {
                return this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            }
        }
    },
}

export const baseMixin = {
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

export const dragMixin = {
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

export const realtimeDbMixin = {
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

export const firestoreMixin = {
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
                import(`/js/firebase/firestore.js?timestamp=${Date.now()}`)
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

export const threadMixin = {
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

export const connectMixin = {
    mixins: [baseMixin, firestoreMixin, realtimeDbMixin],
    data() {
        return {
            authInfo: {
                ready: false,
                user: null,
            },
            connection: {
                name: 'connections',
                users: [],
                ready: false,
            },
            ipClient: null,
        }
    },
    methods: {
        async connectInit() {
            let $this = this;
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
        async authUserInit() {
            let $this = this;

            let authUser = await $this.getAuthUser();
            $this.authInfo.user = authUser;
            $this.authInfo.ready = true;
        },
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

            if (!this.ipClient) {
                await axios.get(`https://api.ipify.org?format=json`).then(function (res) {
                    $this.ipClient = res.data
                });
            }
            return this.ipClient;
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
            //connectModel = this.getObject(users, 'key', connectModel.key);
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
    computed: {
        hasAuth() { return this.authInfo.user != null; },
    },
}

export const mouseSyncMixin = {
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
                delay: 10,
                userMouse: [],
                connectUsers: [],
            },
        }
    },
    methods: {
        mouseSyncInit(authUser, realtimeDb) {
            let $this = this;
            let model = this.mouseSync;

            if (authUser && this.mouseSync.userId == '') {
                this.mouseSync.userId = authUser.uid;
                this.mouseSync.userName = authUser.displayName;
            }
            if (realtimeDb && !this.mouseSync.realtimeDb) { this.mouseSync.realtimeDb = realtimeDb; }

            if (!model.ready && this.mouseSync.userId != '' && this.mouseSync.realtimeDb) {
                this.mouseSyncConnection();
            }
        },
        mouseSyncConnection() {
            let $this = this;
            let model = this.mouseSync;
            if (!model.realtimeDb) return;
            let { dbConnection } = model.realtimeDb;

            dbConnection(model.connectName, null, (snapshot) => {
                //onChildAdded 新增時觸發
                let childData = snapshot.val();
                if (model.userMouse.filter(x => x.uid == snapshot.key).length == 0) {
                    childData["uid"] = snapshot.key;
                    model.userMouse.push(childData)
                }
                this.updateUserName()
            }, null, (snapshot) => {
                //onChildChanged 更新時觸發
                let childData = snapshot.val();
                let user = $this.getObject(model.userMouse, 'uid', snapshot.key)
                if (user) {
                    user.x = childData.x;
                    user.y = childData.y;
                }
            })
            model.ready = true;
        },
        mouseMove(event) {
            let model = this.mouseSync;
            if (!model.ready) { return; }

            let { setRef } = model.realtimeDb;
            if (model.workable) {
                setRef(`${model.connectName}/${model.userId}`, {
                    x: event.clientX,
                    y: event.clientY,
                })

                if (model.delay > 0) {
                    model.workable = false;

                    setTimeout(function () {
                        model.workable = true;
                    }, model.delay)
                }
            }
        },
        updateUserName() {
            let connectUsers = this.mouseSync.connectUsers;

            this.mouseSync.userMouse.forEach(function (v) {
                let filter = connectUsers.filter(x => x.key == v.uid);
                if (filter.length > 0) { v["name"] = filter[0].displayName; }
            })
        },
    },
    watch: {
        "mouseSync.connectUsers": {
            handler: function (nv, ov) {
                this.updateUserName()
            },
        },
        "mouseSync.realtimeDb": {
            handler: function (nv, ov) {
               
            },
        },
    }
}