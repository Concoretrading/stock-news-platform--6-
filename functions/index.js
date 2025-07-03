const vision = require("@google-cloud/vision");
const Fuse = require("fuse.js");
const admin = require("firebase-admin");
const {onObjectFinalized} = require("firebase-functions/v2/storage");
const functions = require("firebase-functions");

// Initialize Vision API client
const client = new vision.ImageAnnotatorClient();

// Load tickers dataset (you'll need to include this in your function)
const tickers = require("./tickers.json");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.ocrProcessor = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const {imageData} = req.body;
    if (!imageData) {
      res.status(400).json({error: "No image data provided"});
      return;
    }

    const imageBuffer = Buffer.from(imageData, "base64");
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    const extractedTextRaw = detections && detections.length > 0 ?
      detections[0].description : "";
    const extractedText = extractedTextRaw || "";

    const fuse = new Fuse(tickers, {
      keys: ["ticker", "name"],
      threshold: 0.3,
      includeScore: true,
    });
    const results = fuse.search(extractedText);
    const matches = results
      .filter((r) => 1 - r.score > 0.6)
      .map((r) => ({
        ticker: r.item.ticker,
        company: r.item.name,
        confidence: 1 - r.score,
      }));

    const lines = extractedText.split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    let headline = "";
    if (matches.length > 0) {
      const idx = lines.findIndex((line) =>
        matches.some((m) =>
          line.includes(m.ticker) ||
                  line.toLowerCase().includes(m.company.toLowerCase()),
        ),
      );
      if (idx !== -1 && lines[idx + 1]) {
        headline = lines[idx + 1];
      }
    }

    const dateMatch = extractedText.match(/\d{4}-\d{2}-\d{2}/);
    const date = dateMatch ? dateMatch[0] : new Date().toISOString().split("T")[0];
    const priceMatch = extractedText.match(/\$([0-9,.]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : null;
    const sourceMatch = extractedText.match(/Source: (.+)/i);
    const source = sourceMatch ? sourceMatch[1].trim() : "";

    res.status(200).json({
      success: true,
      extractedText,
      matches,
      headline,
      date,
      price,
      source,
    });
  } catch (error) {
    console.error("OCR processing error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process image",
      details: error.message,
    });
  }
});

exports.testFunction = (req, res) => {
  res.json({
    success: true,
    message: "Test function is working!",
    timestamp: new Date().toISOString(),
  });
};

// Replace the old trigger with the new modular API
exports.processScreenshotUpload = onObjectFinalized(async (event) => {
  const object = event.data;
  const filePath = object.name; // e.g., users/{userId}/stocks/{stockSymbol}/catalysts/{imageName}
  if (!filePath.startsWith("users/")) return null; // Only process relevant uploads

  // Parse userId and stockSymbol from the path
  const match = filePath.match(
    /^users\/([^/]+)\/stocks\/([^/]+)\/catalysts\/(.+)$/,
  );
  if (!match) return null;
  const userId = match[1];
  const stockSymbol = match[2];
  const imageName = match[3];

  // Download the image file to a temp location
  const bucket = admin.storage().bucket(object.bucket);
  const tempFilePath = `/tmp/${imageName}`;
  await bucket.file(filePath).download({destination: tempFilePath});

  // Run OCR using Vision API
  const [result] = await client.textDetection(tempFilePath);
  const detections = result.textAnnotations;
  const extractedTextRaw = detections && detections.length > 0 ?
    detections[0].description : "";
  const extractedText = extractedTextRaw || "";

  // Ticker/company extraction (reuse fuse.js logic)
  const fuse = new Fuse(tickers, {
    keys: ["ticker", "name"],
    threshold: 0.3,
    includeScore: true,
  });
  const results = fuse.search(extractedText);
  const matches = results
    .filter((r) => 1 - r.score > 0.6)
    .map((r) => ({
      ticker: r.item.ticker,
      company: r.item.name,
      confidence: 1 - r.score,
    }));

  // Headline/date/price/source extraction (reuse logic)
  const lines = extractedText.split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let headline = "";
  if (matches.length > 0) {
    const idx = lines.findIndex((line) =>
      matches.some((m) =>
        line.includes(m.ticker) ||
        line.toLowerCase().includes(m.company.toLowerCase()),
      ),
    );
    if (idx !== -1 && lines[idx + 1]) {
      headline = lines[idx + 1];
    }
  }
  const dateMatch = extractedText.match(/\d{4}-\d{2}-\d{2}/);
  const date = dateMatch ? dateMatch[0] : new Date().toISOString().split("T")[0];
  const priceMatch = extractedText.match(/\$([0-9,.]+)/);
  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : null;
  const sourceMatch = extractedText.match(/Source: (.+)/i);
  const source = sourceMatch ? sourceMatch[1].trim() : "";

  // Write to Firestore under stocks/{stockSymbol}/catalysts
  await db.collection("stocks")
    .doc(stockSymbol)
    .collection("catalysts")
    .add({
      userId,
      headline,
      date,
      imagePath: filePath,
      price,
      source,
      extractedText,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    );

  console.log(
    `Processed screenshot for user ${userId}, stock ${stockSymbol}, image ${imageName}`,
  );
  return null;
});
