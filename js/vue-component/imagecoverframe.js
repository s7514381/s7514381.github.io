import { baseMixin } from '../vue-mixin.js'

export default {
    mixins: [baseMixin],
    data() {
        return {
            ImageUrl: null,
            PreviewSrc: '',
            OptionList: [],
            currentImageCover: null,
            CorrectOptionId: '',
        }
    },
    beforeCreate() {
    },
    created() {

    },
    methods: {
        setImage: async function (inputDom) {
            let $this = this
            let file;
            if (inputDom.files.length > 0) { file = inputDom.files[0]; }

            var reader = new FileReader();
            reader.onload = function (e) {
                $this.ImageUrl = file;
                $this.PreviewSrc = e.target.result;
                $this.OptionList = []
            };
            reader.readAsDataURL(file);
        },
        createImageCover: function (e) {
            e.preventDefault();
            if (e.target.nodeName != "IMG") { return false }

            let item = {};
            item.id = this.newGuid();
            item.AxisX = e.offsetX
            item.AxisY = e.offsetY

            this.currentImageCover = item
            this.OptionList.push(item)
        },
        changeImageCover: function (e) {
            if (e.target.nodeName != "IMG") { return false }
            let item = this.currentImageCover

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

            this.currentImageCover = null;
        },
        deleteItem: function (list, item) {
            list.splice(list.indexOf(item), 1);

            list.forEach(function (v, i) {
                v.Sequence = i
            })
        },
    },
}