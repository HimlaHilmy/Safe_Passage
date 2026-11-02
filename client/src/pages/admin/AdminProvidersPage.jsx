import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  MapPin,
  Phone,
  Mail,
  Award,
  Layers,
  Activity,
  UserCheck,
  UserX,
  RotateCcw
} from 'lucide-react';

export default function AdminProvidersPage() {
  const { token, user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending'
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog State
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyAction, setVerifyAction] = useState('verify'); // 'verify' | 'reject'
  const [verifyNotes, setVerifyNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Detail Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiUrl}/admin/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProviders(data.data || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAction = (prov, action) => {
    setSelectedProvider(prov);
    setVerifyAction(action);
    setVerifyNotes('');
    setVerifyDialogOpen(true);
  };

  const handleConfirmVerification = async () => {
    if (!selectedProvider) return;
    setProcessing(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const isVerifying = verifyAction === 'verify';

    try {
      const res = await fetch(`${apiUrl}/admin/providers/${selectedProvider._id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verified: isVerifying,
          notes: verifyNotes || `Provider ${isVerifying ? 'approved' : 'rejected'} by admin`,
          accountStatus: isVerifying ? 'active' : 'suspended',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast({
          type: 'success',
          title: isVerifying ? 'Provider Verified' : 'Provider Suspended',
          message: `${selectedProvider.name} ${isVerifying ? 'is now an authorized response provider' : 'has been rejected / suspended'}.`,
        });
        setVerifyDialogOpen(false);
        fetchProviders();
      } else {
        addToast({
          type: 'error',
          title: 'Operation Failed',
          message: data.message || 'Could not update provider verification status.',
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Network Error', message: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const openDetailsModal = (prov) => {
    setSelectedProvider(prov);
    setDetailsModalOpen(true);
  };

  // Filter providers
  let filtered = [...providers];
  if (activeTab === 'pending') {
    filtered = filtered.filter((p) => !p.providerDetails?.verified);
  }
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.providerDetails?.licenseNumber?.toLowerCase().includes(q)
    );
  }

  const verifiedCount = providers.filter((p) => p.providerDetails?.verified).length;
  const pendingCount = providers.filter((p) => !p.providerDetails?.verified).length;
  const availableCount = providers.filter((p) => p.providerDetails?.isAvailable).length;

  const columns = [
    {
      title: 'Provider Organization',
      dataIndex: 'name',
      render: (name, row) => (
        <div>
          <div className="font-bold text-brand-navy text-sm flex items-center gap-1.5">
            <span>{name}</span>
            {row.providerDetails?.verified && (
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="Verified Fleet Badge" />
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{row.email}</div>
        </div>
      ),
    },
    {
      title: 'Accreditation License',
      dataIndex: 'providerDetails',
      render: (details) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {details?.licenseNumber || 'PENDING'}
        </span>
      ),
    },
    {
      title: 'Service Specialties',
      dataIndex: 'providerDetails',
      render: (details) => {
        const types = details?.serviceTypes || ['Emergency Roadside'];
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {types.map((t, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal-dark border border-brand-teal/20"
              >
                {t}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Verification Status',
      dataIndex: 'providerDetails',
      render: (details) => {
        const isVerified = details?.verified;
        return isVerified ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Fleet
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Pending Approval
          </span>
        );
      },
    },
    {
      title: 'Availability',
      dataIndex: 'providerDetails',
      render: (details) => {
        const avail = details?.isAvailable;
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold ${
              avail ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${avail ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            {avail ? 'Online & Ready' : 'Offline'}
          </span>
        );
      },
    },
    {
      title: 'Job Metrics',
      dataIndex: 'metrics',
      render: (m) => (
        <div className="text-xs text-slate-600">
          <span className="font-bold text-brand-navy">{m?.totalAssigned || 0}</span> assigned •{' '}
          <span className="font-bold text-emerald-600">{m?.resolvedCount || 0}</span> resolved
        </div>
      ),
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          {!row.providerDetails?.verified ? (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => handleTriggerAction(row, 'verify')}
            >
              Approve
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={UserX}
              onClick={() => handleTriggerAction(row, 'reject')}
              className="text-emergency-red border-red-200 hover:bg-red-50"
            >
              Suspend
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDetailsModal(row)}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Emergency Provider Fleet Approvals"
        subtitle="Review credential submissions, license certifications, service territories, and fleet readiness."
        breadcrumbs={['Admin', 'Provider Approvals']}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-slate-500">Total Fleet Units</div>
          <div className="text-2xl font-black text-brand-navy mt-1">{providers.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Registered organizations</div>
        </Card>
        <Card className="border border-emerald-200 bg-emerald-50/40">
          <div className="text-[11px] font-bold uppercase text-emerald-700">Verified Providers</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{verifiedCount}</div>
          <div className="text-[10px] text-emerald-600 mt-1">Accredited teams</div>
        </Card>
        <Card className="border border-amber-200 bg-amber-50/40">
          <div className="text-[11px] font-bold uppercase text-amber-700">Pending Review</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-amber-700 mt-1">Awaiting verification</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-slate-500">Available Now</div>
          <div className="text-2xl font-black text-brand-teal mt-1">{availableCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Accepting dispatches</div>
        </Card>
      </div>

      {/* Tab Selector & Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-slate-500 hover:text-brand-navy'
            }`}
          >
            All Fleet Directory ({providers.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Verification Queue ({pendingCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search provider or license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-brand-text font-medium focus:ring-2 focus:ring-brand-teal"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title={activeTab === 'pending' ? 'Verification Queue Clear' : 'No Providers Found'}
          description={
            activeTab === 'pending'
              ? 'All emergency response providers are currently verified and authorized.'
              : 'No providers match the search criteria.'
          }
        />
      ) : (
        <Table columns={columns} data={filtered} isLoading={loading} />
      )}

      {/* Verify / Reject Confirm Dialog */}
      <ConfirmDialog
        isOpen={verifyDialogOpen}
        onClose={() => setVerifyDialogOpen(false)}
        onConfirm={handleConfirmVerification}
        title={verifyAction === 'verify' ? 'Approve & Verify Provider' : 'Suspend / Reject Provider'}
        message={`Are you sure you want to ${
          verifyAction === 'verify' ? 'approve and grant verified badge to' : 'suspend the verification of'
        } ${selectedProvider?.name}? This authorization will be permanently logged in the audit trail.`}
        confirmText={verifyAction === 'verify' ? 'Confirm Approval' : 'Confirm Suspension'}
        type={verifyAction === 'verify' ? 'info' : 'danger'}
      />

      {/* Provider Details Modal */}
      {detailsModalOpen && selectedProvider && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={`Provider Fleet Details: ${selectedProvider.name}`}
        >
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm font-bold text-brand-navy">{selectedProvider.name}</div>
              <div className="text-slate-500 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-teal" />
                {selectedProvider.email}
              </div>
              <div className="text-slate-500 mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-teal" />
                {selectedProvider.phone || 'Phone unavailable'}
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-700 uppercase tracking-wider mb-1">
                Accreditation License
              </div>
              <div className="font-mono text-brand-navy bg-slate-100 p-2 rounded-lg font-semibold">
                {selectedProvider.providerDetails?.licenseNumber || 'PENDING SUBMISSION'}
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Capabilities
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedProvider.providerDetails?.serviceTypes || ['Emergency Response']).map((t, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-brand-teal/10 text-brand-teal-dark font-bold border border-brand-teal/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-700 uppercase tracking-wider mb-1">
                Base Headquarters Coordinates
              </div>
              <div className="font-mono text-slate-600 bg-slate-50 p-2 rounded-lg">
                Longitude: {selectedProvider.providerDetails?.currentLocation?.coordinates?.[0] || '79.8612'}, Latitude: {selectedProvider.providerDetails?.currentLocation?.coordinates?.[1] || '6.9271'}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setDetailsModalOpen(false)}>
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

