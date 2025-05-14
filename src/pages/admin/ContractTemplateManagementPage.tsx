import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth, UserRole } from '../../components/auth/AuthContext';

interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  file_name: string;
  storage_path: string;
  version?: string;
  status: 'active' | 'archived';
  uploaded_by_user_id?: string;
  created_at: string;
  profiles?: { full_name?: string }; // For uploaded_by_user_id
}

const ContractTemplateManagementPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for new template
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('contract_templates')
        .select(`
          *,
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setTemplates(data || []);
    } catch (err: any) {
      setError(err.message || '获取合同模板列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.role === UserRole.ADMIN || profile?.role === UserRole.HQ_RECRUITER) {
      fetchTemplates();
    }
  }, [profile, fetchTemplates]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type !== 'application/pdf') {
        setError('请上传 PDF 格式的文件。');
        setTemplateFile(null);
        return;
      }
      if (e.target.files[0].size > 10 * 1024 * 1024) { // 10MB limit
        setError('文件大小不能超过 10MB。');
        setTemplateFile(null);
        return;
      }
      setTemplateFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUploadTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFile || !templateName || !user) {
      setError('请填写模板名称并选择一个 PDF 文件。');
      return;
    }
    setIsUploading(true);
    setError(null);

    try {
      const fileName = `${Date.now()}-${templateFile.name}`;
      const filePath = `contract-templates/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('contract-templates') // Bucket name
        .upload(filePath, templateFile);

      if (uploadError) throw uploadError;

      // Add record to contract_templates table
      const { error: dbError } = await supabase
        .from('contract_templates')
        .insert({
          name: templateName,
          description: templateDescription || null,
          file_name: templateFile.name,
          storage_path: filePath,
          uploaded_by_user_id: user.id,
          status: 'active',
        });
      
      if (dbError) throw dbError;

      alert('合同模板上传成功！');
      setTemplateName('');
      setTemplateDescription('');
      setTemplateFile(null);
      const fileInput = document.getElementById('templateFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchTemplates(); // Refresh the list

    } catch (err: any) {
      setError(err.message || '上传模板失败');
      // Consider deleting from storage if DB insert fails
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleArchiveTemplate = async (templateId: string) => {
    if (!window.confirm('确定要归档此模板吗？归档后将无法用于新的合同。')) return;
    try {
        const { error: updateError } = await supabase
            .from('contract_templates')
            .update({ status: 'archived' })
            .eq('id', templateId);
        if (updateError) throw updateError;
        alert('模板已归档。');
        fetchTemplates();
    } catch (err: any) {
        setError(err.message || '归档模板失败。');
    }
  };

  if (profile?.role !== UserRole.ADMIN && profile?.role !== UserRole.HQ_RECRUITER) {
    return <div className="p-4 text-red-500">您没有权限访问此页面。</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">合同模板管理</h1>

      {/* Upload Form */} 
      <div className="mb-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">上传新模板</h2>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        <form onSubmit={handleUploadTemplate} className="space-y-6">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">模板名称 <span className="text-red-500">*</span></label>
            <input 
              id="templateName"
              type="text" 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required 
            />
          </div>
          <div>
            <label htmlFor="templateDescription" className="block text-sm font-medium text-gray-700">模板描述 (可选)</label>
            <textarea 
              id="templateDescription"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="templateFile" className="block text-sm font-medium text-gray-700">选择 PDF 文件 <span className="text-red-500">*</span></label>
            <input 
              id="templateFile"
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100"
              required
            />
            {templateFile && <p className="text-xs text-gray-500 mt-1">已选择: {templateFile.name}</p>}
          </div>
          <button 
            type="submit"
            disabled={isUploading || !templateFile || !templateName}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isUploading ? '上传中...' : '上传模板'}
          </button>
        </form>
      </div>

      {/* Template List */} 
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">现有模板列表</h2>
        {isLoading ? (
          <p>加载模板中...</p>
        ) : templates.length === 0 ? (
          <p>暂无合同模板。</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件名</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上传者</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上传时间</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a 
                        href={supabase.storage.from('contract-templates').getPublicUrl(template.storage_path).data.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {template.file_name}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${template.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {template.status === 'active' ? '激活' : '归档'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.profiles?.full_name || template.uploaded_by_user_id || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(template.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {template.status === 'active' && (
                        <button 
                            onClick={() => handleArchiveTemplate(template.id)}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            disabled={isUploading} // Disable while any upload is in progress for simplicity
                        >
                            归档
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractTemplateManagementPage;