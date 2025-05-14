import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export const ShoppingCart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      // 假设我们有一个购物车表，关联了用户ID和商品
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products(name, price, image_url)
        `)
        .eq('user_id', 'current_user_id'); // 这里需要替换为实际的用户ID

      if (error) throw error;

      // 转换数据格式
      const formattedItems = data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products.name,
        price: item.products.price,
        quantity: item.quantity,
        image_url: item.products.image_url
      })) || [];

      setCartItems(formattedItems);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      // 更新本地状态
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );

      // 更新数据库
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating quantity:', error);
      // 如果出错，重新获取购物车数据
      fetchCartItems();
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      // 更新本地状态
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

      // 从数据库中删除
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing item:', error);
      // 如果出错，重新获取购物车数据
      fetchCartItems();
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    // 这里可以导航到结账页面或打开结账模态框
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">购物车</h2>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg mb-4">购物车是空的</p>
          <button
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
            onClick={() => window.history.back()}
          >
            继续购物
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-4">商品</th>
                    <th className="text-center pb-4">单价</th>
                    <th className="text-center pb-4">数量</th>
                    <th className="text-right pb-4">小计</th>
                    <th className="text-right pb-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-4">
                        <div className="flex items-center">
                          <img
                            src={item.image_url || 'https://via.placeholder.com/80'}
                            alt={item.product_name}
                            className="w-20 h-20 object-cover rounded-md mr-4"
                          />
                          <span className="font-medium">{item.product_name}</span>
                        </div>
                      </td>
                      <td className="text-center py-4">¥{item.price.toFixed(2)}</td>
                      <td className="text-center py-4">
                        <div className="flex items-center justify-center">
                          <button
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="mx-3">{item.quantity}</span>
                          <button
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="text-right py-4 font-medium">¥{(item.price * item.quantity).toFixed(2)}</td>
                      <td className="text-right py-4">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeItem(item.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col md:flex-row justify-between items-center">
              <button
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors mb-4 md:mb-0"
                onClick={() => window.history.back()}
              >
                继续购物
              </button>

              <div className="text-right">
                <div className="text-xl font-bold mb-2">
                  总计: <span className="text-primary">¥{calculateTotal().toFixed(2)}</span>
                </div>
                <button
                  className="bg-secondary text-white px-8 py-3 rounded-md hover:bg-secondary-dark transition-colors"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? '处理中...' : '结算订单'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;