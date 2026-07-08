import "dotenv/config";

// Prevent google-auth-library from routing through any system proxy
delete process.env.HTTPS_PROXY;
delete process.env.https_proxy;
delete process.env.HTTP_PROXY;
delete process.env.http_proxy;

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { applicationsRouter } from "./routes/applications";
import { statusEventsRouter } from "./routes/status-events";
import { usersRouter } from "./routes/users";
import { gmailRouter } from "./routes/gmail";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 3000;

const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/applications", statusEventsRouter);
app.use("/api/users", usersRouter);
app.use("/api/gmail", gmailRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Pathway backend running on port ${PORT}`);
});
