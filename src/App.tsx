import { useState } from 'react'
import './App.css';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import FinanceManagementPage from './components/finance/FinanceManagementPage';
import InspectionManagementPage from './components/inspection/InspectionManagementPage';
import AnnouncementManagementPage from './pages/AnnouncementManagementPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/auth/RegisterPage'; // 新增导入
import NewApplicationPage from './pages/application/NewApplicationPage'; // 新增导入
import ApplicationReviewPage from './pages/hq/ApplicationReviewPage'; // 新增导入
// import RoleManagementPage from './pages/admin/RoleManagementPage'; // File does not exist
// UserManagementPage is already imported above if this is a retry, ensure it's present
import UserManagementPage from './pages/admin/UserManagementPage'; 
import SystemConfigurationPage from './pages/admin/SystemConfigurationPage';
import ContractTemplateManagementPage from './pages/admin/ContractTemplateManagementPage'; // 新增导入
import { AuthProvider, useAuth, ProtectedRoute, UserRole } from '@/components/auth/AuthContext';


// A simple Layout component for navigation
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>
    <nav className="p-4 bg-gray-100">
      <ul className="flex space-x-4">
        <li><Link to="/" className="text-blue-500 hover:text-blue-700">首页 (占位)</Link></li>
        <li><Link to="/finance" className="text-blue-500 hover:text-blue-700">财务管理</Link></li>
        <li><Link to="/inspection" className="text-blue-500 hover:text-blue-700">巡店管理</Link></li>
        <li><Link to="/announcements" className="text-blue-500 hover:text-blue-700">公告管理</Link></li>
        {/* Add other links here as modules are developed */}
      </ul>
    </nav>
    <main className="p-4">
      {children}
    </main>
  </div>
);

// 自定义受保护的路由组件，包含布局
const ProtectedRouteWithLayout = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode, 
  allowedRoles?: UserRole[] 
}) => {
  return (
    <ProtectedRoute allowedRoles={allowedRoles} redirectTo="/login">
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );
};

// 包装组件，使用认证上下文
const AppWithAuth = () => {
  const { profile } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} /> {/* 新增注册页面路由 */}

      <Route path="/application/new" element={
        <ProtectedRouteWithLayout allowedRoles={[UserRole.APPLICANT]}>
          <NewApplicationPage />
        </ProtectedRouteWithLayout>
      } />

      <Route path="/hq/applications" element={
        <ProtectedRouteWithLayout allowedRoles={[UserRole.HQ_RECRUITER, UserRole.ADMIN]}>
          <ApplicationReviewPage />
        </ProtectedRouteWithLayout>
      } />
      
      <Route path="/" element={
        <ProtectedRouteWithLayout>
          <HomePlaceholder />
        </ProtectedRouteWithLayout>
      } />
      
      <Route path="/finance" element={
        <ProtectedRouteWithLayout allowedRoles={['franchisee', 'hq_finance']}>
          <FinanceManagementPage 
            currentUserRole={profile?.role as 'franchisee' | 'hq_finance'} 
            currentUserId={profile?.id || ''} 
          />
        </ProtectedRouteWithLayout>
      } />
      
      <Route path="/inspection" element={
        <ProtectedRouteWithLayout allowedRoles={['franchisee', 'hq_supervisor']}>
          <InspectionManagementPage 
            currentUserRole={profile?.role as 'franchisee' | 'hq_supervisor'} 
            currentUserId={profile?.id || ''} 
          />
        </ProtectedRouteWithLayout>
      } />

      <Route path="/announcements" element={
        <ProtectedRouteWithLayout allowedRoles={['franchisee', 'hq_ops', 'admin']}>
          <AnnouncementManagementPage />
        </ProtectedRouteWithLayout>
      } />
      <Route path="/admin/*" element={ // Changed to allow nested routes to render Outlet correctly
        <ProtectedRouteWithLayout allowedRoles={[UserRole.ADMIN, UserRole.HQ_RECRUITER]}> {/* HQ_RECRUITER can also access some admin pages like contract templates */} 
          <Outlet />
        </ProtectedRouteWithLayout>
      }>
        <Route index element={<Navigate to="users" replace />} />
        {/* <Route path="roles" element={<RoleManagementPage />} /> // File does not exist */}
        <Route path="users" element={<UserManagementPage />} />
        <Route path="system-configurations" element={<SystemConfigurationPage />} />
        <Route path="contract-templates" element={<ContractTemplateManagementPage />} /> {/* 新增合同模板管理路由 */}
        {/* Ensure UserManagementPage route is correctly placed if it was missing or misplaced */} 
      </Route>
      {/* Add other routes here */}
      <Route path="*" element={<Navigate to="/" replace />} /> {/* Catch-all route */}
      </Route>
      {/* Add other routes here */}
    </Routes>
  );
}

// 主应用组件，包含认证提供者
function App() {
  // const { user, profile, loading, hasRole } = useAuth(); // This line seems to be a commented out remnant, ensure it's not causing issues if uncommented elsewhere.
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );

// Placeholder for Home page
const HomePlaceholder = () => (
  <div className="text-center">
    <h1 className="text-3xl font-bold my-8">逸刻新零售加盟商一体化管理与赋能平台</h1>
    <p className="text-xl">欢迎使用！请通过上方导航访问不同模块。</p>
    <div className="mt-8 flex justify-center space-x-4">
      <img src={viteLogo} className="logo h-24 w-24" alt="Vite logo" />
      <img src={reactLogo} className="logo react h-24 w-24" alt="React logo" />
    </div>
  </div>
);

export default App
