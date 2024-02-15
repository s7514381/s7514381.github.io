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
    public class HomeController : HtmlContentController
    {
        public HomeController(BaseControllerArgument argument, ILogger<HomeController> logger) : base(argument, logger) {  }

        public async Task qq()
        {
            using (HttpClient client = new HttpClient())
            {
                string apiUrl = $@"https://rent.591.com.tw/";
                //
                // string apiUrl = $@"https://rent.591.com.tw/home/search/rsList?is_format_data=1&is_new_list=1&type=1&rentprice=7000,12000&section=3,2,6,5,7,1,4&searchtype=1&order=posttime&orderType=desc&multiNotice=all_sex,boy&showMore=1&kind=2&area=7,&shType=host&firstRow=0&totalRows=35&region=1&recom_community=1";

                HttpResponseMessage response = await client.GetAsync(apiUrl);

                if (response.IsSuccessStatusCode)
                {
                    string content = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"POST 請求成功:\n{content}");

                    //foreach (var header in response.Headers)
                    //{
                    //    if (header.Key == "Set-Cookie")
                    //    {
                    //        foreach (var value in header.Value)
                    //            sessionId = value.Split(';')?[0]?.Split('=')?[1];
                    //    }
                    //}
                }
            }
        }

    }
}