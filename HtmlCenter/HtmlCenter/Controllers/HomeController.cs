﻿using HtmlCenter.Models;
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
        public HomeController(BaseControllerArgument argument, ILogger<HomeController> logger): base(argument)
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
            List<ControllerAction> ControllerActionList = GetControllerActionList();
            var renderControllers = ControllerActionList.Where(x => x.Action == "Index").ToList();

            foreach (ControllerAction controllerAction in renderControllers) {
                string controllerName = controllerAction.Controller.Replace("Controller", "");
                await RenderView(controllerName, "Index", ViewData);
            }
            return RedirectToAction("Index");
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

    }
}