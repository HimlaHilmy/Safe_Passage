import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import SafePassageMap from '../../components/maps/MapContainer';
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
  Legend
} from 'recharts';
import {
  Activity,
  AlertOctagon,
  Clock,
  ShieldCheck,
  TrendingUp,
  Users,
  Building2,
  FileText,
  MapPin,
  ArrowUpRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink
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

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapCenter, setMapCenter] = useState([7.2906, 80.6337]); // Sri Lanka central

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      // 1. Fetch Executive Analytics Aggregations
      const analyticsRes = await fetch(`${apiUrl}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const analyticsData = await analyticsRes.json();
      if (analyticsRes.ok && analyticsData.success) {
        setAnalytics(analyticsData);
      }

      // 2. Fetch Active Incidents for Map
      const incRes = await fetch(`${apiUrl}/admin/incidents?limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const incData = await incRes.json();
      if (incRes.ok && incData.success) {
        setActiveIncidents(incData.data || []);
      }
    } catch (err) {
      console.warn('[Dashboard Error] Falling back to default data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const summary = analytics?.data?.summary || {
    totalIncidents: 5,
    activeIncidents: 3,
    pendingAssignments: 1,
    resolvedIncidents: 2,
    meanResponseMinutes: 14.5,
    verifiedProviders: 2,
    slaComplianceRate: '95%',
  };

  const categoryData = analytics?.data?.incidentsByCategory || [
    { category: 'Roadside & Vehicle Breakdown', count: 1, percentage: 20 },
    { category: 'Medical Emergency', count: 1, percentage: 20 },
    { category: 'Lost & Stranded', count: 1, percentage: 20 },
    { category: 'Natural Hazard & Weather', count: 1, percentage: 20 },
    { category: 'Crime & Theft', count: 1, percentage: 20 },
  ];

  const statusData = analytics?.data?.incidentsByStatus || [
    { status: 'Assistance Dispatched', count: 1 },
    { status: 'In Progress', count: 1 },
    { status: 'Under Review', count: 1 },
    { status: 'Resolved', count: 2 },
  ];

  const hourlyData = analytics?.data?.hourlyTrends || [
    { hour: '00:00', count: 1 },
    { hour: '04:00', count: 0 },
    { hour: '08:00', count: 2 },
    { hour: '12:00', count: 3 },
    { hour: '16:00', count: 4 },
    { hour: '20:00', count: 2 },
  ];

  const providerData = analytics?.data?.providerPerformance || [
    { name: 'Apex Rapid Response Ltd', totalAssigned: 2, resolvedCount: 0, activeCount: 2, resolutionRate: '0%' },
    { name: 'Highland Mountain Rescue Unit', totalAssigned: 1, resolvedCount: 1, activeCount: 0, resolutionRate: '100%' },
  ];

  const isDemo = analytics ? analytics.isDemoData : true;
  const dataSource = analytics?.dataSource || 'Demonstration Mode Fallback';

  // Find urgent pending triage incidents
  const pendingUrgent = activeIncidents.filter(
    (inc) => ['Submitted', 'Under Review'].includes(inc.status) && ['Critical', 'High'].includes(inc.severity)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <PageHeader
        title="Administrative Command Dashboard"
        subtitle="Platform-wide operational oversight, active emergency geospatial monitoring, SLA compliance, and dispatch management."
        breadcrumbs={['Admin', 'Command Dashboard']}
        actions={
          <div className="flex items-center gap-3">
            {/* Live Data / Demo Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                isDemo
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isDemo ? 'Demo Mode (Dual Fallback)' : 'Live Database Records'}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleRefresh}
              loading={refreshing}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Urgent Incident Alert Banner if any pending high-severity cases exist */}
      {pendingUrgent.length > 0 && (
        <div className="rounded-2xl bg-emergency-red/10 border border-emergency-red/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emergency-red text-white shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-950">
                Action Required: {pendingUrgent.length} High-Severity Emergency Awaiting Provider Assignment
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                {pendingUrgent[0].title} — Reported at {pendingUrgent[0].location?.address || 'coordinates'}. Immediate dispatch recommended to protect traveler safety.
              </p>
            </div>
          </div>
          <Link to={`/admin/incidents/${pendingUrgent[0]._id}`}>
            <Button variant="emergency" size="sm">
              Dispatch Case &rarr;
            </Button>
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Incidents */}
        <Card className="border border-slate-200/80 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Incidents</div>
          <div className="text-2xl font-black text-brand-navy mt-1">{summary.totalIncidents}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Platform cases</div>
        </Card>

        {/* Active Incidents */}
        <Card className="border border-red-200 bg-red-50/40">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emergency-red">Active Emergencies</div>
          <div className="text-2xl font-black text-emergency-red mt-1">{summary.activeIncidents}</div>
          <div className="text-[10px] text-red-600 font-semibold mt-1">Under active dispatch</div>
        </Card>

        {/* Pending Assignments */}
        <Card className="border border-amber-200 bg-amber-50/40">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Triage</div>
          <div className="text-2xl font-black text-amber-800 mt-1">{summary.pendingAssignments}</div>
          <div className="text-[10px] text-amber-700 font-medium mt-1">Requires provider assignment</div>
        </Card>

        {/* Resolved Incidents */}
        <Card className="border border-emerald-200 bg-emerald-50/40">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Resolved Cases</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{summary.resolvedIncidents}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Successfully closed</div>
        </Card>

        {/* Average Response Time */}
        <Card className="border border-slate-200/80 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg Response Time</div>
          <div className="text-2xl font-black text-brand-teal mt-1">
            {summary.meanResponseMinutes}m
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Elapsed to dispatch</div>
        </Card>

        {/* Verified Providers */}
        <Card className="border border-slate-200/80 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Verified Fleet</div>
          <div className="text-2xl font-black text-brand-navy mt-1">{summary.verifiedProviders}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            {summary.slaComplianceRate} SLA Met
          </div>
        </Card>
      </div>

      {/* Interactive Map & Active Incident Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-navy flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-teal" />
                Live Incident Map
              </h3>
              <p className="text-xs text-slate-500">
                Geospatial distribution of reported emergencies across Sri Lanka tourist corridors
              </p>
            </div>
            <Link to="/admin/incidents">
              <span className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1">
                View Full Incident Table &rarr;
              </span>
            </Link>
          </div>

          <SafePassageMap
            center={mapCenter}
            zoom={8}
            markers={activeIncidents}
            height="420px"
            className="w-full shadow-card border border-slate-200"
          />
        </div>

        {/* Quick Operational Radar & Active Queue */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-brand-navy flex items-center gap-2">
              <Activity className="w-5 h-5 text-emergency-red" />
              Active Incident Queue
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Most recent distress requests requiring operator supervision
            </p>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {activeIncidents.length === 0 ? (
                <EmptyState
                  title="No Active Emergencies"
                  description="All platform incidents are currently resolved or closed."
                />
              ) : (
                activeIncidents.slice(0, 5).map((inc) => (
                  <div
                    key={inc._id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-brand-teal transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={inc.severity} type="severity" size="sm" />
                      <StatusBadge status={inc.status} size="sm" />
                    </div>

                    <h5 className="font-bold text-xs text-brand-navy mt-2 line-clamp-1">
                      {inc.title}
                    </h5>

                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {inc.location?.address || 'Coordinates marked'}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Link
                        to={`/admin/incidents/${inc._id}`}
                        className="text-[11px] font-bold text-brand-teal hover:underline flex items-center gap-0.5"
                      >
                        Audit Case <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Incidents by Category */}
        <div className="lg:col-span-6">
          <Card
            title="Incidents by Category"
            subtitle="Volume and emergency type distribution"
            icon={TrendingUp}
          >
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cat-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Incident Status Breakdown */}
        <div className="lg:col-span-6">
          <Card
            title="Incident Lifecycle Statuses"
            subtitle="Current disposition of cases in the system"
            icon={Activity}
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
                        key={`stat-${index}`}
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
      </div>

      {/* Hourly Influx Trends & Provider Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Hourly Volume */}
        <div className="lg:col-span-7">
          <Card
            title="Hourly Emergency Influx"
            subtitle="Distress call volume distribution across hours of the day"
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
                    name="Incidents"
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

        {/* Provider Performance Leaderboard */}
        <div className="lg:col-span-5">
          <Card
            title="Provider Fleet Performance"
            subtitle="Dispatched volume and resolution efficiency"
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

      {/* Operational Modules Navigation Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <Link
          to="/admin/incidents"
          className="p-6 rounded-3xl bg-white border border-slate-200 shadow-card hover:border-brand-teal transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-brand-navy text-brand-teal w-fit mb-3 group-hover:scale-105 transition-transform">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-brand-navy group-hover:text-brand-teal transition-colors">
              Incident Management Table
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Multi-criteria search, date filters, severity badges, and manual dispatcher override room.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-brand-teal flex items-center justify-between">
            <span>Manage Incidents</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="p-6 rounded-3xl bg-white border border-slate-200 shadow-card hover:border-brand-teal transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-brand-navy text-brand-teal w-fit mb-3 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-brand-navy group-hover:text-brand-teal transition-colors">
              Analytics & CSV Reporting
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Date-range filtered incident analytics with one-click export to CSV for institutional reporting.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-brand-teal flex items-center justify-between">
            <span>View Analytics & Export</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-6 rounded-3xl bg-white border border-slate-200 shadow-card hover:border-brand-teal transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-brand-navy text-brand-teal w-fit mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-brand-navy group-hover:text-brand-teal transition-colors">
              System Audit Logs
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive audit trail documenting administrative mutations, provider verifications, and case transitions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-brand-teal flex items-center justify-between">
            <span>Inspect Audit Logs</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
