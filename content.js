import config from "./config";
// Function to construct YouTube API URLs for each batch with commas replaced by '%'
function constructYouTubeAPIUrls(videoIDBatches, apiKey) {
  console.log(
    "constructYouTubeAPIUrls: Received videoIDBatches:",
    videoIDBatches
  );
  try {
    const urls = videoIDBatches.map(
      (batch) =>
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${batch.replace(
          /,/g,
          "%"
        )}&regionCode=kr&key=${apiKey}`
    );
    console.log("constructYouTubeAPIUrls: Constructed URLs:", urls);
    return urls;
  } catch (error) {
    console.error("constructYouTubeAPIUrls: Error constructing URLs:", error);
  }
}

// Function to scrape video data and split videoIDs for YouTube API
function scrapeYouTubeVideos() {
  console.log(
    "scrapeYouTubeVideos: Attempting to scrape videos from YouTube page..."
  );
  const videos = document.querySelectorAll("ytd-rich-grid-media");
  console.log(
    `scrapeYouTubeVideos: Found ${videos.length} video elements on the page.`
  );

  const videoData = [];
  const videoIDs = []; // Array to store video IDs

  videos.forEach((video, index) => {
    const titleElement = video.querySelector("a#video-title-link");
    const href = titleElement ? titleElement.getAttribute("href") : null;

    // Extracting the video ID from the href
    let videoID = href ? href.split("v=")[1] : null; // Extract the part after 'v='

    // Check if the videoID contains '&', and if so, remove everything after '&'
    if (videoID && videoID.includes("&")) {
      videoID = videoID.split("&")[0]; // Keep only the part before '&'
    }

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
  // Remove videoIDs that contain 'start_radio'
  // videoIDs = videoIDs.filter((id) => !id.includes("start_radio"));
  console.log("scrapeYouTubeVideos: Scraped videoData:", videoData);
  console.log("scrapeYouTubeVideos: Scraped videoIDs:", videoIDs);

  // Splitting videoIDs into batches of 50 for the YouTube API
  const splitVideoIDsForAPI = (videoIDs) => {
    const batchSize = 50;
    let batches = [];

    // Split videoIDs into chunks of 50
    for (let i = 0; i < videoIDs.length; i += batchSize) {
      let batch = videoIDs
        .slice(i, i + batchSize)
        .map((id) => id.trim())
        .join("%2C"); // Remove whitespace and join IDs with commas
      // , 로 연결한걸 %2C 로 변경.

      batches.push(batch); // Push the cleaned batch into the list
    }

    return batches;
  };

  const videoIDBatches = splitVideoIDsForAPI(videoIDs); // Get batches of 50 video IDs
  console.log("scrapeYouTubeVideos: videoIDBatches:", videoIDBatches);

  return { videoData, videoIDBatches }; // Return both video data and the batched video IDs
}

// Function to fetch and parse video data from YouTube API
async function fetchVideoDataFromYouTube(apiUrls) {
  console.log("fetchVideoDataFromYouTube: Fetching data for URLs:", apiUrls);
  let fetchedVideoData = [];

  // Fetch data for each URL (each batch)
  for (let url of apiUrls) {
    try {
      console.log(`fetchVideoDataFromYouTube: Fetching data from URL: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      console.log("fetchVideoDataFromYouTube: Fetched data:", data);

      // Check if the response contains the video data
      if (data && data.items && data.items.length > 0) {
        data.items.forEach((item) => {
          const video = {
            title: item.snippet.title,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt,
            thumbnails: item.snippet.thumbnails.default.url,
            channelTitle: item.snippet.channelTitle,
          };
          fetchedVideoData.push(video);
        });
      }
    } catch (error) {
      console.error(
        "fetchVideoDataFromYouTube: Error fetching video data from YouTube API:",
        error
      );
    }
  }

  console.log(
    "fetchVideoDataFromYouTube: Fetched video data:",
    fetchedVideoData
  );
  return fetchedVideoData;
}

// Chrome runtime message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);

  if (request.action === "scrape_videos") {
    const { videoData, videoIDBatches } = scrapeYouTubeVideos(); // Destructure return values

    if (videoData.length > 0) {
      console.log(
        "chrome.runtime.onMessage: Scraping completed. Constructing API URLs."
      );

      // Use your YouTube API Key here
      const apiKey = "AIzaSyDf_SrIprVRsmmGxxjceWdVoGTJJpQ_0J0";
      console.log("Using API Key:", apiKey);
      try {
        const apiUrls = constructYouTubeAPIUrls(videoIDBatches, apiKey);
        console.log("chrome.runtime.onMessage: Constructed API URLs:", apiUrls);

        // Fetch video details from YouTube API
        fetchVideoDataFromYouTube(apiUrls).then((fetchedData) => {
          console.log(
            "chrome.runtime.onMessage: Fetched video details from YouTube API:",
            fetchedData
          );
          sendResponse({ videos: fetchedData, videoIDBatches: videoIDBatches }); // Send both data and batches
        });
      } catch (error) {
        console.error(
          "chrome.runtime.onMessage: Error in constructing API URLs:",
          error
        );
        sendResponse({
          videos: [],
          videoIDBatches: [],
          error: "URL Construction Failed",
        });
      }
    } else {
      console.log("chrome.runtime.onMessage: No videos found to scrape.");
      sendResponse({ videos: [], videoIDBatches: [] });
    }
  }

  return true; // Keep the messaging channel open for async response
});
