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
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Phone,
  ShieldCheck,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Star,
  ExternalLink,
  Flame,
  Shield,
  Truck,
  HeartPulse
} from 'lucide-react';

const SERVICE_TYPES = [
  'Hospital & Medical',
  'Police Station',
  'Fire & Rescue',
  'Roadside & Towing',
  'Embassy & Consulate',
  'Coast Guard & Marine',
];

const INITIAL_SERVICE_FORM = {
  name: '',
  type: 'Hospital & Medical',
  address: '',
  longitude: '79.8653',
  latitude: '6.9189',
  phone: '',
  emergencyHotline: '',
  email: '',
  website: '',
  operatingHours: '24/7',
  servicesOffered: '',
  verificationStatus: 'verified',
  rating: 4.8,
};

export default function AdminServicesPage() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryCounts, setSummaryCounts] = useState({
    total: 0,
    hospitals: 0,
    police: 0,
    fire: 0,
    towing: 0,
    verified: 0,
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal States
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(INITIAL_SERVICE_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  useEffect(() => {
    fetchServices();
  }, [currentPage, selectedType, selectedStatus]);

  const fetchServices = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', 15);
    if (searchTerm) params.append('search', searchTerm);
    if (selectedType) params.append('type', selectedType);
    if (selectedStatus) params.append('verificationStatus', selectedStatus);

    try {
      const res = await fetch(`${apiUrl}/admin/services?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setServices(data.data || []);
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
    fetchServices();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormData(INITIAL_SERVICE_FORM);
    setFormModalOpen(true);
  };

  const openEditModal = (svc) => {
    setEditingService(svc);
    const coords = svc.location?.coordinates || [79.8653, 6.9189];
    setFormData({
      name: svc.name || '',
      type: svc.type || 'Hospital & Medical',
      address: svc.address || '',
      longitude: String(coords[0]),
      latitude: String(coords[1]),
      phone: svc.contactInfo?.phone || '',
      emergencyHotline: svc.contactInfo?.emergencyHotline || '',
      email: svc.contactInfo?.email || '',
      website: svc.contactInfo?.website || '',
      operatingHours: svc.contactInfo?.operatingHours || '24/7',
      servicesOffered: Array.isArray(svc.servicesOffered) ? svc.servicesOffered.join(', ') : '',
      verificationStatus: svc.verificationStatus || 'verified',
      rating: svc.rating || 4.8,
    });
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const payload = {
      name: formData.name,
      type: formData.type,
      address: formData.address,
      coordinates: [parseFloat(formData.longitude) || 0, parseFloat(formData.latitude) || 0],
      contactInfo: {
        phone: formData.phone,
        emergencyHotline: formData.emergencyHotline,
        email: formData.email,
        website: formData.website,
        operatingHours: formData.operatingHours,
      },
      servicesOffered: formData.servicesOffered
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      verificationStatus: formData.verificationStatus,
      rating: parseFloat(formData.rating) || 4.8,
    };

    try {
      const url = editingService
        ? `${apiUrl}/admin/services/${editingService._id}`
        : `${apiUrl}/admin/services`;
      const method = editingService ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast({
          type: 'success',
          title: editingService ? 'Service Updated' : 'Service Created',
          message: `${formData.name} was saved successfully to the emergency directory.`,
        });
        setFormModalOpen(false);
        fetchServices();
      } else {
        addToast({
          type: 'error',
          title: 'Save Failed',
          message: data.message || 'Could not save emergency service.',
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Network Error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const triggerDelete = (svc) => {
    setServiceToDelete(svc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiUrl}/admin/services/${serviceToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast({
          type: 'success',
          title: 'Facility Deleted',
          message: `${serviceToDelete.name} was removed from the emergency directory.`,
        });
        setDeleteDialogOpen(false);
        fetchServices();
      } else {
        addToast({
          type: 'error',
          title: 'Delete Failed',
          message: data.message || 'Could not delete service.',
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const columns = [
    {
      title: 'Facility Name & Location',
      dataIndex: 'name',
      render: (name, row) => (
        <div>
          <div className="font-bold text-brand-navy text-sm">{name}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-brand-teal shrink-0" />
            <span className="truncate max-w-xs">{row.address}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Facility Type',
      dataIndex: 'type',
      render: (type) => {
        const icons = {
          'Hospital & Medical': HeartPulse,
          'Police Station': Shield,
          'Fire & Rescue': Flame,
          'Roadside & Towing': Truck,
        };
        const Icon = icons[type] || Building2;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
            <Icon className="w-3.5 h-3.5 text-brand-teal shrink-0" />
            {type}
          </span>
        );
      },
    },
    {
      title: 'Emergency Contact',
      dataIndex: 'contactInfo',
      render: (info) => (
        <div className="text-xs">
          {info?.emergencyHotline && (
            <div className="font-bold text-emergency-red flex items-center gap-1">
              <span>Hotline: {info.emergencyHotline}</span>
            </div>
          )}
          <div className="text-slate-500 font-semibold">{info?.phone || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Services Offered',
      dataIndex: 'servicesOffered',
      render: (tags) => {
        const list = Array.isArray(tags) ? tags : [];
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {list.slice(0, 2).map((t, i) => (
              <span key={i} className="text-[10px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                {t}
              </span>
            ))}
            {list.length > 2 && (
              <span className="text-[10px] text-slate-400">+{list.length - 2} more</span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Verification',
      dataIndex: 'verificationStatus',
      render: (status) => {
        const isVer = status === 'verified';
        return (
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
              isVer
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isVer ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
            {isVer ? 'Verified' : 'Pending'}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={() => openEditModal(row)}
            title="Edit Service"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => triggerDelete(row)}
            className="text-emergency-red hover:bg-red-50"
            title="Delete Service"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Emergency Services Directory"
        subtitle="Manage government hospitals, police headquarters, fire stations, and towing recovery depots nationwide."
        breadcrumbs={['Admin', 'Emergency Services']}
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
            Add Emergency Facility
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-slate-500">Total Directory</div>
          <div className="text-2xl font-black text-brand-navy mt-1">{summaryCounts.total || services.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Listed facilities</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-red-600">Hospitals</div>
          <div className="text-2xl font-black text-emergency-red mt-1">{summaryCounts.hospitals}</div>
          <div className="text-[10px] text-slate-400 mt-1">Trauma centers</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-blue-600">Police</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{summaryCounts.police}</div>
          <div className="text-[10px] text-slate-400 mt-1">Tourist divisions</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-orange-600">Fire & Rescue</div>
          <div className="text-2xl font-black text-orange-600 mt-1">{summaryCounts.fire}</div>
          <div className="text-[10px] text-slate-400 mt-1">Extrication bases</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-[11px] font-bold uppercase text-teal-700">Towing Bases</div>
          <div className="text-2xl font-black text-brand-teal mt-1">{summaryCounts.towing}</div>
          <div className="text-[10px] text-slate-400 mt-1">Expressway depots</div>
        </Card>
        <Card className="border border-emerald-200 bg-emerald-50/40">
          <div className="text-[11px] font-bold uppercase text-emerald-700">Verified</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{summaryCounts.verified}</div>
          <div className="text-[10px] text-emerald-600 mt-1">Certified active</div>
        </Card>
      </div>

      {/* Filter and Search Bar Card */}
      <Card className="border border-slate-200">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <input
              type="text"
              placeholder="Search facility by name, address, or hotline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-brand-text font-medium focus:ring-2 focus:ring-brand-teal focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">All Categories</option>
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
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
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
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

      {/* Directory Table */}
      <Table
        columns={columns}
        data={services}
        isLoading={loading}
        emptyMessage="No emergency services found matching criteria."
      />

      {/* Add / Edit Service Modal */}
      {formModalOpen && (
        <Modal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          title={editingService ? `Edit Emergency Facility: ${editingService.name}` : 'Register New Emergency Facility'}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Colombo National Hospital"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Facility Category *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Regent Street, Colombo 10"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Longitude (Lng) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="79.8653"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-brand-navy font-mono font-semibold focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Latitude (Lat) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="6.9189"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-brand-navy font-mono font-semibold focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Standard Telephone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+94 11 269 1111"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Emergency Shortcode Hotline (e.g. 1990)
                </label>
                <input
                  type="text"
                  placeholder="1990"
                  value={formData.emergencyHotline}
                  onChange={(e) => setFormData({ ...formData, emergencyHotline: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  placeholder="24/7 Continuous Emergency"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Verification Status
                </label>
                <select
                  value={formData.verificationStatus}
                  onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="verified">Verified Official Facility</option>
                  <option value="pending">Pending Validation</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Services Offered (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="Trauma Surgery, ICU, Ambulance Fleet, Helipad"
                value={formData.servicesOffered}
                onChange={(e) => setFormData({ ...formData, servicesOffered: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setFormModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                {editingService ? 'Save Changes' : 'Register Facility'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Emergency Facility"
        message={`Are you sure you want to permanently remove "${serviceToDelete?.name}" from the emergency directory? This will remove the facility pin from the public map.`}
        confirmText="Delete Facility"
        type="danger"
      />
    </div>
  );
}

