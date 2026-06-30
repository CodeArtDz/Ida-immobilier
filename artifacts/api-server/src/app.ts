import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { logEmailConfig } from "./lib/mailer";

// Legacy local upload dir (uploads now go to object storage). Kept portable and
// optional: on serverless hosts (Vercel) the dir may not exist, in which case
// express.static simply 404s and falls through.
const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/uploads", express.static(UPLOADS_DIR));

app.use("/api", router);

// Surface email transport/sender config once at startup (and on each Vercel
// cold start) so deployment logs reveal misconfiguration before a real send.
logEmailConfig();

export default app;
