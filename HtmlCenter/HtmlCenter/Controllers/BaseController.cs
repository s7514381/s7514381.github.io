using HtmlCenter.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using WebsiteBase.Library.Utility;
using static System.Net.WebRequestMethods;

namespace HtmlCenter.Controllers
{
    /// <summary>
    /// 基礎 Controller 類別
    /// </summary>
    public class BaseController : Controller
    {
        protected readonly IWebHostEnvironment _hostingEnvironment;
        protected readonly IConfiguration _configuration;
        protected readonly IViewRenderService _viewRenderService;
        protected ILogger _logger;

        protected string WebRootPath => _hostingEnvironment.WebRootPath;

        // 請將所以有要注入的參數整合進 BaseControllerArgument
        public BaseController(BaseControllerArgument argument)
        {
            _hostingEnvironment = argument.HostingEnvironment;
            _configuration = argument.Configuration;
            _viewRenderService = argument.ViewRenderService;
        }

        /// <summary>
        /// 當前的 Controller 名稱。
        /// </summary>
        public string CurrentController
        {
            get
            {
                return ControllerContext.RouteData.Values["controller"]?.ToString() ?? "";
            }
        }

        /// <summary>
        /// 當前的 Action 名稱。
        /// </summary>
        public string CurrentAction
        {
            get
            {
                return ControllerContext.RouteData.Values["action"]?.ToString() ?? "";
            }
        }

        /// <summary>
        /// 紀錄例外狀況與當下的參數。
        /// </summary>
        /// <param name="ex">發生的例外狀況</param>
        /// <param name="level">例外狀況的嚴重程度(若為 Critical 則忽略 Line Notify 發送限制)</param>
        protected void LogActionError(Exception ex, LogLevel level = LogLevel.Error)
        {
            _logger.Log(level, ex,
                "\r\n【請求路徑】：[{0}] {1}" +
                "\r\n【異常類型】：{2}" +
                "\r\n【異常訊息】：{3}" +
                "\r\n【參數】：{4}" +
                "\r\n【StackTrace】：{5}\r\n",
                Request.Method,
                Request.Path,
                ex.GetType().Name,
                ex.Message,
                Request.Method != "POST" ? "" :
                    JsonSerializer.Serialize(
                        Request.Form.Where(x => x.Key != "__RequestVerificationToken"),
                        new JsonSerializerOptions() { WriteIndented = true }),
                ex.StackTrace);
        }

        public string FormComponent(string formAction = "")
        {
            if (string.IsNullOrEmpty(formAction)) { formAction = CurrentAction; }
            return $"~/Views/Shared/FormComponents/{formAction}.cshtml";
        }

        public string ViewRenderResult(string? sAction = null, string? sController = null)
        {
            ViewBag.RenderController = sController ?? CurrentController;
            ViewBag.RenderAction = sAction ?? CurrentAction;

            return "Views/ViewRender/Index.cshtml";
        }

        public async Task RenderView(string renderController, string renderAction, ViewDataDictionary viewData)
        {
            string renderString = await _viewRenderService.RenderToStringAsync(ViewRenderResult(renderAction, renderController), viewData);

            string renderPath = _configuration.GetValue<string>("RenderPath");
            if (!string.IsNullOrEmpty(renderController) && renderController != "Home") { renderPath += $@"\{renderController.ToLower()}"; }

            if (!Directory.Exists(renderPath))
                Directory.CreateDirectory(renderPath);

            string path = $@"{renderPath}\index.htm";

            using (FileStream fs = System.IO.File.Create(path))
            {
                byte[] info = new UTF8Encoding(true).GetBytes(renderString);
                fs.Write(info, 0, info.Length);
            }
        }

        public List<ControllerAction> GetControllerActionList()
        {
            Assembly asm = Assembly.GetExecutingAssembly();
            var controlleractionlist = asm.GetTypes()
                    .Where(type => typeof(Controller).IsAssignableFrom(type))
                    .SelectMany(type => type.GetMethods(BindingFlags.Instance | BindingFlags.DeclaredOnly | BindingFlags.Public))
                    .Select(x => new ControllerAction
                    {
                        Controller = x.DeclaringType.Name,
                        Action = x.Name,
                        CustomAttributes = x.CustomAttributes.ToList(),
                    }).ToList();
            return controlleractionlist;
        }


    }

    /// <summary>
    /// BaseController 的依賴聚合類別，
    /// 以解決新增 BaseController 依賴項時需要修改每個子類別建構子的問題。
    /// </summary>
    public class BaseControllerArgument
    {
        public IWebHostEnvironment HostingEnvironment { get; set; }
        public IConfiguration Configuration { get; set; }
        public IViewRenderService ViewRenderService { get; set; }

        public BaseControllerArgument(
            IWebHostEnvironment hostingEnvironment,
            IConfiguration configuration,
            IViewRenderService viewRenderService)
        {
            HostingEnvironment = hostingEnvironment;
            Configuration = configuration;
            ViewRenderService = viewRenderService;
        }
    }
}
