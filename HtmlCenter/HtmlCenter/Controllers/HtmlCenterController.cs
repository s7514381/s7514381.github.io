using HtmlCenter.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.Json;
using System.IO;
using WebsiteBase.Library.Utility;
using Microsoft.Extensions.Primitives;
using System.Text;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace HtmlCenter.Controllers
{
    public class HtmlCenterController : BaseController
    {
        public HtmlCenterController(BaseControllerArgument argument, ILogger<HtmlCenterController> logger) : base(argument)
        {
            _logger = logger;
        }

        protected async Task RenderView(string renderController, string renderAction, ViewDataDictionary viewData)
        {          
            string renderString = await _viewRenderService.RenderToStringAsync(ViewRenderResult(renderAction, renderController), viewData);
            await WriteFile(renderController, renderString);
        }

        protected async Task WriteFile(string renderController, string renderString, string fileName = "")
        {
            string renderPath = RenderPath;

            if (!string.IsNullOrEmpty(renderController)) { renderPath += $@"\{renderController.ToLower()}"; }
            if (!string.IsNullOrEmpty(fileName)) { renderPath += $@"\{fileName}"; }

            if (!Directory.Exists(renderPath))
                Directory.CreateDirectory(renderPath);

            string path = $@"{renderPath}\index.htm";

            using (FileStream fs = System.IO.File.Create(path))
            {
                byte[] info = new UTF8Encoding(true).GetBytes(renderString);
                fs.Write(info, 0, info.Length);
            }
        }

        public async Task<IActionResult> UpdateRenderView() 
        {
            string formDirectory = $@"{RenderPath}\HtmlCenter\HtmlCenter\wwwroot";
            CopyDirectory(formDirectory, RenderPath);

            List<ControllerAction> ControllerActionList = GetHtmlContentControllerActionList();
            var renderControllers = ControllerActionList.Where(x => x.Action == "Index").ToList();

            foreach (ControllerAction controllerAction in renderControllers) {
                string controllerName = controllerAction.Controller.Replace("Controller", "");
                string renderString = await _viewRenderService.RenderToStringAsync(ViewRenderResult("Index", controllerName), ViewData);
                await WriteFile(controllerName, renderString);

                //首頁另外做
                if (controllerName == "Home")
                    await WriteFile("", renderString);

                string htmlContent = HtmlContentString(controllerName);
                await WriteFile(controllerName, htmlContent, "htmlContent");
            }
            return RedirectToAction("Index", "Home");
        }

        protected void CopyDirectory(string fromPath, string toPath) 
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


    }
}