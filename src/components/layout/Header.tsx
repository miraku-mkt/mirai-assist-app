import React from 'react'
import { LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const Header: React.FC = () => {
  const { logout } = useAuthStore()

  const handleLogout = () => {
    if (confirm('ログアウトしますか？')) {
      logout()
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            ミライアシスト
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => {/* 設定画面の実装 */}}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="設定"
            aria-label="設定を開く"
          >
            <Settings size={20} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="ログアウト"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">ログアウト</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header