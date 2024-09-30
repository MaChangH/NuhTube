// Function to construct YouTube API URLs for each batch with commas replaced by '%'
function constructYouTubeAPIUrls(videoIDBatches, apiKey) {
  console.log(
    "14. constructYouTubeAPIUrls: Received videoIDBatches:",
    videoIDBatches
  );
  try {
    const urls = videoIDBatches.map(
      (batch) =>
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${batch.replace(
          /,/g,
          "%2C"
        )}&regionCode=kr&key=${apiKey}`
    );
    console.log("15. constructYouTubeAPIUrls: Constructed URLs:", urls);
    return urls;
  } catch (error) {
    console.error(
      "16. constructYouTubeAPIUrls: Error constructing URLs:",
      error
    );
  }
}

// Function to scrape video data and split videoIDs for YouTube API
function scrapeYouTubeVideos() {
  console.log(
    "1. scrapeYouTubeVideos: Start scraping videos from YouTube page..."
  );

  const currentURL = window.location.href;
  console.log("2. Current URL detected:", currentURL);

  let videos = [];

  if (currentURL.includes("youtube.com/watch?v=")) {
    // 개별 동영상 페이지일 때
    console.log(
      "3. Current URL is a video watch page. Using watch page selectors."
    );
    videos = document.querySelectorAll("ytd-compact-video-renderer");
    console.log(
      `4. Found ${videos.length} video elements on the video watch page.`
    );
  } else {
    // 일반 YouTube 메인 또는 탐색 페이지일 때
    console.log(
      "3. Current URL is the YouTube home or browse page. Using main page selectors."
    );
    videos = document.querySelectorAll("ytd-rich-grid-media");
    console.log(`4. Found ${videos.length} video elements on the main page.`);
  }

  const videoData = [];
  const videoIDs = [];

  videos.forEach((video, index) => {
    console.log(`5. Processing video element #${index + 1}...`);
    let titleElement,
      href,
      videoID,
      publisherElement,
      publisherName,
      publisherLink,
      thumbnailElement,
      title,
      thumbnail,
      link;

    if (currentURL.includes("youtube.com/watch?v=")) {
      console.log("6. Using watch page selectors for video metadata.");
      titleElement = video.querySelector("span#video-title");
      const linkElement = video.querySelector(
        "a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer"
      );
      href = linkElement ? linkElement.getAttribute("href") : null;
      videoID = href ? href.split("v=")[1] : null;

      if (videoID && videoID.includes("&")) {
        videoID = videoID.split("&")[0]; // videoID에서 & 이후 제거
      }

      publisherElement = video.querySelector("yt-formatted-string#text");
      publisherName = publisherElement
        ? publisherElement.innerText.trim()
        : "No publisher";
      publisherLink = linkElement
        ? `https://www.youtube.com${linkElement.getAttribute("href")}`
        : "No publisher link";

      thumbnailElement = video.querySelector("img");
    } else {
      console.log("6. Using main page selectors for video metadata.");
      titleElement = video.querySelector("a#video-title-link");
      href = titleElement ? titleElement.getAttribute("href") : null;
      videoID = href ? href.split("v=")[1] : null;

      if (videoID && videoID.includes("&")) {
        videoID = videoID.split("&")[0]; // videoID에서 & 이후 제거
      }

      publisherElement = video.querySelector(
        "a.yt-simple-endpoint.style-scope.yt-formatted-string"
      );
      publisherName = publisherElement
        ? publisherElement.innerText.trim()
        : "No publisher";
      publisherLink = publisherElement
        ? `https://www.youtube.com${publisherElement.getAttribute("href")}`
        : "No publisher link";

      thumbnailElement = video.querySelector("img");
    }

    if (titleElement && thumbnailElement && thumbnailElement.src) {
      title = titleElement.getAttribute("title")
        ? titleElement.getAttribute("title").trim()
        : titleElement.innerText.trim();
      thumbnail = thumbnailElement.src;
      link = `https://www.youtube.com${href}`;

      console.log("7. Scraped metadata:", {
        title,
        thumbnail,
        link,
        videoID,
        videoPublisher: publisherName,
      });

      videoData.push({
        title,
        thumbnail,
        link,
        videoID,
        videoPublisher: publisherName,
        publisherLink,
      });

      if (videoID) {
        videoIDs.push(videoID);
        console.log(`8. Video ID (${videoID}) added to videoIDs array.`);
      }
    }
  });

  console.log("9. All video data processed. Scraped videoData:", videoData);
  console.log("10. All video IDs collected. Scraped videoIDs:", videoIDs);

  const splitVideoIDsForAPI = (videoIDs) => {
    console.log(
      "11. Splitting video IDs into batches of 50 for YouTube API requests."
    );
    const batchSize = 50;
    let batches = [];

    for (let i = 0; i < videoIDs.length; i += batchSize) {
      let batch = videoIDs
        .slice(i, i + batchSize)
        .map((id) => id.trim())
        .join("%2C");
      batches.push(batch);
      console.log(`12. Created batch #${batches.length}:`, batch);
    }

    return batches;
  };

  const videoIDBatches = splitVideoIDsForAPI(videoIDs);
  console.log("13. Final videoIDBatches for API requests:", videoIDBatches);

  return { videoData, videoIDBatches };
}

// Function to fetch and parse video data from YouTube API
async function fetchVideoDataFromYouTube(apiUrls) {
  console.log(
    "17. fetchVideoDataFromYouTube: Fetching data for URLs:",
    apiUrls
  );
  let fetchedVideoData = [];

  for (let url of apiUrls) {
    try {
      console.log(
        `18. fetchVideoDataFromYouTube: Fetching data from URL: ${url}`
      );
      const response = await fetch(url);
      const data = await response.json();
      console.log("19. fetchVideoDataFromYouTube: Fetched data:", data);

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
        "20. fetchVideoDataFromYouTube: Error fetching video data from YouTube API:",
        error
      );
    }
  }

  console.log(
    "21. fetchVideoDataFromYouTube: Fetched video data:",
    fetchedVideoData
  );
  return fetchedVideoData;
}

// Chrome runtime message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("22. Message received in content script:", request);

  if (request.action === "scrape_videos") {
    const { videoData, videoIDBatches } = scrapeYouTubeVideos();

    if (videoData.length > 0) {
      console.log(
        "23. chrome.runtime.onMessage: Scraping completed. Constructing API URLs."
      );

      const apiKey = "AIzaSyDf_SrIprVRsmmGxxjceWdVoGTJJpQ_0J0";
      try {
        const apiUrls = constructYouTubeAPIUrls(videoIDBatches, apiKey);
        console.log(
          "24. chrome.runtime.onMessage: Constructed API URLs:",
          apiUrls
        );

        fetchVideoDataFromYouTube(apiUrls).then((fetchedData) => {
          console.log(
            "25. chrome.runtime.onMessage: Fetched video details from YouTube API:",
            fetchedData
          );
          sendResponse({ videos: fetchedData, videoIDBatches: videoIDBatches });
        });
      } catch (error) {
        console.error(
          "26. chrome.runtime.onMessage: Error in constructing API URLs:",
          error
        );
        sendResponse({
          videos: [],
          videoIDBatches: [],
          error: "URL Construction Failed",
        });
      }
    } else {
      console.log("27. chrome.runtime.onMessage: No videos found to scrape.");
      sendResponse({ videos: [], videoIDBatches: [] });
    }
  }

  return true;
});
