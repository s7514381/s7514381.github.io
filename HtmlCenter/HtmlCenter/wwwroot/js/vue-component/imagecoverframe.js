export const component = {
    mixins: [baseMixin],
    data() {
        return {
            pageTitle: '圖片框選',
            ImageUrl: null,
            PreviewSrc: '',
            OptionList: [],
            currentImageCover: null,
            CorrectOptionId: '',
        }
    },
    created() {
    },
    methods: {
        setImage: async function (inputDom) {
            let file;
            if (inputDom.files.length > 0) { file = inputDom.files[0]; }

            var reader = new FileReader();
            reader.onload = function (e) {
                thisApp.ImageUrl = file;
                thisApp.PreviewSrc = e.target.result;
                thisApp.OptionList = []
            };
            reader.readAsDataURL(file);
        },

        createImageCover: function (e) {
            e.preventDefault();
            if (e.target.nodeName != "IMG") { return false }

            let item = {};
            item.id = thisApp.newGuid();
            item.AxisX = e.offsetX
            item.AxisY = e.offsetY

            thisApp.currentImageCover = item
            thisApp.OptionList.push(item)
        },

        changeImageCover: function (e) {
            if (e.target.nodeName != "IMG") { return false }
            let item = thisApp.currentImageCover

            if (item) {
                if (e.offsetX >= item.AxisX) {
                    item.Width = e.offsetX - item.AxisX
                    if (item.IsReverseX) { item.IsReverseX = false; }
                }
                else {
                    item.Width = item.AxisX - e.offsetX
                    if (!item.IsReverseX) { item.IsReverseX = true; }
                }

                if (e.offsetY >= item.AxisY) {
                    item.Height = e.offsetY - item.AxisY
                    if (item.IsReverseY) { item.IsReverseY = false; }
                }
                else {
                    item.Height = item.AxisY - e.offsetY
                    if (!item.IsReverseY) { item.IsReverseY = true; }
                }
            }
        },

        endImageCover: function (e) {
            if (e.target.nodeName != "IMG") { return false }

            thisApp.currentImageCover = null;
        },
        deleteItem: function (list, item) {
            list.splice(list.indexOf(item), 1);

            list.forEach(function (v, i) {
                v.Sequence = i
            })
        },
    },
}