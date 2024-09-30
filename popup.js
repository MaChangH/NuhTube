document.addEventListener("DOMContentLoaded", () => {
  const scrapeButton = document.getElementById("scrape-button");
  const videoList = document.getElementById("video-list");

  // 버튼 클릭 시 스크래핑 시작
  scrapeButton.addEventListener("click", () => {
    console.log("Scrape button clicked.");

    // 현재 활성 탭의 URL 확인
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const url = currentTab.url;
      console.log("Current URL:", url);

      let action = "scrape_videos"; // 기본 액션 (메인 페이지)

      // URL이 특정 동영상 페이지라면 추천 동영상 스크랩하도록 액션 변경
      if (url && url.match(/^https:\/\/www\.youtube\.com\/watch\?v=/)) {
        action = "scrape_recommended_videos";
      }

      console.log("Sending message with action:", action);

      // 현재 활성 탭에 스크래핑 요청을 보냄
      chrome.tabs.sendMessage(currentTab.id, { action: action }, (response) => {
        console.log("Received response from content script:", response);

        if (response && response.videos && response.videos.length > 0) {
          console.log("Videos found:", response.videos.length);

          videoList.innerHTML = ""; // 기존 목록 초기화
          response.videos.forEach((video) => {
            const videoItem = document.createElement("div");
            videoItem.className = "video-item";

            const thumbnail = document.createElement("img");
            thumbnail.className = "thumbnail";
            thumbnail.src = video.thumbnail || ""; // 썸네일 URL 설정, 없으면 빈 문자열

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
      });
    });
  });
});
