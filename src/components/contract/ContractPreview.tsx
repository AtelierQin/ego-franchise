import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ContractPreviewProps {
  applicationId?: number;
}

interface Contract {
  id: number;
  title: string;
  content: string;
  version: string;
  created_at: string;
}

const ContractPreview = ({ applicationId }: ContractPreviewProps) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        // 获取当前登录用户
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('请先登录');
        }

        // 获取用户的申请记录
        let applicationData;
        
        if (applicationId) {
          // 如果提供了申请ID，直接获取该申请
          const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', applicationId)
            .eq('user_id', user.id)
            .single();
            
          if (error) throw error;
          applicationData = data;
        } else {
          // 否则获取最新的已批准申请
          const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'APPROVED')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (error) throw error;
          applicationData = data;
        }
        
        if (!applicationData) {
          throw new Error('没有找到已批准的申请');
        }

        // 获取合同模板
        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (contractError) throw contractError;
        
        setContract(contractData as Contract);
      } catch (err: any) {
        setError(err.message || '获取合同失败');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [applicationId]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">加载合同中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          <p>{error}</p>
        </div>
        <div className="mt-4 text-center">
          <a
            href="/application/status"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            返回申请状态
          </a>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到合同</h3>
          <p className="mt-1 text-sm text-gray-500">系统暂时无法提供合同模板。</p>
          <div className="mt-6">
            <a
              href="/application/status"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              返回申请状态
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{contract.title}</h2>
      
      <div className="mb-6 border border-gray-200 rounded-lg p-6 bg-gray-50">
        <div className="text-right mb-4">
          <p className="text-sm text-gray-500">合同版本: {contract.version}</p>
          <p className="text-sm text-gray-500">生成日期: {formatDate(contract.created_at)}</p>
        </div>
        
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: contract.content }} />
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <a
          href="/application/status"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          返回
        </a>
        
        <a
          href="/contract/sign"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          继续签约
        </a>
      </div>
    </div>
  );
};

export default ContractPreview;