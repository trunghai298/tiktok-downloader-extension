chrome.action.onClicked.addListener(async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const response = await chrome.tabs.sendMessage(tab.id, { message: "start" });
});

chrome.runtime.onInstalled.addListener(async () => {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const response = await chrome.tabs.sendMessage(tabId, {
      message: "tab-change",
      changeInfo,
      tab,
    });
  });

  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: cs.js,
      });
    }
  }
});

let isCallCancel;

const downloadMedia = async (data) => {
  await Promise.all(
    data.map(async (d) => {
      const fileName = `${d.id}.mp4`;
      await chrome.downloads.download(
        { filename: fileName, url: d.url },
        async (downloadId) => {
          if (isCanceled) {
            console.log("-canceling-", downloadId);
            await chrome.downloads.cancel(downloadId);
          }
        }
      );
    })
  );
};

let isCanceled;

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.msg === "download") {
    isCanceled = false;
    await downloadMedia(request.data);
  }
  if (request.msg === "cancel-download") {
    isCanceled = true;
    isCallCancel = true;
  }
});

const listDownload = [];

chrome.downloads.onChanged.addListener(async (downloadDelta) => {
  console.log(downloadDelta);
  if (isCallCancel) {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    await chrome.tabs.sendMessage(tab.id, {
      message: "cancel-success",
    });
    isCallCancel = false;
  }
  if (downloadDelta.state?.current === "complete") {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    await chrome.downloads.search({ id: downloadDelta.id }, async (res) => {
      await chrome.tabs.sendMessage(tab.id, {
        message: "success",
        item: res[0].filename,
      });
    });
  }
});
