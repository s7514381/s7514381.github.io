import { baseMixin, connectTransferMixin } from '../vue-mixin.js'

export default {
    //connectTransferMixin傳了'authInfo', 'connection', 'realtimeDb', 'firestore'這幾個進來
    mixins: [baseMixin, connectTransferMixin],
    template: `
<div class="chat card h-100">
    <div class="row h-100">
        <div class="col h-100">
            <div class="h-100 d-flex" style="flex-direction: column-reverse;">
                <input class="form-control message-input" placeholder="能不能講一下話阿" @keyup.enter="chatInput" />

                <div v-show="loading" class="fill-parent flex-item-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>

                <div v-show="!loading" ref="chatBody" class="chat-body" style="overflow-y: scroll;" @scroll="handleScroll">
                    <div v-for="(v, i) in content"
                            class="d-flex message push-up"
                            :class="{ 'self': v.self, 'pt-2': i > 0 }">
                        <div class="message-body">
                            {{v.content}}
                        </div>
                    </div>
                </div>

                <div v-show="!isTrack" style="position: absolute; top: 80%; left: 50%;">
                    <div class="keepTrack" @click="keepTrack">
                        繼續捲動
                    </div>
                </div>

            </div>
        </div>
    </div>
</div>
`,
    data() {
        return {
            isTrack: true,
            content: [],
            loading: true,
            currentScrollTop: null,
            scrollBottom: null,
        }
    },
    created() {
        
    },
    mounted() {
        let body = this.$refs.chatBody;
        body.addEventListener("scroll", this.handleScroll);
    },
    methods: {
        async onFirestoreChanged(data) {
            let $this = this;
            let { dbSnapshot } = data;

            let cnt = 0;
            let limitCount = 20;
            dbSnapshot('Chat', limitCount, true, (doc) => {
                let isSelf = doc.uid == $this.authInfo.user.uid;
                doc["self"] = isSelf;
                $this.content.push(doc);

                cnt++; if (cnt == limitCount) { $this.loading = false; }
            })
        }, 
        async chatInput(e) {
            let { dbInsert } = this.firestore;
            if (e.target.value == '') { return; }

            dbInsert("Chat", { uid: this.authInfo.user.uid, content: e.target.value });
            e.target.value = '';
        },
        handleScroll(e) {
            if (this.isTrack) {
                //往上移動則不追蹤最新對話
                if (e.target.scrollTop < this.currentScrollTop) { this.isTrack = false; }
            }
            else { if (e.target.scrollTop >= this.scrollBottom) { this.isTrack = true; } }

            this.currentScrollTop = e.target.scrollTop;
        },
        keepTrack() {
            let body = this.$refs.chatBody;
            body.scrollTo(0, body.scrollHeight);
            this.scrollBottom = body.scrollTop;
        },
    },
    watch: {
        content: {
            handler(nv, ov) {
                let $this = this;
                let body = $this.$refs.chatBody;

                $this.$nextTick(function () {
                    if ($this.isTrack) { $this.keepTrack() }
                });
            },
            deep: true,
        },
    },
}

//<div class="col-3 pe-0 border-end">
//    <div class="p-2" style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
//        這邊放好友名單
//    </div>
//</div>