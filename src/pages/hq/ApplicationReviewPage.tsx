import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth, UserRole } from '../../components/auth/AuthContext';

// Define types based on your franchise_applications table
interface FranchiseApplication {
  id: string;
  user_id: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  intended_city: string;
  investment_amount?: string;
  experience_description?: string;
  documents?: { name: string; url: string; type: string; size: number }[];
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'additional_info_requested';
  submitted_at?: string;
  reviewed_by_user_id?: string;
  reviewed_at?: string;
  review_notes?: string;
  hq_comments_for_applicant?: string;
  created_at: string;
  updated_at: string;
  // Add user profile info if joining
  profiles?: { full_name?: string; email?: string }; 
}

const ApplicationReviewPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState<FranchiseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<FranchiseApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [hqComments, setHqComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch applications that need review, e.g., 'submitted' or 'under_review'
      // Also join with profiles to get applicant's name if not stored directly in contact_name
      const { data, error: fetchError } = await supabase
        .from('franchise_applications')
        .select(`
          *,
          profiles (full_name, email)
        `)
        .in('status', ['submitted', 'under_review', 'additional_info_requested'])
        .order('submitted_at', { ascending: false });

      if (fetchError) throw fetchError;
      setApplications(data || []);
    } catch (err: any) {
      setError(err.message || '获取申请列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.role === UserRole.HQ_RECRUITER || profile?.role === UserRole.ADMIN) {
      fetchApplications();
    }
  }, [profile, fetchApplications]);

  const handleSelectApplication = (app: FranchiseApplication) => {
    setSelectedApplication(app);
    setReviewNotes(app.review_notes || '');
    setHqComments(app.hq_comments_for_applicant || '');
  };

  const handleUpdateStatus = async (newStatus: FranchiseApplication['status']) => {
    if (!selectedApplication || !user) return;
    setActionLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('franchise_applications')
        .update({
          status: newStatus,
          review_notes: reviewNotes,
          hq_comments_for_applicant: hqComments,
          reviewed_by_user_id: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedApplication.id);

      if (updateError) throw updateError;
      
      // Refresh list and close modal/details view
      fetchApplications();
      setSelectedApplication(null);
      alert(`申请状态已更新为: ${newStatus}`);

    } catch (err: any) {
      setError(err.message || '更新申请状态失败');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-4">加载中...</div>;
  if (error) return <div className="p-4 text-red-500">错误: {error}</div>;
  if (profile?.role !== UserRole.HQ_RECRUITER && profile?.role !== UserRole.ADMIN) {
    return <div className="p-4 text-red-500">您没有权限访问此页面。</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">加盟申请审核</h1>

      {applications.length === 0 && <p>当前没有待审核的申请。</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Application List */} 
        <div className="md:col-span-1 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-3">申请列表</h2>
          {applications.map((app) => (
            <div 
              key={app.id} 
              className={`p-3 mb-2 border rounded cursor-pointer hover:bg-gray-100 ${selectedApplication?.id === app.id ? 'bg-blue-100 border-blue-500' : 'border-gray-200'}`}
              onClick={() => handleSelectApplication(app)}
            >
              <p className="font-medium">{app.contact_name || app.profiles?.full_name || 'N/A'}</p>
              <p className="text-sm text-gray-600">城市: {app.intended_city}</p>
              <p className="text-sm text-gray-500">状态: {app.status}</p>
              <p className="text-xs text-gray-400">提交于: {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          ))}
        </div>

        {/* Application Details and Actions */} 
        <div className="md:col-span-2 bg-white p-6 rounded shadow">
          {selectedApplication ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">申请详情 - {selectedApplication.contact_name || selectedApplication.profiles?.full_name}</h2>
              <div className="space-y-3 mb-6">
                <p><strong>联系电话:</strong> {selectedApplication.contact_phone}</p>
                <p><strong>联系邮箱:</strong> {selectedApplication.contact_email || selectedApplication.profiles?.email}</p>
                <p><strong>意向城市:</strong> {selectedApplication.intended_city}</p>
                <p><strong>预计投入:</strong> {selectedApplication.investment_amount || '未提供'}</p>
                <p><strong>经验描述:</strong> {selectedApplication.experience_description || '未提供'}</p>
                <p><strong>当前状态:</strong> <span className="font-semibold">{selectedApplication.status}</span></p>
                <p><strong>提交时间:</strong> {selectedApplication.submitted_at ? new Date(selectedApplication.submitted_at).toLocaleString() : 'N/A'}</p>
                
                {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                  <div>
                    <strong>资质文件:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {selectedApplication.documents.map((doc, index) => (
                        <li key={index}>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {doc.name} ({doc.type}, {(doc.size / 1024 / 1024).toFixed(2)} MB)
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="reviewNotes" className="block text-sm font-medium text-gray-700">内部审核备注:</label>
                  <textarea
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="仅供内部参考的审核意见"
                  />
                </div>
                <div>
                  <label htmlFor="hqComments" className="block text-sm font-medium text-gray-700">给申请人的回复/要求:</label>
                  <textarea
                    id="hqComments"
                    value={hqComments}
                    onChange={(e) => setHqComments(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="例如：请补充XX材料，或说明驳回原因"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button 
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={actionLoading || selectedApplication.status === 'approved'}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {actionLoading ? '处理中...' : '批准申请'}
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('rejected')}
                    disabled={actionLoading || selectedApplication.status === 'rejected'}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    {actionLoading ? '处理中...' : '驳回申请'}
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('additional_info_requested')}
                    disabled={actionLoading || selectedApplication.status === 'additional_info_requested'}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {actionLoading ? '处理中...' : '要求补充材料'}
                  </button>
                   <button 
                    onClick={() => handleUpdateStatus('under_review')}
                    disabled={actionLoading || selectedApplication.status === 'under_review'}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {actionLoading ? '处理中...' : '标记为审核中'}
                  </button>
                </div>
                {error && <p className="text-red-500 mt-2">操作失败: {error}</p>}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">请从左侧列表选择一个申请以查看详情和操作。</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationReviewPage;