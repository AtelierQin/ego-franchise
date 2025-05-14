import { useState } from 'react';
import { UserRole } from '../../lib/supabase';

interface MainLayoutProps {
  children: React.ReactNode;
  userRole?: UserRole; // 用户角色，用于控制导航菜单
}

const MainLayout = ({ children, userRole }: MainLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 根据用户角色返回不同的导航菜单
  const getNavigationItems = () => {
    switch (userRole) {
      case UserRole.APPLICANT:
        return [
          { name: '申请状态', path: '/application/status' },
          { name: '合同签署', path: '/contract/sign' },
        ];
      case UserRole.FRANCHISEE:
        return [
          { name: '商品订购', path: '/products' },
          { name: '订单管理', path: '/orders' },
          { name: '数据看板', path: '/dashboard' },
          { name: '工单支持', path: '/tickets' },
          { name: '公告通知', path: '/announcements' },
          { name: '巡店记录', path: '/inspections' },
          { name: '财务对账', path: '/finance' },
        ];
      case UserRole.HQ_RECRUITER:
        return [
          { name: '申请管理', path: '/admin/applications' },
          { name: '合同管理', path: '/admin/contracts' },
        ];
      case UserRole.HQ_OPS:
        return [
          { name: '订单管理', path: '/admin/orders' },
          { name: '商品管理', path: '/admin/products' },
          { name: '工单管理', path: '/admin/tickets' },
          { name: '公告管理', path: '/admin/announcements' },
        ];
      case UserRole.HQ_SUPERVISOR:
        return [
          { name: '巡店管理', path: '/admin/inspections' },
        ];
      case UserRole.HQ_FINANCE:
        return [
          { name: '货款管理', path: '/admin/payments' },
          { name: '对账管理', path: '/admin/reconciliation' },
        ];
      case UserRole.ADMIN:
        return [
          { name: '用户管理', path: '/admin/users' },
          { name: '角色管理', path: '/admin/roles' },
          { name: '申请管理', path: '/admin/applications' },
          { name: '合同管理', path: '/admin/contracts' },
          { name: '商品管理', path: '/admin/products' },
          { name: '订单管理', path: '/admin/orders' },
          { name: '工单管理', path: '/admin/tickets' },
          { name: '公告管理', path: '/admin/announcements' },
          { name: '巡店管理', path: '/admin/inspections' },
          { name: '财务管理', path: '/admin/finance' },
        ];
      default:
        return [
          { name: '登录', path: '/auth/login' },
          { name: '注册', path: '/auth/register' },
          { name: '申请加盟', path: '/application/new' },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-primary font-bold text-xl">逸刻加盟平台</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigationItems.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {userRole ? (
                <div className="ml-3 relative">
                  <div>
                    <button
                      type="button"
                      className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      id="user-menu-button"
                    >
                      <span className="sr-only">打开用户菜单</span>
                      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                        <span>{userRole.charAt(0).toUpperCase()}</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <a
                    href="/auth/login"
                    className="text-gray-500 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                  >
                    登录
                  </a>
                  <a
                    href="/auth/register"
                    className="bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
                  >
                    注册
                  </a>
                </div>
              )}
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                aria-controls="mobile-menu"
                aria-expanded="false"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">打开主菜单</span>
                <svg
                  className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 移动端菜单 */}
        <div
          className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}
          id="mobile-menu"
        >
          <div className="pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="border-transparent text-gray-500 hover:border-primary hover:text-primary block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              >
                {item.name}
              </a>
            ))}
          </div>
          {userRole && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                    <span>{userRole.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    用户名称
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    用户角色: {userRole}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <a
                  href="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  个人资料
                </a>
                <a
                  href="/auth/logout"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  退出登录
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} 逸刻新零售加盟商一体化管理与赋能平台. 保留所有权利.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;