import React, { useState, useEffect } from 'react'
import { Clock, Calendar, AlertTriangle, Info, Save } from 'lucide-react'
import { format, addDays, addMonths, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'

interface DocumentDeadline {
  documentId?: string
  documentType: 'servicePlan' | 'weeklySchedule' | 'needsAssessment' | 'monitoringReport'
  suggestedDeadline: Date
  userSetDeadline?: Date
  priority: 'high' | 'medium' | 'low'
  notes?: string
  reminderDays: number[]
}

interface DeadlineManagerProps {
  documentType: 'servicePlan' | 'weeklySchedule' | 'needsAssessment' | 'monitoringReport'
  userId: string
  documentId?: string
  onDeadlineSet?: (deadline: DocumentDeadline) => void
  benefitDecisionDate?: Date
  lastPlanDate?: Date
  lastMonitoringDate?: Date
}

// 制度期限の計算ロジック
const calculateSuggestedDeadlines = (
  documentType: string,
  benefitDecisionDate?: Date,
  lastPlanDate?: Date,
  lastMonitoringDate?: Date
): { deadline: Date; reason: string } | null => {
  const today = new Date()
  
  switch (documentType) {
    case 'servicePlan':
      // 支給決定日が設定されている場合のみ制度期限を表示
      if (benefitDecisionDate) {
        return {
          deadline: addDays(benefitDecisionDate, 30),
          reason: '支給決定から30日以内（法定期限）'
        }
      }
      return null // 支給決定日未設定時は制度期限を表示しない
      
    case 'weeklySchedule':
      // サービス等利用計画作成後7日以内（表現を変更）
      if (lastPlanDate) {
        return {
          deadline: addDays(lastPlanDate, 7),
          reason: 'サービス等利用計画作成後7日以内'
        }
      }
      return {
        deadline: addDays(today, 7),
        reason: 'サービス等利用計画作成後7日以内'
      }
      
    case 'needsAssessment':
      // ニーズ整理票は制度期限なし
      return null
      
    case 'monitoringReport':
      // 前回モニタリングから1ヶ月以内
      if (lastMonitoringDate) {
        return {
          deadline: addMonths(lastMonitoringDate, 1),
          reason: '前回モニタリングから1ヶ月以内'
        }
      }
      return {
        deadline: addMonths(today, 1),
        reason: '継続支援（月1回のモニタリング）'
      }
      
    default:
      return null
  }
}

const DeadlineManager: React.FC<DeadlineManagerProps> = ({
  documentType,
  userId,
  documentId,
  onDeadlineSet,
  benefitDecisionDate,
  lastPlanDate,
  lastMonitoringDate
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [userDeadline, setUserDeadline] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [notes, setNotes] = useState('')
  const [reminderDays, setReminderDays] = useState<number[]>([3, 1])

  const suggested = calculateSuggestedDeadlines(
    documentType,
    benefitDecisionDate,
    lastPlanDate,
    lastMonitoringDate
  )

  const documentTypeNames = {
    servicePlan: 'サービス等利用計画',
    weeklySchedule: '週間計画表',
    needsAssessment: 'ニーズ整理票',
    monitoringReport: 'モニタリング報告書'
  }

  // 緊急度の判定
  const getUrgencyLevel = (deadline: Date): { level: string; color: string; days: number } => {
    const today = new Date()
    const daysRemaining = differenceInDays(deadline, today)
    
    if (daysRemaining < 0) {
      return { level: '期限超過', color: 'text-red-600 bg-red-50 border-red-200', days: daysRemaining }
    } else if (daysRemaining <= 3) {
      return { level: '緊急', color: 'text-red-600 bg-red-50 border-red-200', days: daysRemaining }
    } else if (daysRemaining <= 7) {
      return { level: '注意', color: 'text-orange-600 bg-orange-50 border-orange-200', days: daysRemaining }
    } else {
      return { level: '余裕', color: 'text-green-600 bg-green-50 border-green-200', days: daysRemaining }
    }
  }

  const suggestedUrgency = suggested ? getUrgencyLevel(suggested.deadline) : null
  const userDeadlineDate = userDeadline ? new Date(userDeadline) : null
  const userUrgency = userDeadlineDate ? getUrgencyLevel(userDeadlineDate) : null

  const handleSave = () => {
    // 制度期限がない場合は、ユーザー設定期限がある場合のみ保存
    if (!suggested && !userDeadlineDate) {
      alert('期限を設定してください')
      return
    }

    const deadline: DocumentDeadline = {
      documentId,
      documentType,
      suggestedDeadline: suggested?.deadline || userDeadlineDate!,
      userSetDeadline: userDeadlineDate || undefined,
      priority,
      notes,
      reminderDays
    }
    
    onDeadlineSet?.(deadline)
    setIsExpanded(false)
  }

  const toggleReminder = (days: number) => {
    setReminderDays(prev => 
      prev.includes(days) 
        ? prev.filter(d => d !== days)
        : [...prev, days].sort((a, b) => b - a)
    )
  }

  return (
    <div className="card border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900">
              期限設定 - {documentTypeNames[documentType]}
            </h3>
            <p className="text-sm text-gray-600">
              制度期限と個人設定期限の管理
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {isExpanded ? '閉じる' : '期限を設定'}
        </button>
      </div>

      {/* 制度期限の表示（制度期限がある場合のみ表示） */}
      {suggested && (
        <div className="px-4 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-3">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-blue-900 text-sm mb-1">
                  制度上の目安期限
                </div>
                <div className="text-sm text-blue-800">
                  <span className="font-medium">
                    {format(suggested.deadline, 'yyyy年M月d日(E)', { locale: ja })}
                  </span>
                  {suggestedUrgency && (
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${suggestedUrgency.color}`}>
                      あと{suggestedUrgency.days}日
                    </span>
                  )}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {suggested.reason}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 制度期限がない場合の説明 */}
      {!suggested && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-start space-x-3">
              <Info className="w-4 h-4 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm mb-1">
                  制度上の期限設定について
                </div>
                <div className="text-sm text-gray-600">
                  {documentType === 'needsAssessment' && 'ニーズ整理票は提出義務がないため、制度上の期限はありません。'}
                  {documentType === 'servicePlan' && '支給決定日を設定すると、制度上の期限が表示されます。'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 詳細設定エリア */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-4">
          <div className="space-y-4">
            {/* 個人設定期限 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                あなたの設定期限
              </label>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={userDeadline}
                  onChange={(e) => setUserDeadline(e.target.value)}
                  className="input-field flex-1"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                {userUrgency && (
                  <span className={`px-2 py-1 rounded-full text-xs ${userUrgency.color}`}>
                    あと{userUrgency.days}日
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                制度期限より厳しい期限を設定できます
              </p>
            </div>

            {/* 優先度設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                優先度
              </label>
              <div className="flex space-x-3">
                {[
                  { value: 'high', label: '高', color: 'bg-red-100 text-red-800 border-red-200' },
                  { value: 'medium', label: '中', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                  { value: 'low', label: '低', color: 'bg-green-100 text-green-800 border-green-200' }
                ].map(item => (
                  <label key={item.value} className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      value={item.value}
                      checked={priority === item.value}
                      onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                      className="mr-2"
                    />
                    <span className={`px-2 py-1 rounded text-xs border ${item.color}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* リマインダー設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                リマインダー
              </label>
              <div className="flex flex-wrap gap-2">
                {[7, 5, 3, 1].map(days => (
                  <label key={days} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reminderDays.includes(days)}
                      onChange={() => toggleReminder(days)}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-600">
                      {days}日前
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ダッシュボードに通知が表示されます
              </p>
            </div>

            {/* メモ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                期限設定理由・メモ
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="例：利用者との約束、会議予定、他の書類との関連など"
              />
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsExpanded(false)}
                className="btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                期限を設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 設定済み期限の表示 */}
      {userDeadlineDate && !isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  設定期限: {format(userDeadlineDate, 'yyyy年M月d日(E)', { locale: ja })}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${userUrgency?.color}`}>
                    {userUrgency?.level}
                  </span>
                  <span className="text-xs text-gray-500">
                    優先度: {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
                {notes && (
                  <div className="text-xs text-gray-600 mt-1">
                    {notes}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                編集
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeadlineManager