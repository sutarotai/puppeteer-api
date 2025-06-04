const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const app = express();

const PORT = process.env.PORT || 3000;
const CHROME_EXECUTABLE_PATH = "/usr/bin/chromium"; // hoặc bỏ dòng này nếu dùng chromium mặc định

app.use(cors());
app.use(express.json());

// 1. API trả về dữ liệu JSON ẩn trong web (ví dụ dùng evaluate chạy JS trong page)
app.post("/api", async (req, res) => {
  const { url, jsCode } = req.body;
  if (!url || !jsCode)
    return res.status(400).json({ error: "Missing url or jsCode in body" });

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Thực thi jsCode trên trang, trả về kết quả JSON
    // jsCode là chuỗi JS vd: "return window.__MYDATA__;"
    const result = await page.evaluate(new Function(jsCode));

    await browser.close();

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error /api:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Trả về HTML đã render (page.content)
app.get("/content", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const html = await page.content();

    await browser.close();

    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Error /content:", error.message);
    res.status(500).send("Error: " + error.message);
  }
});

// 3. Trả về document.body.innerText
app.get("/innertext", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

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

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(innerText);
  } catch (error) {
    console.error("Error /innertext:", error.message);
    res.status(500).send("Error: " + error.message);
  }
});

// 4. Trả về PDF của trang
app.get("/pdf", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const pdfBuffer = await page.pdf({ format: "A4" });

    await browser.close();

    res.set("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error /pdf:", error.message);
    res.status(500).send("Error: " + error.message);
  }
});

// 5. Trả về kết quả page.$$eval(selector, pageFunction)
// Ví dụ truy vấn nhiều element selector, chạy JS map lấy text, trả về JSON
// Sử dụng POST với body: { url, selector, fnString }
// fnString là string của function có 1 tham số (elements)
app.post("/eval", async (req, res) => {
  const { url, selector, fnString } = req.body;
  if (!url || !selector || !fnString)
    return res.status(400).json({ error: "Missing url, selector or fnString" });

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Chuyển fnString thành function
    const fn = new Function("elements", fnString);

    const result = await page.$$eval(selector, fn);

    await browser.close();

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error /eval:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Puppeteer API Server listening on port ${PORT}`);
});
