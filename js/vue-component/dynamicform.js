let thisApp;

export default {
    mixins: [baseMixin, dragMixin],
    components: {
        'draggable': vuedraggable,
    },
    data() {
        return {
            pageTitle: '動態表單',
            layoutLoading: true,
            fieldLayout: [],
            RowNumber: 8,
            ColumnNumber: 12,
            ColumnWidth: 4,
            StatusItems: [],
            fieldTypeList: [],
            movedEmptyList: [],
            movedIndex: null,
            dragEvent: null,
            dragModel: null,
            currentFieldModel: {},
            FieldList: [],
        }
    },
    beforeCreate() {
        thisApp = this;
    },
    created() {
        let emptyRegionNumber = thisApp.emptyRegionNumber;
        for (let i = 0; i < emptyRegionNumber; i++) {
            thisApp.fieldLayout.push(thisApp.newEmptyRegion());
        }

        thisApp.fieldTypeList = [{ Text: '文字輸入', Value: 1 }, { Text: '單一選擇', Value: 3 }]
        thisApp.fieldTypeList.forEach(function (v, i) {
            v["SignColorClass"] = thisApp.getSignColorClass(v.Value)
        })
    },
    mounted() {
    },
    computed: {
        emptyRegionNumber() {
            return thisApp.ColumnNumber * thisApp.RowNumber;
        },
    },
    methods: {
        fieldRemove: async function (element) {
            if (await confirm("是否確認要刪除欄位?")) { thisApp.layoutRemove(element) }
        },
        createOption: async function (field) {
            let newOption = {};
            //await axios.post(`/DynamicFormFieldOption/GetModel`).then(function (res) {
            //    newOption = res.data;
            //    newOption.DynamicFormFieldId = field.DynamicFormFieldId;

            //    field.OptionList.push(newOption);
            //    field.OptionList.forEach(function (v, i) { v.Sequence = i; })
            //});

            newOption.DynamicFormFieldId = thisApp.newGuid();

            field.OptionList.push(newOption);
            field.OptionList.forEach(function (v, i) { v.Sequence = i; })
        },
        addLayoutRow: function () {
            thisApp.RowNumber++;
            for (let i = 1; i <= thisApp.ColumnNumber; i++) {
                thisApp.fieldLayout.push(thisApp.newEmptyRegion())
            }
        },
        newEmptyRegion: function () {
            return { ColumnWidth: 1, MoveCover: false, emptyRegion: true, Placeholder: false }
        },
        layoutAdd: function (element, newIndex) {
            for (let i = 0; i < element.ColumnWidth; i++) { thisApp.fieldLayout.splice(newIndex, 1); }
            thisApp.fieldLayout.splice(newIndex, 0, element);
            thisApp.resetLayoutIndex();

            thisApp.FieldList.push(element)
        },
        layoutRemove: function (element) {
            let elementIndex = thisApp.fieldLayout.indexOf(element)

            thisApp.deleteItem(thisApp.fieldLayout, element);
            for (let i = element.ColumnWidth; i > 0; i--) {
                thisApp.fieldLayout.splice(elementIndex, 0, thisApp.newEmptyRegion());
            }
            thisApp.resetLayoutIndex();
            thisApp.deleteItem(thisApp.FieldList, element)
        },
        layoutStart: function (customEvent) {
            let e = customEvent;

            thisApp.dragModel = e.item.__draggable_context.element;
            thisApp.layoutRemove(thisApp.fieldLayout[e.oldIndex])
            thisApp.fieldLayout[e.oldIndex].Placeholder = true;
        },
        layoutEnd: async function (customEvent) {
            let e = customEvent;

            thisApp.clearMovedEmptyList();
            thisApp.fieldLayout[e.oldIndex].Placeholder = false;

            if (!await thisApp.checkPlacePath(thisApp.dragModel.ColumnWidth, thisApp.movedIndex)) {
                thisApp.layoutAdd(thisApp.dragModel, e.oldIndex);
                return false;
            }
            thisApp.layoutAdd(thisApp.dragModel, thisApp.movedIndex);
            thisApp.dragEvent = null;
        },
        layoutMove: function (e) {
            if (thisApp.movedIndex != e.relatedContext.index) {
                thisApp.clearMovedEmptyList();
                thisApp.dragEvent = e;
                thisApp.movedIndex = e.relatedContext.index;
                thisApp.dragMoveCover(e.draggedContext.element.ColumnWidth, thisApp.movedIndex);
            }
            return false;
        },
        cloneEnd: async function (e) {
            thisApp.clearMovedEmptyList();
            if (!e.originalEvent.target.classList.contains("layoutEmpty")) { return false; }
            if (!thisApp.dragEvent || !thisApp.dragEvent.to.classList.contains("FormLayout")) { return false; }
            if (!await thisApp.checkPlacePath(thisApp.ColumnWidth, thisApp.movedIndex)) { return false; }

            let fieldTypeElement = thisApp.dragEvent.draggedContext.element;
            let cloneElement = await thisApp.createField(fieldTypeElement);

            thisApp.layoutAdd(cloneElement, thisApp.movedIndex);
            thisApp.dragEvent = null;
            thisApp.modalTrigger(cloneElement);
        },
        cloneMove: function (e) {
            if (thisApp.movedIndex != e.relatedContext.index)
                if (e.to.classList.contains("FormLayout")) {
                    thisApp.clearMovedEmptyList();
                    thisApp.dragEvent = e;
                    thisApp.movedIndex = e.relatedContext.index;
                    thisApp.dragMoveCover(thisApp.ColumnWidth, thisApp.movedIndex);
                }

            return false;
        },
        dragMoveCover: function (columnWidth, index) {
            for (let i = 0; i < columnWidth; i++) {
                let emptyIndex = index + i;
                if (thisApp.fieldLayout.length <= emptyIndex) { continue; }
                thisApp.fieldLayout[emptyIndex].MoveCover = true;
            }
        },
        checkPlacePath: async function (columnWidth, index) {
            for (let i = 0; i < columnWidth; i++) {
                let pathRegion = thisApp.fieldLayout[index + i];
                if (!pathRegion) { thisApp.addLayoutRow(); return thisApp.checkPlacePath(columnWidth, index); }
                if (!pathRegion.emptyRegion) { alert("路徑上有其他欄位，請重新確認。"); return false; }
            }
            return true;
        },
        clearMovedEmptyList: function () {
            thisApp.fieldLayout.filter(x => x.MoveCover).forEach(function (v, i) { v.MoveCover = false; })
        },
        resetLayoutIndex: function () {
            thisApp.fieldLayout.forEach(function (v, i) {
                if (v.DynamicFormFieldId) { v.LayoutIndex = i; }
            })
        },
        createField: async function (typeElement) {
            let result = {};

            result.DynamicFormFieldId = thisApp.newGuid()
            result.Type = typeElement.Value;
            result.DynamicFormId = thisApp.newGuid()
            result.SignColorClass = thisApp.getSignColorClass(result.Type)
            result.Placeholder = typeElement.Text;
            result.ColumnWidth = thisApp.ColumnWidth;

            switch (typeElement.Value) {
                case 3:
                case 4:
                    result.HasOption = true;
                    result.OptionList = [];
                    break;
            }

            return result;
        },
        setChildId: function (model, field) {
            return model.DynamicFormId + "_" + field;
        },
        deleteItem: function (list, item) {
            list.splice(list.indexOf(item), 1);
        },
        modalTrigger: function (element) {
            thisApp.currentFieldModel = DeepClone(element);
            this.$refs.modalTrigger.click();
        },
        modalSave: function (element) {
            let origin = thisApp.FieldList.filter(x => x.DynamicFormFieldId == element.DynamicFormFieldId)[0];
            let modelIndex = thisApp.FieldList.indexOf(origin)
            thisApp.FieldList[modelIndex] = element

            thisApp.fieldLayout[element.LayoutIndex] = element
            this.$refs.modalTrigger.click();
        },
        getSignColorClass: function (fieldType) {
            let prefix = "sign-", color;
            switch (Number(fieldType)) {
                default:
                case 1:
                    color = "blue"; break;
                case 2:
                    color = "green"; break;
                case 3:
                    color = "red"; break;
                case 4:
                    color = "yellow"; break;
            }
            return prefix + color;
        },
    },
    watch: {
        model(nv, ov) {

            },
        fieldTypeList(nv, ov) {
            thisApp.fieldLayout.forEach(function (v, i) {
                let type = thisApp.fieldTypeList.filter(x => x.Value == v.Type)[0];
                if (type) {
                    v.SignColorClass = type.SignColorClass;
                    v.Placeholder = type.Text;
                }
            })
            thisApp.layoutLoading = false;
        },
    }
}