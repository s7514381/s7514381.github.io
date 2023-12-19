import { baseMixin, connectTransferMixin } from '../vue-mixin.js'

export default {
    mixins: [baseMixin, connectTransferMixin],
    template: `
<video style="display:none" id="localVideo" autoplay playsinline></video>
<video id="remoteVideo" autoplay playsinline></video>
<button @click="startScreenSharing()">Share Screen</button>
`,
    data() {
        return {
            peerConnection: null,
        }
    },
    beforeCreate() {
    },
    created() {
    },
    mounted() {
        const configuration = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        }
        this.peerConnection = new RTCPeerConnection({ configuration: configuration, iceServers: [{ urls: 'stun:stun.l.google.com:11893' }] });
        this.remoteConnection = new RTCPeerConnection(configuration);

        // 設定遠端視訊流處理

        this.peerConnection.ontrack = function (event) {
            console.log(1, event)
            remoteStream = event.streams[0];

            const remoteVideo = document.getElementById('remoteVideo');
            remoteVideo.srcObject = remoteStream;
        }
        this.remoteConnection.ontrack = function (event) {
            console.log(3, event)
            remoteStream = event.streams[0];

            const remoteVideo = document.getElementById('remoteVideo');
            remoteVideo.srcObject = remoteStream;
        }

        this.peerConnection.onicecandidate = event => {
            if (event.candidate) {
                // 將 ICE 候選傳送給遠端
                console.log(2, event)
            }
        };
    },
    methods: {
        async startScreenSharing() {
            let $this = this;

            try {
                // 使用 navigator.mediaDevices 請求分享螢幕
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true }); //audio: true

                // 連接本地視訊流到本地視訊元素
                const localVideo = document.getElementById('localVideo');
                localVideo.srcObject = stream;

                $this.peerConnection.addStream(stream);

                let localStream = stream;

                // 添加本地視訊流至 Peer 連接
                localStream.getTracks().forEach(track => $this.peerConnection.addStream(track, localStream));

            } catch (err) {
                //console.error('Error accessing screen:', err);
            }
        },
        handleRemoteICECandidate(event) {
            const candidate = event.candidate;
        },
        handleRemoteStream(event) {
            remoteVideo.srcObject = event.stream;
        }
    },
    watch: {
    },
}

