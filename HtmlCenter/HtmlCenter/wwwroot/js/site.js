
function DeepClone(model) {
    return JSON.parse(JSON.stringify(model));
}

//youtube
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

//chatGPT是鬼吧，這有夠猛
function onYouTubeReady() {
    return new Promise((resolve) => {
        function onYouTubeIframeAPIReady() {
            resolve(true);
        }
        // 確認 YouTube API script 是否已載入
        if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') {
            // 若已載入，直接呼叫 onYouTubeIframeAPIReady，因為它不會自動被觸發
            onYouTubeIframeAPIReady();
        } else {
            // 若尚未載入，設定 window.onYouTubeIframeAPIReady 為我們的解析函式
            window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
        }
    });
}