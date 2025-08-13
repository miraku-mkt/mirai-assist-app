import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  UserPlus, 
  Edit3, 
  Trash2, 
  FileText,
  Eye,
  EyeOff 
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
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
  
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showActualNames, setShowActualNames] = useState(true)
  const [formData, setFormData] = useState({
    actualName: '',
    disabilityType: '',
    disabilitySupportCategory: '',
    supportServiceNumber: '',
    municipalityNumber: '',
    consultantName: '',
    planCreator: ''
  })

  const resetForm = () => {
    setFormData({
      actualName: '',
      disabilityType: '',
      disabilitySupportCategory: '',
      supportServiceNumber: '',
      municipalityNumber: '',
      consultantName: '',
      planCreator: ''
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

    if (editingUser) {
      updateUser(editingUser.id, formData)
    } else {
      addUser(formData)
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
        consultantName: fullUser.consultantName,
        planCreator: fullUser.planCreator
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

  const handleCreateDocument = (user: User) => {
    setCurrentUser(user)
    navigate(`/documents/${user.id}`)
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
                    placeholder="受給者証番号を入力"
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
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {fullUser?.actualName?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {showActualNames ? (fullUser?.actualName || '名前未設定') : user.anonymizedName}
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
                            onClick={() => handleCreateDocument(user)}
                            className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                            title="書類作成"
                          >
                            <FileText size={16} />
                          </button>
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