using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace streaming_be.Controllers
{
    [ApiController]
    [Route("metadata")]
    public class MetadataController : ControllerBase
    {
        private readonly string _metadataRoot = "metadata";

        [HttpGet]
        public IActionResult GetAllVideos()
        {
            var jsonFilePath = Path.Combine(_metadataRoot, "videos.json");

            if (!System.IO.File.Exists(jsonFilePath))
                return Ok(new List<object>());

            try
            {
                var json = System.IO.File.ReadAllText(jsonFilePath);

                var result = JsonSerializer.Deserialize<List<MetadataFileResponse>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return Ok(result ?? new List<MetadataFileResponse>());
            }
            catch (Exception ex)
            {
                // log ex if you have logging
                return StatusCode(500, "Failed to read videos.json");
            }
        }

        [HttpGet("{index}")]
        public IActionResult GetMetadata(int index)
        {
            var metadataPath = Path.Combine(_metadataRoot, index.ToString());
            if (!System.IO.File.Exists(metadataPath))
                metadataPath = Path.Combine(_metadataRoot, index + ".json");

            if (!System.IO.File.Exists(metadataPath))
                return NotFound();

            var content = System.IO.File.ReadAllText(metadataPath);
            return Content(content, "application/json");
        }
    }

    public class MetadataFileResponse
    {
        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("index")]
        public int Index { get; set; }

        [JsonPropertyName("streaming_url")]
        public string StreamingUrl { get; set; }   
    }
}
