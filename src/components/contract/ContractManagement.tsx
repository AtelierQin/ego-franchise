import { useState, useEffect } from 'react';
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

interface Application {
  id: number;
  name: string;
  city: string;
};

const ContractManagement = () => {
  const [contracts, setContracts] = useState<SignedContract[]>([]);
  const [applications, setApplications] = useState<{[key: number]: Application}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        // 获取当前登录用户
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('请先登录');
        }

        // 获取用户的所有已签署合同
        const { data: contractsData, error: contractsError } = await supabase
          .from('signed_contracts')
          .select('*')
          .eq('user_id', user.id)
          .order('signed_at', { ascending: false });
          
        if (contractsError) throw contractsError;
        
        if (!contractsData || contractsData.length === 0) {
          setContracts([]);
          setLoading(false);
          return;
        }
        
        setContracts(contractsData as SignedContract[]);
        
        // 获取相关的申请信息
        const applicationIds = contractsData.map(contract => contract.application_id);
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('applications')
          .select('id, name, city')
          .in('id', applicationIds);
          
        if (applicationsError) throw applicationsError;
        
        // 将申请数据转换为以ID为键的对象
        const applicationsMap: {[key: number]: Application} = {};
        applicationsData?.forEach((app: Application) => {
          applicationsMap[app.id] = app;
        });
        
        setApplications(applicationsMap);
      } catch (err: any) {
        setError(err.message || '获取合同信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

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
      </div>
    );
  }

  if (contracts.length === 0) {
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到已签署的合同</h3>
          <p className="mt-1 text-sm text-gray-500">您还没有签署任何加盟合同。</p>
          <div className="mt-6">
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
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">我的合同</h2>
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">合同编号</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">申请人</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">城市</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">签署日期</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">状态</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {contracts.map((contract) => {
              const application = applications[contract.application_id];
              return (
                <tr key={contract.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {contract.contract_number || `C${contract.id}`}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {application?.name || '未知'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {application?.city || '未知'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(contract.signed_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                      已签署
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <a href={`/contract/view/${contract.id}`} className="text-primary hover:text-primary-dark">
                      查看<span className="sr-only">, {contract.contract_number || `C${contract.id}`}</span>
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>注意事项：</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>合同签署后将永久保存在系统中</li>
          <li>如需合同纸质版，请联系客服</li>
          <li>合同相关问题请致电：400-123-4567</li>
        </ul>
      </div>
    </div>
  );
};

export default ContractManagement;