import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { buildWorkflow, executeWorkflow, buildContractClientFromEnv } from "./workflow.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Serve the frontend logo as favicon to satisfy /favicon.ico requests
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 256 256" fill="none">
  <defs>
    <linearGradient id="tb-bg" x1="32" y1="12" x2="212" y2="244" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0E1116" />
      <stop offset="1" stop-color="#1C2230" />
    </linearGradient>
    <linearGradient id="tb-accent" x1="72" y1="44" x2="196" y2="200" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7FD1AE" />
      <stop offset="1" stop-color="#5FBF9A" />
    </linearGradient>
    <radialGradient id="tb-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(128 128) rotate(90) scale(94)">
      <stop stop-color="#7FD1AE" stop-opacity="0.45" />
      <stop offset="1" stop-color="#7FD1AE" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect x="12" y="12" width="232" height="232" rx="56" fill="url(#tb-bg)" />
  <rect x="24" y="24" width="208" height="208" rx="48" fill="#0E1116" opacity="0.55" />

  <circle cx="128" cy="128" r="94" fill="url(#tb-glow)" />
  <circle cx="128" cy="128" r="82" stroke="url(#tb-accent)" stroke-width="9" fill="none" />
  <circle cx="128" cy="128" r="62" stroke="#1F2632" stroke-width="4" fill="#0F141E" />

  <path d="M78 106c24-14 48-21 64-21s40 7 64 21" stroke="#7FD1AE" stroke-width="10" stroke-linecap="round" fill="none" />
  <path d="M78 150c24 14 48 21 64 21s40-7 64-21" stroke="#5FBF9A" stroke-width="10" stroke-linecap="round" stroke-opacity="0.85" fill="none" />

  <path d="M116 82v92" stroke="#E6EAF0" stroke-width="8" stroke-linecap="round" />
  <path d="M140 90v76" stroke="#7FD1AE" stroke-width="8" stroke-linecap="round" />

  <circle cx="128" cy="128" r="10" fill="#7FD1AE" />
  <circle cx="128" cy="128" r="4" fill="#0E1116" />

  <circle cx="88" cy="96" r="5" fill="#7FD1AE" />
  <circle cx="168" cy="160" r="5" fill="#7FD1AE" />
</svg>`;

app.get("/favicon.ico", (_req, res) => {
  res.type("image/svg+xml").send(faviconSvg);
});

// Friendly landing page for the backend API
app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Tracebound Backend API</title>
      <style>
        body { margin: 0; padding: 32px; font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f141d; color: #e6eaf0; }
        .card { max-width: 720px; margin: 0 auto; padding: 28px; border-radius: 16px; background: linear-gradient(145deg, #111724 0%, #0b0f17 100%); border: 1px solid #1f2632; box-shadow: 0 16px 48px rgba(0,0,0,0.35); }
        .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(127, 209, 174, 0.14); color: #7fd1ae; border: 1px solid rgba(127, 209, 174, 0.28); font-weight: 600; font-size: 13px; }
        .title { margin: 18px 0 8px; font-size: 24px; font-weight: 700; letter-spacing: 0.2px; }
        .muted { color: #9aa5b5; font-size: 14px; line-height: 1.6; }
        .links { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px; }
        a { color: #7fd1ae; text-decoration: none; padding: 10px 14px; border: 1px solid rgba(127,209,174,0.35); border-radius: 10px; transition: all 0.15s ease; background: rgba(127,209,174,0.06); }
        a:hover { background: rgba(127,209,174,0.12); border-color: rgba(127,209,174,0.55); }
        .code { margin-top: 18px; padding: 14px; background: #0b0f17; border: 1px solid #1f2632; border-radius: 10px; font-family: Consolas, Monaco, "SFMono-Regular", monospace; font-size: 13px; color: #cdd5e0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">Tracebound • Backend API</div>
        <div class="title">Service is running</div>
        <div class="muted">This is the backend API for Tracebound. Use the endpoints below or visit /health for on-chain status.</div>
        <div class="links">
          <a href="/health">Health</a>
          <a href="/workflow/parse">/workflow/parse</a>
          <a href="/workflow/execute">/workflow/execute</a>
        </div>
        <div class="code">POST /workflow/parse  { "instruction": "..." }<br/>POST /workflow/execute  { "instruction": "..." }</div>
      </div>
    </body>
  </html>`);
});

const contractClient = buildContractClientFromEnv(process.env);

app.get("/health", (_req, res) => {
  const onchain = contractClient.isEnabled();
  res.json({
    status: "ok",
    onchain,
    contractAddress: onchain && contractClient.contract ? contractClient.contract.target : null,
    rpcConfigured: Boolean(process.env.RPC_URL),
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.post("/workflow/parse", (req, res) => {
  const instruction = (req.body?.instruction || "").trim();
  if (!instruction) return res.status(400).json({ error: "instruction required" });
  res.json({ workflow: buildWorkflow(instruction) });
});

app.post("/workflow/execute", async (req, res) => {
  try {
    const instruction = (req.body?.instruction || "").trim();
    if (!instruction) return res.status(400).json({ error: "instruction required" });

    const result = await executeWorkflow(instruction, contractClient);
    res.json(result);
  } catch (err) {
    console.error("execution error", err);
    res.status(500).json({ error: "execution failed", detail: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Tracebound backend listening on :${port}`);
});
