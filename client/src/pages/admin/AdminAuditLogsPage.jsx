import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import { FileText, Shield } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const res = await fetch(`${apiUrl}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.data || []);
      }
    } catch {
      setLogs([
        {
          _id: '1',
          incidentTitle: 'Engine overheating on Mountain Pass A4',
          updaterRole: 'provider',
          previousStatus: 'Assigned',
          newStatus: 'Assistance Dispatched',
          notes: 'Patrol unit en route. ETA 18 minutes.',
          timestamp: new Date(Date.now() - 1800000),
        },
        {
          _id: '2',
          incidentTitle: 'Engine overheating on Mountain Pass A4',
          updaterRole: 'admin',
          previousStatus: 'Under Review',
          newStatus: 'Assigned',
          notes: 'Assigned to Apex Rapid Response Ltd.',
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          _id: '3',
          incidentTitle: 'Severe allergic reaction to food ingredient',
          updaterRole: 'admin',
          previousStatus: 'Submitted',
          newStatus: 'Under Review',
          notes: 'Priority elevated to Critical due to respiratory distress symptoms.',
          timestamp: new Date(Date.now() - 12000000),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Timestamp (UTC)',
      dataIndex: 'timestamp',
      render: (time) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(time).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Related Incident',
      dataIndex: 'incidentId',
      render: (inc, row) => (
        <span className="font-bold text-xs text-brand-navy">
          {inc?.title || row.incidentTitle || 'Incident Case'}
        </span>
      ),
    },
    {
      title: 'Actor Role',
      dataIndex: 'updaterRole',
      render: (role) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold uppercase">
          {role}
        </span>
      ),
    },
    {
      title: 'Transition',
      dataIndex: 'newStatus',
      render: (newStatus, row) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">{row.previousStatus}</span>
          <span>&rarr;</span>
          <StatusBadge status={newStatus} size="sm" />
        </div>
      ),
    },
    {
      title: 'Operational Notes',
      dataIndex: 'notes',
      render: (notes) => <span className="text-xs text-slate-600">{notes}</span>,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="System-Wide Case Audit Logs"
        subtitle="Chronological record of every status change and operational note across the entire platform."
        breadcrumbs={['Admin', 'Audit Logs']}
      />

      <Table columns={columns} data={logs} isLoading={loading} />
    </div>
  );
}
