import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  FileText,
  Plus,
  Search,
  Eye
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const MonitoringManagement: React.FC = () => {
  const navigate = useNavigate()
  const { users, getUserById } = useUserStore()
  const [searchTerm, setSearchTerm] = useState('')

  // 検索フィルタ
  const filteredUsers = users.filter(user => {
    const fullUser = getUserById(user.id)
    const actualName = fullUser?.actualName || user.anonymizedName
    return actualName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleCreateMonitoring = (userId: string) => {
    navigate(`/monitoring/create/${userId}`)
  }

  const handleViewMonitoring = (userId: string) => {
    navigate(`/monitoring/view/${userId}`)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">モニタリング管理</h1>
          <p className="text-gray-600 mt-1">
            利用者のモニタリング報告書を作成・管理します
          </p>
        </div>
      </div>

      {/* 検索機能 */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="利用者を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* 利用者一覧 */}
      <div className="card">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '該当する利用者が見つかりません' : '利用者が登録されていません'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? '検索条件を変更してください' : 'まず利用者を登録してください'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/users')}
                className="btn-primary"
              >
                利用者管理に移動
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    利用者名
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    障害種別
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    支援区分
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    最終更新
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const fullUser = getUserById(user.id)
                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {fullUser?.actualName?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {fullUser?.actualName || '名前未設定'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {user.disabilityType || '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {user.disabilitySupportCategory || '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-sm">
                        {format(new Date(user.updatedAt), 'yyyy/MM/dd', { locale: ja })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleCreateMonitoring(user.id)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="モニタリング報告書作成"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => handleViewMonitoring(user.id)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="モニタリング報告書閲覧"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default MonitoringManagement