import { Router } from "express";
import { validateBody } from "../middleware/validateRequest";
import { ingestLog } from "../controllers/ingestion.controller";

const router = Router();

router.post("/", validateBody(["sessionId",  "provider", "model", "status", "latencyMs"]), ingestLog)

export default router