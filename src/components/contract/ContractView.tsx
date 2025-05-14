import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface SignedContract {
  id: number;
  application_id: number;
  user_id: string;
  signature_url: string;
  signed_at: string;
  status: string;
  contract_number: string;
}

interface Contract {
  id: number;
  title: string;
  content: string;
  version: string;
  created_at: string;
}

interface Application {
  id: number;
  name: string;
  city: string;
  user_id: string;
}

const ContractView = () => {
  const { id } = useParams<{ id: string }>();
  const [signedContract, setSignedContract] = useState<SignedContract | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractDetails = async () => {
      if (!id) return;
      
      try {
        // 获取当前登录用户
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('请先登录');
        }

        // 获取已签署合同信息
        const { data: signedContractData, error: signedContractError } = await supabase
          .from('signed_contracts')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (signedContractError) throw signedContractError;
        if (!signedContractData) throw new Error('未找到合同信息');
        
        setSignedContract(signedContractData as SignedContract);
        
        // 获取申请信息
        const { data: applicationData, error: applicationError } = await supabase
          .from('applications')
          .select('*')
          .eq('id', signedContractData.application_id)
          .single();
          
        if (applicationError) throw applicationError;
        setApplication(applicationData as Application);
        
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
        setError(err.message || '获取合同信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchContractDetails();
  }, [id]);

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
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">加载合同信息中...</p>
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
            href="/contract/management"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            返回合同列表
          </a>
        </div>
      </div>
    );
  }

  if (!signedContract || !contract || !application) {
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">未找到合同信息</h3>
          <p className="mt-1 text-sm text-gray-500">请确认您访问的合同ID是否正确。</p>
          <div className="mt-6">
            <a
              href="/contract/management"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              返回合同列表
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{contract.title}</h2>
        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
          已签署
        </span>
      </div>
      
      <div className="mb-6 border-b border-gray-200 pb-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">合同编号</dt>
            <dd className="mt-1 text-sm text-gray-900">{signedContract.contract_number || `C${signedContract.id}`}</dd>
          </div>
          
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">签署日期</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(signedContract.signed_at)}</dd>
          </div>
          
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">申请人</dt>
            <dd className="mt-1 text-sm text-gray-900">{application.name}</dd>
          </div>
          
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">加盟城市</dt>
            <dd className="mt-1 text-sm text-gray-900">{application.city}</dd>
          </div>
          
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">合同版本</dt>
            <dd className="mt-1 text-sm text-gray-900">{contract.version}</dd>
          </div>
        </dl>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">合同内容</h3>
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: contract.content }} />
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">电子签名</h3>
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 flex justify-center">
          <img 
            src={signedContract.signature_url} 
            alt="电子签名" 
            className="max-h-32 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <a
          href="/contract/management"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          返回合同列表
        </a>
        
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          打印合同
        </button>
      </div>
    </div>
  );
};

export default ContractView;