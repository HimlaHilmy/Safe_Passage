import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { MapPin, Eye, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminIncidentsPage() {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const res = await fetch(`${apiUrl}/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIncidents(data.data || []);
      }
    } catch {
      // Fallback
      setIncidents([
        {
          _id: '65f000000000000000000010',
          title: 'Engine overheating on Mountain Pass A4',
          category: 'Roadside & Vehicle Breakdown',
          severity: 'High',
          status: 'Assistance Dispatched',
          traveler: { name: 'Sarah Jenkins', phone: '+1 (555) 234-5678' },
          location: { address: 'Route A4, Mile Marker 42, Central Province' },
          createdAt: new Date(Date.now() - 7200000),
        },
        {
          _id: '65f000000000000000000011',
          title: 'Severe allergic reaction to food ingredient',
          category: 'Medical Emergency',
          severity: 'Critical',
          status: 'In Progress',
          traveler: { name: 'Sarah Jenkins', phone: '+1 (555) 234-5678' },
          location: { address: 'Galle Face Terrace, Coastal Road' },
          createdAt: new Date(Date.now() - 14400000),
        },
        {
          _id: '65f000000000000000000012',
          title: 'Missed trail marker in dense fog',
          category: 'Lost & Stranded',
          severity: 'Medium',
          status: 'Under Review',
          traveler: { name: 'Marcus Vance', phone: '+44 7700 900123' },
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
      title: 'Incident Title',
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
      title: 'Reporter',
      dataIndex: 'traveler',
      render: (traveler) => (
        <span className="text-xs font-semibold text-slate-700">
          {traveler?.name || 'Sarah Jenkins'}
        </span>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: (cat) => <span className="text-xs font-semibold text-slate-600">{cat}</span>,
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
      title: 'Action',
      dataIndex: '_id',
      render: (id) => (
        <Link to={`/traveler/incidents/${id}`}>
          <Button variant="outline" size="sm" icon={Eye}>
            Audit Case
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Incident Operations Management"
        subtitle="Full administrative oversight of active and archived emergencies."
        breadcrumbs={['Admin', 'Incident Management']}
      />

      <Table
        columns={columns}
        data={incidents}
        isLoading={loading}
      />
    </div>
  );
}
