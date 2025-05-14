import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext'; // Assuming AuthContext provides user info

interface FranchiseApplicationFormProps {
  onSuccess?: (applicationId: string) => void;
  onFailure?: (error: Error) => void;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

const FranchiseApplicationForm: React.FC<FranchiseApplicationFormProps> = ({ onSuccess, onFailure }) => {
  const { user, profile } = useAuth(); // Get user and profile from AuthContext

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [intendedCity, setIntendedCity] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [experienceDescription, setExperienceDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadedFileDetails, setUploadedFileDetails] = useState<UploadedFile[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setContactName(profile.full_name || '');
    }
    if (user) {
      setContactEmail(user.email || '');
    }
  }, [user, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 3) {
        setError('最多只能上传3个文件。');
        setFiles(null);
        return;
      }
      for (const file of Array.from(e.target.files)) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit per file
          setError(`文件 ${file.name} 太大，请确保每个文件不超过5MB。`);
          setFiles(null);
          return;
        }
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          setError(`文件 ${file.name} 的格式不受支持。请上传 PDF, JPG, 或 PNG 文件。`);
          setFiles(null);
          return;
        }
      }
      setFiles(e.target.files);
      setError(null); // Clear previous file errors
    } else {
      setFiles(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!user) {
      setError('用户未登录，无法提交申请。');
      setLoading(false);
      return;
    }

    if (!contactName || !contactPhone || !contactEmail || !intendedCity) {
        setError('请填写所有必填项（姓名、电话、邮箱、意向城市）。');
        setLoading(false);
        return;
    }

    let currentUploadedFileDetails: UploadedFile[] = [];

    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('application-documents') // Ensure this bucket exists and has correct policies
          .upload(fileName, file);

        if (uploadError) {
          setError(`上传文件 ${file.name} 失败: ${uploadError.message}`);
          setLoading(false);
          // Optional: implement rollback for already uploaded files if needed
          return;
        }
        
        // Get public URL (ensure bucket policies allow public reads or use signed URLs)
        const { data: urlData } = supabase.storage
          .from('application-documents')
          .getPublicUrl(fileName);

        currentUploadedFileDetails.push({
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
          size: file.size,
        });
      }
      setUploadedFileDetails(currentUploadedFileDetails);
    }

    try {
      const { data: applicationData, error: applicationError } = await supabase
        .from('franchise_applications')
        .insert([
          {
            user_id: user.id,
            contact_name: contactName,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            intended_city: intendedCity,
            investment_amount: investmentAmount || null,
            experience_description: experienceDescription || null,
            documents: currentUploadedFileDetails.length > 0 ? currentUploadedFileDetails : null,
            status: 'submitted', // Set status to submitted
            submitted_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (applicationError) {
        throw applicationError;
      }

      setSuccessMessage('您的加盟申请已成功提交！我们会尽快与您联系。');
      if (onSuccess && applicationData) {
        onSuccess(applicationData.id);
      }
      // Reset form or redirect
      setContactName(profile?.full_name || '');
      setContactPhone('');
      // setContactEmail(user.email || ''); // Keep email prefilled
      setIntendedCity('');
      setInvestmentAmount('');
      setExperienceDescription('');
      setFiles(null);
      setUploadedFileDetails([]);

    } catch (err: any) {
      setError(err.message || '提交申请失败，请稍后再试。');
      if (onFailure) {
        onFailure(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">加盟申请表</h2>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
      {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">{successMessage}</div>}

      <div>
        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">姓名 <span className="text-red-500">*</span></label>
        <input
          id="contactName"
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">邮箱 <span className="text-red-500">*</span></label>
        <input
          id="contactEmail"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
          readOnly={!!user?.email} // Make it readonly if prefilled from auth user
        />
      </div>

      <div>
        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">联系电话 <span className="text-red-500">*</span></label>
        <input
          id="contactPhone"
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="intendedCity" className="block text-sm font-medium text-gray-700">意向城市 <span className="text-red-500">*</span></label>
        <input
          id="intendedCity"
          type="text"
          value={intendedCity}
          onChange={(e) => setIntendedCity(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="investmentAmount" className="block text-sm font-medium text-gray-700">预计投入资金 (可选)</label>
        <input
          id="investmentAmount"
          type="text"
          value={investmentAmount}
          onChange={(e) => setInvestmentAmount(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="例如：50-100万"
        />
      </div>

      <div>
        <label htmlFor="experienceDescription" className="block text-sm font-medium text-gray-700">简要经验描述 (可选)</label>
        <textarea
          id="experienceDescription"
          value={experienceDescription}
          onChange={(e) => setExperienceDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="请简述您的相关行业经验或管理经验"
        />
      </div>

      <div>
        <label htmlFor="documents" className="block text-sm font-medium text-gray-700">
          资质文件 (可选, 最多3个, PDF/JPG/PNG, 每个不超过5MB)
        </label>
        <input
          id="documents"
          type="file"
          multiple
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100"
        />
        {files && Array.from(files).map(file => (
          <p key={file.name} className="text-xs text-gray-500 mt-1">已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
        ))}
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {loading ? '提交中...' : '提交申请'}
        </button>
      </div>
    </form>
  );
};

export default FranchiseApplicationForm;