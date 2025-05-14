import { useState } from 'react'
import './App.css';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import FinanceManagementPage from './components/finance/FinanceManagementPage';
import InspectionManagementPage from './components/inspection/InspectionManagementPage';
import AnnouncementManagementPage from './pages/AnnouncementManagementPage';
import LoginPage from './pages/LoginPage';
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
      {/* Add other routes here */}
    </Routes>
  );
}

// 主应用组件，包含认证提供者
function App() {
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
