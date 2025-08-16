import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  UserPlus, 
  Edit3, 
  Trash2, 
  Eye,
  EyeOff 
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useInterviewStore } from '@/stores/interviewStore'
import { User } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const UserManagement: React.FC = () => {
  const navigate = useNavigate()
  const { 
    users, 
    addUser, 
    updateUser, 
    deleteUser, 
    getUserById,
    setCurrentUser 
  } = useUserStore()
  
  const { addInterview } = useInterviewStore()
  
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showActualNames, setShowActualNames] = useState(true)
  const [formData, setFormData] = useState({
    actualName: '',
    disabilityType: '',
    disabilitySupportCategory: '',
    supportServiceNumber: '',
    municipalityNumber: '',
    disabilityWelfareServiceNumber: '',
    regionalConsultationSupportNumber: '',
    consultantName: '',
    planCreator: '',
    // 期限管理関連フィールド
    benefitDecisionDate: '',
    // 面談関連フィールド
    nextInterviewDate: '',
    nextInterviewTime: '',
    nextInterviewEndTime: '',
    interviewLocation: '',
    interviewPurpose: '',
    interviewFrequency: 'monthly'
  })

  const resetForm = () => {
    setFormData({
      actualName: '',
      disabilityType: '',
      disabilitySupportCategory: '',
      supportServiceNumber: '',
      municipalityNumber: '',
      disabilityWelfareServiceNumber: '',
      regionalConsultationSupportNumber: '',
      consultantName: '',
      planCreator: '',
      // 期限管理関連フィールド
      benefitDecisionDate: '',
      // 面談関連フィールド
      nextInterviewDate: '',
      nextInterviewTime: '',
      nextInterviewEndTime: '',
      interviewLocation: '',
      interviewPurpose: '',
      interviewFrequency: 'monthly'
    })
    setShowForm(false)
    setEditingUser(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.actualName.trim()) {
      alert('利用者名は必須です')
      return
    }

    // 利用者基本情報の処理
    const userBasicData = {
      actualName: formData.actualName,
      disabilityType: formData.disabilityType,
      disabilitySupportCategory: formData.disabilitySupportCategory,
      supportServiceNumber: formData.supportServiceNumber,
      municipalityNumber: formData.municipalityNumber,
      disabilityWelfareServiceNumber: formData.disabilityWelfareServiceNumber,
      regionalConsultationSupportNumber: formData.regionalConsultationSupportNumber,
      consultantName: formData.consultantName,
      planCreator: formData.planCreator,
      benefitDecisionDate: formData.benefitDecisionDate ? new Date(formData.benefitDecisionDate) : undefined,
      interviewFrequency: formData.interviewFrequency as 'weekly' | 'biweekly' | 'monthly' | 'as_needed'
    }

    let userId: string
    if (editingUser) {
      updateUser(editingUser.id, userBasicData)
      userId = editingUser.id
    } else {
      userId = addUser(userBasicData)
    }

    // 面談予定がある場合は面談記録を作成
    if (formData.nextInterviewDate && formData.nextInterviewTime && formData.nextInterviewEndTime) {
      const scheduledDate = new Date(`${formData.nextInterviewDate}T${formData.nextInterviewTime}`)
      const endDate = new Date(`${formData.nextInterviewDate}T${formData.nextInterviewEndTime}`)
      
      // 終了時間が開始時間より後かチェック
      if (endDate > scheduledDate) {
        addInterview({
          userId,
          scheduledDate,
          endDate,
          location: formData.interviewLocation || '未設定',
          purpose: formData.interviewPurpose || '定期面談',
          status: 'scheduled',
          participants: [formData.actualName, formData.consultantName].filter(Boolean)
        })
      }
    }

    resetForm()
  }

  const handleEdit = (user: User) => {
    const fullUser = getUserById(user.id)
    if (fullUser) {
      setFormData({
        actualName: fullUser.actualName,
        disabilityType: fullUser.disabilityType,
        disabilitySupportCategory: fullUser.disabilitySupportCategory,
        supportServiceNumber: fullUser.supportServiceNumber,
        municipalityNumber: fullUser.municipalityNumber,
        disabilityWelfareServiceNumber: fullUser.disabilityWelfareServiceNumber || '',
        regionalConsultationSupportNumber: fullUser.regionalConsultationSupportNumber || '',
        consultantName: fullUser.consultantName,
        planCreator: fullUser.planCreator,
        // 期限管理関連フィールド
        benefitDecisionDate: fullUser.benefitDecisionDate ? format(fullUser.benefitDecisionDate, 'yyyy-MM-dd') : '',
        // 面談関連フィールド（編集時は空にしておく）
        nextInterviewDate: '',
        nextInterviewTime: '',
        nextInterviewEndTime: '',
        interviewLocation: '',
        interviewPurpose: '',
        interviewFrequency: fullUser.interviewFrequency || 'monthly'
      })
      setEditingUser(fullUser)
      setShowForm(true)
    }
  }

  const handleDelete = (user: User) => {
    const fullUser = getUserById(user.id)
    const displayName = fullUser?.actualName || user.anonymizedName
    if (confirm(`${displayName}さんのデータを削除しますか？この操作は元に戻せません。`)) {
      deleteUser(user.id)
    }
  }


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">利用者管理</h1>
          <p className="text-gray-600 mt-1">
            利用者の基本情報を登録・管理します
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowActualNames(!showActualNames)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title={showActualNames ? '匿名化表示に切り替え' : '実名表示に切り替え'}
          >
            {showActualNames ? <EyeOff size={18} /> : <Eye size={18} />}
            <span className="text-sm">{showActualNames ? '匿名化' : '実名表示'}</span>
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <UserPlus size={20} className="mr-2" />
            新規利用者登録
          </button>
        </div>
      </div>

      {/* 利用者登録・編集フォーム */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingUser ? '利用者情報の編集' : '新規利用者登録'}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group md:col-span-2">
                  <label className="form-label">
                    利用者名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.actualName}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualName: e.target.value }))}
                    className="input-field"
                    placeholder="利用者の実名を入力"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">障害種別</label>
                  <select
                    value={formData.disabilityType}
                    onChange={(e) => setFormData(prev => ({ ...prev, disabilityType: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">選択してください</option>
                    <option value="身体障害">身体障害</option>
                    <option value="知的障害">知的障害</option>
                    <option value="精神障害">精神障害</option>
                    <option value="発達障害">発達障害</option>
                    <option value="難病">難病</option>
                    <option value="重複障害">重複障害</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">障害支援区分</label>
                  <select
                    value={formData.disabilitySupportCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, disabilitySupportCategory: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">選択してください</option>
                    <option value="非該当">非該当</option>
                    <option value="区分1">区分1</option>
                    <option value="区分2">区分2</option>
                    <option value="区分3">区分3</option>
                    <option value="区分4">区分4</option>
                    <option value="区分5">区分5</option>
                    <option value="区分6">区分6</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">利用者負担上限額</label>
                  <input
                    type="text"
                    value={formData.supportServiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, supportServiceNumber: e.target.value }))}
                    className="input-field"
                    placeholder="例：0円、9,300円、37,200円"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">通所受給者証番号</label>
                  <input
                    type="text"
                    value={formData.municipalityNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, municipalityNumber: e.target.value }))}
                    className="input-field"
                    placeholder="通所受給者証番号を入力"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">障害福祉サービス受給者証番号</label>
                  <input
                    type="text"
                    value={formData.disabilityWelfareServiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, disabilityWelfareServiceNumber: e.target.value }))}
                    className="input-field"
                    placeholder="障害福祉サービス受給者証番号を入力"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">地域相談支援受給者証番号</label>
                  <input
                    type="text"
                    value={formData.regionalConsultationSupportNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, regionalConsultationSupportNumber: e.target.value }))}
                    className="input-field"
                    placeholder="地域相談支援受給者証番号を入力"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">相談支援事業者名</label>
                  <input
                    type="text"
                    value={formData.consultantName}
                    onChange={(e) => setFormData(prev => ({ ...prev, consultantName: e.target.value }))}
                    className="input-field"
                    placeholder="相談支援事業者名を入力"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">計画作成担当者</label>
                  <input
                    type="text"
                    value={formData.planCreator}
                    onChange={(e) => setFormData(prev => ({ ...prev, planCreator: e.target.value }))}
                    className="input-field"
                    placeholder="計画作成担当者名を入力"
                  />
                </div>
              </div>

              {/* 期限管理セクション */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">期限管理</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">支給決定日</label>
                    <input
                      type="date"
                      value={formData.benefitDecisionDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, benefitDecisionDate: e.target.value }))}
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      サービス等利用計画の期限計算に使用されます
                    </p>
                  </div>
                </div>
              </div>

              {/* 面談情報セクション */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">面談予定</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">次回面談日</label>
                    <input
                      type="date"
                      value={formData.nextInterviewDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextInterviewDate: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">開始時間</label>
                    <input
                      type="time"
                      value={formData.nextInterviewTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextInterviewTime: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">終了時間</label>
                    <input
                      type="time"
                      value={formData.nextInterviewEndTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextInterviewEndTime: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div className="form-group md:col-span-2">
                    <label className="form-label">面談場所</label>
                    <input
                      type="text"
                      value={formData.interviewLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, interviewLocation: e.target.value }))}
                      className="input-field"
                      placeholder="例：事業所、利用者宅、オンライン"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">面談目的</label>
                    <select
                      value={formData.interviewPurpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, interviewPurpose: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">選択してください</option>
                      <option value="初回面談">初回面談</option>
                      <option value="定期モニタリング">定期モニタリング</option>
                      <option value="計画見直し">計画見直し</option>
                      <option value="緊急対応">緊急対応</option>
                      <option value="サービス調整">サービス調整</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">面談頻度</label>
                    <select
                      value={formData.interviewFrequency}
                      onChange={(e) => setFormData(prev => ({ ...prev, interviewFrequency: e.target.value }))}
                      className="input-field"
                    >
                      <option value="weekly">毎週</option>
                      <option value="biweekly">隔週</option>
                      <option value="monthly">毎月</option>
                      <option value="as_needed">必要に応じて</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingUser ? '更新' : '登録'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 利用者一覧 */}
      <div className="card">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              利用者が登録されていません
            </h3>
            <p className="text-gray-500 mb-6">
              最初の利用者を登録してください
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <UserPlus size={20} className="mr-2" />
              新規利用者登録
            </button>
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
                {users.map((user) => {
                  const fullUser = getUserById(user.id)
                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">
                          {showActualNames ? (fullUser?.actualName || '名前未設定') : user.anonymizedName}
                        </span>
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
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="編集"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="削除"
                          >
                            <Trash2 size={16} />
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

export default UserManagement