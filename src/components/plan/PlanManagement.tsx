import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  Plus, 
  Search, 
  Calendar, 
  Clock,
  AlertCircle,
  FileText,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useDocumentStore } from '@/stores/documentStore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const PlanManagement: React.FC = () => {
  const navigate = useNavigate()
  const { users, getUserById } = useUserStore()
  const { servicePlans } = useDocumentStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // 検索フィルタリング（復号化された情報を使用）
  const filteredUsers = users.filter(user => {
    const decryptedUser = getUserById(user.id)
    if (!decryptedUser) return false
    return decryptedUser.actualName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           decryptedUser.disabilityType.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // 利用者ごとの最新計画を取得
  const getUserLatestPlan = (userId: string) => {
    const userPlans = servicePlans.filter(plan => plan.userId === userId)
    return userPlans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
  }

  // 計画の期限切れチェック
  const isPlanExpiring = (plan: any) => {
    if (!plan) return false
    const sixMonthsFromCreation = new Date(plan.createdAt)
    sixMonthsFromCreation.setMonth(sixMonthsFromCreation.getMonth() + 6)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((sixMonthsFromCreation.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const handleCreatePlan = (userId: string) => {
    navigate(`/plan/create/${userId}`)
  }

  const handleViewPlan = (planId: string) => {
    navigate(`/plan/view/${planId}`)
  }

  const handleEditPlan = (planId: string) => {
    navigate(`/plan/edit/${planId}`)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">計画作成</h1>
          <p className="text-gray-600 mt-1">
            サービス等利用計画の作成・管理を行います
          </p>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="利用者名や障害種別で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800">総利用者数</h3>
                <p className="text-2xl font-bold text-blue-900">{users.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card bg-green-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-green-800">計画作成済み</h3>
                <p className="text-2xl font-bold text-green-900">
                  {users.filter(user => getUserLatestPlan(user.id)).length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">期限切れ間近</h3>
                <p className="text-2xl font-bold text-yellow-900">
                  {users.filter(user => {
                    const plan = getUserLatestPlan(user.id)
                    return isPlanExpiring(plan)
                  }).length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card bg-red-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-red-800">計画未作成</h3>
                <p className="text-2xl font-bold text-red-900">
                  {users.filter(user => !getUserLatestPlan(user.id)).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 利用者一覧 */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">利用者一覧</h2>
          
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">利用者が見つかりません</h3>
              <p className="text-gray-600">検索条件を変更してください</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const decryptedUser = getUserById(user.id)
                const latestPlan = getUserLatestPlan(user.id)
                const isExpiring = isPlanExpiring(latestPlan)
                
                if (!decryptedUser) return null
                
                return (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-900">{decryptedUser.actualName}</h3>
                            {isExpiring && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                期限切れ間近
                              </span>
                            )}
                            {!latestPlan && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <Clock className="w-3 h-3 mr-1" />
                                計画未作成
                              </span>
                            )}
                            {latestPlan && !isExpiring && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ 計画作成済み
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>{decryptedUser.disabilityType}</span>
                            <span>支援区分: {decryptedUser.disabilitySupportCategory}</span>
                            {latestPlan && (
                              <span>
                                最終作成: {format(latestPlan.createdAt, 'yyyy年M月d日', { locale: ja })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {latestPlan ? (
                          <>
                            <button
                              onClick={() => handleViewPlan(latestPlan.id)}
                              className="btn-secondary flex items-center text-sm"
                              title="計画を確認"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              確認
                            </button>
                            <button
                              onClick={() => handleEditPlan(latestPlan.id)}
                              className="btn-secondary flex items-center text-sm"
                              title="計画を編集"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              編集
                            </button>
                          </>
                        ) : null}
                        
                        <button
                          onClick={() => handleCreatePlan(user.id)}
                          className="btn-primary flex items-center text-sm"
                          title={latestPlan ? "新しい計画を作成" : "計画を作成"}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {latestPlan ? "新規作成" : "作成"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlanManagement