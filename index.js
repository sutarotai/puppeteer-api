const express = require("express");
const puppeteer = require("puppeteer-core");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CHROME_EXECUTABLE_PATH = "/usr/bin/chromium"; // Railway dùng chromium gói sẵn

// ✅ 1. Trả về API bị ẩn (bắt các request JSON)
app.post("/api-capture", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Thiếu URL" });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const apiResponses = [];

  page.on("response", async (response) => {
    const req = response.request();
    const type = response.headers()["content-type"] || "";
    if (type.includes("application/json")) {
      try {
        const data = await response.json();
        apiResponses.push({
          url: req.url(),
          data,
        });
      } catch {}
    }
  });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForTimeout(5000); // chờ cho API chạy

  await browser.close();
  return res.json({ success: true, apiResponses });
});

// ✅ 2. Trả về page.content() — toàn HTML đã render
app.post("/html", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Thiếu URL" });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  const html = await page.content();
  await browser.close();
  return res.send(html);
});

// ✅ 3. Trả về document.body.innerText — toàn bộ văn bản
app.post("/text", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Thiếu URL" });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  const text = await page.evaluate(() => document.body.innerText);
  await browser.close();
  return res.send(text);
});

// ✅ 4. Trả về PDF của toàn trang
app.post("/pdf", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Thiếu URL" });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=page.pdf");
  return res.send(pdfBuffer);
});

// ✅ 5. Trả về nhiều phần tử theo selector (mảng nội dung)
app.post("/extract-list", async (req, res) => {
  const { url, selector } = req.body;
  if (!url || !selector) return res.status(400).json({ error: "Thiếu URL hoặc selector" });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  await page.waitForSelector(selector, { timeout: 20000 });
  const items = await page.$$eval(selector, els => els.map(el => el.innerText.trim()));

  await browser.close();
  return res.json({ success: true, items });
});

// ✅ Root
app.get("/", (req, res) => {
  res.send("🧠 Puppeteer API Server is running.");
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
