import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/equipment': '装备管理',
  '/customers': '客户管理',
  '/suppliers': '供应商管理',
  '/rentals': '租赁记录',
  '/usage-stats': '使用统计',
  '/damage': '损耗登记',
  '/maintenance': '维护管理',
  '/inventory': '收纳盘点',
  '/reports': '数据报表',
};

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    return pageTitles[location.pathname] || '露营台账系统';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={getPageTitle()}
        />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
