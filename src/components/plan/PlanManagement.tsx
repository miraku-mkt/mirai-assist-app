import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  Plus, 
  Search,
  Eye,
  Edit
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useDocumentStore } from '@/stores/documentStore'

const PlanManagement: React.FC = () => {
  const navigate = useNavigate()
  const { users, getUserById } = useUserStore()
  const { servicePlans } = useDocumentStore()
  const [searchTerm, setSearchTerm] = useState('')

  // 検索フィルタリング（復号化された情報を使用）
  const filteredUsers = users.filter(user => {
    try {
      const decryptedUser = getUserById(user.id)
      if (!decryptedUser) return false
      return decryptedUser.actualName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             decryptedUser.disabilityType.toLowerCase().includes(searchTerm.toLowerCase())
    } catch (error) {
      console.error('Error filtering user:', error)
      return false
    }
  })

  // 利用者ごとの書類タイプ別計画を取得
  const getUserPlansByType = (userId: string) => {
    try {
      const userPlans = servicePlans.filter(plan => plan.userId === userId)
      console.log(`User ${userId} plans:`, userPlans) // デバッグ用
      
      const plansByType = {
        servicePlan: null as any,
        weeklySchedule: null as any,
        needsAssessment: null as any
      }
      
      // より安全な書類タイプ判定
      userPlans.forEach(plan => {
        const docType = (plan as any).documentType
        console.log(`Plan ${plan.id} documentType:`, docType) // デバッグ用
        
        if (!docType || docType === 'servicePlan') {
          if (!plansByType.servicePlan || plan.createdAt > plansByType.servicePlan.createdAt) {
            plansByType.servicePlan = plan
          }
        } else if (docType === 'weeklySchedule') {
          if (!plansByType.weeklySchedule || plan.createdAt > plansByType.weeklySchedule.createdAt) {
            plansByType.weeklySchedule = plan
          }
        } else if (docType === 'needsAssessment') {
          if (!plansByType.needsAssessment || plan.createdAt > plansByType.needsAssessment.createdAt) {
            plansByType.needsAssessment = plan
          }
        }
      })
      
      console.log(`User ${userId} plansByType:`, plansByType) // デバッグ用
      return plansByType
    } catch (error) {
      console.error('Error getting user plans by type:', error)
      return { servicePlan: null, weeklySchedule: null, needsAssessment: null }
    }
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

      {/* 利用者一覧 */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">利用者一覧</h2>
          
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">利用者が見つかりません</h3>
              <p className="text-gray-600">利用者を追加してください</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                try {
                  const decryptedUser = getUserById(user.id)
                  if (!decryptedUser) {
                    console.warn(`Could not decrypt user: ${user.id}`)
                    return null
                  }
                  
                  const userPlans = getUserPlansByType(user.id)
                  if (!userPlans) {
                    console.warn(`Could not get plans for user: ${user.id}`)
                    return null
                  }
                  
                  const hasAnyPlan = userPlans.servicePlan || userPlans.weeklySchedule || userPlans.needsAssessment
                  console.log(`User ${user.id} hasAnyPlan:`, hasAnyPlan) // デバッグ用
                  
                  return (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium text-gray-900">{decryptedUser.actualName}</h3>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span>{decryptedUser.disabilityType}</span>
                              <span>支援区分: {decryptedUser.disabilitySupportCategory}</span>
                            </div>

                            {/* 書類タイプ別ステータス表示 */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {userPlans?.servicePlan && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  ✓ サービス等利用計画
                                </span>
                              )}
                              {userPlans?.weeklySchedule && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ 週間計画表
                                </span>
                              )}
                              {userPlans?.needsAssessment && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  ✓ ニーズ整理票
                                </span>
                              )}
                              {!hasAnyPlan && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  計画未作成
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-3">
                          {/* 作成済み書類の確認・編集ボタン */}
                          {hasAnyPlan && userPlans && (
                            <div className="space-y-2 min-w-80">
                              {userPlans.servicePlan?.id && (
                                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  <span className="text-sm font-medium text-blue-900">サービス等利用計画</span>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleViewPlan(userPlans.servicePlan.id)}
                                      className="btn-secondary flex items-center text-sm px-3 py-1.5 w-20 justify-center"
                                      title="サービス等利用計画を確認"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      確認
                                    </button>
                                    <button
                                      onClick={() => handleEditPlan(userPlans.servicePlan.id)}
                                      className="btn-secondary flex items-center text-sm px-3 py-1.5 w-20 justify-center"
                                      title="サービス等利用計画を編集"
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      編集
                                    </button>
                                  </div>
                                </div>
                              )}
                              {userPlans.weeklySchedule?.id && (
                                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                                  <span className="text-sm font-medium text-green-900">週間計画表</span>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleViewPlan(userPlans.weeklySchedule.id)}
                                      className="btn-secondary flex items-center text-sm px-3 py-1.5 w-20 justify-center"
                                      title="週間計画表を確認"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      確認
                                    </button>
                                    <button
                                      onClick={() => handleEditPlan(userPlans.weeklySchedule.id)}
                                      className="btn-secondary flex items-center text-sm px-3 py-1.5 w-20 justify-center"
                                      title="週間計画表を編集"
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      編集
                                    </button>
                                  </div>
                                </div>
                              )}
                              {userPlans.needsAssessment?.id && (
                                <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  <span className="text-sm font-medium text-purple-900">ニーズ整理票</span>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleViewPlan(userPlans.needsAssessment.id)}
                                      className="btn-secondary flex items-center text-sm px-3 py-1.5 w-20 justify-center"
                                      title="ニーズ整理票を確認"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      確認
                                    </button>
                                    <button
                                      onClick={() => handleEditPlan(userPlans.needsAssessment.id)}
                                      className="btn-secondary flex items-center text-sm px-3 py-1.5 w-20 justify-center"
                                      title="ニーズ整理票を編集"
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      編集
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* 新規作成ボタン */}
                          <button
                            onClick={() => {
                              try {
                                navigate(`/plan/create/${user.id}`)
                              } catch (error) {
                                console.error('Navigation error:', error)
                              }
                            }}
                            className="btn-primary flex items-center text-sm"
                            title="新しい計画を作成"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            新規作成
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                } catch (error) {
                  console.error('Error rendering user:', error)
                  return null
                }
              }).filter(Boolean)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlanManagement