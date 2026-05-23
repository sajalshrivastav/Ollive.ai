import { Request, Response } from "express";
import prisma from "../db/prisma";

export async function getDashboardStats(req: any, res: any) {
    try {

        const logs = await prisma.inferenceLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 1000
        })
        const totalRequests = logs.length;
        const successCount = logs.filter((l: any) => l.status === "SUCCESS").length;
        const errorCount = logs.filter((l: any) => l.status === "ERROR").length;

        const avgLatencyMs =
            totalRequests > 0
                ? Math.round(logs.reduce((sum: any, l: any) => sum + l.latencyMs, 0) / totalRequests)
                : 0;

        const totalTokensUsed = logs.reduce(
            (sum: any, l: any) => sum + (l.totalTokens || 0),
            0
        )
        // Count requests per provider
        const requestsByProvider: Record<string, number> = {};
        logs.forEach((l: any) => {
            requestsByProvider[l.provider] =
                (requestsByProvider[l.provider] || 0) + 1;
        });

        // Count requests per model
        const requestsByModel: Record<string, number> = {};
        logs.forEach((l: any) => {
            requestsByModel[l.model] = (requestsByModel[l.model] || 0) + 1;
        });

        // Last 5 errors
        const recentErrors = logs
            .filter((l: any) => l.status === "ERROR")
            .slice(0, 5)
            .map((l: any) => ({
                model: l.model,
                errorMessage: l.errorMessage,
                createdAt: l.createdAt,
            }));

        res.json({
            success: true,
            data: {
                totalRequests,
                successCount,
                errorCount,
                avgLatencyMs,
                totalTokensUsed,
                requestsByProvider,
                requestsByModel,
                recentErrors,
            },
        });


    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to fetch dashboard stats" });
    }
}