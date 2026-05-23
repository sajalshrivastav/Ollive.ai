import { Router } from "express";
import { sendMessage } from "../controllers/chat.controller";
import { validateBody } from "../middleware/validateRequest";


const router = Router();
router.post("/", validateBody(["conversationId", "message", "model", "provider"]), sendMessage);

export default router;