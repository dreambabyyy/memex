const fs = require("fs");
const path = require("path");
const axios = require("axios");
const colors = require("colors");
const readline = require("readline");
const maxThreads = 1; // number of threads
const user_agents = require("./config/userAgents");
const settings = require("./config/config");
const { sleep } = require("./utils");
const { checkBaseUrl } = require("./checkAPI");

class Clayton {
  constructor(accountIndex, initData, session_name, baseURL) {
    this.accountIndex = accountIndex;
    this.queryId = initData;
    this.headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9,vi-VN,vi;q=0.8,fr-FR;q=0.7,fr;q=0.6",
      "Content-Type": "application/json",
      Origin: "https://tonclayton.fun",
      Referer: "https://tonclayton.fun/games",
      "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    };
    this.session_name = session_name;
    this.session_user_agents = this.#load_session_data();
    this.skipTasks = settings.SKIP_TASKS;
    this.baseURL = baseURL;
  }

  #load_session_data() {
    try {
      const filePath = path.join(process.cwd(), "session_user_agents.json");
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      } else {
        throw error;
      }
    }
  }

  #get_random_user_agent() {
    const randomIndex = Math.floor(Math.random() * user_agents.length);
    return user_agents[randomIndex];
  }

  #get_user_agent() {
    if (this.session_user_agents[this.session_name]) {
      return this.session_user_agents[this.session_name];
    }

    this.log(`Creating user agent...`);
    const newUserAgent = this.#get_random_user_agent();
    this.session_user_agents[this.session_name] = newUserAgent;
    this.#save_session_data(this.session_user_agents);
    return newUserAgent;
  }

  #save_session_data(session_user_agents) {
    const filePath = path.join(process.cwd(), "session_user_agents.json");
    fs.writeFileSync(filePath, JSON.stringify(session_user_agents, null, 2));
  }

  #get_platform(userAgent) {
    const platformPatterns = [
      { pattern: /iPhone/i, platform: "ios" },
      { pattern: /Android/i, platform: "android" },
      { pattern: /iPad/i, platform: "ios" },
    ];

    for (const { pattern, platform } of platformPatterns) {
      if (pattern.test(userAgent)) {
        return platform;
      }
    }

    return "Unknown";
  }

  set_headers() {
    const platform = this.#get_platform(this.#get_user_agent());
    this.headers["sec-ch-ua"] = `"Not)A;Brand";v="99", "${platform} WebView";v="127", "Chromium";v="127"`;
    this.headers["sec-ch-ua-platform"] = platform;
    this.headers["User-Agent"] = this.#get_user_agent();
  }

  loadWallets() {
    try {
      const walletFile = path.join(__dirname, "wallets.txt");
      if (fs.existsSync(walletFile)) {
        return fs.readFileSync(walletFile, "utf8").replace(/\r/g, "").split("\n").filter(Boolean);
      }
      return [];
    } catch (error) {
      this.log(`Error reading wallet file: ${error.message}`, "error");
      return [];
    }
  }

  async log(msg, type = "info") {
    const accountPrefix = `[Account ${this.accountIndex + 1}]`;
    let logMessage = "";

    switch (type) {
      case "success":
        logMessage = `${accountPrefix} ${msg}`.green;
        break;
      case "error":
        logMessage = `${accountPrefix} ${msg}`.red;
        break;
      case "warning":
        logMessage = `${accountPrefix} ${msg}`.yellow;
        break;
      default:
        logMessage = `${accountPrefix} ${msg}`.blue;
    }
    console.log(logMessage);
  }

  async makeRequest(url, method, data = {}, retries = 0) {
    const headers = {
      ...this.headers,
      cookie: `telegramInitData=${this.queryId}`,
      "x-telegram-init-data": this.queryId,
    };
    let currRetries = 0,
      success = false;
    do {
      currRetries++;
      try {
        const response = await axios({
          method,
          url,
          data,
          headers,
          timeout: 30000,
        });
        success = true;
        return { success: true, data: response.data };
      } catch (error) {
        this.log(`Request failed: ${url} | ${error.message} | retrying...`, "warning");
        success = false;
        await sleep(settings.DELAY_BETWEEN_REQUESTS);
        return { success: false, error: error.message };
      }
    } while (currRetries < retries && !success);
  }

  async getUserInfo() {
    return this.makeRequest(`${this.baseURL}/public/user`, "get");
  }

  async dailyCheckStatus() {
    return this.makeRequest(`${this.baseURL}/public/user/daily`, "get");
  }

  async dailyCheckin() {
    return this.makeRequest(`${this.baseURL}/public/user/daily`, "post");
  }

  async claimSBT() {
    return this.makeRequest(`${this.baseURL}/schedule/public/user/claim`, "get");
  }

  async connectwallet(wallet) {
    if (!wallet) return this.log("No wallet address found... skipping");
    const res = await this.makeRequest(`${this.baseURL}/user/wallet`, "post", { wallet });
    if (res?.data?.ok) {
      this.log(`Wallet connected successfully: ${res.data.wallet}`.green);
    } else {
      this.log(`Cannot connect wallet, it may already be linked to another account: ${res?.data?.error}`.yellow);
    }
  }

  async processAccount() {
    const loginResult = await this.getUserInfo();

    if (!loginResult.success) {
      this.log("Login failed. Skipping account.", "error");
      return;
    }

    const { userName, memesWarUser, canClaimSBT, referralPoint } = loginResult.data.user;

    this.log(`userName: ${userName} | memesWarUser: ${memesWarUser.toString()} | referralPoint: ${referralPoint || 0}`, "custom");

    await sleep(2);
    const dailyStatus = await this.dailyCheckStatus();

    if (!dailyStatus.success) {
    }

    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const { fromTime, toTime, content } = dailyStatus.data;
    const needCheckIn = !content || (!content.includes(today) && today >= fromTime && today <= toTime);
    if (needCheckIn) {
      this.log(`Start check-in...`);
      const res = await this.dailyCheckin();
      if (res.success) this.log(`Check-in successful! | Streak: ${content.length}`, "success");
    } else {
      this.log(`You are checked in today! | Streak: ${content.length}`, "warning");
    }

    // if (!canClaimSBT) {
    //   const resSBT = await this.claimSBT();
    // }
  }
}

