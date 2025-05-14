import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ApplicationStatus as AppStatus } from '../../lib/supabase';

interface Application {
  id: number;
  status: AppStatus;
  created_at: string;
  updated_at: string;
  reviewer_comment?: string;
  name: string;
  city: string;
  qualification_files: string[];
}

const ApplicationStatusComponent = () => {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      try {
        // 获取当前登录用户
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('请先登录');
        }

        // 获取用户的申请记录
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          throw error;
        }

        setApplication(data as Application);
      } catch (err: any) {
        setError(err.message || '获取申请状态失败');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationStatus();
  }, []);

  // 获取状态对应的中文描述和颜色
  const getStatusInfo = (status: AppStatus) => {
    switch (status) {
      case AppStatus.PENDING:
        return { text: '待审核', color: 'bg-yellow-100 text-yellow-800' };
      case AppStatus.REVIEWING:
        return { text: '审核中', color: 'bg-blue-100 text-blue-800' };
      case AppStatus.APPROVED:
        return { text: '已通过', color: 'bg-green-100 text-green-800' };
      case AppStatus.REJECTED:
        return { text: '已驳回', color: 'bg-red-100 text-red-800' };
      case AppStatus.NEED_MORE_INFO:
        return { text: '需补充材料', color: 'bg-orange-100 text-orange-800' };
      default:
        return { text: '未知状态', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          <p>{error}</p>
        </div>
        <div className="mt-4 text-center">
          <a
            href="/application/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            提交新申请
          </a>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mx-auto">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到申请记录</h3>
          <p className="mt-1 text-sm text-gray-500">您还没有提交过加盟申请。</p>
          <div className="mt-6">
            <a
              href="/application/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              提交新申请
            </a>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(application.status);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">申请状态</h2>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">申请编号: #{application.id}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
        
        <div className="border-t border-gray-200 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">申请人</dt>
              <dd className="mt-1 text-sm text-gray-900">{application.name}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">意向城市</dt>
              <dd className="mt-1 text-sm text-gray-900">{application.city}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">提交时间</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(application.created_at)}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">最后更新</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(application.updated_at || application.created_at)}</dd>
            </div>
            
            {application.reviewer_comment && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">审核意见</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{application.reviewer_comment}</dd>
              </div>
            )}
            
            {application.qualification_files && application.qualification_files.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">上传的资质文件</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {application.qualification_files.map((file, index) => (
                      <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <div className="w-0 flex-1 flex items-center">
                          <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          </svg>
                          <span className="ml-2 flex-1 w-0 truncate">资质文件 {index + 1}</span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <a href={file} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:text-primary-dark">
                            查看
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {application.status === AppStatus.NEED_MORE_INFO && (
        <div className="mt-6">
          <a
            href="/application/update"
            className="inline-flex w-full justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            补充申请材料
          </a>
        </div>
      )}
      
      {application.status === AppStatus.REJECTED && (
        <div className="mt-6">
          <a
            href="/application/new"
            className="inline-flex w-full justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            重新申请
          </a>
        </div>
      )}
      
      {application.status === AppStatus.APPROVED && (
        <div className="mt-6">
          <a
            href="/contract/sign"
            className="inline-flex w-full justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            前往签约
          </a>
        </div>
      )}
    </div>
  );
};

export default ApplicationStatusComponent;