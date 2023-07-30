import { baseMixin, connectTransferMixin } from '../vue-mixin.js'

export default {
    mixins: [baseMixin, connectTransferMixin],
    template: `
<div class="mb-2">
    <input ref="videoUrlInput" class="form-control rounded-pill" placeholder="請輸入影片網址或影片代號" @keyup.enter="videoUrlInput" />
</div>
<div class="container-16_9">
    <div class="responsive-element">
        <div :id="playerId" class='ytPlayer'></div>
    </div>
</div>

`,
    data() {
        return {
            playerId: 'player',
            loading: false,
            ytPlayer: null,
        }
    },
    beforeCreate() {
    },
    created() {
    },
    mounted() {
        
    },
    methods: {
        videoUrlInput(e) {
            let $this = this;
            let value = e.target.value;
            if (!value) { return; }
            if (!$this.loading) { return; }

            let { setRef } = this.realtimeDb;
            let videoParam = $this.getVideoParam(value);
            let videoId = videoParam.videoId;

            setRef(`movie/player`, {
                videoId: videoId,
            })
            e.target.value = '';
        },
        async onConnectTransferReady(lib) {
            let $this = this;
            let { dbConnection } = lib.realtimeDb;

            dbConnection('movie', null, (snapshot) => {
                //onChildAdded 新增時觸發
                let mode = snapshot.key;
                let childData = snapshot.val();
                $this.handlePlayerData(mode, childData);
            }, null, (snapshot) => {
                //onChildChanged 更新時觸發
                let mode = snapshot.key;
                let childData = snapshot.val();
                $this.handlePlayerData(mode, childData);    

                
            })
        },
        handlePlayerData(mode, childData) {
            let $this = this;

            $this.$nextTick(function () {
                switch (mode) {
                    case "player":
                        if ($this.ytPlayer == null) {
                            let ytSetting = $this.setDefaultSetting({ videoId: childData.videoId })
                            $this.ytPlayer = new YT.Player($this.playerId, ytSetting);
                        }
                        else { $this.ytPlayer.loadVideoById(childData.videoId); }
                        console.log($this.ytPlayer)
                        break;
                    case "onPlayerStateChange":
                        //這邊的狀態屬於操作介面觸發，所以操作本人不需接收
                        //console.log(childData.visitId == this.authInfo.visitId)
                        //自己發出的訊號自己不需接收
                        if (childData.visitId == this.authInfo.visitId) { return; }
                        //緩衝時不接收訊號
                        if ($this.ytPlayer.getPlayerState() == 3) { return; }
                        
                        if ($this.ytPlayer.getPlayerState() != childData.state) {
                            switch (childData.state) {
                                case 1:
                                    $this.ytPlayer.playVideo(); break;
                                case 2:
                                    $this.ytPlayer.pauseVideo(); break;
                            }
                            $this.ytPlayer.seekTo(childData.currentTime, false);
                        }

                        break;
                }
            });
        },
        async onYoutubeChanged(lib) {
            let $this = this;

            $this.$nextTick(function () {
                $this.loading = true;
            });
        },
        onPlayerReady(e) { },
        onPlayerStateChange(e) {
            let { setRef } = this.realtimeDb;

            //被操作者的訊號不再發出
            setRef(`movie/onPlayerStateChange`, {
                visitId: this.authInfo.visitId,
                state: e.data,
                currentTime: this.ytPlayer.getCurrentTime(),
            })
        },
        onPlayerError(e) {
            console.log(e)
        },
        setDefaultSetting(obj) {
            if (!obj.events) {
                obj.events = {
                    'onReady': this.onPlayerReady,
                    'onStateChange': this.onPlayerStateChange,
                    'onError': this.onPlayerError
                };
            }
            return this.youtube.setDefaultSetting(obj);
        },
        getVideoParam(input) {
            let value = input;
            let result = {};
            let videoId = '';
            let t = null;

            if (value.indexOf('http') > -1) {
                const url = new URL(value);

                if (url.host == 'youtu.be') { videoId = url.pathname.replace('/', '') }
                switch (url.host) {
                    case "youtu.be":
                        videoId = url.pathname.replace('/', '');
                        break;
                    case "www.youtube.com":
                        videoId = url.searchParams.get('v');
                        break;
                }
                t = url.searchParams.get('t');
            }
            else { videoId = value; }

            result = { videoId: videoId, t: t };
            return result;
        },
    },
    watch: {
    },
}

