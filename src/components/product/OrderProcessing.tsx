import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { OrderStatus } from '../../lib/supabase';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface ShippingInfo {
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  postal_code?: string;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_info: ShippingInfo;
  items: OrderItem[];
  tracking_number?: string;
  notes?: string;
}

export const OrderProcessing: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  const fetchOrderDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // 获取订单基本信息
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('订单不存在');

      // 获取订单项
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          product_id,
          quantity,
          price,
          products(name)
        `)
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      // 格式化订单项数据
      const formattedItems = orderItems?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || '未知商品',
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price
      })) || [];

      // 构建完整的订单对象
      const completeOrder: Order = {
        id: orderData.id,
        order_number: orderData.order_number || `ORD-${orderData.id.slice(0, 8)}`,
        created_at: new Date(orderData.created_at).toLocaleString(),
        status: orderData.status,
        total_amount: orderData.total_amount,
        shipping_info: orderData.shipping_info,
        items: formattedItems,
        tracking_number: orderData.tracking_number || '',
        notes: orderData.notes || ''
      };

      setOrder(completeOrder);
      setTrackingNumber(completeOrder.tracking_number || '');
      setNotes(completeOrder.notes || '');
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('获取订单详情失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    
    try {
      setUpdating(true);
      setError(null);
      setSuccessMessage(null);

      const updates = {
        status: newStatus,
        tracking_number: trackingNumber.trim() || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id);

      if (error) throw error;

      // 如果状态更新为已发货，创建货款记录（在实际项目中，这可能会通过Supabase触发器或Edge Function处理）
      if (newStatus === OrderStatus.SHIPPED) {
        // 这里简化处理，实际项目中可能需要更复杂的逻辑
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([
            {
              order_id: order.id,
              amount: order.total_amount,
              status: 'pending', // 待支付
              user_id: 'franchisee_id', // 需要替换为实际的加盟商ID
            }
          ]);

        if (paymentError) console.error('Error creating payment record:', paymentError);
      }

      // 更新本地状态
      setOrder({
        ...order,
        status: newStatus,
        tracking_number: trackingNumber.trim() || undefined,
        notes: notes.trim() || undefined
      });

      setSuccessMessage(`订单状态已更新为${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('更新订单状态失败，请稍后再试');
    } finally {
      setUpdating(false);
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

  // 根据当前状态获取可用的下一步状态
  const getAvailableActions = (currentStatus: string) => {
    switch (currentStatus) {
      case OrderStatus.PENDING:
        return [
          { status: OrderStatus.PROCESSING, label: '确认订单' },
          { status: 'cancelled', label: '取消订单' }
        ];
      case OrderStatus.PROCESSING:
        return [
          { status: OrderStatus.SHIPPED, label: '标记为已发货' },
          { status: 'cancelled', label: '取消订单' }
        ];
      case OrderStatus.SHIPPED:
        return [
          { status: OrderStatus.COMPLETED, label: '标记为已完成' }
        ];
      default:
        return [];
    }
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
          onClick={() => orderId && fetchOrderDetails(orderId)}
        >
          重试
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">未找到订单信息</span>
        <button
          className="mt-4 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => navigate('/admin/orders')}
        >
          返回订单列表
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* 订单处理标题 */}
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">订单处理</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">订单号: {order.order_number}</p>
        </div>
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </span>
      </div>

      {/* 成功消息 */}
      {successMessage && (
        <div className="mx-4 my-2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccessMessage(null)}
          >
            <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>关闭</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </button>
        </div>
      )}

      {/* 订单详情 */}
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">订单时间</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.created_at}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">订单总金额</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">¥{order.total_amount.toFixed(2)}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">收货信息</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <p>收件人: {order.shipping_info.recipient_name}</p>
              <p>电话: {order.shipping_info.phone}</p>
              <p>地址: {order.shipping_info.province}{order.shipping_info.city}{order.shipping_info.district}{order.shipping_info.address}</p>
              {order.shipping_info.postal_code && <p>邮编: {order.shipping_info.postal_code}</p>}
            </dd>
          </div>
        </dl>
      </div>

      {/* 订单商品列表 */}
      <div className="px-4 py-5 sm:px-6">
        <h4 className="text-md font-medium text-gray-900">订单商品</h4>
        <div className="mt-4 flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单价</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">小计</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥{item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥{item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 订单处理表单 */}
      <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
        <h4 className="text-md font-medium text-gray-900">订单处理</h4>
        <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="tracking_number" className="block text-sm font-medium text-gray-700">物流单号</label>
            <div className="mt-1">
              <input
                type="text"
                name="tracking_number"
                id="tracking_number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">处理备注</label>
            <div className="mt-1">
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* 状态更新按钮 */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            返回列表
          </button>
          
          {getAvailableActions(order.status).map((action) => (
            <button
              key={action.status}
              type="button"
              onClick={() => updateOrderStatus(action.status)}
              disabled={updating}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${action.status === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {updating ? '处理中...' : action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};