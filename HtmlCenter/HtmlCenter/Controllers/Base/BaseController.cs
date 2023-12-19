using HtmlCenter.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
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
    public abstract class BaseController : Controller
    {
        protected readonly IWebHostEnvironment _hostingEnvironment;
        protected readonly IConfiguration _configuration;
        protected readonly IViewRenderService _viewRenderService;
        private readonly IFileProvider _fileProvider;
        protected ILogger _logger;

        public string RenderPath;
        protected string WebRootPath => _hostingEnvironment.WebRootPath;

        // 請將所以有要注入的參數整合進 BaseControllerArgument
        public BaseController(BaseControllerArgument argument)
        {
            _hostingEnvironment = argument.HostingEnvironment;
            _configuration = argument.Configuration;
            _viewRenderService = argument.ViewRenderService;
            _fileProvider = argument.FileProvider;
            RenderPath = _configuration.GetValue<string>("RenderPath");
        }

        /// <summary>
        /// 當前的 Controller 名稱。
        /// </summary>
        protected string CurrentController
        {
            get
            {
                return ControllerContext.RouteData.Values["controller"]?.ToString() ?? "";
            }
        }

        /// <summary>
        /// 當前的 Action 名稱。
        /// </summary>
        protected string CurrentAction
        {
            get
            {
                return ControllerContext.RouteData.Values["action"]?.ToString() ?? "";
            }
        }

        protected string HtmlContentString(string controllerName = "", string actionName = "")
        {
            if (string.IsNullOrEmpty(controllerName)) { controllerName = CurrentController; }

            if (string.IsNullOrEmpty(actionName)) { actionName = "Index"; }
            string path = Path.Combine("Views", controllerName, $"{actionName}.cshtml");
            IFileInfo fileInfo = _fileProvider.GetFileInfo(path);

            if (!fileInfo.Exists) { return ""; }

            using (StreamReader reader = new StreamReader(fileInfo.CreateReadStream()))
            {
                string content = reader.ReadToEnd();
                return content;
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

        protected string FormComponent(string formAction = "")
        {
            if (string.IsNullOrEmpty(formAction)) { formAction = CurrentAction; }
            return $"~/Views/Shared/FormComponents/{formAction}.cshtml";
        }

        protected string ViewRenderResult(string? sAction = null, string? sController = null)
        {
            ViewBag.RenderController = sController ?? CurrentController;
            ViewBag.RenderAction = sAction ?? CurrentAction;

            return "Views/ViewRender/Index.cshtml";
        }
        //BindingFlags.Instance | BindingFlags.DeclaredOnly | BindingFlags.Public
        protected List<ControllerAction> GetControllerActionList()
        {
            Assembly asm = Assembly.GetExecutingAssembly();
            var controlleractionlist = asm.GetTypes()
                    .Where(type => typeof(Controller).IsAssignableFrom(type))
                    .SelectMany(type => type.GetMethods(BindingFlags.Instance | BindingFlags.FlattenHierarchy | BindingFlags.Public))
                    .Where(method => method.GetCustomAttributes(typeof(HttpGetAttribute), true).Any()) // 添加對 HttpGet 的條件
                    .Select(x => new ControllerAction
                    {
                        Controller = x.DeclaringType?.Name,
                        Action = x.Name,
                        CustomAttributes = x.CustomAttributes.ToList(),
                    }).ToList();
            return controlleractionlist;
        }


        protected List<ControllerAction> GetHtmlContentControllerActionList()
        {
            Assembly asm = Assembly.GetExecutingAssembly();

            var controlleractionlist = asm.GetTypes()
                    .Where(type => typeof(HtmlContentController).IsAssignableFrom(type))
                    .Select(x => new ControllerAction
                    {
                        Controller = x.Name,
                        Action = "Index",
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
        public IFileProvider FileProvider;

        public BaseControllerArgument(
            IWebHostEnvironment hostingEnvironment,
            IConfiguration configuration,
            IViewRenderService viewRenderService,
            IFileProvider fileProvider)
        {
            HostingEnvironment = hostingEnvironment;
            Configuration = configuration;
            ViewRenderService = viewRenderService;
            FileProvider = fileProvider;
        }
    }
}
