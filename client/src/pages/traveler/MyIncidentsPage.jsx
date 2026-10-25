import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { AlertOctagon, Clock, MapPin, Eye, Plus, ArrowRight } from 'lucide-react';

export default function MyIncidentsPage() {
  const { token, user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchMyIncidents();
  }, [statusFilter]);

  const fetchMyIncidents = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      let url = `${apiUrl}/incidents`;
      if (statusFilter) url += `?status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIncidents(data.data || []);
      }
    } catch {
      // Offline fallback
      setIncidents([
        {
          _id: '65f000000000000000000010',
          title: 'Engine overheating on Mountain Pass A4',
          category: 'Roadside & Vehicle Breakdown',
          severity: 'High',
          status: 'Assistance Dispatched',
          location: { address: 'Route A4, Mile Marker 42, Central Province' },
          createdAt: new Date(Date.now() - 7200000),
        },
        {
          _id: '65f000000000000000000011',
          title: 'Severe allergic reaction to food ingredient',
          category: 'Medical Emergency',
          severity: 'Critical',
          status: 'In Progress',
          location: { address: 'Galle Face Terrace, Coastal Road' },
          createdAt: new Date(Date.now() - 14400000),
        },
        {
          _id: '65f000000000000000000012',
          title: 'Missed trail marker in dense fog',
          category: 'Lost & Stranded',
          severity: 'Medium',
          status: 'Under Review',
          location: { address: 'Horton Plains National Park trail 3' },
          createdAt: new Date(Date.now() - 21600000),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Incident Details',
      dataIndex: 'title',
      render: (title, row) => (
        <div>
          <div className="font-bold text-brand-navy">{title}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-brand-teal" />
            <span>{row.location?.address || 'Location on map'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: (cat) => <span className="text-xs font-semibold text-slate-700">{cat}</span>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      render: (sev) => <StatusBadge status={sev} type="severity" size="sm" />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Reported',
      dataIndex: 'createdAt',
      render: (date) => (
        <span className="text-xs text-slate-500">
          {new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      title: 'Action',
      dataIndex: '_id',
      render: (id) => (
        <Link to={`/traveler/incidents/${id}`}>
          <Button variant="outline" size="sm" icon={Eye}>
            Track Case
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title="My Submitted Incidents"
        subtitle="Review, monitor, and track all your active and previous emergency reports."
        breadcrumbs={['Traveler', 'My Incidents']}
        action={
          <Link to="/traveler/report">
            <Button variant="emergency" icon={Plus}>
              Report New Emergency
            </Button>
          </Link>
        }
      />

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-500 mr-1">Filter Status:</span>
        {['', 'Submitted', 'Under Review', 'Assigned', 'Assistance Dispatched', 'In Progress', 'Resolved', 'Cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`
              px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0
              ${statusFilter === st
                ? 'bg-brand-navy text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}
            `}
          >
            {st || 'All Incidents'}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={incidents}
        isLoading={loading}
        emptyMessage="You have not reported any incidents matching this criteria."
      />
    </div>
  );
}
