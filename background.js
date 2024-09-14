chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: scrapeYouTubeVideos,
    },
    (results) => {
      if (results && results[0] && results[0].result) {
        chrome.storage.local.set({ videos: results[0].result });
      }
    }
  );
});
