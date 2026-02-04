import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { superAdminService, type AdminProfile, type UsageStats } from '../../services/superAdminService';
import { Button } from '../../components/shared/Button';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../hooks/useToast';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Calendar,
  TrendingUp,
  Activity,
  AlertCircle,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { eandColors } from '../../constants/eandColors';

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user?.isSuperAdmin) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [adminsData, statsData] = await Promise.all([
        superAdminService.getAllAdmins(),
        superAdminService.getUsageStats(),
      ]);
      setAdmins(adminsData);
      setStats(statsData);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (adminId: string) => {
    try {
      await superAdminService.approveAdmin(adminId);
      showToast('Admin approved successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to approve admin', 'error');
    }
  };

  const handleReject = async (adminId: string) => {
    try {
      await superAdminService.rejectAdmin(adminId);
      showToast('Admin rejected', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to reject admin', 'error');
    }
  };

  const handleDelete = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    try {
      await superAdminService.deleteAdmin(adminId);
      showToast('Admin deleted successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to delete admin', 'error');
    }
  };

  const handleOpenEdit = (admin: AdminProfile) => {
    setSelectedAdmin(admin);
    setLicenseExpiry(admin.license_expires_at || '');
    setNotes(admin.notes || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAdmin) return;

    try {
      await superAdminService.updateAdmin(selectedAdmin.id, {
        license_expires_at: licenseExpiry || null,
        notes: notes || undefined,
      });
      showToast('Admin updated successfully', 'success');
      setShowEditModal(false);
      loadData();
    } catch (error) {
      showToast('Failed to update admin', 'error');
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    if (filterStatus === 'all') return true;
    return admin.approval_status === filterStatus;
  });

  const getStatusBadgeStyle = (status: string) => {
    const badges = {
      pending: { backgroundColor: `${eandColors.sandRed}20`, color: eandColors.sandRed, border: `1px solid ${eandColors.sandRed}50` },
      approved: { backgroundColor: `${eandColors.brightGreen}20`, color: eandColors.darkGreen, border: `1px solid ${eandColors.brightGreen}50` },
      rejected: { backgroundColor: `${eandColors.red}15`, color: eandColors.red, border: `1px solid ${eandColors.red}40` },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const isLicenseExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isLicenseExpiring = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiryDate > now && expiryDate <= thirtyDaysFromNow;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: eandColors.red }} />
          <p style={{ color: eandColors.oceanBlue }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: eandColors.lightGrey }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:opacity-70 transition-opacity"
                style={{ color: eandColors.oceanBlue }}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: eandColors.oceanBlue }}>Super Admin Dashboard</h1>
                <p className="mt-1" style={{ color: eandColors.grey }}>Manage admins and monitor platform usage</p>
              </div>
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1" style={{ color: eandColors.grey }}>Total Admins</p>
                  <p className="text-3xl font-bold" style={{ color: eandColors.oceanBlue }}>{stats.totalAdmins}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${eandColors.oceanBlue}15` }}>
                  <Users className="w-6 h-6" style={{ color: eandColors.oceanBlue }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1" style={{ color: eandColors.grey }}>Pending Approval</p>
                  <p className="text-3xl font-bold" style={{ color: eandColors.sandRed }}>{stats.pendingAdmins}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${eandColors.sandRed}20` }}>
                  <Clock className="w-6 h-6" style={{ color: eandColors.sandRed }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1" style={{ color: eandColors.grey }}>Active Sessions</p>
                  <p className="text-3xl font-bold" style={{ color: eandColors.brightGreen }}>{stats.activeSessions}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${eandColors.brightGreen}15` }}>
                  <Activity className="w-6 h-6" style={{ color: eandColors.brightGreen }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1" style={{ color: eandColors.grey }}>Expiring Licenses</p>
                  <p className="text-3xl font-bold" style={{ color: eandColors.red }}>{stats.expiringLicenses}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${eandColors.red}15` }}>
                  <AlertCircle className="w-6 h-6" style={{ color: eandColors.red }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>Admin Management</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={
                    filterStatus === 'all'
                      ? { backgroundColor: eandColors.red, color: 'white' }
                      : { backgroundColor: eandColors.lightGrey, color: eandColors.oceanBlue }
                  }
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={
                    filterStatus === 'pending'
                      ? { backgroundColor: eandColors.sandRed, color: 'white' }
                      : { backgroundColor: eandColors.lightGrey, color: eandColors.oceanBlue }
                  }
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={
                    filterStatus === 'approved'
                      ? { backgroundColor: eandColors.brightGreen, color: 'white' }
                      : { backgroundColor: eandColors.lightGrey, color: eandColors.oceanBlue }
                  }
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={
                    filterStatus === 'rejected'
                      ? { backgroundColor: eandColors.red, color: 'white' }
                      : { backgroundColor: eandColors.lightGrey, color: eandColors.oceanBlue }
                  }
                >
                  Rejected
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    License Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.organization_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex px-3 py-1 text-xs font-semibold rounded-full"
                        style={getStatusBadgeStyle(admin.approval_status)}
                      >
                        {admin.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.license_expires_at ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm ${
                              isLicenseExpired(admin.license_expires_at)
                                ? 'text-red-600 font-semibold'
                                : isLicenseExpiring(admin.license_expires_at)
                                ? 'text-amber-600 font-semibold'
                                : 'text-gray-600'
                            }`}
                          >
                            {new Date(admin.license_expires_at).toLocaleDateString()}
                          </span>
                          {(isLicenseExpired(admin.license_expires_at) ||
                            isLicenseExpiring(admin.license_expires_at)) && (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No expiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {admin.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(admin.id)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: eandColors.brightGreen }}
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(admin.id)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: eandColors.red }}
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenEdit(admin)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: eandColors.oceanBlue }}
                          title="Edit"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        {!admin.is_super_admin && (
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: eandColors.red }}
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAdmins.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No admins found</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Admin"
      >
        {selectedAdmin && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Organization</p>
              <p className="text-gray-900">{selectedAdmin.organization_name || 'N/A'}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
              <p className="text-gray-900">{selectedAdmin.email}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                License Expiry Date
              </label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': eandColors.red } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': eandColors.red } as React.CSSProperties}
                placeholder="Add notes about this admin..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
