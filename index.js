const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CHROME_EXECUTABLE_PATH = "/usr/bin/chromium"; // optional, thêm nếu biết chính xác

app.post("/extract", async (req, res) => {
  const { url, selector, xpath } = req.body;

  if (!url || (!selector && !xpath)) {
    return res.status(400).json({ error: "Phải có url và selector hoặc xpath" });
  }

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

    let content;

    if (selector) {
      await page.waitForSelector(selector, { timeout: 30000 });
      content = await page.$eval(selector, el => el.innerText.trim());
    } else if (xpath) {
      await page.waitForXPath(xpath, { timeout: 30000 });
      const [elHandle] = await page.$x(xpath);
      content = await page.evaluate(el => el.textContent.trim(), elHandle);
    }

    await browser.close();

    return res.json({ success: true, content });
  } catch (error) {
    console.error("Lỗi Puppeteer:", error.message);
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
