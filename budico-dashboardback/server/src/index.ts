import "dotenv/config";
import express from "express";
import cors from "cors";
import { portfolioRouter } from "./routes/portfolio.js";
import { sectorsRouter } from "./routes/sectors.js";
import { projectsRouter } from "./routes/projects.js";
import { cosEotRouter } from "./routes/cosEot.js";
import { flagsRouter } from "./routes/flags.js";
import { referenceRouter } from "./routes/reference.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

const origins = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: origins,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "budico-api" });
});

app.use("/api/v1/portfolio", portfolioRouter);
app.use("/api/v1/sectors", sectorsRouter);
app.use("/api/v1/projects", projectsRouter);
app.use("/api/v1/cos-eot", cosEotRouter);
app.use("/api/v1/flags", flagsRouter);
app.use("/api/v1/reference", referenceRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

app.listen(port, () => {
  console.log(`BUIDCO API listening on http://localhost:${port}`);
});
