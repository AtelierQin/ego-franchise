import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ContractPreview from './ContractPreview';

interface SignatureData {
  signatureUrl: string;
  signedAt: string;
}

const ContractSign = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  
  // 签名板状态
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const fetchApplicationId = async () => {
      try {
        // 获取当前登录用户
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('请先登录');
        }

        // 获取用户最新的已批准申请
        const { data, error } = await supabase
          .from('applications')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'APPROVED')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setApplicationId(data.id);
        } else {
          throw new Error('没有找到已批准的申请');
        }
      } catch (err: any) {
        setError(err.message || '获取申请信息失败');
      }
    };

    fetchApplicationId();
    initializeCanvas();
  }, []);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布样式
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制底部签名线
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 20);
    ctx.lineTo(canvas.width - 20, canvas.height - 20);
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    
    // 获取鼠标/触摸位置
    let clientX, clientY;
    
    if ('touches' in e) {
      // 触摸事件
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // 鼠标事件
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 获取鼠标/触摸位置
    let clientX, clientY;
    
    if ('touches' in e) {
      // 触摸事件
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // 防止触摸时页面滚动
    } else {
      // 鼠标事件
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setHasSignature(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 重新绘制底部签名线
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 20);
    ctx.lineTo(canvas.width - 20, canvas.height - 20);
    ctx.stroke();
    
    setHasSignature(false);
  };

  const saveSignature = async () => {
    if (!hasSignature) {
      setError('请先在签名区域签名');
      return;
    }
    
    if (!applicationId) {
      setError('无法获取申请信息');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 获取当前登录用户
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('请先登录');
      }

      // 将签名转换为图片URL
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('无法获取签名');
      
      const signatureUrl = canvas.toDataURL('image/png');
      const signedAt = new Date().toISOString();
      
      // 上传签名图片到存储
      const fileName = `signature-${user.id}-${Date.now()}.png`;
      const filePath = `signatures/${fileName}`;
      
      // 将Base64转换为Blob
      const base64Data = signatureUrl.split(',')[1];
      const blob = await (await fetch(`data:image/png;base64,${base64Data}`)).blob();
      
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, blob);
        
      if (uploadError) throw uploadError;
      
      // 获取签名图片的公共URL
      const { data } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);
      
      const publicSignatureUrl = data.publicUrl;
      
      // 创建合同记录
      const { error: contractError } = await supabase
        .from('signed_contracts')
        .insert({
          application_id: applicationId,
          user_id: user.id,
          signature_url: publicSignatureUrl,
          signed_at: signedAt,
          status: 'SIGNED'
        });
        
      if (contractError) throw contractError;
      
      // 更新申请状态为已签约
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'CONTRACTED' })
        .eq('id', applicationId);
        
      if (updateError) throw updateError;
      
      setSignatureData({
        signatureUrl: publicSignatureUrl,
        signedAt
      });
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '签约失败');
    } finally {
      setLoading(false);
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

  if (success && signatureData) {
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
          <h2 className="mt-3 text-lg font-medium text-gray-900">合同签署成功！</h2>
          <p className="mt-2 text-sm text-gray-500">
            您已于 {formatDate(signatureData.signedAt)} 成功签署加盟合同。
          </p>
          
          <div className="mt-6 border border-gray-200 rounded-md p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">您的电子签名：</p>
            <img 
              src={signatureData.signatureUrl} 
              alt="电子签名" 
              className="mx-auto max-h-24 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="mt-6">
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              前往加盟商管理中心
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
        
        <div className="text-center">
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

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">合同签约</h2>
      
      {/* 合同预览 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">合同内容</h3>
        {applicationId && <ContractPreview applicationId={applicationId} />}
      </div>
      
      {/* 电子签名区域 */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">电子签名</h3>
        <p className="text-sm text-gray-500 mb-4">请在下方区域手写您的签名：</p>
        
        <div className="border-2 border-gray-300 rounded-md mb-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />
        </div>
        
        <div className="flex justify-between mb-6">
          <button
            type="button"
            onClick={clearSignature}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            清除签名
          </button>
          
          <button
            type="button"
            onClick={saveSignature}
            disabled={loading || !hasSignature}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading || !hasSignature ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
          >
            {loading ? '处理中...' : '确认签署合同'}
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>签署说明：</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>请确保您已仔细阅读并理解合同内容</li>
            <li>电子签名与手写签名具有同等法律效力</li>
            <li>签署后，您将收到一份合同电子副本</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContractSign;