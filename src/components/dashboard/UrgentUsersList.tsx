import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useDocumentStore } from '@/stores/documentStore'
import { useDeadlineStore } from '@/stores/deadlineStore'
import { format, differenceInDays, isAfter, startOfToday } from 'date-fns'
import { ja } from 'date-fns/locale'

interface UrgentUser {
  id: string
  actualName: string
  urgencyType: 'monitoring_due' | 'plan_expiry' | 'overdue'
  daysRemaining: number
  description: string
  priority: 'high' | 'urgent'
}

const UrgentUsersList: React.FC = () => {
  const navigate = useNavigate()
  const { users, getUserById, setCurrentUser } = useUserStore()
  const { servicePlans, monitoringReports } = useDocumentStore()
  const { getOverdueDeadlines, getUpcomingDeadlines } = useDeadlineStore()
  
  const today = startOfToday()

  // 緊急度の高い利用者を抽出
  const getUrgentUsers = (): UrgentUser[] => {
    const urgentUsers: UrgentUser[] = []

    users.forEach(user => {
      // モニタリング期限チェック
      if (user.nextMonitoringDate) {
        const daysUntilMonitoring = differenceInDays(user.nextMonitoringDate, today)
        
        if (daysUntilMonitoring <= 7 && daysUntilMonitoring >= 0) {
          urgentUsers.push({
            id: user.id,
            actualName: user.actualName,
            urgencyType: 'monitoring_due',
            daysRemaining: daysUntilMonitoring,
            description: `モニタリング期限まで${daysUntilMonitoring}日`,
            priority: daysUntilMonitoring <= 3 ? 'urgent' : 'high'
          })
        } else if (daysUntilMonitoring < 0) {
          urgentUsers.push({
            id: user.id,
            actualName: user.actualName,
            urgencyType: 'overdue',
            daysRemaining: Math.abs(daysUntilMonitoring),
            description: `モニタリング期限超過（${Math.abs(daysUntilMonitoring)}日）`,
            priority: 'urgent'
          })
        }
      }

      // 計画更新期限チェック
      if (user.planExpiryDate) {
        const daysUntilExpiry = differenceInDays(user.planExpiryDate, today)
        
        if (daysUntilExpiry <= 14 && daysUntilExpiry >= 0) {
          urgentUsers.push({
            id: user.id,
            actualName: user.actualName,
            urgencyType: 'plan_expiry',
            daysRemaining: daysUntilExpiry,
            description: `計画更新期限まで${daysUntilExpiry}日`,
            priority: daysUntilExpiry <= 7 ? 'urgent' : 'high'
          })
        }
      }
    })

    // 期限切れ・期限迫る書類をチェック
    const overdueDeadlines = getOverdueDeadlines()
    const upcomingDeadlines = getUpcomingDeadlines(7)
    
    const allDeadlines = [...overdueDeadlines, ...upcomingDeadlines]
    allDeadlines.forEach(deadline => {
      const user = getUserById(deadline.userId)
      if (!user) return
      
      const daysUntilDeadline = differenceInDays(
        deadline.userSetDeadline || deadline.suggestedDeadline, 
        today
      )
      
      const isOverdue = daysUntilDeadline < 0
      
      urgentUsers.push({
        id: deadline.userId,
        actualName: user.actualName,
        urgencyType: isOverdue ? 'overdue' : 'monitoring_due',
        daysRemaining: Math.abs(daysUntilDeadline),
        description: isOverdue 
          ? `${deadline.documentType}期限超過（${Math.abs(daysUntilDeadline)}日）`
          : `${deadline.documentType}期限まで${daysUntilDeadline}日`,
        priority: isOverdue ? 'urgent' : (daysUntilDeadline <= 3 ? 'urgent' : 'high')
      })
    })

    // 重複を除去し、優先度とスケジュールでソート
    const uniqueUrgentUsers = urgentUsers.reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id)
      if (!existing) {
        acc.push(current)
      } else if (current.priority === 'urgent' && existing.priority !== 'urgent') {
        // より緊急な項目で上書き
        acc[acc.indexOf(existing)] = current
      }
      return acc
    }, [] as UrgentUser[])

    return uniqueUrgentUsers
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority === 'urgent' ? -1 : 1
        }
        return a.daysRemaining - b.daysRemaining
      })
      .slice(0, 8) // 最大8件表示
  }

  const urgentUsers = getUrgentUsers()

  const handleUserClick = (userId: string) => {
    const user = getUserById(userId)
    if (user) {
      setCurrentUser(user)
      navigate(`/documents/${userId}`)
    }
  }

  const getPriorityIcon = (urgentUser: UrgentUser) => {
    if (urgentUser.urgencyType === 'overdue' || urgentUser.priority === 'urgent') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
    return <Clock className="w-4 h-4 text-orange-500" />
  }

  const getPriorityColors = (urgentUser: UrgentUser) => {
    if (urgentUser.urgencyType === 'overdue' || urgentUser.priority === 'urgent') {
      return {
        bg: 'bg-red-50 hover:bg-red-100 border-red-200',
        text: 'text-red-900',
        description: 'text-red-700'
      }
    }
    return {
      bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      text: 'text-orange-900',
      description: 'text-orange-700'
    }
  }

  if (urgentUsers.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 text-green-600 mr-2" />
            緊急対応が必要な利用者
          </h2>
          <p className="text-gray-600 mt-1">
            期限が迫っている利用者の確認
          </p>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-green-800 font-medium">すべて順調です</p>
          <p className="text-green-600 text-sm mt-1">
            緊急対応が必要な利用者はいません
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          緊急対応が必要な利用者
          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
            {urgentUsers.length}件
          </span>
        </h2>
        <p className="text-gray-600 mt-1">
          期限が迫っている利用者の確認
        </p>
      </div>

      <div className="space-y-3">
        {urgentUsers.map((urgentUser) => {
          const colors = getPriorityColors(urgentUser)
          
          return (
            <button
              key={`${urgentUser.id}-${urgentUser.urgencyType}`}
              onClick={() => handleUserClick(urgentUser.id)}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors group ${colors.bg}`}
            >
              <div className="flex items-center space-x-3">
                {getPriorityIcon(urgentUser)}
                <div className="text-left">
                  <div className={`font-medium ${colors.text}`}>
                    {urgentUser.actualName}
                  </div>
                  <div className={`text-sm ${colors.description}`}>
                    {urgentUser.description}
                  </div>
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 transition-colors group-hover:${colors.text.replace('text-', 'text-')} ${colors.text}`} />
            </button>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>ヒント:</strong> 期限管理を効率的に行うために、各利用者の次回モニタリング日程を設定してください。
        </p>
      </div>
    </div>
  )
}

export default UrgentUsersList