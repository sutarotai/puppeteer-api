const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CHROME_EXECUTABLE_PATH = "/usr/bin/chromium";

// Helper function to launch browser
async function launchBrowser() {
  return await puppeteer.launch({
    headless: "new",
    executablePath: CHROME_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

// 1. API to list all available endpoints
app.get("/api", (req, res) => {
  const endpoints = {
    endpoints: [
      {
        method: "GET",
        path: "/api",
        description: "List all available API endpoints"
      },
      {
        method: "POST",
        path: "/extract",
        description: "Extract content using selector or XPath",
        parameters: {
          url: "string (required)",
          selector: "string (optional)",
          xpath: "string (optional)"
        }
      },
      {
        method: "GET",
        path: "/render",
        description: "Render full page HTML",
        parameters: {
          url: "string (required)"
        }
      },
      {
        method: "GET",
        path: "/full-html",
        description: "Get full page HTML content",
        parameters: {
          url: "string (required)"
        }
      },
      {
        method: "GET",
        path: "/full-text",
        description: "Get full page text content",
        parameters: {
          url: "string (required)"
        }
      },
      {
        method: "GET",
        path: "/pdf",
        description: "Generate PDF of the page",
        parameters: {
          url: "string (required)",
          landscape: "boolean (optional)",
          format: "string (optional, e.g., A4, Letter)",
          scale: "number (optional, e.g., 1.0)"
        }
      },
      {
        method: "POST",
        path: "/multi-elements",
        description: "Get multiple elements content",
        parameters: {
          url: "string (required)",
          selector: "string (required)",
          properties: "array (optional, e.g., ['innerText', 'href'])"
        }
      }
    ]
  };
  res.json(endpoints);
});

// Existing extract endpoint
app.post("/extract", async (req, res) => {
  const { url, selector, xpath } = req.body;

  if (!url || (!selector && !xpath)) {
    return res.status(400).json({ error: "Phải có url và selector hoặc xpath" });
  }

  try {
    const browser = await launchBrowser();
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

// Existing render endpoint
app.get("/render", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url query param");

  try {
    const browser = await launchBrowser();
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

// 2. Full HTML content endpoint
app.get("/full-html", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  try {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const html = await page.content();
    await browser.close();

    res.json({ success: true, html });
  } catch (error) {
    console.error("Error getting full HTML:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Full text content endpoint
app.get("/full-text", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  try {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const text = await page.evaluate(() => document.body.innerText);
    await browser.close();

    res.json({ success: true, text });
  } catch (error) {
    console.error("Error getting full text:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. PDF generation endpoint
app.get("/pdf", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  try {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const pdfOptions = {
      format: req.query.format || 'A4',
      landscape: req.query.landscape === 'true',
      scale: req.query.scale ? parseFloat(req.query.scale) : 1.0,
      printBackground: true
    };

    const pdf = await page.pdf(pdfOptions);
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="page.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error("Error generating PDF:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Multiple elements evaluation endpoint
app.post("/multi-elements", async (req, res) => {
  const { url, selector, properties } = req.body;

  if (!url || !selector) {
    return res.status(400).json({ error: "Missing url or selector parameter" });
  }

  try {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(selector, { timeout: 30000 });

    let elementsData;
    
    if (properties && properties.length > 0) {
      elementsData = await page.$$eval(selector, (elements, props) => {
        return elements.map(el => {
          const result = {};
          props.forEach(prop => {
            if (prop === 'innerText') {
              result[prop] = el.innerText.trim();
            } else if (prop === 'href' && el.hasAttribute('href')) {
              result[prop] = el.getAttribute('href');
            } else if (prop === 'src' && el.hasAttribute('src')) {
              result[prop] = el.getAttribute('src');
            } else if (prop === 'textContent') {
              result[prop] = el.textContent.trim();
            } else if (prop === 'className') {
              result[prop] = el.className;
            } else if (prop === 'id') {
              result[prop] = el.id;
            }
            // Add more properties as needed
          });
          return result;
        });
      }, properties);
    } else {
      elementsData = await page.$$eval(selector, elements => 
        elements.map(el => el.innerText.trim())
      );
    }

    await browser.close();

    res.json({ success: true, elements: elementsData });
  } catch (error) {
    console.error("Error evaluating multiple elements:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Puppeteer Render API is running. Visit /api for endpoints documentation.");
});

app.listen(PORT, () => {
  console.log(`✅ Server is listening on port ${PORT}`);
});
