const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CHROME_EXECUTABLE_PATH = "/usr/bin/chromium";

async function launchBrowser() {
  return await puppeteer.launch({
    headless: "new",
    executablePath: CHROME_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

// Endpoint kiểm tra server
app.get("/", (req, res) => {
  res.json({
    status: "running",
    endpoints: [
      { method: "GET", path: "/full-text?url=URL" },
      { method: "GET", path: "/full-html?url=URL" },
      { method: "GET", path: "/pdf?url=URL" },
      { method: "POST", path: "/multi-elements" },
    ]
  });
});

// Lấy toàn bộ text từ trang web
app.get("/full-text", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "Thiếu tham số url" });
    }

    const browser = await launchBrowser();
    const page = await browser.newPage();
    
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    
    await page.goto(url, { 
      waitUntil: "networkidle2", 
      timeout: 30000 
    });

    const text = await page.evaluate(() => document.body.innerText);
    await browser.close();

    res.json({ success: true, text });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Lấy toàn bộ HTML từ trang web
app.get("/full-html", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "Thiếu tham số url" });
    }

    const browser = await launchBrowser();
    const page = await browser.newPage();
    
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    
    await page.goto(url, { 
      waitUntil: "networkidle2", 
      timeout: 30000 
    });

    const html = await page.content();
    await browser.close();

    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Tạo PDF từ trang web
app.get("/pdf", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "Thiếu tham số url" });
    }

    const browser = await launchBrowser();
    const page = await browser.newPage();
    
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    
    await page.goto(url, { 
      waitUntil: "networkidle2", 
      timeout: 30000 
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Lấy nhiều phần tử cùng lúc
app.post("/multi-elements", async (req, res) => {
  try {
    const { url, selector } = req.body;
    if (!url || !selector) {
      return res.status(400).json({ 
        error: "Thiếu url hoặc selector" 
      });
    }

    const browser = await launchBrowser();
    const page = await browser.newPage();
    
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    
    await page.goto(url, { 
      waitUntil: "networkidle2", 
      timeout: 30000 
    });

    const elements = await page.$$eval(selector, (nodes) => 
      nodes.map((n) => n.innerText)
    );

    await browser.close();

    res.json({ success: true, elements });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
