import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css';
import { Routes, Route, Link } from 'react-router-dom';
import FinanceManagementPage from './components/finance/FinanceManagementPage';
import InspectionManagementPage from './components/inspection/InspectionManagementPage';

// Mock current user for demonstration
const mockCurrentUser = {
  id: 'franchisee-123',
  role: 'franchisee' as 'franchisee' | 'hq_finance', // or 'hq_finance'
};

// A simple Layout component for navigation
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>
    <nav className="p-4 bg-gray-100">
      <ul className="flex space-x-4">
        <li><Link to="/" className="text-blue-500 hover:text-blue-700">首页 (占位)</Link></li>
        <li><Link to="/finance" className="text-blue-500 hover:text-blue-700">财务管理</Link></li>
        <li><Link to="/inspection" className="text-blue-500 hover:text-blue-700">巡店管理</Link></li>
        {/* Add other links here as modules are developed */}
      </ul>
    </nav>
    <main className="p-4">
      {children}
    </main>
  </div>
);

function App() {
  const [count, setCount] = useState(0)

  // Remove useState for count as it's placeholder content
  // const [count, setCount] = useState(0)

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePlaceholder />} />
        <Route 
          path="/finance"
          element={<FinanceManagementPage currentUserRole={mockCurrentUser.role} currentUserId={mockCurrentUser.id} />}
        />
        <Route 
          path="/inspection"
          element={<InspectionManagementPage currentUserRole={mockCurrentUser.role as 'franchisee' | 'hq_supervisor'} currentUserId={mockCurrentUser.id} />}
        />
        {/* Add other routes here */}
      </Routes>
    </Layout>
  );
}

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
}

export default App
