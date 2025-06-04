const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const { executablePath } = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post("/render", async (req, res) => {
  const { url } = req.body;
  if (!url || !/^https?:\/\//.test(url)) {
    return res.status(400).json({ error: "Missing or invalid URL" });
  }

  try {
    const browser = await puppeteer.launch({
      executablePath: executablePath(), // tìm Chromium trong hệ thống
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    const html = await page.content();
    await browser.close();

    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Puppeteer API server is up!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
