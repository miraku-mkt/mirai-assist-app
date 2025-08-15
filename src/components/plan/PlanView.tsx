import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  Edit, 
  Download,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useDocumentStore } from '@/stores/documentStore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { exportServicePlanToExcel } from '@/utils/excelExport'

const PlanView: React.FC = () => {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { getUserById } = useUserStore()
  const { getServicePlanById } = useDocumentStore()

  const plan = planId ? getServicePlanById(planId) : null
  const user = plan ? getUserById(plan.userId) : null

  const handleBack = () => {
    navigate('/plan')
  }

  const handleEdit = () => {
    if (planId) {
      navigate(`/plan/edit/${planId}`)
    }
  }

  const handleDownload = () => {
    if (!plan || !user) return
    
    // 簡易的なテキスト形式でダウンロード
    const content = `
サービス等利用計画（様式2-1）

作成日: ${format(plan.createdAt, 'yyyy年M月d日', { locale: ja })}
利用者氏名: ${plan.userAgreementName}
障害種別: ${user.disabilityType}
障害支援区分: ${user.disabilitySupportCategory}

【利用者及びその家族の生活に対する意向】
${plan.lifeGoals}

【総合的な援助の方針】
${plan.comprehensiveSupport}

【長期目標】
${plan.longTermGoals}

【短期目標】
${plan.shortTermGoals}

【福祉サービス等】
${plan.services.map((service, index) => `
${index + 1}. 優先順位: ${service.priority}
   解決すべき課題: ${service.issueToSolve}
   支援目標: ${service.supportGoal}
   達成時期: ${service.completionPeriod}
   サービス内容: ${service.serviceDetails}
   提供事業所: ${service.providerName}
   本人の役割: ${service.userRole}
   評価時期: ${service.evaluationPeriod}
   その他留意事項: ${service.otherNotes}
`).join('\n')}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `サービス等利用計画_${plan.userAgreementName}_${format(plan.createdAt, 'yyyyMMdd', { locale: ja })}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExcelExport = () => {
    if (!plan || !user) return
    exportServicePlanToExcel(plan, plan.userAgreementName, user)
  }

  if (!plan || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">計画書が見つかりません</h2>
          <button onClick={handleBack} className="btn-secondary">
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">サービス等利用計画</h1>
            <p className="text-gray-600 mt-1">
              {plan.userAgreementName}さんの利用計画（{format(plan.createdAt, 'yyyy年M月d日作成', { locale: ja })}）
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownload}
            className="btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            テキスト
          </button>
          <button
            onClick={handleExcelExport}
            className="btn-secondary flex items-center"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel出力
          </button>
          <button
            onClick={handleEdit}
            className="btn-primary flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            編集
          </button>
        </div>
      </div>

      {/* 基本情報 */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            基本情報
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">利用者氏名</label>
                <p className="text-gray-900">{plan.userAgreementName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">障害種別</label>
                <p className="text-gray-900">{user.disabilityType}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作成日</label>
                <p className="text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(plan.createdAt, 'yyyy年M月d日', { locale: ja })}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">障害支援区分</label>
                <p className="text-gray-900">{user.disabilitySupportCategory}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 生活に対する意向 */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            利用者及びその家族の生活に対する意向
          </h2>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-900 whitespace-pre-wrap">{plan.lifeGoals}</p>
          </div>
        </div>
      </div>

      {/* 援助の方針 */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            総合的な援助の方針
          </h2>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-gray-900 whitespace-pre-wrap">{plan.comprehensiveSupport}</p>
          </div>
        </div>
      </div>

      {/* 目標設定 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              長期目標
            </h2>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{plan.longTermGoals}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              短期目標
            </h2>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{plan.shortTermGoals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 福祉サービス等 */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            福祉サービス等
          </h2>
          
          {plan.services.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">登録されているサービスはありません</p>
            </div>
          ) : (
            <div className="space-y-6">
              {plan.services.map((service, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">サービス {index + 1}</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      優先順位: {service.priority}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">解決すべき課題</label>
                        <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded">{service.issueToSolve}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">支援目標</label>
                        <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded">{service.supportGoal}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">達成時期</label>
                        <p className="text-gray-900 text-sm">{service.completionPeriod}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">評価時期</label>
                        <p className="text-gray-900 text-sm">{service.evaluationPeriod}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">サービス内容・量</label>
                        <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded">{service.serviceDetails}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">提供事業所名</label>
                        <p className="text-gray-900 text-sm">{service.providerName}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">本人の役割</label>
                        <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded">{service.userRole}</p>
                      </div>
                      
                      {service.otherNotes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">その他留意事項</label>
                          <p className="text-gray-900 text-sm bg-yellow-50 p-3 rounded border border-yellow-200">{service.otherNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 作成情報 */}
      <div className="card bg-gray-50">
        <div className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>作成日時: {format(plan.createdAt, 'yyyy年M月d日 HH:mm', { locale: ja })}</span>
            <span>計画ID: {plan.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlanView