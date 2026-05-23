import { Router } from "express";
import {
  cancelConversation,
  createConversation,
  getConversation,
  getMessage,
  deleteConversation,
  updateConversationTitle,
} from "../controllers/conversation.controller";

const router = Router();

router.get("/", getConversation);
router.post("/", createConversation);
router.get("/:id/messages", getMessage);
router.patch("/:id/cancel", cancelConversation);
router.patch("/:id/title", updateConversationTitle);
router.delete("/:id", deleteConversation);

export default router;
