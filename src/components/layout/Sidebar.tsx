import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  ClipboardCheck, 
  BarChart3,
  PlusCircle
} from 'lucide-react'

const Sidebar: React.FC = () => {

  const navItems = [
    {
      to: '/',
      icon: Home,
      label: 'ダッシュボード',
      description: 'メイン画面'
    },
    {
      to: '/users',
      icon: Users,
      label: '利用者管理',
      description: '利用者の登録・編集'
    },
    {
      to: '/calendar',
      icon: Calendar,
      label: '面談カレンダー',
      description: '面談予定の確認・管理'
    },
    {
      to: '/plan',
      icon: PlusCircle,
      label: '計画作成',
      description: 'サービス等利用計画の作成・管理'
    },
    {
      to: '/monitoring',
      icon: BarChart3,
      label: 'モニタリング管理',
      description: 'モニタリング報告書の作成・管理'
    }
  ]


  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">
              相談支援専門員
            </h2>
            <p className="text-xs text-gray-500">
              書類作成支援システム
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={20} />
            <div className="flex-1">
              <div className="font-medium text-sm">{item.label}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </NavLink>
        ))}

      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          オフライン環境で安全に動作
        </div>
      </div>
    </aside>
  )
}

export default Sidebar