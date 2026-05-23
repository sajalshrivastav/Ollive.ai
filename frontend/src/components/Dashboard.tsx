import { useEffect, useState } from "react";
import { Activity, CheckCircle, XCircle, Clock, Zap, AlertTriangle } from "lucide-react";
import { getDashboard } from "../api/api";

interface Stats {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
  totalTokensUsed: number;
  requestsByProvider: Record<string, number>;
  requestsByModel: Record<string, number>;
  recentErrors: { model: string; errorMessage: string | null; createdAt: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="no-data">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard">
        <div className="no-data">Failed to load stats.</div>
      </div>
    );
  }

  const successRate = stats.totalRequests > 0
    ? Math.round((stats.successCount / stats.totalRequests) * 100)
    : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Inference Dashboard</h2>
        <p>Real-time metrics from your LLM inference logs</p>
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><Activity size={18} /></div>
          <div className="stat-value">{stats.totalRequests}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={18} /></div>
          <div className="stat-value">{successRate}%</div>
          <div className="stat-label">Success Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><XCircle size={18} /></div>
          <div className="stat-value">{stats.errorCount}</div>
          <div className="stat-label">Errors</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Clock size={18} /></div>
          <div className="stat-value">{stats.avgLatencyMs}ms</div>
          <div className="stat-label">Avg Latency</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Zap size={18} /></div>
          <div className="stat-value">{stats.totalTokensUsed.toLocaleString()}</div>
          <div className="stat-label">Total Tokens</div>
        </div>
      </div>

      {/* By Provider */}
      <div className="section-title"><Activity size={14} /> Requests by Provider</div>
      {Object.keys(stats.requestsByProvider).length === 0 ? (
        <div className="no-data" style={{ marginBottom: 24 }}>No data yet</div>
      ) : (
        <div className="provider-grid" style={{ marginBottom: 24 }}>
          {Object.entries(stats.requestsByProvider).map(([provider, count]) => (
            <div key={provider} className="provider-card">
              <div className="provider-name">{provider}</div>
              <div className="provider-count">{count}</div>
            </div>
          ))}
        </div>
      )}

      {/* By Model */}
      <div className="section-title"><Zap size={14} /> Requests by Model</div>
      {Object.keys(stats.requestsByModel).length === 0 ? (
        <div className="no-data" style={{ marginBottom: 24 }}>No data yet</div>
      ) : (
        <div className="provider-grid" style={{ marginBottom: 24 }}>
          {Object.entries(stats.requestsByModel).map(([model, count]) => (
            <div key={model} className="provider-card">
              <div className="provider-name" style={{ fontSize: 11 }}>{model.split("/")[1] || model}</div>
              <div className="provider-count">{count}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Errors */}
      <div className="section-title"><AlertTriangle size={14} /> Recent Errors</div>
      {stats.recentErrors.length === 0 ? (
        <div className="no-data">No errors — everything is running smoothly 🎉</div>
      ) : (
        <div className="error-list">
          {stats.recentErrors.map((e, i) => (
            <div key={i} className="error-item">
              <div className="error-model">{e.model}</div>
              <div className="error-msg">{e.errorMessage || "Unknown error"}</div>
              <div className="error-time">{new Date(e.createdAt).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
