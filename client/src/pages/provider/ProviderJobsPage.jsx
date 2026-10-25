import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Briefcase, MapPin, Phone, Eye } from 'lucide-react';

export default function ProviderJobsPage() {
  const [filter, setFilter] = useState('all');

  const jobs = [
    {
      _id: '65r001',
      serviceType: 'Roadside Towing & Vehicle Repair',
      travelerName: 'Sarah Jenkins',
      travelerPhone: '+1 (555) 234-5678',
      location: 'Route A4, Mile Marker 42, Central Province',
      status: 'En Route',
      acceptedAt: new Date(Date.now() - 1800000),
      fee: '$85.00',
    },
    {
      _id: '65r002',
      serviceType: 'Emergency Battery Jumpstart',
      travelerName: 'Marcus Vance',
      travelerPhone: '+44 7700 900123',
      location: 'Kandy Lake Road, Pier 2',
      status: 'Completed',
      acceptedAt: new Date(Date.now() - 86400000),
      fee: '$45.00',
    },
    {
      _id: '65r003',
      serviceType: 'Highway Winching & Extrication',
      travelerName: 'David Chen',
      travelerPhone: '+61 400 123 456',
      location: 'Southern Expressway KM 34',
      status: 'Completed',
      acceptedAt: new Date(Date.now() - 86400000 * 2),
      fee: '$120.00',
    },
  ];

  const filteredJobs = filter === 'all' ? jobs : jobs.filter((j) => (filter === 'active' ? j.status !== 'Completed' : j.status === 'Completed'));

  const columns = [
    {
      title: 'Service Type & Client',
      dataIndex: 'serviceType',
      render: (serviceType, row) => (
        <div>
          <div className="font-bold text-brand-navy">{serviceType}</div>
          <div className="text-xs text-slate-500">Client: {row.travelerName} ({row.travelerPhone})</div>
        </div>
      ),
    },
    {
      title: 'Dispatch Location',
      dataIndex: 'location',
      render: (loc) => (
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-brand-teal shrink-0" />
          <span>{loc}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (st) => <StatusBadge status={st} size="sm" />,
    },
    {
      title: 'Timestamp',
      dataIndex: 'acceptedAt',
      render: (date) => (
        <span className="text-xs text-slate-400">
          {new Date(date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      title: 'Compensation',
      dataIndex: 'fee',
      render: (fee) => <span className="text-xs font-bold text-emerald-600">{fee}</span>,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title="Assigned Dispatch Jobs"
        subtitle="Manage and review all your current and completed emergency service dispatches."
        breadcrumbs={['Provider', 'Jobs History']}
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold ${filter === 'all' ? 'bg-brand-navy text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          All Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 rounded-full text-xs font-bold ${filter === 'active' ? 'bg-brand-navy text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Active (1)
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 rounded-full text-xs font-bold ${filter === 'completed' ? 'bg-brand-navy text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Completed (2)
        </button>
      </div>

      <Table columns={columns} data={filteredJobs} />
    </div>
  );
}
