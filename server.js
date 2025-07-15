import http from "http";
import fs from "fs";
import path from "path";
import url from "url";
import { fileURLToPath } from "url";
import corsAnywhere from "cors-anywhere";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATIC_DIR = path.join(__dirname, "dist");
const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 8080;

// Configure cors-anywhere
const corsProxy = corsAnywhere.createServer({
  originWhitelist: [], // Allow all origins
  requireHeaders: [], // No required headers
  removeHeaders: [
    "cookie",
    "cookie2",
    // Remove other headers that might cause issues
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Set a proper User-Agent
    xfwd: false,
  },
  // Optional: rate limiting
  // setHeaders: {
  //   'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  // }
});

// Create the main server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Handle CORS proxy requests - anything starting with /proxy/
  if (parsedUrl.pathname.startsWith("/proxy/")) {
    // Remove /proxy from the path and let cors-anywhere handle it
    req.url = req.url.replace(/^\/proxy\//, "/");
    // Let cors-anywhere handle the request
    corsProxy.emit("request", req, res);
    return;
  }

  // Handle static file serving for everything else
  serveStaticFile(req, res, parsedUrl);
});

function serveStaticFile(req, res, parsedUrl) {
  // Serve static files
  const safePath = path
    .normalize(decodeURIComponent(parsedUrl.pathname))
    .replace(/^(\.\.[\/\\])+/, "");

  let filePath = path.join(STATIC_DIR, safePath);

  // Check if path exists and is directory, serve index.html
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
  } catch (err) {
    // If STATIC_DIR doesn't exist, create a simple response
    if (!fs.existsSync(STATIC_DIR)) {
      res.writeHead(404, { "Content-Type": "text/html" });
      return res.end(`
        <html>
          <head><title>Server Running</title></head>
          <body>
            <h1>CORS Proxy + Static Server</h1>
            <p>Static directory not found: ${STATIC_DIR}</p>
            <p>CORS proxy available at: <code>/proxy/https://example.com</code></p>
          </body>
        </html>
      `);
    }
  }

  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".pdf": "application/pdf",
  };

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/html" });
        return res.end(`
          <html>
            <head><title>404 Not Found</title></head>
            <body>
              <h1>404 - Not Found</h1>
              <p>File not found: ${parsedUrl.pathname}</p>
              <p>CORS proxy available at: <code>/proxy/https://example.com</code></p>
            </body>
          </html>
        `);
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        return res.end(`Server Error: ${err.message}`);
      }
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

// Graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("\nShutting down gracefully...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forcefully shutting down...");
    process.exit(1);
  }, 5000);
}

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`🔗 CORS proxy available at: /proxy/https://example.com`);
});
