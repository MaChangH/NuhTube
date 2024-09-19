// Function to scrape video data and split videoIDs for YouTube API
function scrapeYouTubeVideos() {
  console.log("Attempting to scrape videos from YouTube page...");
  const videos = document.querySelectorAll("ytd-rich-grid-media");
  console.log(`Found ${videos.length} video elements on the page.`);

  const videoData = [];
  const videoIDs = []; // Array to store video IDs

  videos.forEach((video, index) => {
    const titleElement = video.querySelector("a#video-title-link");
    const href = titleElement ? titleElement.getAttribute("href") : null;

    // Extracting the video ID from the href
    const videoID = href ? href.split("v=")[1] : null; // Extract the part after 'v='
    if (videoID) {
      videoIDs.push(videoID); // Add videoID to the list
    }

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

    if (titleElement && thumbnailElement && thumbnailElement.src) {
      const title = titleElement.getAttribute("title").trim(); // <a> 태그의 title 속성에서 제목 가져오기
      const thumbnail = thumbnailElement.src; // <img> 태그의 src 속성에서 썸네일 이미지 가져오기
      const link = `https://www.youtube.com${href}`; // 전체 링크 추출

      videoData.push({
        title,
        thumbnail,
        link,
        videoID,
        videoPublisher: publisherName,
        publisherLink,
      });
    }
  });

  // Splitting videoIDs into batches of 50 for the YouTube API
  const splitVideoIDsForAPI = (videoIDs) => {
    const batchSize = 50;
    let batches = [];

    // Split videoIDs into chunks of 50
    for (let i = 0; i < videoIDs.length; i += batchSize) {
      let batch = videoIDs.slice(i, i + batchSize).join(","); // Join IDs with commas
      batches.push(batch); // Push the cleaned batch into the list
    }

    return batches;
  };

  const videoIDBatches = splitVideoIDsForAPI(videoIDs); // Get batches of 50 video IDs

  console.log("List of video ID batches for YouTube API:", videoIDBatches);
  console.log("Final scraped video data:", videoData);

  return { videoData, videoIDBatches }; // Return both video data and the batched video IDs
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);

  if (request.action === "scrape_videos") {
    const { videoData, videoIDBatches } = scrapeYouTubeVideos(); // Destructure return values

    if (videoData.length > 0) {
      console.log("Sending scraped video data and video ID batches:", {
        videoData,
        videoIDBatches,
      });
      sendResponse({ videos: videoData, videoIDBatches: videoIDBatches }); // Send both data and batches
    } else {
      console.log("No videos found to scrape.");
      sendResponse({ videos: [], videoIDBatches: [] });
    }
  }
});
