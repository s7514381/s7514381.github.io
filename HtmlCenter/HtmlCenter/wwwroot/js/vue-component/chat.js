import { baseMixin, mouseSyncMixin } from '../vue-mixin.js'

export default {
    mixins: [baseMixin, mouseSyncMixin],
    props: ['authInfo', 'connection', 'realtimeDb'],
    template: `
<div class="fill-parent card" @mousemove="mouseMove">
    <span v-for="v in mouseSync.userMouse"
          class="user-mouse"
          style="position:fixed; z-index:1"
          :style="{top: v.y + 'px', left: v.x + 'px'}">
        {{v.name}}
    </span>
</div>
`,
    data() {
        return {
        }
    },
    async created() {
        this.setMouseSync();

        let users = this.connection?.users;
        if (users && users.length > 0) 
            this.mouseSync.connectUsers = users;
        
    },
    methods: {
        setMouseSync() {
            this.mouseSyncInit(this.authInfo?.user, this.realtimeDb);
        },
    },
    watch: {
        "authInfo.ready": async function (nv, ov) {
            if (nv) { this.setMouseSync(); }
        },
        "connection": {
            handler: function (nv, ov) {
                if (nv.users.length > 0) 
                    this.mouseSync.connectUsers = nv.users;
            },
            deep: true
        },
        "realtimeDb": {
            handler: async function (nv, ov) {
                if (nv) { this.setMouseSync(); }
            },
        },
    }
}