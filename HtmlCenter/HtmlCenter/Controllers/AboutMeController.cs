using HtmlCenter.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.Json;
using System.IO;
using WebsiteBase.Library.Utility;
using Microsoft.Extensions.Primitives;
using System.Text;
using Microsoft.Extensions.FileProviders;

namespace HtmlCenter.Controllers
{
    public class AboutMeController : BaseController
    {
        private readonly IFileProvider _fileProvider;

        public AboutMeController(BaseControllerArgument argument
            , ILogger<AboutMeController> logger
            , IFileProvider fileProvider
            ) : base(argument)
        {
            _logger = logger;
            _fileProvider = fileProvider;
        }

        public async Task<IActionResult> Index()
        {
            return View(ViewRenderResult());
        }

        public async Task<IActionResult> test()
        {
            return View();
        }

        [HttpGet]
        public IActionResult GetIndexContent()
        {
            string path = Path.Combine("Views", "AboutMe", "Index.cshtml");
            IFileInfo fileInfo = _fileProvider.GetFileInfo(path);

            if (!fileInfo.Exists)
            {
                return NotFound();
            }

            using (StreamReader reader = new StreamReader(fileInfo.CreateReadStream()))
            {
                string content = reader.ReadToEnd();
                return Json(content);
            }
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

    }
}