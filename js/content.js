function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file_path);
  node.appendChild(script);
  console.log("injected");
}
injectScript(chrome.runtime.getURL("js/content.js"), "body");

const getIdVideo = (url) => {
  const matching = url.includes("/video/");
  if (!matching) {
    console.log("[X] Error: URL not found");
  }
  const idVideo = url.substring(url.indexOf("/video/") + 7, url.length);
  return idVideo.length > 19
    ? idVideo.substring(0, idVideo.indexOf("?"))
    : idVideo;
};

const headers = new Headers();
headers.append(
  "User-Agent",
  "TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet"
);

const getVideoNoWM = async (url) => {
  const idVideo = await getIdVideo(url);
  const API_URL = `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id=${idVideo}`;
  const request = await fetch(API_URL, {
    method: "GET",
    headers: headers,
  });
  const body = await request.text();
  try {
    var res = JSON.parse(body);
  } catch (err) {
    console.error("Error:", err);
    console.error("Response body:", body);
  }
  const urlMedia = res.aweme_list[0].video.play_addr.url_list[0];
  const videoTitle = res.aweme_list[0].desc;
  const playCount = res.aweme_list[0].statistics.play_count;
  const data = {
    url: urlMedia,
    id: idVideo,
    title: videoTitle,
    playCount,
  };
  return data;
};

const insertHtml = () => {
  document
    .querySelector(".tiktok-10qtkim-DivShareLayoutBase-StyledShareLayoutV2 ")
    .insertAdjacentHTML(
      "afterbegin",
      `<div
      class="download-panel"
      style="
        width: 300px;
        height: 250px;
        position: fixed;
        top: 90px;
        right: 20px;
        z-index: 999;
      "
    >
      <div
        class="close-button"
        style="position: absolute; top: -25px; right: -7px; z-index: 999; cursor: pointer;"
      >
        <svg
          width="18"
          data-e2e=""
          height="18"
          viewBox="0 0 9 10"
          fill="#000"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.35299 0.792837L4.49961 3.93944L7.64545 0.792566C7.8407 0.597249 8.15733 0.597223 8.35262 0.792508L8.70669 1.14658C8.90195 1.34184 8.90195 1.65842 8.70669 1.85368L5.56027 5.0001L8.70672 8.14655C8.90198 8.34181 8.90198 8.65839 8.70672 8.85366L8.35316 9.20721C8.1579 9.40247 7.84132 9.40247 7.64606 9.20721L4.49961 6.06076L1.35319 9.20719C1.15793 9.40245 0.841345 9.40245 0.646083 9.20719L0.292629 8.85373C0.0973708 8.65847 0.0973653 8.3419 0.292617 8.14664L3.43895 5.0001L0.292432 1.85357C0.0972034 1.65834 0.0971656 1.34182 0.292347 1.14655L0.645801 0.792924C0.841049 0.597582 1.1577 0.597543 1.35299 0.792837Z"
          ></path>
        </svg>
      </div>
      <div
        style="
          background-color: #fe2d52;
          height: 100%;
          width: 100%;
          position: absolute;
          top: -5px;
          right: -5px;
          z-index: 1;
        "
      ></div>
      <div
        style="
          background-color: #28ffff;
          height: 100%;
          width: 100%;
          position: absolute;
          z-index: 2;
        "
      ></div>
      <div
        style="
          background-color: #fff;
          height: 240px;
          width: 290px;
          position: absolute;
          top: 5px;
          right: 5px;
          z-index: 3;
          padding: 8px;
        "
      >
        <div class="video-found" style="height: 100%">
          <div class="video-count">Fetching video...</div>
          <div class="video-list" style="height: 100%; overflow: scroll"></div>
        </div>
        <div style="width: 80%">
          <button
            class="down-load-button"
            style="
              position: absolute;
              background-color: #fe2d52;
              border: 1px solid #fe2d52;
              color: #fff;
              font-weight: 700;
              bottom: 0px;
              right: 50%;
              transform: translate(50%, -50%);
              width: 80%;
            "
          >
            Fetching...
          </button>
        </div>
      </div>
    </div>`
    );
};

let videoFound = 0;
const kFormatter = (num) => {
  return Math.abs(num) > 999
    ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "K"
    : Math.sign(num) * Math.abs(num);
};

const renderListVideo = (data) => {
  return data
    .map((item) => {
      return `
      <div style="width: 100%; display: flex; align-items: center; margin-bottom: 4px;">
        <div style="
          width:70%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;"
        >
        • ${item.title ? item.title : "no title"}
        </div>
        <div>
        - ${kFormatter(item.playCount)} ▶️
        </div>
      </div>
    `;
    })
    .join("");
};

let interval;
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message === "start") {
    insertHtml();
    const closeButton = document.querySelector(".close-button");
    closeButton.addEventListener("click", () => {
      document.querySelector(".download-panel").remove();
      clearInterval(interval);
      window.scrollTo(0, 0);
    });
    interval = setInterval(async () => {
      const listVideo = Array.from(
        document.querySelectorAll(".tiktok-1s72ajp-DivWrapper > a")
      );
      const urls = listVideo.map((v) => v.href);
      const timeout = setTimeout(() => {
        videoFound = urls.length;
      }, 1000);
      window.scrollTo(0, document.body.scrollHeight);
      console.log(`[*] ${urls.length} video found`);
      const countElem = document.querySelector(".video-count");
      const videoList = document.querySelector(".video-list");
      countElem.innerHTML = `<p style="font-size: 16px; font-weight: 700;">${urls.length} videos found</p>`;
      const videoData = await Promise.all(
        urls.map(async (url) => {
          const data = await getVideoNoWM(url);
          return data;
        })
      );
      videoList.innerHTML = renderListVideo(videoData);
      if (videoFound === urls.length) {
        const downloadBtn = document.querySelector(".down-load-button");
        downloadBtn.addEventListener("click", async () => {
          downloadBtn.innerHTML = `Downloading...`;
          const response = await chrome.runtime.sendMessage({
            msg: "download",
            data: videoData,
          });
          console.log("response", response);
        });
        clearInterval(interval);
        clearTimeout(timeout);
        window.scrollTo(0, 0);
        downloadBtn.innerHTML = `Download ${urls.length} videos`;
        console.log("[X] No more video found");
      }
    }, 1500);
  }
});
