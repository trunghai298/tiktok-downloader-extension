chrome.action.onClicked.addListener(async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const response = await chrome.tabs.sendMessage(tab.id, { message: "start" });
});

chrome.runtime.onInstalled.addListener(async (reason) => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: cs.js,
      });
    }
  }
});

const downloadMedia = async (data) => {
  data.forEach((d) => {
    const fileName = `${d.id}.mp4`;
    chrome.downloads.download({ filename: fileName, url: d.url });
  });
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.msg === "download") {
    await downloadMedia(request.data);
    sendResponse({ msg: "Downloaded successfully" });
  }
});

chrome.downloads.onChanged.addListener((downloadDelta) => {
  console.log("downloadDelta", downloadDelta);
});
