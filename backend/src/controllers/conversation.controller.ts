import prisma from "../db/prisma";

export async function getConversation(req: any, res: any) {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { messages: true } } }
    });
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch conversations" });
  }
}

export async function createConversation(req: any, res: any) {
  try {
    const { title } = req.body;
    const conversation = await prisma.conversation.create({
      data: { title: title || "New Conversation" }
    });
    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to create conversation" });
  }
}

export async function getMessage(req: any, res: any) {
  try {
    const { id } = req.params;
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" }
    });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to get messages" });
  }
}

export async function cancelConversation(req: any, res: any) {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.update({
      where: { id },
      data: { status: "CANCELLED" }
    });
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to cancel conversation" });
  }
}

export async function deleteConversation(req: any, res: any) {
  try {
    const { id } = req.params;
    await prisma.conversation.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to delete conversation" });
  }
}

export async function updateConversationTitle(req: any, res: any) {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, error: "Title is required" });
    }
    const conversation = await prisma.conversation.update({
      where: { id },
      data: { title: title.trim() }
    });
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update title" });
  }
}
