import prisma from "../db/prisma";

export async function getDashboardStats(_req: any, res: any) {
  try {
    const logs = await prisma.inferenceLog.findMany({
      orderBy: { createdAt: "asc" },
      take: 1000,
    });

    const totalRequests = logs.length;
    const successCount = logs.filter((l) => l.status === "SUCCESS").length;
    const errorCount = logs.filter((l) => l.status === "ERROR").length;
    const cancelledCount = logs.filter((l) => l.status === "CANCELLED").length;

    const avgLatencyMs =
      totalRequests > 0
        ? Math.round(logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalRequests)
        : 0;

    const totalTokensUsed = logs.reduce((sum, l) => sum + (l.totalTokens || 0), 0);

    // Requests by provider
    const requestsByProvider: Record<string, number> = {};
    logs.forEach((l) => {
      requestsByProvider[l.provider] = (requestsByProvider[l.provider] || 0) + 1;
    });

    // Requests by model
    const requestsByModel: Record<string, number> = {};
    logs.forEach((l) => {
      requestsByModel[l.model] = (requestsByModel[l.model] || 0) + 1;
    });

    // Time series — latency per request (last 20)
    const latencySeries = logs.slice(-20).map((l, i) => ({
      index: i + 1,
      latency: l.latencyMs,
      time: new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: l.status,
    }));

    // Throughput — requests per hour (last 24 hours)
    const now = Date.now();
    const throughputMap: Record<string, number> = {};
    logs.forEach((l) => {
      const age = now - new Date(l.createdAt).getTime();
      if (age <= 24 * 60 * 60 * 1000) {
        const hour = new Date(l.createdAt).getHours();
        const label = `${hour}:00`;
        throughputMap[label] = (throughputMap[label] || 0) + 1;
      }
    });
    const throughputSeries = Object.entries(throughputMap).map(([hour, count]) => ({ hour, count }));

    // Recent errors
    const recentErrors = logs
      .filter((l) => l.status === "ERROR")
      .slice(-5)
      .reverse()
      .map((l) => ({
        model: l.model,
        provider: l.provider,
        errorMessage: l.errorMessage,
        latencyMs: l.latencyMs,
        createdAt: l.createdAt,
      }));

    res.json({
      success: true,
      data: {
        totalRequests,
        successCount,
        errorCount,
        cancelledCount,
        avgLatencyMs,
        totalTokensUsed,
        requestsByProvider,
        requestsByModel,
        latencySeries,
        throughputSeries,
        recentErrors,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch dashboard stats" });
  }
}
