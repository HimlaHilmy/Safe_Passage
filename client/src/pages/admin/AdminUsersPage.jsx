import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const res = await fetch(`${apiUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.data || []);
      }
    } catch {
      setUsers([
        {
          _id: '1',
          name: 'Sarah Jenkins',
          email: 'traveler@safepassage.org',
          role: 'traveler',
          phone: '+1 (555) 234-5678',
          accountStatus: 'active',
          createdAt: new Date(Date.now() - 86400000 * 30),
        },
        {
          _id: '2',
          name: 'Apex Rapid Response Ltd',
          email: 'provider@safepassage.org',
          role: 'provider',
          phone: '+1 (555) 987-6543',
          accountStatus: 'active',
          providerDetails: { verified: true },
          createdAt: new Date(Date.now() - 86400000 * 60),
        },
        {
          _id: '3',
          name: 'Himla (Admin Lead)',
          email: 'admin@safepassage.org',
          role: 'admin',
          phone: '+1 (555) 000-1122',
          accountStatus: 'active',
          createdAt: new Date(Date.now() - 86400000 * 90),
        },
        {
          _id: '4',
          name: 'Highland Mountain Rescue Unit',
          email: 'highland@rescue.org',
          role: 'provider',
          phone: '+94 81 223 9900',
          accountStatus: 'active',
          providerDetails: { verified: true },
          createdAt: new Date(Date.now() - 86400000 * 15),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Full Name / Organization',
      dataIndex: 'name',
      render: (name, row) => (
        <div>
          <div className="font-bold text-brand-navy">{name}</div>
          <div className="text-xs text-slate-400">{row.email}</div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role) => {
        const colors = {
          traveler: 'bg-teal-50 text-teal-800 border-teal-200',
          provider: 'bg-amber-50 text-amber-800 border-amber-200',
          admin: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${colors[role] || 'bg-slate-100'}`}>
            {role}
          </span>
        );
      },
    },
    {
      title: 'Contact Phone',
      dataIndex: 'phone',
      render: (phone) => <span className="text-xs font-semibold text-slate-600">{phone || '—'}</span>,
    },
    {
      title: 'Account Status',
      dataIndex: 'accountStatus',
      render: (status) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="capitalize">{status}</span>
        </span>
      ),
    },
    {
      title: 'Verification',
      dataIndex: 'providerDetails',
      render: (details, row) => {
        if (row.role !== 'provider') return <span className="text-xs text-slate-400">N/A (Traveler)</span>;
        const isVerified = details?.verified;
        return isVerified ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Fleet
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Pending Review
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="User & Provider Management"
        subtitle="Review traveler profiles, role assignments, and provider verification credentials."
        breadcrumbs={['Admin', 'User Management']}
      />

      <Table columns={columns} data={users} isLoading={loading} />
    </div>
  );
}
