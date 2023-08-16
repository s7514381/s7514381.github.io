import { baseMixin, connectTransferMixin } from '../vue-mixin.js'

export default {
    mixins: [baseMixin, connectTransferMixin],
    template: `
<video id="localVideo" autoplay playsinline></video>
<video id="remoteVideo" autoplay playsinline></video>
<button @click="startScreenSharing()">Share Screen</button>
`,
    data() {
        return {

        }
    },
    beforeCreate() {
    },
    created() {
    },
    mounted() {
        const servers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:11893' }
                // Add your TURN server here if needed
            ]
        };
        let peerConnection = new RTCPeerConnection(servers);

        // 設定遠端視訊流處理
        peerConnection.ontrack = event => {

            console.log(event)
            remoteStream = event.streams[0];

            remoteVideo.srcObject = remoteStream;
        };
    },
    methods: {
        async startScreenSharing() {
            try {
                // 使用 navigator.mediaDevices 請求分享螢幕
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true }); //audio: true

                // 連接本地視訊流到本地視訊元素
                const localVideo = document.getElementById('localVideo');
                localVideo.srcObject = stream;
                localStream = stream;

                // 創建 RTC Peer 連接
                createPeerConnection();

                // 添加本地視訊流至 Peer 連接
                localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            } catch (err) {
                //console.error('Error accessing screen:', err);
            }
        },
        createPeerConnection() {
            // 設定遠端視訊流處理
            peerConnection.ontrack = event => {
                remoteStream = event.streams[0];

                console.log(event)

                const remoteVideo = document.getElementById('remoteVideo');
                remoteVideo.srcObject = remoteStream;
            };

            // 處理 ICE 候選
            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    // 將 ICE 候選傳送給遠端
                }
            };
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

