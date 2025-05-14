import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

// 图表组件可以使用recharts库，这里先用简单的实现
interface DashboardData {
  currentMonthTotal: number;
  previousMonthTotal: number;
  currentMonthOrderCount: number;
  recentOrders: {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    total_amount: number;
  }[];
  topProducts: {
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_amount: number;
  }[];
  monthlyTrend: {
    month: string;
    total: number;
  }[];
}

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'30' | '90' | 'all'>('30');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取当前用户ID（实际应用中需要从认证状态获取）
      const userId = 'current_user_id'; // 需要替换为实际的用户ID

      // 获取当前月份和上个月份的日期范围
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // 获取时间范围
      let rangeStart;
      if (timeRange === '30') {
        rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (timeRange === '90') {
        rangeStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        // 全部时间，可以设置一个较早的日期
        rangeStart = new Date(2020, 0, 1).toISOString();
      }

      // 1. 获取当前月订单总金额
      const { data: currentMonthData, error: currentMonthError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('user_id', userId)
        .gte('created_at', currentMonthStart)
        .lte('created_at', currentMonthEnd);

      if (currentMonthError) throw currentMonthError;

      // 2. 获取上月订单总金额
      const { data: previousMonthData, error: previousMonthError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('user_id', userId)
        .gte('created_at', previousMonthStart)
        .lte('created_at', previousMonthEnd);

      if (previousMonthError) throw previousMonthError;

      // 3. 获取最近订单
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select('id, order_number, created_at, status, total_amount')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentOrdersError) throw recentOrdersError;

      // 4. 获取热门商品
      const { data: topProductsData, error: topProductsError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          products(name),
          quantity,
          price
        `)
        .in('order_id', function(builder) {
          builder
            .select('id')
            .from('orders')
            .eq('user_id', userId)
            .gte('created_at', rangeStart);
        });

      if (topProductsError) throw topProductsError;

      // 5. 获取月度趋势数据（最近6个月）
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).toISOString();
        
        const { data: monthData, error: monthError } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('user_id', userId)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);
        
        if (monthError) throw monthError;
        
        const monthTotal = monthData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
        const monthName = new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleDateString('zh-CN', { month: 'short' });
        
        monthlyTrend.push({
          month: monthName,
          total: monthTotal
        });
      }

      // 处理热门商品数据
      const productMap = new Map();
      topProductsData?.forEach(item => {
        const productId = item.product_id;
        const productName = item.products?.name || '未知商品';
        const quantity = item.quantity;
        const amount = item.quantity * item.price;
        
        if (productMap.has(productId)) {
          const product = productMap.get(productId);
          product.total_quantity += quantity;
          product.total_amount += amount;
        } else {
          productMap.set(productId, {
            product_id: productId,
            product_name: productName,
            total_quantity: quantity,
            total_amount: amount
          });
        }
      });
      
      // 转换为数组并排序
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 5);

      // 计算当前月和上月总金额
      const currentMonthTotal = currentMonthData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const previousMonthTotal = previousMonthData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const currentMonthOrderCount = currentMonthData?.length || 0;

      // 格式化最近订单数据
      const formattedRecentOrders = recentOrdersData?.map(order => ({
        id: order.id,
        order_number: order.order_number || `ORD-${order.id.slice(0, 8)}`,
        created_at: new Date(order.created_at).toLocaleString(),
        status: order.status,
        total_amount: order.total_amount
      })) || [];

      // 设置仪表盘数据
      setDashboardData({
        currentMonthTotal,
        previousMonthTotal,
        currentMonthOrderCount,
        recentOrders: formattedRecentOrders,
        topProducts,
        monthlyTrend
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('获取数据失败，请稍后再试');
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

  // 计算环比增长率
  const calculateGrowthRate = () => {
    if (!dashboardData || dashboardData.previousMonthTotal === 0) return 0;
    return ((dashboardData.currentMonthTotal - dashboardData.previousMonthTotal) / dashboardData.previousMonthTotal) * 100;
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
          onClick={() => fetchDashboardData()}
        >
          重试
        </button>
      </div>
    );
  }

  const growthRate = calculateGrowthRate();

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">经营数据概览</h2>
      
      {/* 顶部卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">本月订货总额</h3>
          <div className="flex items-end">
            <p className="text-3xl font-bold text-gray-800">¥{dashboardData?.currentMonthTotal.toFixed(2)}</p>
            <span className={`ml-2 text-sm font-medium ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growthRate >= 0 ? '↑' : '↓'} {Math.abs(growthRate).toFixed(1)}%
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">上月: ¥{dashboardData?.previousMonthTotal.toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">本月订单数</h3>
          <p className="text-3xl font-bold text-gray-800">{dashboardData?.currentMonthOrderCount}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">平均单价</h3>
          <p className="text-3xl font-bold text-gray-800">
            ¥{dashboardData?.currentMonthOrderCount ? (dashboardData.currentMonthTotal / dashboardData.currentMonthOrderCount).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>
      
      {/* 时间范围选择器 */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setTimeRange('30')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${timeRange === '30' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            近30天
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('90')}
            className={`px-4 py-2 text-sm font-medium ${timeRange === '90' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            近90天
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${timeRange === 'all' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            全部
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 最近订单 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">最近订单</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单编号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/order/${order.id}`)}>
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
                  </tr>
                ))}
                {dashboardData?.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      暂无订单记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-right">
            <button
              onClick={() => navigate('/orders')}
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              查看全部订单 →
            </button>
          </div>
        </div>
        
        {/* 热门商品 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">热门订货商品</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订货数量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订货金额</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.topProducts.map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.total_quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">¥{product.total_amount.toFixed(2)}</div>
                    </td>
                  </tr>
                ))}
                {dashboardData?.topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      暂无商品数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* 月度趋势图 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">月度订货金额趋势</h3>
        <div className="h-64">
          {/* 简单的柱状图实现 */}
          <div className="flex h-48 items-end space-x-2">
            {dashboardData?.monthlyTrend.map((item, index) => {
              // 找出最大值用于计算高度比例
              const maxValue = Math.max(...dashboardData.monthlyTrend.map(i => i.total));
              const heightPercentage = maxValue > 0 ? (item.total / maxValue) * 100 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full flex justify-center">
                    <div 
                      className="w-4/5 bg-primary rounded-t" 
                      style={{ height: `${heightPercentage}%` }}
                      title={`¥${item.total.toFixed(2)}`}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{item.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;