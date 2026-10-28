import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Download,
  Calendar,
  Clock,
  Activity,
  ShieldCheck,
  Database,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

const CATEGORY_COLORS = ['#14B8A6', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B'];
const STATUS_COLORS = {
  'Submitted': '#64748B',
  'Under Review': '#F59E0B',
  'Assigned': '#3B82F6',
  'Assistance Dispatched': '#8B5CF6',
  'In Progress': '#F97316',
  'Resolved': '#10B981',
  'Cancelled': '#94A3B8',
};

const RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Today (24h)', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Custom', value: 'custom' },
];

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [range, setRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [range, startDate, endDate]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const params = new URLSearchParams();
    params.append('range', range);
    if (range === 'custom') {
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
    }

    try {
      const res = await fetch(`${apiUrl}/admin/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalytics(data);
      }
    } catch (err) {
      console.warn('[Analytics Error] Fallback:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportCSV = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const params = new URLSearchParams();
    if (range === 'custom') {
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
    } else if (range === '24h') {
      const d = new Date(Date.now() - 86400000).toISOString();
      params.append('startDate', d);
    } else if (range === '7d') {
      const d = new Date(Date.now() - 7 * 86400000).toISOString();
      params.append('startDate', d);
    } else if (range === '30d') {
      const d = new Date(Date.now() - 30 * 86400000).toISOString();
      params.append('startDate', d);
    }

    window.open(`${apiUrl}/admin/export/csv?${params.toString()}`, '_blank');
    addToast({
      type: 'info',
      title: 'Generating Report',
      message: 'Downloading incident analytics report in RFC CSV format.',
    });
  };

  const summary = analytics?.data?.summary || {
    totalIncidents: 0,
    activeIncidents: 0,
    pendingAssignments: 0,
    resolvedIncidents: 0,
    meanResponseMinutes: 0,
    verifiedProviders: 0,
    slaComplianceRate: '100%',
  };

  const categoryData = analytics?.data?.incidentsByCategory || [];
  const statusData = analytics?.data?.incidentsByStatus || [];
  const severityData = analytics?.data?.severityDistribution || [];
  const hourlyData = analytics?.data?.hourlyTrends || [];
  const monthlyData = analytics?.data?.monthlyTrends || [];
  const providerData = analytics?.data?.providerPerformance || [];

  const isDemo = analytics ? analytics.isDemoData : true;
  const dataSource = analytics?.dataSource || 'Demonstration Mode Fallback';
  const timestampFormula =
    analytics?.timestampCalculationMethod ||
    'Elapsed minutes between Traveler Report timestamp (createdAt) and Operator Dispatch confirmation (updatedAt).';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Executive Analytics & Operations Reporting"
        subtitle="Aggregated system telemetry, resolution SLA metrics, category breakdowns, and official CSV data export."
        breadcrumbs={['Admin', 'Analytics & Reports']}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => {
                setRefreshing(true);
                fetchAnalyticsData();
              }}
              loading={refreshing}
            >
              Recalculate
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
            >
              Export CSV Report
            </Button>
          </div>
        }
      />

      {/* Transparency & Methodology Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-brand-navy text-brand-teal shrink-0 mt-0.5">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-navy">
                Data Aggregation Engine:
              </span>
              <span
                className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isDemo
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {dataSource}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{timestampFormula}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                range === r.value
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {range === 'custom' && (
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            />
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            />
          </div>
        )}
      </div>

      {/* Executive KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border border-slate-200 bg-white">
          <div className="text-[11px] font-bold uppercase text-slate-500">Total Emergencies</div>
          <div className="text-2xl font-black text-brand-navy mt-1">{summary.totalIncidents}</div>
          <div className="text-[10px] text-slate-400 mt-1">Matching date filter</div>
        </Card>
        <Card className="border border-red-200 bg-red-50/40">
          <div className="text-[11px] font-bold uppercase text-emergency-red">Active Cases</div>
          <div className="text-2xl font-black text-emergency-red mt-1">{summary.activeIncidents}</div>
          <div className="text-[10px] text-red-600 mt-1">Dispatched/In Progress</div>
        </Card>
        <Card className="border border-amber-200 bg-amber-50/40">
          <div className="text-[11px] font-bold uppercase text-amber-700">Pending Triage</div>
          <div className="text-2xl font-black text-amber-800 mt-1">{summary.pendingAssignments}</div>
          <div className="text-[10px] text-amber-700 mt-1">Awaiting dispatch</div>
        </Card>
        <Card className="border border-emerald-200 bg-emerald-50/40">
          <div className="text-[11px] font-bold uppercase text-emerald-700">Resolved Cases</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{summary.resolvedIncidents}</div>
          <div className="text-[10px] text-emerald-600 mt-1">Closed successfully</div>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <div className="text-[11px] font-bold uppercase text-slate-500">Mean Dispatch SLA</div>
          <div className="text-2xl font-black text-brand-teal mt-1">{summary.meanResponseMinutes}m</div>
          <div className="text-[10px] text-brand-teal font-medium mt-1">Calculated response</div>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <div className="text-[11px] font-bold uppercase text-slate-500">SLA Compliance</div>
          <div className="text-2xl font-black text-brand-navy mt-1">{summary.slaComplianceRate}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Target &le; 30 mins</div>
        </Card>
      </div>

      {/* Main Charts Section */}
      {summary.totalIncidents === 0 ? (
        <EmptyState
          title="No Incident Data in Date Range"
          description="There are no emergency incident records matching the selected timeframe. Try selecting 'All Time' or adjusting the date filters."
          actionLabel="Show All Time"
          onAction={() => setRange('all')}
        />
      ) : (
        <div className="space-y-6">
          {/* Row 1: Daily/Monthly Trends AreaChart & Category BarChart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Trend Area Chart */}
            <div className="lg:col-span-7">
              <Card
                title="Incident Reporting Volume Trends"
                subtitle="Historical emergency influx versus resolved cases"
                icon={TrendingUp}
              >
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                      <defs>
                        <linearGradient id="incidentsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Legend verticalAlign="top" height={30} />
                      <Area
                        type="monotone"
                        dataKey="incidents"
                        name="Reported"
                        stroke="#14B8A6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#incidentsGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        name="Resolved"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#resolvedGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Incidents by Category BarChart */}
            <div className="lg:col-span-5">
              <Card
                title="Category Breakdown"
                subtitle="Distribution across emergency types"
                icon={Activity}
              >
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis
                        type="category"
                        dataKey="category"
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {categoryData.map((_, index) => (
                          <Cell key={`bar-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>

          {/* Row 2: Status Breakdown PieChart & Severity Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Status PieChart */}
            <div className="lg:col-span-6">
              <Card
                title="Incident Disposition & Status Machine"
                subtitle="Active vs completed lifecycle transitions"
                icon={CheckCircle2}
              >
                <div className="h-72 w-full pt-4 flex flex-col sm:flex-row items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`stat-pie-${index}`}
                            fill={STATUS_COLORS[entry.status] || CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Severity Distribution */}
            <div className="lg:col-span-6">
              <Card
                title="Triage Severity Distribution"
                subtitle="Operational triage classification of reported cases"
                icon={AlertTriangle}
              >
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {severityData.map((entry, index) => (
                          <Cell key={`sev-${index}`} fill={entry.color || '#3B82F6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>

          {/* Row 3: Hourly Trends & Provider Performance Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <Card
                title="24-Hour Emergency Frequency"
                subtitle="Peak distress call hours in UTC+5:30"
                icon={Clock}
              >
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#EF4444"
                        strokeWidth={3}
                        dot={{ fill: '#EF4444', r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-5">
              <Card
                title="Provider Performance Efficiency"
                subtitle="Jobs assigned, resolved, and resolution percentage"
                icon={ShieldCheck}
              >
                <div className="space-y-3 pt-2">
                  {providerData.map((prov, i) => (
                    <div key={prov.id || i} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-brand-navy">{prov.name}</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {prov.resolutionRate} Resolution
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200 text-center">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Assigned</div>
                          <div className="text-xs font-bold text-slate-700">{prov.totalAssigned}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Active</div>
                          <div className="text-xs font-bold text-amber-600">{prov.activeCount}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Resolved</div>
                          <div className="text-xs font-bold text-emerald-600">{prov.resolvedCount}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
