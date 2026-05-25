import { useEffect, useState } from "react";
import {
  Activity, CheckCircle, XCircle, Clock, Zap, RefreshCw,
  BarChart2, Search, Filter
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { getDashboard } from "../api/api";

interface Stats {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  cancelledCount?: number;
  avgLatencyMs: number;
  totalTokensUsed: number;
  requestsByProvider: Record<string, number>;
  requestsByModel: Record<string, number>;
  latencySeries?: { index: number; latency: number; time: string; status: string }[];
  recentErrors?: { model: string; provider: string; errorMessage: string | null; latencyMs: number; createdAt: string }[];
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
};

// Custom label in center of donut
const renderCenterLabel = ({ cx, cy, successRate }: any) => (
  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
    <tspan x={cx} dy="-6" fontSize="22" fontWeight="800" fill="#1e3a2f">{successRate}%</tspan>
    <tspan x={cx} dy="20" fontSize="11" fill="#9090a8">SUCCESS</tspan>
  </text>
);

type LogFilter = "all" | "success" | "error";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [logFilter, setLogFilter] = useState<LogFilter>("all");

  const load = () => {
    setLoading(true);
    getDashboard()
      .then((res) => { setStats(res.data.data); setLastUpdated(new Date()); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="db-wrap">
      <div className="db-loading">
        <RefreshCw size={22} className="db-spin" color="#1e3a2f" />
        <span>Loading dashboard...</span>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="db-wrap"><div className="db-loading">Failed to load stats.</div></div>
  );

  const successRate = stats.totalRequests > 0
    ? Math.round((stats.successCount / stats.totalRequests) * 100) : 0;

  const latencySeries = stats.latencySeries || [];
  const recentErrors = stats.recentErrors || [];

  // Provider progress bars
  const maxProvider = Math.max(...Object.values(stats.requestsByProvider || {}), 1);
  const providerEntries = Object.entries(stats.requestsByProvider || {});

  // Model progress bars
  const maxModel = Math.max(...Object.values(stats.requestsByModel || {}), 1);
  const modelEntries = Object.entries(stats.requestsByModel || {});

  // Pie data
  const pieData = [
    { name: "Success", value: stats.successCount || 0 },
    { name: "Error", value: stats.errorCount || 0 },
  ].filter(d => d.value > 0);

  // Logs for table
  const allLogs = latencySeries.slice().reverse();
  const filteredLogs = allLogs.filter(l => {
    if (logFilter === "success") return l.status === "SUCCESS";
    if (logFilter === "error") return l.status === "ERROR";
    return true;
  });

  return (
    <div className="db-wrap">

      {/* Top bar */}
      <div className="db-topbar">
        <div className="db-search">
          <Search size={13} color="#9090a8" />
          <input placeholder="Search queries..." className="db-search-input" />
        </div>
        <div className="db-topbar-right">
          <button className="db-refresh-btn" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="db-header">
        <h1 className="db-title">{getGreeting()}, Ollive AI</h1>
        <p className="db-subtitle">Monitor your LLM inference metrics in real time.</p>
      </div>

      {/* Stat Cards */}
      <div className="db-cards">
        <div className="db-card">
          <div className="db-card-icon-row">
            <div className="db-card-icon green"><Activity size={15} /></div>
            <BarChart2 size={18} color="#c8e6d4" />
          </div>
          <div className="db-card-label">TOTAL REQUESTS</div>
          <div className="db-card-value">{stats.totalRequests}</div>
        </div>

        <div className="db-card">
          <div className="db-card-icon-row">
            <div className="db-card-icon green"><CheckCircle size={15} /></div>
            <span className="db-badge db-badge--success">● Stable</span>
          </div>
          <div className="db-card-label">SUCCESS RATE</div>
          <div className="db-card-value">{successRate}%</div>
        </div>

        <div className="db-card">
          <div className="db-card-icon-row">
            <div className="db-card-icon orange"><Clock size={15} /></div>
          </div>
          <div className="db-card-label">AVG LATENCY</div>
          <div className="db-card-value">
            {stats.avgLatencyMs >= 1000
              ? `${(stats.avgLatencyMs / 1000).toFixed(1)}s`
              : `${stats.avgLatencyMs}ms`}
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-icon-row">
            <div className="db-card-icon teal"><Zap size={15} /></div>
          </div>
          <div className="db-card-label">TOTAL TOKENS</div>
          <div className="db-card-value">{stats.totalTokensUsed.toLocaleString()}</div>
        </div>

        <div className="db-card">
          <div className="db-card-icon-row">
            <div className="db-card-icon red"><XCircle size={15} /></div>
          </div>
          <div className="db-card-label">ERRORS</div>
          <div className="db-card-value">{stats.errorCount}</div>
        </div>
      </div>

      {/* Latency Chart */}
      <div className="db-chart-card db-full">
        <div className="db-chart-header">
          <div>
            <div className="db-chart-title">Latency Over Time</div>
            <div className="db-chart-sub">Response distribution across active inference streams</div>
          </div>
          <div className="db-time-filters">
            <button className="db-time-btn">1h</button>
            <button className="db-time-btn active">24h</button>
            <button className="db-time-btn">7d</button>
          </div>
        </div>

        {latencySeries.length === 0 ? (
          <div className="db-empty-chart">
            <div className="db-empty-icon"><BarChart2 size={28} color="#c8e6d4" /></div>
            <div className="db-empty-title">No data yet</div>
            <div className="db-empty-sub">Send messages to see real-time trends.</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={latencySeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a2f" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#1e3a2f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0faf4" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#9090a8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9090a8" }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}s` : `${v}ms`} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #d6f0e0", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}ms`, "Latency"]} />
              <Area type="monotone" dataKey="latency" stroke="#1e3a2f" strokeWidth={2} fill="url(#latGrad)" dot={{ fill: "#1e3a2f", r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 3 column row */}
      <div className="db-charts-row">

        {/* Requests by Provider */}
        <div className="db-chart-card">
          <div className="db-chart-title" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={14} color="#1e3a2f" /> Requests by Provider
          </div>
          {providerEntries.length === 0 ? (
            <div className="db-no-data">No data yet</div>
          ) : (
            <div className="db-progress-list">
              {providerEntries.map(([name, count]) => (
                <div key={name} className="db-progress-item">
                  <div className="db-progress-label">
                    <span>{name}</span>
                    <span className="db-progress-count">{count}</span>
                  </div>
                  <div className="db-progress-track">
                    <div className="db-progress-fill" style={{ width: `${(count / maxProvider) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request Status Donut */}
        <div className="db-chart-card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="db-chart-title" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
            <CheckCircle size={14} color="#1e3a2f" /> Request Status
          </div>
          {pieData.length === 0 ? (
            <div className="db-no-data">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                  >
                    <Cell fill="#1e3a2f" />
                    <Cell fill="#dc2626" />
                  </Pie>
                  {/* Center text via foreignObject workaround */}
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fontSize={20} fontWeight={800} fill="#1e3a2f">{successRate}%</text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#9090a8">SUCCESS</text>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9090a8" }}>
                <span><span style={{ color: "#1e3a2f" }}>●</span> Success</span>
                <span><span style={{ color: "#dc2626" }}>●</span> Error</span>
              </div>
            </>
          )}
        </div>

        {/* Requests by Model */}
        <div className="db-chart-card">
          <div className="db-chart-title" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={14} color="#1e3a2f" /> Requests by Model
          </div>
          {modelEntries.length === 0 ? (
            <div className="db-no-data">No data yet</div>
          ) : (
            <div className="db-progress-list">
              {modelEntries.map(([name, count]) => {
                const shortName = name.split("/")[1] || name;
                return (
                  <div key={name} className="db-progress-item">
                    <div className="db-progress-label">
                      <span className="db-model-pill">{shortName}</span>
                      <span className="db-progress-count">{count}</span>
                    </div>
                    <div className="db-progress-track">
                      <div className="db-progress-fill" style={{ width: `${(count / maxModel) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Inference Logs */}
      <div className="db-chart-card db-full">
        <div className="db-chart-header">
          <div className="db-chart-title">Recent Inference Logs</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button className={`db-filter-btn ${logFilter === "all" ? "active" : ""}`} onClick={() => setLogFilter("all")}>All</button>
            <button className={`db-filter-btn ${logFilter === "success" ? "active" : ""}`} onClick={() => setLogFilter("success")}>Success</button>
            <button className={`db-filter-btn ${logFilter === "error" ? "active" : ""}`} onClick={() => setLogFilter("error")}>Error</button>
            <Filter size={14} color="#9090a8" style={{ marginLeft: 4 }} />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="db-no-data">No logs yet — send a message to generate inference logs</div>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>PROVIDER</th>
                  <th>MODEL</th>
                  <th>LATENCY</th>
                  <th>TOKENS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((row) => (
                  <tr key={row.index}>
                    <td className="db-td-muted">{row.time}</td>
                    <td>—</td>
                    <td>—</td>
                    <td>{row.latency >= 1000 ? `${(row.latency / 1000).toFixed(1)}s` : `${row.latency}ms`}</td>
                    <td className="db-td-muted">—</td>
                    <td><span className={`db-badge db-badge--${row.status.toLowerCase()}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="db-footer">Last updated: {lastUpdated.toLocaleTimeString()}</div>
    </div>
  );
}
