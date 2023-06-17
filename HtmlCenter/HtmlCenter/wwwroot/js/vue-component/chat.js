import { baseMixin, mouseSyncMixin } from '../vue-mixin.js'

export default {
    mixins: [baseMixin, mouseSyncMixin],
    props: ['authInfo','connection'],
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
        await this.mouseSyncInit(this.authInfo?.user);
    },
    methods: { },
    watch: {
        "authInfo.ready": async function (nv, ov) {
            if (nv) {
                await this.mouseSyncInit(this.authInfo?.user);
            }
        },
        "connection": {
            handler: function (nv, ov) {
                let $this = this;

                if (nv.users.length > 0) {
                    $this.mouseSync.connectUsers = nv.users;
                }
            },
            deep: true
        },
    }
}