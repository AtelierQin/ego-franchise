import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface OrderFormProps {
  cartItems: any[];
  totalAmount: number;
  onOrderSuccess?: () => void;
}

interface ShippingInfo {
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  postal_code: string;
}

export const OrderForm: React.FC<OrderFormProps> = ({ cartItems, totalAmount, onOrderSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    recipient_name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    address: '',
    postal_code: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!shippingInfo.recipient_name.trim()) {
      setError('收件人姓名不能为空');
      return false;
    }
    if (!shippingInfo.phone.trim() || !/^1[3-9]\d{9}$/.test(shippingInfo.phone)) {
      setError('请输入有效的手机号码');
      return false;
    }
    if (!shippingInfo.province.trim() || !shippingInfo.city.trim() || !shippingInfo.district.trim()) {
      setError('请选择完整的省市区信息');
      return false;
    }
    if (!shippingInfo.address.trim()) {
      setError('详细地址不能为空');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      setError('购物车为空，无法提交订单');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 1. 创建订单
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: 'current_user_id', // 需要替换为实际的用户ID
            total_amount: totalAmount,
            status: 'pending',
            shipping_info: shippingInfo
          }
        ])
        .select();

      if (orderError) throw orderError;
      if (!orderData || orderData.length === 0) throw new Error('创建订单失败');

      const orderId = orderData[0].id;

      // 2. 创建订单项
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. 清空购物车
      const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', 'current_user_id'); // 需要替换为实际的用户ID

      if (cartError) throw cartError;

      // 4. 订单成功回调
      if (onOrderSuccess) {
        onOrderSuccess();
      }

      // 5. 导航到订单成功页面
      navigate(`/order-success/${orderId}`);
    } catch (error) {
      console.error('Error submitting order:', error);
      setError('提交订单失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">收货信息</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipient_name">
              收件人姓名 *
            </label>
            <input
              type="text"
              id="recipient_name"
              name="recipient_name"
              value={shippingInfo.recipient_name}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
              手机号码 *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={shippingInfo.phone}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              pattern="^1[3-9]\d{9}$"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="province">
              省份 *
            </label>
            <input
              type="text"
              id="province"
              name="province"
              value={shippingInfo.province}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
              城市 *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={shippingInfo.city}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="district">
              区/县 *
            </label>
            <input
              type="text"
              id="district"
              name="district"
              value={shippingInfo.district}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
            详细地址 *
          </label>
          <textarea
            id="address"
            name="address"
            value={shippingInfo.address}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postal_code">
            邮政编码
          </label>
          <input
            type="text"
            id="postal_code"
            name="postal_code"
            value={shippingInfo.postal_code}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">订单摘要</h3>
          <div className="flex justify-between mb-2">
            <span>商品总数:</span>
            <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}件</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>订单总额:</span>
            <span className="text-primary">¥{totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-gray-400 transition-colors mr-4"
          >
            返回购物车
          </button>
          <button
            type="submit"
            className="bg-secondary text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline hover:bg-secondary-dark transition-colors"
            disabled={loading}
          >
            {loading ? '提交中...' : '提交订单'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;