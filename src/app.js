import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

// routes
import userRouter from "./routes/v1/user.routes.js";
import videRouter from "./routes/v1/video.routes.js";

// routing
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videRouter);

export { app };
