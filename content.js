// Function to scrape a single video's title from a YouTube video page
function scrapeSingleVideoTitle() {
  console.log("scrapeSingleVideoTitle: Scraping single video title...");

  // <span id="video-title"> 요소를 선택하여 제목 텍스트를 가져옴
  const titleElement = document.querySelector("span#video-title");

  if (titleElement) {
    const videoTitle = titleElement.textContent.trim();
    console.log("scrapeSingleVideoTitle: Scraped title:", videoTitle);

    // 스크랩한 제목 데이터를 배열 형태로 반환
    return [{ title: videoTitle }];
  } else {
    console.log("scrapeSingleVideoTitle: Unable to find the video title.");
    return [];
  }
}

// Function to scrape recommended videos from the right sidebar
function scrapeRecommendedVideos() {
  console.log("scrapeRecommendedVideos: Scraping recommended videos...");

  // 우측 추천 동영상 목록에서 <span id="video-title"> 요소를 선택
  const recommendedVideos = document.querySelectorAll(
    "ytd-compact-video-renderer"
  );
  const videoData = [];

  recommendedVideos.forEach((videoElement) => {
    const titleElement = videoElement.querySelector("#video-title");
    const hrefElement = videoElement.querySelector("#thumbnails");
    const thumbnailElement = videoElement.querySelector("#img");

    if (titleElement && hrefElement && thumbnailElement) {
      const title = titleElement.textContent.trim();
      const link = `https://www.youtube.com${hrefElement.getAttribute("href")}`;
      const thumbnail = thumbnailElement.getAttribute("src");

      videoData.push({
        title,
        link,
        thumbnail,
      });
    }
  });

  console.log(
    "scrapeRecommendedVideos: Scraped recommended videos:",
    videoData
  );
  return videoData;
}

// Function to scrape YouTube videos from main page
function scrapeYouTubeVideos() {
  console.log("scrapeYouTubeVideos: Scraping videos from main YouTube page...");

  const videos = document.querySelectorAll("ytd-rich-grid-media");
  const videoData = [];

  videos.forEach((video) => {
    const titleElement = video.querySelector("a#video-title-link");
    if (titleElement) {
      const title = titleElement.getAttribute("title").trim();
      videoData.push({ title });
    }
  });

  console.log("scrapeYouTubeVideos: Scraped video data:", videoData);
  return videoData;
}

// Chrome runtime message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);

  if (request.action === "scrape_videos") {
    const videoData = scrapeYouTubeVideos(); // 기존 동영상 목록 스크랩
    sendResponse({ videos: videoData });
  } else if (request.action === "scrape_recommended_videos") {
    const recommendedVideos = scrapeRecommendedVideos(); // 추천 동영상 스크랩
    sendResponse({ videos: recommendedVideos });
  } else {
    sendResponse({ videos: [], videoIDBatches: [] });
  }

  return true; // Keep the messaging channel open for async response
});
