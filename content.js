function scrapeYouTubeVideos() {
  console.log("Attempting to scrape videos from YouTube page...");
  const videos = document.querySelectorAll("ytd-rich-grid-media");
  console.log(`Found ${videos.length} video elements on the page.`);

  const videoData = [];

  videos.forEach((video, index) => {
    const titleElement = video.querySelector("a#video-title-link");
    const href = titleElement ? titleElement.getAttribute("href") : null;
    const videoTitle = titleElement ? titleElement.getAttribute("title") : null;

    // Extracting the video ID from the href
    const videoID = href ? href.split("v=")[1] : "No ID"; // Extract the part after 'v='

    // Extracting the publisher info
    const publisherElement = video.querySelector(
      "a.yt-simple-endpoint.style-scope.yt-formatted-string"
    );
    const publisherName = publisherElement
      ? publisherElement.innerText.trim()
      : "No publisher";
    const publisherLink = publisherElement
      ? `https://www.youtube.com${publisherElement.getAttribute("href")}`
      : "No publisher link";

    let thumbnailElement = video.querySelector("img"); // 기본 썸네일 검색

    console.log(
      `Processing video ${index + 1}: title element found:`,
      !!titleElement,
      "thumbnail element found:",
      !!thumbnailElement,
      "publisher found:",
      !!publisherElement,
      "video ID found:",
      !!videoID
    );

    if (titleElement && thumbnailElement && thumbnailElement.src) {
      const title = videoTitle ? videoTitle.trim() : "No title"; // <a> 태그의 title 속성에서 제목 가져오기
      const thumbnail = thumbnailElement.src; // <img> 태그의 src 속성에서 썸네일 이미지 가져오기
      const link = href ? `https://www.youtube.com${href}` : "No link"; // 전체 링크 추출
      const videoPublisher = publisherName ? publisherName : "No publisher"; // 동영상 게시자 이름 추출

      console.log(
        `Video ${
          index + 1
        }: Title: ${title}, Thumbnail: ${thumbnail}, Link: ${link}, Video ID: ${videoID}, Publisher: ${videoPublisher}, Publisher Link: ${publisherLink}`
      );

      videoData.push({
        title,
        thumbnail,
        link,
        videoID,
        videoPublisher,
        publisherLink,
      });
    } else {
      console.log(
        `Video ${index + 1}: Missing title, thumbnail, or publisher element.`
      );
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
