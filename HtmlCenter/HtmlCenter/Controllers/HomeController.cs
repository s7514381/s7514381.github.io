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
        public HomeController(BaseControllerArgument argument, ILogger<HomeController> logger): base(argument)
        {
            _logger = logger;

        }

        public string ViewRenderResult(string? sAction = null, string ? sController = null) 
        {
            ViewBag.RenderController = sController ?? CurrentController;
            ViewBag.RenderAction = sAction ?? CurrentAction;

            return "Views/ViewRender/Index.cshtml";
        }

        public async Task<IActionResult> Index()
        {
            await RenderView(CurrentController, CurrentAction);

            return View(ViewRenderResult());
        }

        public async Task RenderView(string renderController, string renderAction) 
        {
            string renderString = await _viewRenderService.RenderToStringAsync(ViewRenderResult(renderAction, renderController), 
                new { RenderController = renderController, RenderAction = renderAction });

            string path = $@"{_configuration.GetValue<string>("RenderPath")}\index.htm";

            using (FileStream fs = System.IO.File.Create(path))
            {
                byte[] info = new UTF8Encoding(true).GetBytes(renderString);
                fs.Write(info, 0, info.Length);
            }
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public async Task HandleAsync(HttpContext context)
        {
            HttpRequest request = context.Request;
            context.Response.Headers.Add("Access-Control-Allow-Origin", "*");


            // Check URL parameters for "message" field
            string message = request.Query["message"];

            // If there's a body, parse it as JSON and check for "message" field.
            using TextReader reader = new StreamReader(request.Body);
            string text = await reader.ReadToEndAsync();
            if (text.Length > 0)
            {
                try
                {
                    JsonElement json = JsonSerializer.Deserialize<JsonElement>(text);
                    if (json.TryGetProperty("message", out JsonElement messageElement) &&
                        messageElement.ValueKind == JsonValueKind.String)
                    {
                        message = messageElement.GetString();
                    }
                }
                catch (JsonException parseException)
                {
                    _logger.LogError(parseException, "Error parsing JSON request");
                }
            }

            await context.Response.WriteAsync(message ?? "Hello Worldqq!");
        }


    }
}