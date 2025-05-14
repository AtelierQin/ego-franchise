import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  sku: string;
  specifications?: Record<string, string>;
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('无法加载商品信息，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const addToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);
      
      // 检查购物车中是否已有该商品
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('product_id', product.id)
        .eq('user_id', 'current_user_id') // 需要替换为实际的用户ID
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 表示没有找到记录
        throw checkError;
      }

      if (existingItem) {
        // 更新现有购物车项的数量
        const newQuantity = existingItem.quantity + quantity;
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        // 添加新的购物车项
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: 'current_user_id', // 需要替换为实际的用户ID
            product_id: product.id,
            quantity: quantity
          });

        if (insertError) throw insertError;
      }

      // 成功添加到购物车后导航到购物车页面
      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('添加到购物车失败，请稍后再试');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">错误！</strong>
          <span className="block sm:inline"> {error || '商品不存在'}</span>
        </div>
        <button
          className="mt-4 bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
          onClick={() => navigate(-1)}
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <img
              src={product.image_url || 'https://via.placeholder.com/500'}
              alt={product.name}
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="md:w-1/2 p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
            <p className="text-gray-600 mb-6">{product.description}</p>
            
            <div className="mb-6">
              <span className="text-2xl font-bold text-primary">¥{product.price.toFixed(2)}</span>
              <span className="text-sm text-gray-500 ml-2">库存: {product.stock}</span>
            </div>
            
            {product.specifications && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">规格参数</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="text-gray-600 mr-2">{key}:</span>
                      <span className="text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">数量</h3>
              <div className="flex items-center">
                <button
                  className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="mx-3 w-16 text-center border border-gray-300 rounded-md px-2 py-1"
                />
                <button
                  className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  onClick={increaseQuantity}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                className="flex-1 bg-secondary text-white px-6 py-3 rounded-md hover:bg-secondary-dark transition-colors"
                onClick={addToCart}
                disabled={addingToCart || product.stock === 0}
              >
                {addingToCart ? '添加中...' : '加入购物车'}
              </button>
              <button
                className="flex-1 bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors"
                onClick={() => navigate('/cart')}
              >
                查看购物车
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;