export default {
    mixins: [connectMixin, mouseSyncMixin],
    data() {
        return {
        }
    },
    async created() {
        let $this = this;

        let authUser = await $this.getAuthUser();
        $this.mouseSync.realtimeDb = await this.getRealtimeDb();
        $this.mouseSync.ready = true;
        $this.mouseSync.userId = authUser.uid;
        $this.mouseSync.userName = authUser.displayName;
    },
    methods: {

    },
}