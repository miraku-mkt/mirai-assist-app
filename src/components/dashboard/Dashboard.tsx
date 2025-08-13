import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  UserPlus, 
  Users, 
  FileText, 
  Calendar,
  ClipboardCheck,
  BarChart3,
  ArrowRight
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useDocumentStore } from '@/stores/documentStore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { getAnonymizedUsers, setCurrentUser, getUserById } = useUserStore()
  const { 
    servicePlans, 
    weeklySchedules, 
    needsAssessments, 
    monitoringReports 
  } = useDocumentStore()

  const users = getAnonymizedUsers()

  const stats = {
    totalUsers: users.length,
    servicePlans: servicePlans.length,
    weeklySchedules: weeklySchedules.length,
    needsAssessments: needsAssessments.length,
    monitoringReports: monitoringReports.length
  }

  const handleUserSelect = (userId: string) => {
    const user = getUserById(userId)
    if (user) {
      setCurrentUser(user)
      navigate(`/documents/${userId}`)
    }
  }

  const handleNewUser = () => {
    navigate('/users')
  }

  const recentUsers = users
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ヘッダーセクション */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          ミライアシスト ダッシュボード
        </h1>
        <p className="text-lg text-gray-600">
          相談支援専門員向けAI書類作成支援システム
        </p>
      </div>

      {/* 統計情報カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4">
            <Users className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
          <p className="text-sm text-gray-600">登録利用者数</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-success-100 rounded-lg mx-auto mb-4">
            <FileText className="w-6 h-6 text-success-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.servicePlans}</h3>
          <p className="text-sm text-gray-600">サービス等利用計画</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-warning-100 rounded-lg mx-auto mb-4">
            <Calendar className="w-6 h-6 text-warning-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.weeklySchedules}</h3>
          <p className="text-sm text-gray-600">週間計画表</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.needsAssessments}</h3>
          <p className="text-sm text-gray-600">ニーズ整理票</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.monitoringReports}</h3>
          <p className="text-sm text-gray-600">モニタリング報告書</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* クイックアクション */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">
              クイックアクション
            </h2>
            <p className="text-gray-600 mt-1">
              よく使用する機能に素早くアクセス
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleNewUser}
              className="w-full flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">新規利用者登録</div>
                  <div className="text-sm text-gray-600">新しい利用者の基本情報を登録</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/users')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">利用者管理</div>
                  <div className="text-sm text-gray-600">登録済み利用者の確認・編集</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* 最近の利用者 */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">
              最近の利用者
            </h2>
            <p className="text-gray-600 mt-1">
              最近更新された利用者（最大5件）
            </p>
          </div>

          {recentUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">まだ利用者が登録されていません</p>
              <button
                onClick={handleNewUser}
                className="mt-4 btn-primary"
              >
                最初の利用者を登録
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => {
                const fullUser = getUserById(user.id)
                return (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {fullUser?.actualName?.charAt(0) || user.anonymizedName.slice(-1)}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">
                          {user.anonymizedName}
                        </div>
                        <div className="text-sm text-gray-500 space-x-2">
                          <span>最終更新: {format(new Date(user.updatedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
                          {user.disabilityType && (
                            <>
                              <span>•</span>
                              <span>{user.disabilityType}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 注意事項 */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              プライバシー保護について
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              このアプリケーションは個人情報保護を最優先に設計されています。
              すべてのデータはローカルに暗号化されて保存され、外部への送信は行われません。
              利用者名は匿名化されて表示され、実際の個人情報は適切に保護されています。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard