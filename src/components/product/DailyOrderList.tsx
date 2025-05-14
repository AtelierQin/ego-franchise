import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  order_type: string;
}

export const DailyOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // 构建查询
      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', 'current_user_id') // 需要替换为实际的用户ID
        .eq('order_type', 'daily') // 只获取日常订单
        .order('created_at', { ascending: false });

      // 根据筛选条件过滤
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // 格式化订单数据
      const formattedOrders = data?.map(order => ({
        id: order.id,
        order_number: order.order_number || `ORD-${order.id.slice(0, 8)}`,
        created_at: new Date(order.created_at).toLocaleString(),
        status: order.status,
        total_amount: order.total_amount,
        order_type: order.order_type
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

  // 再来一单功能
  const handleReorder = async (orderId: string) => {
    try {
      // 获取订单详情
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // 获取订单项
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // 将商品添加到购物车（这里假设有一个购物车状态管理）
      // 实际实现可能需要调用购物车服务或状态管理
      console.log('重新下单:', { orderItems });
      
      // 跳转到购物车页面
      navigate('/cart', { 
        state: { 
          reorderItems: orderItems,
          shippingInfo: orderData.shipping_info 
        } 
      });
    } catch (error) {
      console.error('重新下单失败:', error);
      alert('重新下单失败，请稍后再试');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">日常订单记录</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            全部
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md ${filter === 'pending' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            待处理
          </button>
          <button 
            onClick={() => setFilter('shipped')}
            className={`px-4 py-2 rounded-md ${filter === 'shipped' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            已发货
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md ${filter === 'completed' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            已完成
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => fetchOrders()}
          >
            重试
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">暂无日常订单记录</p>
          <button
            onClick={() => navigate('/products')}
            className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-md transition duration-300"
          >
            去下单
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单编号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下单时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{order.created_at}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">¥{order.total_amount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => handleReorder(order.id)}
                      className="text-secondary hover:text-secondary-dark"
                    >
                      再来一单
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

export default DailyOrderList;