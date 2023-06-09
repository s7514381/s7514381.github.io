
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
            if (thisApp.realtimeDb == null) { thisApp.realtimeDb = await thisApp.realtimeDbInit(); }
            return thisApp.realtimeDb;
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
            return new Promise((resolve, reject) => {
                import(`/js/firebase/firestore.js?timestamp=${ Date.now() }`)
                    .then(module => {
                        thisApp.dbAssembly = module.dbAssembly;
                        resolve(true);
                    })
            });
        },
        getDbAssembly: async function () {
            let { ready } = thisApp.dbAssembly;

            if (!ready) { await thisApp.firestoreInit(); }
            return thisApp.dbAssembly;
        },
        dbInsert: async function (collectionName, data, docId = '') {
            let { addDoc, collection, db } = await thisApp.getDbAssembly();

            if (docId != '') { return await setDoc(doc(db, collectionName, docId), data); }
            return await addDoc(collection(db, collectionName), data);
        },
        dbUpdate: async function (collectionName, docId, data) {
            let { doc, updateDoc, db } = await thisApp.getDbAssembly();
            const docRef = doc(db, collectionName, docId);
            return await updateDoc(docRef, data);
        },
        dbDelete: async function (collectionName, docId) {
            let { doc, deleteDoc, db } = await thisApp.getDbAssembly();
            await deleteDoc(doc(db, collectionName, docId));
        },
        dbQuery: async function (queryCondition) {
            let { getDocs } = await thisApp.getDbAssembly();
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
        thisApp.$router.beforeEach(async to => {
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
                        component = { data() { return thisApp.$data; }, template: null };
                        break;
                }

                thisApp.$router.addRoute({
                    name: controllerName,
                    path: to.path,
                    component: component,
                })
                return to.fullPath;
            }
        })

        thisApp.$router.beforeResolve(async to => {
            thisApp.pageLoading = true;

            const routeComponent = to.matched[0]?.components?.default;

            if (routeComponent && !routeComponent?.template) {
                routeComponent.template = await this.getHtmlContent(to.name);
                routeComponent.template = routeComponent.template.replaceAll('@@', '@');
            }
            thisApp.pageLoading = false;
        })
    },
    methods: {
        async getHtmlContent(controllerName) {
            let result;
            result = await axios.get(`/${controllerName}/HtmlContent`);
            return result.data;
        }
    },
}