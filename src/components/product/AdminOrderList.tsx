import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { OrderStatus } from '../../lib/supabase';
import { OrderNotification } from './OrderNotification';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  user_id: string;
  user_name?: string;
  is_first_order?: boolean;
}

export const AdminOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();

    // 设置实时订阅，监听新订单
    const subscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        // 当有新订单时，更新订单列表
        const newOrder = payload.new as any;
        const formattedOrder: Order = {
          id: newOrder.id,
          order_number: newOrder.order_number || `ORD-${newOrder.id.slice(0, 8)}`,
          created_at: new Date(newOrder.created_at).toLocaleString(),
          status: newOrder.status,
          total_amount: newOrder.total_amount,
          user_id: newOrder.user_id,
          is_first_order: newOrder.is_first_order
        };
        setOrders(prev => [formattedOrder, ...prev]);

        // 创建订单通知
        createOrderNotification(formattedOrder);
      })
      .subscribe();

    return () => {
      // 组件卸载时取消订阅
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // 构建查询
      let query = supabase
        .from('orders')
        .select(`
          *,
          users:user_id (name)
        `)
        .order('created_at', { ascending: false });

      // 应用状态筛选
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // 应用订单类型筛选
      if (orderTypeFilter === 'first') {
        query = query.eq('is_first_order', true);
      } else if (orderTypeFilter === 'regular') {
        query = query.eq('is_first_order', false);
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
        user_id: order.user_id,
        user_name: order.users?.name || '未知用户',
        is_first_order: order.is_first_order
      })) || [];

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('获取订单列表失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const createOrderNotification = async (order: Order) => {
    try {
      await supabase
        .from('order_notifications')
        .insert([
          {
            order_id: order.id,
            order_number: order.order_number,
            total_amount: order.total_amount,
            is_read: false
          }
        ]);
    } catch (error) {
      console.error('Error creating order notification:', error);
    }
  };

  // 获取订单状态的中文描述
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待处理',
      'processing': '处理中',
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
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleProcessOrder = (orderId: string) => {
    navigate(`/admin/orders/${orderId}/process`);
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">订单管理</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">查看和处理所有订单</p>
        </div>
        <div className="flex items-center space-x-4">
          <OrderNotification />
          <button
            onClick={() => fetchOrders()}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="px-4 py-3 bg-gray-50 border-t border-b border-gray-200 sm:px-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">订单状态</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="all">全部状态</option>
            <option value={OrderStatus.PENDING}>待处理</option>
            <option value={OrderStatus.PROCESSING}>处理中</option>
            <option value={OrderStatus.SHIPPED}>已发货</option>
            <option value={OrderStatus.COMPLETED}>已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">订单类型</label>
          <select
            id="type-filter"
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="all">全部订单</option>
            <option value="first">首批订单</option>
            <option value="regular">日常订单</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => fetchOrders()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            应用筛选
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => fetchOrders()}
          >
            重试
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
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
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无订单</h3>
          <p className="mt-1 text-sm text-gray-500">当前筛选条件下没有找到订单记录</p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单号</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">加盟商</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单类型</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下单时间</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.user_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.is_first_order ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              首批订单
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              日常订单
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥{order.total_amount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.created_at}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewOrder(order.id)}
                            className="text-primary hover:text-primary-dark mr-3"
                          >
                            查看
                          </button>
                          {order.status === OrderStatus.PENDING && (
                            <button
                              onClick={() => handleProcessOrder(order.id)}
                              className="text-secondary hover:text-secondary-dark"
                            >
                              处理
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};