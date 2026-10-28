import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import {
  Users,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  UserX,
  Lock,
  Mail,
  Phone,
  Calendar,
  RotateCcw,
  ShieldAlert,
  UserCog
} from 'lucide-react';

const ROLES = ['traveler', 'provider', 'admin'];
const STATUSES = ['active', 'suspended', 'pending'];

export default function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryCounts, setSummaryCounts] = useState({
    total: 0,
    travelers: 0,
    providers: 0,
    admins: 0,
    suspended: 0,
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Dialog / Modal States
  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('traveler');
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, selectedRole, selectedStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', 20);
    if (searchTerm) params.append('search', searchTerm);
    if (selectedRole) params.append('role', selectedRole);
    if (selectedStatus) params.append('status', selectedStatus);

    try {
      const res = await fetch(`${apiUrl}/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.data || []);
        if (data.summaryCounts) setSummaryCounts(data.summaryCounts);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const triggerToggleStatus = (u) => {
    setTargetUser(u);
    setActionReason('');
    setConfirmSuspendOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!targetUser) return;
    setProcessing(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const nextStatus = targetUser.accountStatus === 'active' ? 'suspended' : 'active';

    try {
      const res = await fetch(`${apiUrl}/admin/users/${targetUser._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountStatus: nextStatus,
          reason: actionReason || `Admin action by ${currentUser?.name || 'Administrator'}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast({
          type: 'success',
          title: 'Account Status Modified',
          message: `${targetUser.name}'s account is now ${nextStatus}.`,
        });
        setConfirmSuspendOpen(false);
        fetchUsers();
      } else {
        addToast({
          type: 'error',
          title: 'Action Failed',
          message: data.message || 'Could not change account status.',
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Network Error', message: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const triggerChangeRole = (u) => {
    setTargetUser(u);
    setNewRole(u.role);
    setActionReason('');
    setRoleModalOpen(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUser) return;
    setProcessing(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiUrl}/admin/users/${targetUser._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: newRole,
          reason: actionReason || 'Role adjusted via Admin Directory',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast({
          type: 'success',
          title: 'Role Updated',
          message: `${targetUser.name} is now designated as ${newRole}.`,
        });
        setRoleModalOpen(false);
        fetchUsers();
      } else {
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: data.message || 'Could not adjust user role.',
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Network Error', message: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      title: 'User Profile & Identity',
      dataIndex: 'name',
      render: (name, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-navy text-brand-teal font-bold flex items-center justify-center text-xs shrink-0">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="font-bold text-brand-navy text-sm">{name}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{row.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'System Role',
      dataIndex: 'role',
      render: (role) => {
        const colors = {
          traveler: 'bg-teal-50 text-teal-800 border-teal-200',
          provider: 'bg-amber-50 text-amber-800 border-amber-200',
          admin: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
              colors[role] || 'bg-slate-100 text-slate-700'
            }`}
          >
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
      render: (status) => {
        const isSuspended = status === 'suspended';
        const isPending = status === 'pending';
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold ${
              isSuspended
                ? 'text-emergency-red'
                : isPending
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSuspended ? 'bg-emergency-red' : isPending ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span className="capitalize">{status || 'active'}</span>
          </span>
        );
      },
    },
    {
      title: 'Registration Date',
      dataIndex: 'createdAt',
      render: (time) => (
        <span className="text-xs text-slate-500 font-medium">
          {time ? new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={UserCog}
            onClick={() => triggerChangeRole(row)}
            title="Adjust Role"
          >
            Role
          </Button>

          <Button
            variant={row.accountStatus === 'active' ? 'outline' : 'secondary'}
            size="sm"
            icon={row.accountStatus === 'active' ? UserX : UserCheck}
            onClick={() => triggerToggleStatus(row)}
            className={row.accountStatus === 'active' ? 'text-emergency-red border-red-200 hover:bg-red-50' : ''}
          >
            {row.accountStatus === 'active' ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="User & Account Governance"
        subtitle="Review traveler accounts, assign administrator credentials, inspect contact records, and enforce account suspensions."
        breadcrumbs={['Admin', 'User Directory']}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-slate-500">Total Users</div>
          <div className="text-2xl font-black text-brand-navy mt-1">{summaryCounts.total || users.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Platform members</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-teal-700">Travelers</div>
          <div className="text-2xl font-black text-brand-teal mt-1">{summaryCounts.travelers}</div>
          <div className="text-[10px] text-slate-400 mt-1">Registered public</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-amber-700">Providers</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{summaryCounts.providers}</div>
          <div className="text-[10px] text-slate-400 mt-1">Fleet units</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-indigo-700">Admins</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{summaryCounts.admins}</div>
          <div className="text-[10px] text-slate-400 mt-1">Authorized staff</div>
        </Card>
        <Card className="border border-red-200 bg-red-50/40">
          <div className="text-[11px] font-bold uppercase text-emergency-red">Suspended</div>
          <div className="text-2xl font-black text-emergency-red mt-1">{summaryCounts.suspended}</div>
          <div className="text-[10px] text-red-600 mt-1">Access revoked</div>
        </Card>
      </div>

      {/* Filter and Search Bar Card */}
      <Card className="border border-slate-200">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <input
              type="text"
              placeholder="Search by full name, email, or telephone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-brand-text font-medium focus:ring-2 focus:ring-brand-teal focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" className="w-full">
              Filter
            </Button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 rounded-xl text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Card>

      {/* Users Table */}
      <Table
        columns={columns}
        data={users}
        isLoading={loading}
        emptyMessage="No users match the active filter criteria."
      />

      {/* Confirm Suspend / Activate Dialog */}
      <ConfirmDialog
        isOpen={confirmSuspendOpen}
        onClose={() => setConfirmSuspendOpen(false)}
        onConfirm={handleConfirmToggleStatus}
        title={targetUser?.accountStatus === 'active' ? 'Suspend User Account' : 'Reactivate User Account'}
        message={`Are you sure you want to ${
          targetUser?.accountStatus === 'active' ? 'suspend' : 'reactivate'
        } the account for ${targetUser?.name} (${targetUser?.email})? This action will be recorded in the system audit log.`}
        confirmText={targetUser?.accountStatus === 'active' ? 'Suspend Account' : 'Reactivate'}
        type={targetUser?.accountStatus === 'active' ? 'danger' : 'info'}
      />

      {/* Role Modification Modal */}
      {roleModalOpen && targetUser && (
        <Modal
          isOpen={roleModalOpen}
          onClose={() => setRoleModalOpen(false)}
          title={`Modify User Role: ${targetUser.name}`}
        >
          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Current User</label>
              <div className="text-sm font-bold text-brand-navy bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {targetUser.name} ({targetUser.email})
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">New Role Assignment</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-brand-navy font-bold focus:ring-2 focus:ring-brand-teal"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Reason / Administrative Justification
              </label>
              <textarea
                rows={3}
                placeholder="Reason for role change (e.g. verified provider onboarding)..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={processing}>
                Save Role Change
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
