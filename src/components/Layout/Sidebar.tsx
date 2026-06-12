import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  Wrench,
  Warehouse,
  FileBarChart,
  Tent,
  Wallet,
  ArrowRightLeft,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    category: '概览',
    items: [
      { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
    ],
  },
  {
    category: '基础信息',
    items: [
      { path: '/equipment', label: '装备管理', icon: Package },
      { path: '/customers', label: '客户管理', icon: Users },
      { path: '/suppliers', label: '供应商管理', icon: Building2 },
    ],
  },
  {
    category: '运营管理',
    items: [
      { path: '/rentals', label: '租赁记录', icon: ClipboardList },
      { path: '/deposit-ledger', label: '押金台账', icon: BookOpen },
      { path: '/usage-stats', label: '使用统计', icon: BarChart3 },
    ],
  },
  {
    category: '维护管理',
    items: [
      { path: '/damage', label: '损耗登记', icon: AlertTriangle },
      { path: '/maintenance', label: '维护管理', icon: Wrench },
    ],
  },
  {
    category: '库存管理',
    items: [
      { path: '/inventory', label: '收纳盘点', icon: Warehouse },
    ],
  },
  {
    category: '数据中心',
    items: [
      { path: '/reports', label: '数据报表', icon: FileBarChart },
      { path: '/finance-reconciliation', label: '财务对账', icon: ArrowRightLeft },
    ],
  },
  {
    category: '系统设置',
    items: [
      { path: '/finance-settings', label: '财务设置', icon: Wallet },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col bg-gradient-to-b from-emerald-900 to-emerald-950 text-white h-screen sticky top-0 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 flex items-center gap-3 border-b border-emerald-800">
        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Tent className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-lg whitespace-nowrap">露营台账系统</h1>
            <p className="text-xs text-emerald-300 whitespace-nowrap">Camping Ledger</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {!collapsed && (
              <p className="px-4 mb-2 text-xs font-medium text-emerald-400 uppercase tracking-wider">
                {group.category}
              </p>
            )}
            <ul className="space-y-1 px-2">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                        'hover:bg-emerald-800/50 hover:text-white',
                        isActive
                          ? 'bg-amber-500/20 text-amber-400 border-l-2 border-amber-400'
                          : 'text-emerald-200'
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-emerald-800">
        {!collapsed && (
          <div className="text-xs text-emerald-400 text-center">
            <p>版本 1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  );
}
