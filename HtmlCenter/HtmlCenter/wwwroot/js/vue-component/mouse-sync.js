import { baseMixin, connectTransferMixin } from '../vue-mixin.js'

const mouseSyncMixin = {
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
        //對外接口 => 初始化模組
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
        //對外接口 => 傳遞連線使用者
        setConnectUsers(list) {
            if (!list) { list = []; }
            this.mouseSync.connectUsers = list;
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
        updateUsers() {
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
                this.updateUsers()
            },
            deep: true,
        },
        "mouseSync.userMouse": {
            handler: function (nv, ov) {
                this.updateUsers()
            },
            deep: true,
        },
    }
}

export default {
    mixins: [baseMixin, mouseSyncMixin, connectTransferMixin],
    props:['class'],
    template: `
<div :class="pClass" @mousemove="mouseMove">
    <span v-for="v in mouseSync.userMouse"
          class="user-mouse"
          :style="{top: v.y + 'px', left: v.x + 'px'}">
        {{v.name}}
    </span>
    <slot />
</div>
`,
    data() {
        return {
            pClass:this.class
        }
    },
    created() { },
    methods: {
        async onConnectTransferReady(data) {
            this.mouseSyncInit(data.authInfo?.user, data.realtimeDb);
        },
        async onConnectionChanged(data) { this.setConnectUsers(data?.users); }, 
    },
}

