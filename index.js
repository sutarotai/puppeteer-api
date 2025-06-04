const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CHROME_EXECUTABLE_PATH = "/usr/bin/chromium";

app.post("/render", async (req, res) => {
  const { url } = req.body;

  if (!url || !/^https?:\/\//.test(url)) {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: "new"
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const html = await page.content();

    await browser.close();
    res.status(200).send(html);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Puppeteer Render API is running.");
});

app.listen(PORT, () => {
  console.log(`✅ Server is listening on port ${PORT}`);
});
