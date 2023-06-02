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
    public class DynamicFormController : BaseController
    {
        public DynamicFormController(BaseControllerArgument argument, ILogger<DynamicFormController> logger): base(argument)
        {
            _logger = logger;
        }

        public async Task<IActionResult> Index()
        {
            return View(ViewRenderResult());
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

    }
}