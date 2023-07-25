import { baseMixin, connectTransferMixin } from '../vue-mixin.js'
import jsMouseSync from './mouse-sync.js'

export default {
    mixins: [baseMixin, connectTransferMixin],
    components: {
        'v-mouse-sync': jsMouseSync,
    },
    template: `
<v-mouse-sync :authInfo="authInfo" :connection="connection" :realtimeDb="realtimeDb">

    <div class="chat card fill-parent">

        <div class="row" style="height: 100%;">
            <div class="col-auto pe-0 border-end">
                <div class="p-2">這邊放好友名單</div>
                </div>
            <div class="col ps-0">
                <div class="" style="height: 100%;display: flex; flex-direction: column-reverse;">
                    <input class="form-control message-input" placeholder="能不能講一下話阿" @change="qq2" />
                    
                    <div class="chat-body">

                        

                    </div>
                </div>
            </div>
        </div>
    </div>

</v-mouse-sync>
`,
    data() {
        return {
        }
    },
    async created() {
    },
    methods: {
        qq2: function (event) {
            console.log(1)
        }
    },
}

