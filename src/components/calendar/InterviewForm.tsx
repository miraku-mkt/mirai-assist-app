import React, { useState, useEffect } from 'react'
import { X, Clock, MapPin, User, FileText } from 'lucide-react'
import { useInterviewStore } from '@/stores/interviewStore'
import { useUserStore } from '@/stores/userStore'
import { InterviewSession, User as UserType } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface InterviewFormProps {
  isOpen: boolean
  onClose: () => void
  interview?: InterviewSession | null
  selectedDate?: Date | null
  onSave?: () => void
}

const InterviewForm: React.FC<InterviewFormProps> = ({
  isOpen,
  onClose,
  interview,
  selectedDate,
  onSave
}) => {
  const { addInterview, updateInterview } = useInterviewStore()
  const { users, getUserById } = useUserStore()

  const [formData, setFormData] = useState({
    userId: '',
    scheduledDate: '',
    scheduledTime: '',
    endTime: '',
    location: '',
    purpose: '',
    participants: [''],
    notes: ''
  })

  // フォーム初期化
  useEffect(() => {
    if (interview) {
      // 編集モード
      const scheduledDate = new Date(interview.scheduledDate)
      const endDate = new Date(interview.endDate)
      setFormData({
        userId: interview.userId,
        scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
        scheduledTime: format(scheduledDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        location: interview.location,
        purpose: interview.purpose,
        participants: interview.participants || [''],
        notes: interview.notes || ''
      })
    } else if (selectedDate) {
      // 新規作成モード（選択された日付）
      setFormData({
        userId: '',
        scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
        scheduledTime: '10:00',
        endTime: '11:00',
        location: '',
        purpose: '定期面談',
        participants: [''],
        notes: ''
      })
    } else {
      // 新規作成モード（今日）
      const today = new Date()
      setFormData({
        userId: '',
        scheduledDate: format(today, 'yyyy-MM-dd'),
        scheduledTime: '10:00',
        endTime: '11:00',
        location: '',
        purpose: '定期面談',
        participants: [''],
        notes: ''
      })
    }
  }, [interview, selectedDate, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.userId || !formData.scheduledDate || !formData.scheduledTime || !formData.endTime) {
      alert('利用者、日付、開始時間、終了時間は必須項目です')
      return
    }

    // 終了時間が開始時間より前でないかチェック
    const startTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
    const endTime = new Date(`${formData.scheduledDate}T${formData.endTime}`)
    if (endTime <= startTime) {
      alert('終了時間は開始時間より後に設定してください')
      return
    }

    const scheduledDate = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
    const endDate = new Date(`${formData.scheduledDate}T${formData.endTime}`)
    const selectedUser = users.find(user => user.id === formData.userId)
    
    const interviewData = {
      userId: formData.userId,
      scheduledDate,
      endDate,
      location: formData.location || '未設定',
      purpose: formData.purpose || '定期面談',
      status: 'scheduled' as const,
      participants: formData.participants.filter(p => p.trim() !== ''),
      notes: formData.notes
    }

    if (interview) {
      // 編集モード
      updateInterview(interview.id, interviewData)
    } else {
      // 新規作成モード
      addInterview(interviewData)
    }

    onSave?.()
    onClose()
  }

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, '']
    }))
  }

  const removeParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }))
  }

  const updateParticipant = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => i === index ? value : p)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {interview ? '面談予定の編集' : '面談予定の追加'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* 利用者選択 */}
            <div className="form-group">
              <label className="form-label flex items-center">
                <User className="w-4 h-4 mr-2" />
                利用者 <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">利用者を選択してください</option>
                {users.map(userRecord => {
                  const user = getUserById(userRecord.id)
                  return (
                    <option key={userRecord.id} value={userRecord.id}>
                      {user?.actualName || userRecord.anonymizedName || '名前未設定'}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* 日時設定 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  面談日 <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  開始時間 <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  終了時間 <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* 場所と目的 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  面談場所
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="input-field"
                  placeholder="例：事業所、利用者宅、オンライン"
                />
              </div>

              <div className="form-group">
                <label className="form-label">面談目的</label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  className="input-field"
                >
                  <option value="初回面談">初回面談</option>
                  <option value="定期モニタリング">定期モニタリング</option>
                  <option value="計画見直し">計画見直し</option>
                  <option value="緊急対応">緊急対応</option>
                  <option value="サービス調整">サービス調整</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>

            {/* 参加者 */}
            <div className="form-group">
              <label className="form-label">参加者</label>
              <div className="space-y-2">
                {formData.participants.map((participant, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={participant}
                      onChange={(e) => updateParticipant(index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="参加者名"
                    />
                    {formData.participants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addParticipant}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + 参加者を追加
                </button>
              </div>
            </div>

            {/* メモ */}
            <div className="form-group">
              <label className="form-label flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                メモ・備考
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="input-field"
                rows={3}
                placeholder="面談に関する特記事項やメモを入力"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {interview ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InterviewForm