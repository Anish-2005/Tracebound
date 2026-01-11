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
