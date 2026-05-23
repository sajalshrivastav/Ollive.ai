import { Request, Response } from "express";
import prisma from "../db/prisma";

export async function ingestLog(req: Request, res: Response) {

    try {
        const body = req.body
        const log = await prisma.inferenceLog.create({
            data: {
                conversationId: body.conversationId || null,
                sessionId: body.sessionId,
                provider: body.provider,
                model: body.model,
                status: body.status,
                latencyMs: body.latencyMs,
                promptTokens: body.promptTokens || null,
                completionTokens: body.completionTokens || null,
                totalTokens: body.totalTokens || null,
                inputPreview: body.inputPreview || null,
                outputPreview: body.outputPreview || null,
                errorMessage: body.errorMessage || null,
                metadata: body.metadata || {},
            },
        });

        res.status(201).json({ success: true, logId: log.id })
    } catch (error) {
        console.log("Ingestion error:", error);
        res.status(500).json({ success: false, error: "Failed to store log" });
    }

}