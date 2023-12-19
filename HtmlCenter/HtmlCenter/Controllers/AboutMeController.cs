﻿using HtmlCenter.Models;
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
    public class AboutMeController : HtmlContentController
    {
        public AboutMeController(BaseControllerArgument argument, ILogger<AboutMeController> logger) : base(argument, logger) { }


    }
}