let videoList = [];
let currentVideoIndex = -1;
const API_BASE = config.API_BASE;

async function fetchVideos() {
	const res = await fetch(`${API_BASE}/metadata`);
	const data = await res.json();
	videoList = data;
	return data;
}

async function fetchMetadata(videoIndex) {
	const res = await fetch(`${API_BASE}/metadata/${videoIndex}`);
	return res.json();
}

function renderVideoList(videos) {
	const list = document.getElementById("video-list");
	list.innerHTML = "";
	if (!videos || videos.length === 0) {
		list.innerHTML = "<p>No videos available.</p>";
		return;
	}
	videos.forEach((videoObj, idx) => {
		const div = document.createElement("div");
		div.className = "video-item";
		div.textContent = videoObj.title;
		div.onclick = () => showPlayerByIndex(idx);
		list.appendChild(div);
	});
}

async function showPlayerByIndex(idx) {
	if (!videoList || idx < 0 || idx >= videoList.length) return;
	currentVideoIndex = idx;
	const videoObj = videoList[idx];
	await showPlayer(videoObj);
	updateNavButtons();
}

function extractYouTubeId(url) {
	const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/);
	return match ? match[1] : null;
}

async function showPlayer(video) {
	const metadata = await fetchMetadata(video.index);
	document.getElementById("player-section").style.display = "block";

	const displayName = metadata.video_title || video.title || "Unnamed Video";
	document.getElementById("video-title").textContent = displayName;

	// Renderuj metapodatke, ali sakrij po defaultu
	const metadataEl = document.getElementById("video-metadata");
	metadataEl.innerHTML = renderMetadataHtml(metadata);
	metadataEl.style.display = "none";

	// Upravljanje dugmetom za prikaz/sakrivanje
	const toggleBtn = document.getElementById("toggle-metadata-btn");
	if (toggleBtn) {
		toggleBtn.textContent = "Prika i detalje";
		toggleBtn.onclick = () => {
			if (metadataEl.style.display === "none") {
				metadataEl.style.display = "block";
				toggleBtn.textContent = "Sakrij detalje";
			} else {
				metadataEl.style.display = "none";
				toggleBtn.textContent = "Prika i detalje";
			}
		};
	}

	// Video player kontejner
	const container = document.getElementById("video-player-container");
	container.innerHTML = "";

	if (metadata.youtube_url) {
		const id = extractYouTubeId(metadata.youtube_url);
		if (id) {
			const iframe = document.createElement("iframe");
			iframe.width = "640";
			iframe.height = "360";
			iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
			iframe.frameborder = "0";
			iframe.allow =
				"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
			iframe.allowFullscreen = true;
			container.appendChild(iframe);
		} else {
			container.innerHTML = "<p>Neva e i YouTube link</p>";
		}
	} else {
		const videoEl = document.createElement("video");
		videoEl.id = "video-player";
		videoEl.controls = true;
		videoEl.width = 640;
		videoEl.height = 360;
		const playlistUrl = video.streaming_url;

		if (Hls.isSupported()) {
			const hls = new Hls();
			hls.loadSource(playlistUrl);
			hls.attachMedia(videoEl);
			videoEl.hlsInstance = hls;
		} else {
			videoEl.src = playlistUrl;
		}
		container.appendChild(videoEl);
		videoEl.play();
	}
}

function updateNavButtons() {
	const prevBtn = document.getElementById("prev-video-btn");
	const nextBtn = document.getElementById("next-video-btn");
	if (!videoList || videoList.length === 0) {
		prevBtn.disabled = true;
		nextBtn.disabled = true;
		return;
	}
	prevBtn.disabled = currentVideoIndex <= 0;
	nextBtn.disabled = currentVideoIndex >= videoList.length - 1;
}

function playPrevVideo() {
	if (currentVideoIndex > 0) {
		showPlayerByIndex(currentVideoIndex - 1);
	}
}

function playNextVideo() {
	if (currentVideoIndex < videoList.length - 1) {
		showPlayerByIndex(currentVideoIndex + 1);
	}
}

function renderMetadataHtml(metadata) {
	if (!metadata || typeof metadata !== "object")
		return "<em>No metadata available.</em>";
	let html = '<ul class="metadata-list">';
	for (const [key, value] of Object.entries(metadata)) {
		html += `<li><strong>${key}:</strong> ${formatMetadataValue(value)}</li>`;
	}
	html += "</ul>";
	return html;
}

function formatMetadataValue(value) {
	if (typeof value === "object" && value !== null) {
		return "<pre>" + JSON.stringify(value, null, 2) + "</pre>";
	}
	return value;
}

window.onload = async () => {
	const videos = await fetchVideos();
	renderVideoList(videos);

	let navContainer = document.getElementById("video-nav-buttons");
	if (!navContainer) {
		navContainer = document.createElement("div");
		navContainer.id = "video-nav-buttons";
		navContainer.style.margin = "10px 0";
		document.getElementById("player-section").prepend(navContainer);
	}

	navContainer.innerHTML = `
		<button id="prev-video-btn">Previous</button>
		<button id="next-video-btn">Next</button>
	`;

	document.getElementById("prev-video-btn").onclick = playPrevVideo;
	document.getElementById("next-video-btn").onclick = playNextVideo;
	updateNavButtons();
};
