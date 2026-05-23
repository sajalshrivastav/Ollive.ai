export interface DashboardStats {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
  totalTokensUsed: number;
  requestsByProvider: Record<string, number>;
  requestsByModel: Record<string, number>;
  recentErrors: {
    model: string;
    errorMessage: string | null;
    createdAt: Date;
  }[];
}