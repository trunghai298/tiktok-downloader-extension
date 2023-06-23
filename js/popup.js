const userInput = document.querySelector(".username-input");
const goToPage = document.querySelector(".go-to-page");

let baseUrl = "https://www.tiktok.com/";
let username = "";

const getCurrentTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
};

const generateUrlProfile = (username) => {
  if (username.includes("@")) {
    baseUrl = `${baseUrl}${username}`;
  } else {
    baseUrl = `${baseUrl}@${username}`;
  }
  return baseUrl;
};

const getListVideoByUsername = async (username) => {
  const url = generateUrlProfile("@_lana_2311");
  const listVideo = Array.from(
    document.querySelectorAll(".tiktok-1s72ajp-DivWrapper > a")
  );
};

document.addEventListener("DOMContentLoaded", async function () {
  registerOnChangeTabUpdate();
});
