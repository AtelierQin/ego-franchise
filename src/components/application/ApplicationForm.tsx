import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ApplicationStatus } from '../../lib/supabase';

interface ApplicationFormProps {
  onSuccess?: () => void;
}

const ApplicationForm = ({ onSuccess }: ApplicationFormProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [investment, setInvestment] = useState('');
  const [experience, setExperience] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 3) {
        setError('最多只能上传3个文件');
        return;
      }
      
      // 检查文件类型和大小
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      const invalidFiles = selectedFiles.filter(
        file => !validTypes.includes(file.type) || file.size > maxSize
      );
      
      if (invalidFiles.length > 0) {
        setError('文件格式必须是PDF、JPG或PNG，且大小不超过5MB');
        return;
      }
      
      setFiles(selectedFiles);
      setError(null);
    }
  };

  // 提交申请
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. 获取当前登录用户
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('请先登录');
      }

      // 2. 上传资质文件
      const fileUrls = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `applications/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('qualifications')
          .upload(filePath, file);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // 获取文件URL
        const { data } = supabase.storage
          .from('qualifications')
          .getPublicUrl(filePath);
          
        fileUrls.push(data.publicUrl);
      }

      // 3. 创建申请记录
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          name,
          phone,
          email,
          city,
          investment_amount: parseFloat(investment),
          experience,
          qualification_files: fileUrls,
          status: ApplicationStatus.PENDING,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      // 申请成功
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || '提交申请失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mx-auto">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-3 text-lg font-medium text-gray-900">申请提交成功！</h2>
          <p className="mt-2 text-sm text-gray-500">
            您的加盟申请已成功提交，我们的招商专员将尽快审核您的申请，请耐心等待。
          </p>
          <div className="mt-4">
            <a
              href="/application/status"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              查看申请状态
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">加盟申请表</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="col-span-1">
            <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="请输入您的姓名"
              required
            />
          </div>

          <div className="col-span-1">
            <label htmlFor="phone" className="block text-gray-700 text-sm font-medium mb-2">
              联系电话 <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="请输入您的联系电话"
              required
            />
          </div>

          <div className="col-span-1">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              邮箱 <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="请输入您的邮箱"
              required
            />
          </div>

          <div className="col-span-1">
            <label htmlFor="city" className="block text-gray-700 text-sm font-medium mb-2">
              意向城市 <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="请输入您的意向城市"
              required
            />
          </div>

          <div className="col-span-1">
            <label htmlFor="investment" className="block text-gray-700 text-sm font-medium mb-2">
              预计投入资金（万元）<span className="text-red-500">*</span>
            </label>
            <input
              id="investment"
              type="number"
              value={investment}
              onChange={(e) => setInvestment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="请输入预计投入资金"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="experience" className="block text-gray-700 text-sm font-medium mb-2">
              简要经验描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="请简要描述您的相关经验（如餐饮、零售等行业经验）"
              required
              rows={4}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              上传资质文件 <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                  >
                    <span>上传文件</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                  </label>
                  <p className="pl-1">或拖拽文件到此处</p>
                </div>
                <p className="text-xs text-gray-500">
                  支持PDF、JPG、PNG格式，最多3个文件，单个文件不超过5MB
                </p>
                {files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">已选择 {files.length} 个文件:</p>
                    <ul className="mt-1 text-xs text-left text-gray-500">
                      {Array.from(files).map((file, index) => (
                        <li key={index} className="truncate">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '提交中...' : '提交申请'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;