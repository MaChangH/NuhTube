function scrapeYouTubeVideos() {
  console.log("Attempting to scrape videos from YouTube page...");

  const videos = document.querySelectorAll("ytd-rich-grid-media");
  console.log(`Found ${videos.length} video elements on the page.`);

  const videoData = [];

  videos.forEach((video, index) => {
    const titleElement = video.querySelector("a#video-title-link");
    const thumbnailElement = video.querySelector("img");

    console.log(
      `Processing video ${index + 1}: title element found:`,
      !!titleElement,
      "thumbnail element found:",
      !!thumbnailElement
    );

    if (titleElement && thumbnailElement) {
      const title = titleElement.title.trim(); // <a> 태그의 title 속성에서 제목 가져오기
      const thumbnail = thumbnailElement.src; // <img> 태그의 src 속성에서 썸네일 이미지 가져오기

      console.log(
        `Video ${index + 1}: Title: ${title}, Thumbnail: ${thumbnail}`
      );

      videoData.push({ title, thumbnail });
    } else {
      console.log(`Video ${index + 1}: Missing title or thumbnail element.`);
    }
  });

  console.log("Final scraped video data:", videoData);

  return videoData;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);

  if (request.action === "scrape_videos") {
    const videoData = scrapeYouTubeVideos();

    if (videoData.length > 0) {
      console.log("Sending scraped video data:", videoData);
      sendResponse({ videos: videoData });
    } else {
      console.log("No videos found to scrape.");
      sendResponse({ videos: [] });
    }
  }
});
