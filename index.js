const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const app = express();

const PORT = process.env.PORT || 3000;
const CHROME_EXECUTABLE_PATH = "/usr/bin/chromium"; // Railway, Render dùng path này

app.use(cors());
app.use(express.json());

// 🧠 1. Trả về content theo selector/xpath (ẩn, mã hóa)
app.post("/extract", async (req, res) => {
  const { url, selector, xpath } = req.body;
  if (!url || (!selector && !xpath)) return res.status(400).json({ error: "Phải có url và selector hoặc xpath" });

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 ... Chrome/115.0 Safari/537.36");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    let content;
    if (selector) {
      await page.waitForSelector(selector, { timeout: 30000 });
      content = await page.$eval(selector, el => el.innerText.trim());
    } else if (xpath) {
      await page.waitForXPath(xpath, { timeout: 30000 });
      const [el] = await page.$x(xpath);
      content = await page.evaluate(el => el.textContent.trim(), el);
    }

    await browser.close();
    return res.json({ success: true, content });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 📰 2. Trả về HTML sau render JS
app.get("/render", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Thiếu url");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 ... Chrome/115.0 Safari/537.36");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const html = await page.content();
    await browser.close();

    res.set("Content-Type", "text/html");
    return res.send(html);
  } catch (error) {
    return res.status(500).send("Error: " + error.message);
  }
});

// 📜 3. Trả về document.body.innerText
app.get("/innertext", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Thiếu url");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const innerText = await page.evaluate(() => document.body.innerText);
    await browser.close();

    return res.json({ success: true, text: innerText });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 📄 4. Trả về PDF của trang
app.get("/pdf", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Thiếu url");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const pdf = await page.pdf({ format: "A4" });
    await browser.close();

    res.set({ "Content-Type": "application/pdf" });
    return res.send(pdf);
  } catch (error) {
    return res.status(500).send("Lỗi: " + error.message);
  }
});

// 💡 5. Trả về danh sách nội dung theo nhiều selector
app.post("/multi", async (req, res) => {
  const { url, selector } = req.body;
  if (!url || !selector) return res.status(400).json({ error: "Thiếu url hoặc selector" });

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const results = await page.$$eval(selector, els => els.map(e => e.innerText.trim()));
    await browser.close();

    return res.json({ success: true, results });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Root check
app.get("/", (req, res) => {
  res.send("✅ Puppeteer API is running.");
});

app.listen(PORT, () => {
  console.log("✅ Listening on port", PORT);
});
