using HtmlCenter.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.Json;
using System.IO;
using WebsiteBase.Library.Utility;
using Microsoft.Extensions.Primitives;
using System.Text;

namespace HtmlCenter.Controllers
{
    public class NewsController : BaseController
    {
        public NewsController(BaseControllerArgument argument, ILogger<NewsController> logger): base(argument)
        {
            _logger = logger;

        }

        public IActionResult Index()
        {
            return View(ViewRenderResult());
        }

        public IActionResult HtmlContent()
        {
            return Json(HtmlContentString());
        }


    }
}