import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
}

export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取当前用户的订单列表
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', 'current_user_id') // 需要替换为实际的用户ID
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 格式化订单数据
      const formattedOrders = data?.map(order => ({
        id: order.id,
        order_number: order.order_number || `ORD-${order.id.slice(0, 8)}`,
        created_at: new Date(order.created_at).toLocaleString(),
        status: order.status,
        total_amount: order.total_amount
      })) || [];

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('获取订单列表失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 获取订单状态的中文描述
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待处理',
      'confirmed': '已确认',
      'shipped': '已发货',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 获取订单状态的颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/order/${orderId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error}</span>
        <button
          className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => fetchOrders()}
        >
          重试
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">您还没有任何订单</p>
        <button
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
          onClick={() => navigate('/products')}
        >
          去购物
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">我的订单</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">订单编号</th>
              <th className="py-3 px-6 text-left">下单时间</th>
              <th className="py-3 px-6 text-center">订单状态</th>
              <th className="py-3 px-6 text-right">订单金额</th>
              <th className="py-3 px-6 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {orders.map(order => (
              <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">{order.order_number}</td>
                <td className="py-3 px-6 text-left">{order.created_at}</td>
                <td className="py-3 px-6 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="py-3 px-6 text-right">¥{order.total_amount.toFixed(2)}</td>
                <td className="py-3 px-6 text-center">
                  <button
                    onClick={() => handleViewOrder(order.id)}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1 px-3 rounded"
                  >
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;