async function wait(seconds) {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r${colors.cyan(`[*] Waiting for ${Math.floor(i / 60)} minutes ${i % 60} seconds to continue`)}`.padEnd(80));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 0);
  console.log(`Starting new loop...`);
}

async function main() {
  console.log(colors.yellow("Tool developed by the tele Airdrop Hunter Super BianzZz (https://t.me/superbianz)"));

  const { endpoint: hasIDAPI, message } = await checkBaseUrl();
  if (!hasIDAPI) return console.log(`Cannot find ID API, try again later!`.red);
  console.log(`${message}`.yellow);

  const dataFile = path.join(__dirname, "data.txt");
  const data = fs.readFileSync(dataFile, "utf8").replace(/\r/g, "").split("\n").filter(Boolean);
  const waitTime = settings.TIME_SLEEP * 60 * 60;
  while (true) {
    for (let i = 0; i < data.length; i += maxThreads) {
      const batch = data.slice(i, i + maxThreads);

      const promises = batch.map(async (initData, indexInBatch) => {
        const accountIndex = i + indexInBatch;
        const userData = JSON.parse(decodeURIComponent(initData.split("user=")[1].split("&")[0]));
        const firstName = userData.first_name || "";
        const lastName = userData.last_name || "";
        const session_name = userData.id;

        console.log(`=========Account ${accountIndex + 1}| ${firstName + " " + lastName}`.green);
        const client = new Clayton(accountIndex, initData, session_name, hasIDAPI);
        client.set_headers();

        return timeout(client.processAccount(), 60 * 60 * 1000).catch((err) => {
          client.log(`Error processing account: ${err.message}`, "error");
        });
      });
      await Promise.allSettled(promises);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    console.log(`All accounts processed`);
    await wait(waitTime);
  }
}

function timeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
