const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const app = express();
const userAgent = require('user-agents');

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CHROME_EXECUTABLE_PATH = "/usr/bin/chromium";

// Cấu hình Puppeteer nâng cao
const stealthConfig = {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certificate-errors",
    "--ignore-certificate-errors-spki-list",
    "--disable-web-security",
    "--disable-features=IsolateOrigins,site-per-process",
    "--disable-blink-features=AutomationControlled"
  ],
  headless: "new",
  executablePath: CHROME_EXECUTABLE_PATH,
  ignoreHTTPSErrors: true,
};

// Middleware giả lập trình duyệt
const emulateBrowser = async (page) => {
  // Sử dụng user-agent ngẫu nhiên
  const randomUserAgent = new userAgent({ deviceCategory: 'desktop' });
  await page.setUserAgent(randomUserAgent.toString());
  
  // Che dấu dấu hiệu Puppeteer
  await page.evaluateOnNewDocument(() => {
    delete navigator.__proto__.webdriver;
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  // Thiết lập viewport ngẫu nhiên
  await page.setViewport({
    width: 1280 + Math.floor(Math.random() * 100),
    height: 800 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: false,
  });

  // Thêm header HTTP ngẫu nhiên
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Upgrade-Insecure-Requests': '1',
  });
};

app.post("/extract-all-text", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Phải có URL" });
  }

  let browser;
  try {
    browser = await puppeteer.launch(stealthConfig);
    const page = await browser.newPage();
    
    // Áp dụng các biện pháp giả lập
    await emulateBrowser(page);
    
    // Thêm delay ngẫu nhiên giữa các hành động
    await page.goto(url, { 
      waitUntil: "networkidle2", 
      timeout: 120000,
      referer: 'https://www.google.com/',
    });

    // Thêm delay giả lập người dùng
    await page.waitForTimeout(2000 + Math.random() * 3000);
    
    // Lấy nội dung với cách tiếp cận ẩn danh
    const content = await page.evaluate(() => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNode(document.body);
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    });

    await browser.close();
    return res.json({ success: true, content });
  } catch (error) {
    console.error("Lỗi:", error);
    if (browser) await browser.close();
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get("/render", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url query param");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const html = await page.content();

    await browser.close();

    res.set("Content-Type", "text/html");
    return res.send(html);
  } catch (error) {
    console.error("Lỗi Puppeteer /render:", error.message);
    return res.status(500).send("Error: " + error.message);
  }
});

app.get("/", (req, res) => {
  res.send("✅ Puppeteer Render API is running.");
});

app.listen(PORT, () => {
  console.log(`✅ Server is listening on port ${PORT}`);
});
