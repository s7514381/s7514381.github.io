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
    public class UnityWebGLController : HtmlContentController
    {
        public UnityWebGLController(BaseControllerArgument argument, ILogger<UnityWebGLController> logger) : base(argument, logger) { }

    }
}