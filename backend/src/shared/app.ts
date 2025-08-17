import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bookingsRouter from "../module/bookings/bookings.routes";
import clientsRouter from "../module/clients/clients.routes";
import { errorHandler, notFound } from "./http";
import { applyHttpLogger } from "./logger"; 

dotenv.config();

const app = express();

applyHttpLogger(app); 

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? [
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/clients", clientsRouter);
app.use("/api/bookings", bookingsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
