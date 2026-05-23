import { Request, Response } from "express";
import prisma from "../db/prisma";
import { callLLM, callLLMStream } from "../sdk/llmClient";
import { v4 as uuidv4 } from "uuid";

// POST /api/chat — send a message and get AI response
export async function sendMessage(req: Request, res: Response) {
  const { conversationId, message, model, provider, stream } = req.body;

  try {
    // Save user message to DB
    await prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content: message,
      },
    });

    // Get full conversation history for context
    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    const messages = history.map((m:any) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    const sessionId = uuidv4();

    // STREAMING response
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullContent = "";

      const generator = callLLMStream({
        provider,
        model,
        messages,
        conversationId,
        sessionId,
      });

      for await (const chunk of generator) {
        fullContent += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      // Save assistant message after streaming completes
      await prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: fullContent,
        },
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // NON-STREAMING response
    const result = await callLLM({
      provider,
      model,
      messages,
      conversationId,
      sessionId,
    });

    // Save assistant message to DB
    await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: result.content,
      },
    });

    res.json({
      success: true,
      data: {
        content: result.content,
        model: result.model,
        usage: result.usage,
        latencyMs: result.latencyMs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send message";
    res.status(500).json({ success: false, error: message });
  }
}
