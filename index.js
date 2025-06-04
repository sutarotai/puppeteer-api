const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const app = express();

const PORT = process.env.PORT || 3000;

// Danh sách user-agent cố định (không cần cài package)
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0"
];

app.use(cors());
app.use(express.json());

const CHROME_EXECUTABLE_PATH = "/usr/bin/chromium";

app.post("/extract-all-text", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Phải có URL" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    
    // Chọn ngẫu nhiên 1 user-agent
    const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    await page.setUserAgent(randomUserAgent);

    // Che dấu Puppeteer
    await page.evaluateOnNewDocument(() => {
      delete navigator.__proto__.webdriver;
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto(url, { 
      waitUntil: "networkidle2", 
      timeout: 60000 
    });

    // Delay giả lập người dùng
    await page.waitForTimeout(2000);
    
    const content = await page.evaluate(() => {
      return document.body.innerText;
    });

    await browser.close();
    return res.json({ success: true, content });
  } catch (error) {
    console.error("Lỗi:", error.message);
    if (browser) await browser.close();
    return res.status(500).json({ success: false, error: error.message });
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
