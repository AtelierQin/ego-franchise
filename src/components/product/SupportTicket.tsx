import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext'; // 导入 useAuth

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  attachments?: string[];
}

interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  is_staff: boolean;
}

export const TicketList: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取当前用户的工单列表
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', 'current_user_id') // 需要替换为实际的用户ID
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 格式化工单数据
      const formattedTickets = data?.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        status: ticket.status,
        created_at: new Date(ticket.created_at).toLocaleString(),
        attachments: ticket.attachments
      })) || [];

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('获取工单列表失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 获取工单状态的中文描述
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待处理',
      'processing': '处理中',
      'resolved': '已解决',
      'closed': '已关闭'
    };
    return statusMap[status] || status;
  };

  // 获取工单状态的颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // 获取工单分类的中文描述
  const getCategoryText = (category: string) => {
    const categoryMap: Record<string, string> = {
      'order': '订单问题',
      'system': '系统操作咨询',
      'policy': '政策疑问',
      'other': '其他'
    };
    return categoryMap[category] || category;
  };

  const handleViewTicket = (ticketId: string) => {
    navigate(`/ticket/${ticketId}`);
  };

  const handleCreateTicket = () => {
    navigate('/ticket/create');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">我的工单</h2>
        <button
          onClick={handleCreateTicket}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          创建工单
        </button>
      </div>

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => fetchTickets()}
          >
            重试
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">暂无工单记录</p>
          <button
            onClick={handleCreateTicket}
            className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-md transition duration-300"
          >
            创建第一个工单
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工单标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{getCategoryText(ticket.category)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{ticket.created_at}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewTicket(ticket.id)}
                      className="text-primary hover:text-primary-dark"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const TicketDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails(ticketId);
    }
  }, [ticketId]);

  const fetchTicketDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // 获取工单基本信息
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (ticketError) throw ticketError;
      if (!ticketData) throw new Error('工单不存在');

      // 获取工单回复
      const { data: replyData, error: replyError } = await supabase
        .from('ticket_replies')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (replyError) throw replyError;

      // 格式化工单数据
      const formattedTicket: Ticket = {
        id: ticketData.id,
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category,
        status: ticketData.status,
        created_at: new Date(ticketData.created_at).toLocaleString(),
        attachments: ticketData.attachments
      };

      // 格式化回复数据
      const formattedReplies = replyData?.map(reply => ({
        id: reply.id,
        ticket_id: reply.ticket_id,
        user_id: reply.user_id,
        user_name: reply.user_name || '用户',
        content: reply.content,
        created_at: new Date(reply.created_at).toLocaleString(),
        is_staff: reply.is_staff
      })) || [];

      setTicket(formattedTicket);
      setReplies(formattedReplies);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      setError('获取工单详情失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !ticketId) return;

    try {
      setSubmitting(true);

      // 提交回复
      const { data, error } = await supabase
        .from('ticket_replies')
        .insert([
          {
            ticket_id: ticketId,
            user_id: 'current_user_id', // 需要替换为实际的用户ID
            user_name: '当前用户', // 需要替换为实际的用户名
            content: replyContent,
            is_staff: false
          }
        ]);

      if (error) throw error;

      // 刷新工单详情
      await fetchTicketDetails(ticketId);
      setReplyContent('');
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('提交回复失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  // 获取工单状态的中文描述
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待处理',
      'processing': '处理中',
      'resolved': '已解决',
      'closed': '已关闭'
    };
    return statusMap[status] || status;
  };

  // 获取工单分类的中文描述
  const getCategoryText = (category: string) => {
    const categoryMap: Record<string, string> = {
      'order': '订单问题',
      'system': '系统操作咨询',
      'policy': '政策疑问',
      'other': '其他'
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error || '工单不存在'}</span>
          <div className="mt-4 flex space-x-4">
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => ticketId && fetchTicketDetails(ticketId)}
            >
              重试
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => navigate('/tickets')}
            >
              返回列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/tickets')}
          className="text-primary hover:text-primary-dark font-medium flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回工单列表
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-800">{ticket.title}</h2>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
              {getStatusText(ticket.status)}
            </span>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span className="mr-4">分类: {getCategoryText(ticket.category)}</span>
            <span>创建时间: {ticket.created_at}</span>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-700 whitespace-pre-line">{ticket.description}</p>
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">附件:</h4>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    附件 {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 回复列表 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">沟通记录</h3>
        {replies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">暂无沟通记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <div 
                key={reply.id} 
                className={`bg-white rounded-lg shadow-md p-4 ${reply.is_staff ? 'border-l-4 border-secondary' : 'border-l-4 border-primary'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-gray-800">
                    {reply.is_staff ? '客服 ' : '我 '}
                    <span className="text-gray-500 font-normal">({reply.user_name})</span>
                  </div>
                  <div className="text-sm text-gray-500">{reply.created_at}</div>
                </div>
                <p className="text-gray-700 whitespace-pre-line">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 回复表单 */}
      {ticket.status !== 'closed' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">回复工单</h3>
          <div className="mb-4">
            <textarea
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-primary"
              rows={4}
              placeholder="请输入您的回复内容..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              disabled={submitting}
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSubmitReply}
              disabled={submitting || !replyContent.trim()}
              className={`px-4 py-2 rounded-md text-white font-medium ${submitting || !replyContent.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
            >
              {submitting ? '提交中...' : '提交回复'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const CreateTicket: React.FC = () => {
  const { user } = useAuth(); // 获取当前用户
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: 'order',
    description: ''
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      if (fileList.length > 2) {
        alert('最多只能上传2张图片');
        return;
      }
      setAttachments(fileList);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('请填写标题和详细描述');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 上传附件（如果有）
      const attachmentUrls: string[] = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fileName = `${user?.id || 'unknown_user'}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
          const filePath = `ticket-attachments/${fileName}`;
          const { data, error: uploadError } = await supabase.storage
            .from('ego-franchise-bucket') // 使用实际的 bucket 名称
            .upload(filePath, file);

          if (uploadError) throw uploadError;
          
          // 获取公共URL
          const { data: urlData } = supabase.storage
            .from('ego-franchise-bucket') // 使用实际的 bucket 名称
            .getPublicUrl(filePath);
            
          if (urlData?.publicUrl) {
            attachmentUrls.push(urlData.publicUrl);
          } else {
            console.warn('Could not get public URL for uploaded file:', filePath);
            // 可以选择抛出错误或记录下来，取决于业务需求
          }
        }
      }

      // 创建工单
      const { data, error } = await supabase
        .from('tickets')
        .insert([
          {
            title: formData.title,
            category: formData.category,
            description: formData.description,
            user_id: user?.id, // 使用实际的用户ID
            status: 'pending',
            attachments: attachmentUrls.length > 0 ? attachmentUrls : null
          }
        ]);

      if (error) throw error;

      // 跳转到工单列表
      navigate('/tickets', { state: { success: true, message: '工单创建成功' } });
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('创建工单失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/tickets')}
          className="text-primary hover:text-primary-dark font-medium flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回工单列表
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">创建工单</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              工单标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
              placeholder="请简要描述您的问题"
              value={formData.title}
              onChange={handleInputChange}
              required
              disabled={submitting}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
              问题分类 <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
              value={formData.category}
              onChange={handleInputChange}
              disabled={submitting}
            >
              <option value="order">订单问题</option>
              <option value="system">系统操作咨询</option>
              <option value="policy">政策疑问</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
              placeholder="请详细描述您遇到的问题，以便我们更好地为您提供帮助"
              value={formData.description}
              onChange={handleInputChange}
              required
              disabled={submitting}
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="attachments">
              附件（可选，最多2张图片）
            </label>
            <input
              type="file"
              id="attachments"
              name="attachments"
              accept="image/*"
              multiple
              max={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
              onChange={handleFileChange}
              disabled={submitting}
            />
            <p className="mt-1 text-sm text-gray-500">支持的格式：JPG, PNG，单个文件大小不超过2MB</p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-md text-white font-medium ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
            >
              {submitting ? '提交中...' : '提交工单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default { TicketList, TicketDetail, CreateTicket };