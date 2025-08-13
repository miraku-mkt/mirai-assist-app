import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  ClipboardCheck, 
  BarChart3,
  UserPlus
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'

const Sidebar: React.FC = () => {
  const { currentUser, getUserById } = useUserStore()
  
  // 現在のユーザーの復号化された情報を取得
  const decryptedUser = currentUser ? getUserById(currentUser.id) : null

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
    }
  ]

  // 利用者が選択されている場合の追加メニュー
  const userSpecificItems = currentUser ? [
    {
      to: `/documents/${currentUser.id}`,
      icon: FileText,
      label: 'サービス等利用計画',
      description: '計画書の作成・編集'
    },
    {
      to: `/weekly-schedule/${currentUser.id}`,
      icon: Calendar,
      label: '週間計画表',
      description: 'スケジュールの作成'
    },
    {
      to: `/needs-assessment/${currentUser.id}`,
      icon: ClipboardCheck,
      label: 'ニーズ整理票',
      description: 'アセスメント情報'
    },
    {
      to: `/monitoring/${currentUser.id}`,
      icon: BarChart3,
      label: 'モニタリング報告書',
      description: 'モニタリング結果'
    }
  ] : []

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

        {!currentUser && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 px-4 py-3 text-gray-400">
              <UserPlus size={20} />
              <div className="flex-1">
                <div className="font-medium text-sm">利用者を選択</div>
                <div className="text-xs">書類作成を開始するには利用者を選択してください</div>
              </div>
            </div>
          </div>
        )}

        {userSpecificItems.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {decryptedUser?.actualName || '利用者'}さん の書類
              </h3>
            </div>
            {userSpecificItems.map((item) => (
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
          </div>
        )}
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