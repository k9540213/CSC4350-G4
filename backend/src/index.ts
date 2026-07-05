import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { applicationsRouter } from "./routes/applications";
import { statusEventsRouter } from "./routes/status-events";
import { usersRouter } from "./routes/users";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors({
  origin: process.env.CLIENT_URL ?? "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/applications", statusEventsRouter);
app.use("/api/users", usersRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Pathway backend running on port ${PORT}`);
});
