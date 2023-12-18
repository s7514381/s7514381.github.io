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
    public class NewsController : HtmlContentController
    {
        public NewsController(BaseControllerArgument argument, ILogger<NewsController> logger) : base(argument, logger) { }

    }
}