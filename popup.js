document.addEventListener("DOMContentLoaded", () => {
  const scrapeButton = document.getElementById("scrape-button");
  const videoList = document.getElementById("video-list");

  // 버튼 클릭 시 스크래핑 시작
  scrapeButton.addEventListener("click", () => {
    console.log("Scrape button clicked.");

    // 현재 활성 탭에 스크래핑 요청을 보냄
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log(
        "Sending scrape message to content script in tab:",
        tabs[0].id
      );

      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "scrape_videos" },
        (response) => {
          console.log("Received response from content script:", response);

          if (response && response.videos && response.videos.length > 0) {
            console.log("Videos found:", response.videos.length);

            videoList.innerHTML = ""; // 기존 목록 초기화
            response.videos.forEach((video) => {
              const videoItem = document.createElement("div");
              videoItem.className = "video-item";

              const thumbnail = document.createElement("img");
              thumbnail.className = "thumbnail";
              thumbnail.src = video.thumbnail;

              const title = document.createElement("span");
              title.textContent = video.title;

              videoItem.appendChild(thumbnail);
              videoItem.appendChild(title);
              videoList.appendChild(videoItem);
            });
          } else {
            console.log("No videos found.");
            videoList.textContent = "No videos found.";
          }
        }
      );
    });
  });
});
