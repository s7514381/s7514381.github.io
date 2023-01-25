using System.ComponentModel.DataAnnotations;

namespace HtmlCenter.Models.Enums
{
    public enum EDynamicFormFieldType
    {
        [Display(Name = "文字輸入")]
        Input = 1,

        [Display(Name = "多行輸入")]
        Textarea = 2,

        [Display(Name = "單一選擇")]
        Select = 3,

        [Display(Name = "多重選擇")]
        MultiSelect = 4,
    }
}