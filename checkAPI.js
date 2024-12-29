const axios = require("axios");
const { log } = require("./utils"); // Adjust the path as necessary
const settings = require("./config/config");

const urlChecking = "https://raw.githubusercontent.com/Hunga9k50doker/APIs-checking/refs/heads/main/endpoints.json";

async function checkBaseUrl() {
  console.log("Checking API...".blue);
  if (settings.ADVANCED_ANTI_DETECTION) {
    const result = await getBaseApi(urlChecking);
    if (result.endpoint) {
      log("No change in API!", "success");
      return result;
    }
  } else {
    return settings.BASE_URL;
  }
}

async function getBaseApi(url) {
  try {
    const response = await axios.get(url);
    const content = response.data;
    if (content?.memex) {
      return { endpoint: content.memex, message: content.copyright };
    } else {
      return {
        endpoint: null,
        message:
          "If the API has changed, please contact the BianzZz group on Telegram  for more information and updates!| Have any issues",
      };
    }
  } catch (e) {
    return {
      endpoint: null,
      message:
        "If the API has changed, please contact the BianzZz group on Telegram  for more information and updates!| Have any issues",
    };
  }
}

module.exports = { checkBaseUrl };
