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
    public class HomeController : BaseController
    {
        public HomeController(BaseControllerArgument argument, ILogger<HomeController> logger) : base(argument)
        {
            _logger = logger;

        }

        public async Task<IActionResult> Index()
        {
            await RenderView(CurrentController, CurrentAction, ViewData);

            return View(ViewRenderResult());
        }

        public async Task<IActionResult> UpdateRenderView() 
        {
            string formDirectory = @"C:\Users\s7514\source\repos\s7514381.github.io\HtmlCenter\HtmlCenter\wwwroot";
            string toDirectory = _configuration.GetValue<string>("RenderPath");
            CopyDirectory(formDirectory, toDirectory);

            List<ControllerAction> ControllerActionList = GetControllerActionList();
            var renderControllers = ControllerActionList.Where(x => x.Action == "Index").ToList();

            foreach (ControllerAction controllerAction in renderControllers) {
                string controllerName = controllerAction.Controller.Replace("Controller", "");
                await RenderView(controllerName, "Index", ViewData);
            }
            return RedirectToAction("Index");
        }

        public void CopyDirectory(string fromPath, string toPath) 
        {
            if (!Directory.Exists(toPath))
                Directory.CreateDirectory(toPath);

            string[] fileList = Directory.GetFiles(fromPath);
            foreach (string file in fileList)
            {
                FileInfo fi = new FileInfo(file);
                string destFileName = toPath + @"\" + fi.Name;
                FileInfo targetFile = new FileInfo(destFileName);

                if (!targetFile.Exists) { fi.CopyTo(destFileName); }
                else {
                    if (fi.LastWriteTime > targetFile.LastWriteTime) { 
                        targetFile.Delete();
                        fi.CopyTo(destFileName);
                    }
                }
            }

            string[] directories = Directory.GetDirectories(fromPath);
            foreach (string directorie in directories) 
            {
                CopyDirectory(directorie, toPath + directorie.Replace(fromPath, ""));
            }
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

    }
}