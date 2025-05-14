import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

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
}

export const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        items: formattedItems
      };

      setOrder(completeOrder);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('获取订单详情失败，请稍后再试');
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
          onClick={() => navigate('/orders')}
        >
          返回订单列表
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">未找到订单信息</p>
        <button
          className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
          onClick={() => navigate('/orders')}
        >
          返回订单列表
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">订单详情</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">订单信息</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p><span className="font-medium">订单编号:</span> {order.order_number}</p>
            <p><span className="font-medium">下单时间:</span> {order.created_at}</p>
            <p><span className="font-medium">订单状态:</span> {getStatusText(order.status)}</p>
            <p><span className="font-medium">订单总额:</span> ¥{order.total_amount.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">收货信息</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p><span className="font-medium">收件人:</span> {order.shipping_info.recipient_name}</p>
            <p><span className="font-medium">联系电话:</span> {order.shipping_info.phone}</p>
            <p><span className="font-medium">收货地址:</span> {order.shipping_info.province}{order.shipping_info.city}{order.shipping_info.district}{order.shipping_info.address}</p>
            {order.shipping_info.postal_code && (
              <p><span className="font-medium">邮政编码:</span> {order.shipping_info.postal_code}</p>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2 text-gray-700">商品清单</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">商品名称</th>
              <th className="py-3 px-6 text-center">单价</th>
              <th className="py-3 px-6 text-center">数量</th>
              <th className="py-3 px-6 text-right">小计</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {order.items.map(item => (
              <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">{item.product_name}</td>
                <td className="py-3 px-6 text-center">¥{item.price.toFixed(2)}</td>
                <td className="py-3 px-6 text-center">{item.quantity}</td>
                <td className="py-3 px-6 text-right">¥{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td className="py-3 px-6 text-right" colSpan={3}>总计</td>
              <td className="py-3 px-6 text-right">¥{order.total_amount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
          onClick={() => navigate('/orders')}
        >
          返回订单列表
        </button>
        
        {order.status === 'pending' && (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
            onClick={() => {
              // 这里可以添加取消订单的逻辑
              alert('取消订单功能将在后续版本中实现');
            }}
          >
            取消订单
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;