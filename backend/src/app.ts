import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";


import ChatRoute from "./routes/chat.routes" 
import DashboardRoute from "./routes/dashboard.routes"
import IngestionRoute from "./routes/ingestion.routes" 
import ConversationRoute from "./routes/conversation.routes" 
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet({contentSecurityPolicy:false}));
const allowedOrigins = process.env.NODE_ENV === "production"
  ? [
      process.env.FRONTEND_URL || "",
      "https://ollive-ai.netlify.app",
    ].filter(Boolean)
  : ["*"];

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? allowedOrigins : "*",
  credentials: true,
}));
app.use(express.json({limit:"2mb"}))
app.use(morgan("dev"));


// Routes

app.use("/api/chat", ChatRoute)
app.use("/api/conversation", ConversationRoute)
app.use("/api/ingest", IngestionRoute)
app.use("/api/dashboard", DashboardRoute)

app.get("/health", (_req, _res)=>{
      _res.json({ status: "ok", timestamp: new Date().toISOString() });
})

app.use(errorHandler);



export default app