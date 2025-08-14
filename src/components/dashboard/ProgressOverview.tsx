import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar,
  ArrowRight,
  Target
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useDocumentStore } from '@/stores/documentStore'
import { format, startOfWeek, endOfWeek, startOfToday, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ProgressStats {
  totalUsers: number
  activeUsers: number
  completedDocuments: number
  overdueItems: number
  thisWeekProgress: number
  upcomingDeadlines: number
}

interface UserProgressSummary {
  userId: string
  actualName: string
  completionRate: number
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent'
  nextAction: string
  daysUntilDeadline?: number
}

const ProgressOverview: React.FC = () => {
  const navigate = useNavigate()
  const { users, getUserById, setCurrentUser } = useUserStore()
  const { servicePlans, weeklySchedules, needsAssessments, monitoringReports } = useDocumentStore()
  
  const today = startOfToday()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

  // 全体の進捗統計を計算
  const calculateProgressStats = (): ProgressStats => {
    let activeUsers = 0
    let completedDocuments = 0
    let overdueItems = 0
    let upcomingDeadlines = 0
    let thisWeekDocuments = 0

    users.forEach(userRecord => {
      // getUserByIdを使用して復号化されたユーザー情報を取得
      const user = getUserById(userRecord.id)
      if (!user) return
      const userServicePlans = servicePlans.filter(plan => plan.userId === user.id)
      const userWeeklySchedules = weeklySchedules.filter(schedule => schedule.userId === user.id)
      const userNeedsAssessments = needsAssessments.filter(assessment => assessment.userId === user.id)
      const userMonitoringReports = monitoringReports.filter(report => report.userId === user.id)

      // アクティブユーザー（何らかの書類がある）
      if (userServicePlans.length > 0 || userWeeklySchedules.length > 0 || 
          userNeedsAssessments.length > 0 || userMonitoringReports.length > 0) {
        activeUsers++
      }

      // 完了した書類数
      completedDocuments += userServicePlans.length + userWeeklySchedules.length + 
                           userNeedsAssessments.length + userMonitoringReports.length

      // 今週作成された書類
      const allUserDocs = [
        ...userServicePlans.map(p => p.createdAt),
        ...userWeeklySchedules.map(s => s.createdAt),
        ...userNeedsAssessments.map(n => n.createdAt),
        ...userMonitoringReports.map(m => m.createdAt)
      ]
      
      thisWeekDocuments += allUserDocs.filter(date => 
        date >= weekStart && date <= weekEnd
      ).length

      // 期限チェック
      if (user.nextMonitoringDate) {
        const daysUntil = differenceInDays(user.nextMonitoringDate, today)
        if (daysUntil < 0) {
          overdueItems++
        } else if (daysUntil <= 7) {
          upcomingDeadlines++
        }
      }

      if (user.planExpiryDate) {
        const daysUntil = differenceInDays(user.planExpiryDate, today)
        if (daysUntil < 0) {
          overdueItems++
        } else if (daysUntil <= 14) {
          upcomingDeadlines++
        }
      }
    })

    return {
      totalUsers: users.length,
      activeUsers,
      completedDocuments,
      overdueItems,
      thisWeekProgress: thisWeekDocuments,
      upcomingDeadlines
    }
  }

  // 利用者別の進捗サマリーを計算
  const calculateUserProgress = (): UserProgressSummary[] => {
    return users.map(userRecord => {
      // getUserByIdを使用して復号化されたユーザー情報を取得
      const user = getUserById(userRecord.id)
      if (!user) return null

      const userServicePlans = servicePlans.filter(plan => plan.userId === user.id)
      const userWeeklySchedules = weeklySchedules.filter(schedule => schedule.userId === user.id)
      const userNeedsAssessments = needsAssessments.filter(assessment => assessment.userId === user.id)
      const userMonitoringReports = monitoringReports.filter(report => report.userId === user.id)

      // 完了率計算（4つの書類タイプ）
      const completedTypes = [
        userServicePlans.length > 0,
        userWeeklySchedules.length > 0,
        userNeedsAssessments.length > 0,
        userMonitoringReports.length > 0
      ].filter(Boolean).length

      const completionRate = (completedTypes / 4) * 100

      // 緊急度判定
      let urgencyLevel: 'low' | 'medium' | 'high' | 'urgent' = 'low'
      let nextAction = '書類作成を開始してください'
      let daysUntilDeadline: number | undefined

      if (user.nextMonitoringDate) {
        const daysUntil = differenceInDays(user.nextMonitoringDate, today)
        if (daysUntil < 0) {
          urgencyLevel = 'urgent'
          nextAction = `モニタリング期限超過（${Math.abs(daysUntil)}日）`
          daysUntilDeadline = daysUntil
        } else if (daysUntil <= 3) {
          urgencyLevel = 'urgent'
          nextAction = `モニタリング実施（${daysUntil}日後）`
          daysUntilDeadline = daysUntil
        } else if (daysUntil <= 7) {
          urgencyLevel = 'high'
          nextAction = `モニタリング準備（${daysUntil}日後）`
          daysUntilDeadline = daysUntil
        }
      }

      if (user.planExpiryDate) {
        const daysUntil = differenceInDays(user.planExpiryDate, today)
        if (daysUntil <= 7 && (urgencyLevel === 'low' || urgencyLevel === 'medium')) {
          urgencyLevel = daysUntil <= 3 ? 'urgent' : 'high'
          nextAction = `計画更新準備（${daysUntil}日後）`
          daysUntilDeadline = daysUntil
        }
      }

      if (urgencyLevel === 'low') {
        if (completedTypes === 0) {
          nextAction = 'サービス等利用計画から開始'
          urgencyLevel = 'medium'
        } else if (completedTypes === 1) {
          nextAction = '週間計画表の作成'
        } else if (completedTypes === 2) {
          nextAction = 'ニーズ整理票の作成'
        } else if (completedTypes === 3) {
          nextAction = 'モニタリング報告書の作成'
        } else {
          nextAction = '全書類完成・継続支援中'
        }
      }

      // デバッグ用: 各利用者の actualName を確認
      console.log(`User ID: ${user.id}, actualName: "${user.actualName}", anonymizedName: "${user.anonymizedName}"`)
      
      return {
        userId: user.id,
        actualName: user.actualName || user.anonymizedName || '名前未設定',
        completionRate,
        urgencyLevel,
        nextAction,
        daysUntilDeadline
      }
    })
    .filter((progress): progress is UserProgressSummary => progress !== null)
    .sort((a, b) => {
      const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      if (a.urgencyLevel !== b.urgencyLevel) {
        return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel]
      }
      return b.completionRate - a.completionRate
    })
    .slice(0, 6) // 上位6件を表示
  }

  const stats = calculateProgressStats()
  const userProgress = calculateUserProgress()
  
  // デバッグ用: 利用者データの確認
  console.log('Users data:', users)
  console.log('User progress data:', userProgress)

  const handleUserClick = (userId: string) => {
    const user = getUserById(userId)
    if (user) {
      setCurrentUser(user)
      navigate(`/documents/${userId}`)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getProgressBarColor = (rate: number) => {
    if (rate >= 75) return 'bg-green-500'
    if (rate >= 50) return 'bg-blue-500'
    if (rate >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総利用者数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">今週の進捗</p>
              <p className="text-2xl font-bold text-green-600">{stats.thisWeekProgress}</p>
              <p className="text-xs text-gray-500">書類作成数</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">期限迫る</p>
              <p className="text-2xl font-bold text-orange-600">{stats.upcomingDeadlines}</p>
              <p className="text-xs text-gray-500">件の予定</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">要対応</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdueItems}</p>
              <p className="text-xs text-gray-500">期限超過</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* 利用者別進捗 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Target className="w-5 h-5 text-purple-600 mr-2" />
            利用者別進捗状況
          </h2>
          <p className="text-gray-600 mt-1">
            各利用者の書類作成進捗と次のアクション
          </p>
        </div>

        {userProgress.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">利用者が登録されていません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userProgress.map((progress) => (
              <button
                key={progress.userId}
                onClick={() => handleUserClick(progress.userId)}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {progress.actualName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {progress.completionRate.toFixed(0)}% 完了
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${getProgressBarColor(progress.completionRate)}`}
                          style={{ width: `${progress.completionRate}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {progress.nextAction}
                        </span>
                        {progress.daysUntilDeadline !== undefined && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(progress.urgencyLevel)}`}>
                            {progress.daysUntilDeadline < 0 ? 
                              `超過${Math.abs(progress.daysUntilDeadline)}日` : 
                              `あと${progress.daysUntilDeadline}日`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-purple-800 text-sm">
            <strong>進捗管理のポイント:</strong> 緊急度の高い利用者から優先的に対応し、計画的に書類作成を進めましょう。
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProgressOverview