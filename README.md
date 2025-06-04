# Puppeteer API Server

Free server to render HTML using Puppeteer (like Browserless), deployable to Railway.

## API

### `POST /render`

**Body:**

```json
{
  "url": "https://example.com"
}
