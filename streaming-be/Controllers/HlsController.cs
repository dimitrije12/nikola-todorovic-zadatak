using Microsoft.AspNetCore.Mvc;

namespace streaming_be.Controllers
{
    [ApiController]
    [Route("hls/{index}")]
    public class HlsController : ControllerBase
    {
        private readonly string _hlsRoot = "hls-output"; // Fajl gde su videi

        [HttpGet("playlist.m3u8")]
        public IActionResult GetPlaylist(int index)
        {
            var playlistPath = Path.Combine(_hlsRoot, index.ToString(), "playlist.m3u8");
            if (!System.IO.File.Exists(playlistPath))
                return NotFound();
            var content = System.IO.File.ReadAllText(playlistPath);
            return Content(content, "application/vnd.apple.mpegurl");
        }

        [HttpGet("{chunk}.ts")]
        public IActionResult GetChunk(int index, string chunk)
        {
            var chunkPath = Path.Combine(_hlsRoot, index.ToString(), $"{chunk}.ts");
            if (!System.IO.File.Exists(chunkPath))
                return NotFound();
            var stream = System.IO.File.OpenRead(chunkPath);
            return File(stream, "video/MP2T");
        }
    }
}
