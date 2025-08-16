import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Loader,
  CheckCircle,
  AlertCircle,
  Trash2,
  Bot
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useDocumentStore } from '@/stores/documentStore'
import { ServicePlan, ServicePlanItem } from '@/types'
import { format } from 'date-fns'
import { generateDocumentWithAI } from '@/utils/aiPrompts'

// アップロードファイルの型定義
type UploadedFile = {
  id: string
  file: File
  type: 'interview' | 'assessment' | 'medical' | 'other'
  name: string
  content?: string
  status: 'uploading' | 'ready' | 'error'
}

type FileType = {
  key: 'interview' | 'assessment' | 'medical' | 'other'
  label: string
  description: string
  required: boolean
}

const PlanCreate: React.FC = () => {
  const { userId, planId } = useParams<{ userId: string; planId: string }>()
  const navigate = useNavigate()
  const { getUserById } = useUserStore()
  const { addServicePlan, getServicePlanById, updateServicePlan } = useDocumentStore()
  
  // 編集モードかどうかを判定
  const isEditMode = !!planId
  const existingPlan = isEditMode ? getServicePlanById(planId) : null
  
  // 編集モードの場合、既存プランからuserIdを取得
  const actualUserId = userId || (existingPlan ? existingPlan.userId : null)
  
  const [formData, setFormData] = useState({
    planDate: format(new Date(), 'yyyy-MM-dd'),
    userAgreementName: '',
    documentType: 'servicePlan' as 'servicePlan' | 'needsAssessment' | 'weeklySchedule'
  })
  
  // 3ステップ進行管理
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  
  // アップロードファイル管理
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<{
    lifeGoals: string
    comprehensiveSupport: string
    longTermGoals: string
    shortTermGoals: string
    services: Partial<ServicePlanItem>[]
  } | null>(null)
  
  // ファイルタイプ定義
  const fileTypes: FileType[] = [
    {
      key: 'interview',
      label: '面談記録',
      description: '利用者との面談内容（ニーズ、希望、現状の課題等）',
      required: true
    },
    {
      key: 'assessment',
      label: 'アセスメント情報',
      description: '障害状況、ADL、生活環境等の評価情報',
      required: false
    },
    {
      key: 'medical',
      label: '医療・専門機関情報',
      description: '医師の意見書、専門機関の評価、検査結果等',
      required: false
    },
    {
      key: 'other',
      label: 'その他関連資料',
      description: '家族からの情報、既存サービス利用状況等',
      required: false
    }
  ]

  const user = actualUserId ? getUserById(actualUserId) : null

  useEffect(() => {
    if (user && user.actualName) {
      setFormData(prev => ({
        ...prev,
        userAgreementName: user.actualName
      }))
    }
  }, [user?.actualName])

  // 編集モードの場合、既存プランの情報を読み込む
  useEffect(() => {
    if (isEditMode && existingPlan) {
      setFormData(prev => ({
        ...prev,
        planDate: format(existingPlan.planDate, 'yyyy-MM-dd'),
        userAgreementName: existingPlan.userAgreementName,
        documentType: (existingPlan as any).documentType || 'servicePlan'
      }))
      
      setGeneratedPlan({
        lifeGoals: existingPlan.lifeGoals,
        comprehensiveSupport: existingPlan.comprehensiveSupport,
        longTermGoals: existingPlan.longTermGoals,
        shortTermGoals: existingPlan.shortTermGoals,
        services: existingPlan.services
      })
      
      // 編集モードの場合は直接ステップ3に進む
      setCurrentStep(3)
    }
  }, [isEditMode, existingPlan])

  // ファイルアップロード処理
  const handleFileUpload = (files: FileList | null, type: FileType['key']) => {
    if (!files) return

    Array.from(files).forEach(file => {
      const fileId = `${type}_${Date.now()}_${file.name}`
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        type,
        name: file.name,
        status: 'uploading'
      }

      setUploadedFiles(prev => [...prev, uploadedFile])

      // ファイル内容を読み取り（テキストファイルの場合）
      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, content: e.target?.result as string, status: 'ready' }
                : f
            )
          )
        }
        reader.onerror = () => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileId ? { ...f, status: 'error' } : f
            )
          )
        }
        reader.readAsText(file)
      } else {
        // 他の形式の場合は準備完了とマーク
        setTimeout(() => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileId ? { ...f, status: 'ready' } : f
            )
          )
        }, 1000)
      }
    })
  }

  // ファイル削除
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // 必須ファイルがアップロード済みかチェック
  const hasRequiredFiles = () => {
    const requiredTypes = fileTypes.filter(t => t.required).map(t => t.key)
    return requiredTypes.every(type => 
      uploadedFiles.some(f => f.type === type && f.status === 'ready')
    )
  }

  // AI生成処理
  const handleGeneratePlan = async () => {
    if (!hasRequiredFiles()) {
      alert('必須ファイルをアップロードしてください')
      return
    }

    setIsGenerating(true)
    try {
      // アップロードされたファイルの内容を統合
      const allContent = uploadedFiles
        .filter(f => f.status === 'ready')
        .map(f => `【${fileTypes.find(t => t.key === f.type)?.label || f.type}】\n${f.content || f.name}\n`)
        .join('\n')

      // AI生成（選択された書類タイプに応じたプロンプトを使用）
      const result = await generateDocumentWithAI(formData.documentType, allContent, user)
      
      setGeneratedPlan({
        lifeGoals: result.lifeGoals || '',
        comprehensiveSupport: result.comprehensiveSupport || '',
        longTermGoals: result.longTermGoals || '',
        shortTermGoals: result.shortTermGoals || '',
        services: result.services || []
      })
      
      // 生成完了後、ステップ3へ移行
      setTimeout(() => {
        setCurrentStep(3)
      }, 500)
    } catch (error) {
      console.error('AI生成エラー:', error)
      alert('サービス等利用計画の生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getFileStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getFilesByType = (type: FileType['key']) => {
    return uploadedFiles.filter(f => f.type === type)
  }

  // ステップ進行関数
  const nextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (generatedPlan) {
        setCurrentStep(3)
      }
    }
  }

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)
    }
  }

  // 生成されたプランの編集
  const updateGeneratedPlan = (field: string, value: any) => {
    if (!generatedPlan) return
    setGeneratedPlan(prev => prev ? { ...prev, [field]: value } : null)
  }

  const updateServiceItem = (index: number, field: string, value: any) => {
    if (!generatedPlan) return
    setGeneratedPlan(prev => {
      if (!prev) return null
      const updatedServices = [...prev.services]
      updatedServices[index] = { ...updatedServices[index], [field]: value }
      return { ...prev, services: updatedServices }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!actualUserId) {
      alert('利用者IDが不正です')
      return
    }

    if (!formData.planDate) {
      alert('計画作成日は必須です')
      return
    }

    if (!generatedPlan) {
      alert('まずAI生成を実行してください')
      return
    }

    const planData = {
      userId: actualUserId,
      planDate: new Date(formData.planDate),
      userAgreementName: formData.userAgreementName,
      documentType: formData.documentType, // 書類タイプを追加
      lifeGoals: generatedPlan.lifeGoals,
      comprehensiveSupport: generatedPlan.comprehensiveSupport,
      longTermGoals: generatedPlan.longTermGoals,
      shortTermGoals: generatedPlan.shortTermGoals,
      services: generatedPlan.services.filter(service => 
        service.supportGoal && service.supportGoal.trim() !== ''
      ) as ServicePlanItem[]
    }

    const documentNames = {
      servicePlan: 'サービス等利用計画',
      weeklySchedule: '週間計画表', 
      needsAssessment: 'ニーズ整理票'
    }

    if (isEditMode && planId) {
      updateServicePlan(planId, planData)
      alert(`${documentNames[formData.documentType]}が更新されました`)
    } else {
      addServicePlan(planData)
      alert(`${documentNames[formData.documentType]}が作成されました`)
    }
    navigate('/plan')
  }

  const handleBack = () => {
    navigate('/plan')
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">利用者が見つかりません</h2>
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
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? (
                <>
                  {formData.documentType === 'servicePlan' && 'サービス等利用計画編集'}
                  {formData.documentType === 'weeklySchedule' && '週間計画表編集'}
                  {formData.documentType === 'needsAssessment' && 'ニーズ整理票編集'}
                </>
              ) : (
                <>
                  {formData.documentType === 'servicePlan' && 'サービス等利用計画作成'}
                  {formData.documentType === 'weeklySchedule' && '週間計画表作成'}
                  {formData.documentType === 'needsAssessment' && 'ニーズ整理票作成'}
                </>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              {user.actualName}さんの関連資料をアップロードしてAIが専門的な
              {formData.documentType === 'servicePlan' && 'サービス等利用計画'}
              {formData.documentType === 'weeklySchedule' && '週間計画表'}
              {formData.documentType === 'needsAssessment' && 'ニーズ整理票'}
              を生成します
            </p>
          </div>
        </div>
      </div>

      {/* 3ステッププログレス */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">作成プロセス</h2>
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: '基本情報', description: '計画書の基本情報と関連資料', icon: FileText },
              { step: 2, title: 'AI生成', description: '専門知識を活用した計画書生成', icon: Bot },
              { step: 3, title: '確認・編集', description: '内容確認と必要な修正', icon: CheckCircle }
            ].map((stepInfo, index) => {
              const isActive = stepInfo.step === currentStep
              const isCompleted = stepInfo.step < currentStep
              const IconComponent = stepInfo.icon
              
              return (
                <div key={stepInfo.step} className="flex items-center">
                  <div className={`flex items-center space-x-3 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`p-3 rounded-full ${isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-medium">ステップ{stepInfo.step}: {stepInfo.title}</div>
                      <div className="text-sm text-gray-500">{stepInfo.description}</div>
                    </div>
                  </div>
                  {index < 2 && (
                    <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ステップ1: 基本情報 */}
        {currentStep === 1 && (
          <div className="card">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                ステップ1: 基本情報
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-group md:col-span-2">
                  <label className="form-label">作成する書類 <span className="text-red-500">*</span></label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => handleFormChange('documentType', e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="servicePlan">サービス等利用計画（様式2-1）</option>
                    <option value="weeklySchedule">週間計画表（様式2-2）</option>
                    <option value="needsAssessment">ニーズ整理票</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">計画作成日 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={formData.planDate}
                    onChange={(e) => handleFormChange('planDate', e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">利用者氏名</label>
                  <input
                    type="text"
                    value={formData.userAgreementName}
                    onChange={(e) => handleFormChange('userAgreementName', e.target.value)}
                    className="input-field"
                    placeholder="利用者の氏名"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!formData.planDate}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次のステップ：関連資料アップロード
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ステップ2: AI生成 */}
        {currentStep === 2 && (
          <div className="card">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                ステップ2: AI生成
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                以下の資料をアップロードしてください。AIが専門知識を活用して
                {formData.documentType === 'servicePlan' && 'サービス等利用計画'}
                {formData.documentType === 'weeklySchedule' && '週間計画表'}
                {formData.documentType === 'needsAssessment' && 'ニーズ整理票'}
                を生成します。
              </p>
              
              <div className="space-y-6">
                {fileTypes.map((fileType) => (
                  <div key={fileType.key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center">
                          {fileType.label}
                          {fileType.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        <p className="text-sm text-gray-600">{fileType.description}</p>
                      </div>
                      <div>
                        <input
                          type="file"
                          id={`file-${fileType.key}`}
                          multiple
                          accept=".txt,.doc,.docx,.pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e.target.files, fileType.key)}
                          className="hidden"
                        />
                        <label
                          htmlFor={`file-${fileType.key}`}
                          className="btn-secondary flex items-center cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          ファイル選択
                        </label>
                      </div>
                    </div>
                    
                    {/* アップロードされたファイル一覧 */}
                    <div className="space-y-2">
                      {getFilesByType(fileType.key).map((file) => (
                        <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            {getFileStatusIcon(file.status)}
                            <span className="text-sm text-gray-700">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI生成ボタン */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={previousStep}
                    className="btn-secondary flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    前のステップ
                  </button>
                  
                  <div className="text-center">
                    {hasRequiredFiles() ? (
                      <p className="text-sm text-green-600 mb-2">✓ 必須ファイルのアップロード完了</p>
                    ) : (
                      <p className="text-sm text-gray-600 mb-2">必須ファイルをアップロードしてください</p>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGeneratePlan}
                    disabled={!hasRequiredFiles() || isGenerating}
                    className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        AI生成中...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        AI生成して次のステップへ
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ステップ3: 確認・編集 */}
        {currentStep === 3 && generatedPlan && (
          <div className="card">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                ステップ3: 確認・編集
              </h2>
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-green-800 text-sm">
                  ✅ AIが専門知識を活用して
                  {formData.documentType === 'servicePlan' && 'サービス等利用計画'}
                  {formData.documentType === 'weeklySchedule' && '週間計画表'}
                  {formData.documentType === 'needsAssessment' && 'ニーズ整理票'}
                  を生成しました。内容を確認し、必要に応じて修正してください。
                </p>
              </div>
              
              <div className="space-y-6">
                {/* サービス等利用計画のフォーム */}
                {formData.documentType === 'servicePlan' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">利用者及びその家族の生活に対する意向</label>
                      <textarea
                        value={generatedPlan.lifeGoals}
                        onChange={(e) => updateGeneratedPlan('lifeGoals', e.target.value)}
                        className="input-field"
                        rows={4}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">総合的な援助の方針</label>
                      <textarea
                        value={generatedPlan.comprehensiveSupport}
                        onChange={(e) => updateGeneratedPlan('comprehensiveSupport', e.target.value)}
                        className="input-field"
                        rows={4}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">長期目標</label>
                      <textarea
                        value={generatedPlan.longTermGoals}
                        onChange={(e) => updateGeneratedPlan('longTermGoals', e.target.value)}
                        className="input-field"
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">短期目標</label>
                      <textarea
                        value={generatedPlan.shortTermGoals}
                        onChange={(e) => updateGeneratedPlan('shortTermGoals', e.target.value)}
                        className="input-field"
                        rows={3}
                      />
                    </div>

                    {/* サービス項目 */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">福祉サービス等</h3>
                      <div className="space-y-4">
                        {generatedPlan.services.map((service, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">サービス {index + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="form-group">
                                <label className="form-label">優先順位</label>
                                <input
                                  type="number"
                                  value={service.priority || ''}
                                  onChange={(e) => updateServiceItem(index, 'priority', parseInt(e.target.value))}
                                  className="input-field"
                                  min="1"
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">達成時期</label>
                                <input
                                  type="text"
                                  value={service.completionPeriod || ''}
                                  onChange={(e) => updateServiceItem(index, 'completionPeriod', e.target.value)}
                                  className="input-field"
                                />
                              </div>

                              <div className="form-group md:col-span-2">
                                <label className="form-label">解決すべき課題</label>
                                <textarea
                                  value={service.issueToSolve || ''}
                                  onChange={(e) => updateServiceItem(index, 'issueToSolve', e.target.value)}
                                  className="input-field"
                                  rows={2}
                                />
                              </div>

                              <div className="form-group md:col-span-2">
                                <label className="form-label">支援目標</label>
                                <textarea
                                  value={service.supportGoal || ''}
                                  onChange={(e) => updateServiceItem(index, 'supportGoal', e.target.value)}
                                  className="input-field"
                                  rows={2}
                                />
                              </div>

                              <div className="form-group md:col-span-2">
                                <label className="form-label">福祉サービス等の種類・内容・量</label>
                                <textarea
                                  value={service.serviceDetails || ''}
                                  onChange={(e) => updateServiceItem(index, 'serviceDetails', e.target.value)}
                                  className="input-field"
                                  rows={2}
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">提供事業所名</label>
                                <input
                                  type="text"
                                  value={service.providerName || ''}
                                  onChange={(e) => updateServiceItem(index, 'providerName', e.target.value)}
                                  className="input-field"
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">評価時期</label>
                                <input
                                  type="text"
                                  value={service.evaluationPeriod || ''}
                                  onChange={(e) => updateServiceItem(index, 'evaluationPeriod', e.target.value)}
                                  className="input-field"
                                />
                              </div>

                              <div className="form-group md:col-span-2">
                                <label className="form-label">本人の役割</label>
                                <textarea
                                  value={service.userRole || ''}
                                  onChange={(e) => updateServiceItem(index, 'userRole', e.target.value)}
                                  className="input-field"
                                  rows={2}
                                />
                              </div>

                              <div className="form-group md:col-span-2">
                                <label className="form-label">その他留意事項</label>
                                <textarea
                                  value={service.otherNotes || ''}
                                  onChange={(e) => updateServiceItem(index, 'otherNotes', e.target.value)}
                                  className="input-field"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 週間計画表のフォーム */}
                {formData.documentType === 'weeklySchedule' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">基本的生活パターン</label>
                      <textarea
                        value={generatedPlan.lifeGoals || ''}
                        onChange={(e) => updateGeneratedPlan('lifeGoals', e.target.value)}
                        className="input-field"
                        rows={4}
                        placeholder="起床、就寝時間、食事時間、基本的な生活リズム等"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">月曜日の活動内容</label>
                      <textarea
                        value={generatedPlan.comprehensiveSupport || ''}
                        onChange={(e) => updateGeneratedPlan('comprehensiveSupport', e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder="午前・午後・夕方の活動内容を記載"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">火曜日の活動内容</label>
                      <textarea
                        value={generatedPlan.longTermGoals || ''}
                        onChange={(e) => updateGeneratedPlan('longTermGoals', e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder="午前・午後・夕方の活動内容を記載"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">水曜日の活動内容</label>
                      <textarea
                        value={generatedPlan.shortTermGoals || ''}
                        onChange={(e) => updateGeneratedPlan('shortTermGoals', e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder="午前・午後・夕方の活動内容を記載"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">木曜日の活動内容</label>
                        <textarea
                          className="input-field"
                          rows={3}
                          placeholder="午前・午後・夕方の活動内容を記載"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">金曜日の活動内容</label>
                        <textarea
                          className="input-field"
                          rows={3}
                          placeholder="午前・午後・夕方の活動内容を記載"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">土曜日の活動内容</label>
                        <textarea
                          className="input-field"
                          rows={3}
                          placeholder="午前・午後・夕方の活動内容を記載"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">日曜日の活動内容</label>
                        <textarea
                          className="input-field"
                          rows={3}
                          placeholder="午前・午後・夕方の活動内容を記載"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">週間を通しての留意事項</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        placeholder="健康管理、安全面での配慮、緊急時対応等"
                      />
                    </div>
                  </>
                )}

                {/* ニーズ整理票のフォーム */}
                {formData.documentType === 'needsAssessment' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">生活全般の状況とニーズ</label>
                      <textarea
                        value={generatedPlan.lifeGoals || ''}
                        onChange={(e) => updateGeneratedPlan('lifeGoals', e.target.value)}
                        className="input-field"
                        rows={4}
                        placeholder="現在の生活状況、困っていること、希望していること等"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">ADL（日常生活動作）の状況</label>
                      <textarea
                        value={generatedPlan.comprehensiveSupport || ''}
                        onChange={(e) => updateGeneratedPlan('comprehensiveSupport', e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder="食事、入浴、着替え、移動等の自立度と必要な支援"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">IADL（手段的日常生活動作）の状況</label>
                      <textarea
                        value={generatedPlan.longTermGoals || ''}
                        onChange={(e) => updateGeneratedPlan('longTermGoals', e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder="買い物、調理、掃除、金銭管理等の状況と必要な支援"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">コミュニケーション・社会参加の状況</label>
                      <textarea
                        value={generatedPlan.shortTermGoals || ''}
                        onChange={(e) => updateGeneratedPlan('shortTermGoals', e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder="意思疎通方法、社会との関わり、対人関係等"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">医療的ケア・健康管理</label>
                        <textarea
                          className="input-field"
                          rows={3}
                          placeholder="服薬管理、通院状況、医療的配慮等"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">行動・心理症状（BPSD等）</label>
                        <textarea
                          className="input-field"
                          rows={3}
                          placeholder="問題となる行動、対応方法、環境調整等"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">家族・介護者の状況</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        placeholder="家族構成、介護負担、家族の希望・意向等"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">環境・住環境の状況</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        placeholder="住居形態、バリアフリー状況、地域資源の活用等"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">優先的に解決すべき課題</label>
                      <textarea
                        className="input-field"
                        rows={4}
                        placeholder="緊急性や重要度を考慮した優先課題とその理由"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ナビゲーションボタン */}
        {currentStep === 3 && (
          <div className="flex justify-between space-x-4">
            <button
              type="button"
              onClick={previousStep}
              className="btn-secondary flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              前のステップ
            </button>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!generatedPlan}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? (
                  <>
                    {formData.documentType === 'servicePlan' && 'サービス等利用計画を更新'}
                    {formData.documentType === 'weeklySchedule' && '週間計画表を更新'}
                    {formData.documentType === 'needsAssessment' && 'ニーズ整理票を更新'}
                  </>
                ) : (
                  <>
                    {formData.documentType === 'servicePlan' && 'サービス等利用計画を保存'}
                    {formData.documentType === 'weeklySchedule' && '週間計画表を保存'}
                    {formData.documentType === 'needsAssessment' && 'ニーズ整理票を保存'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default PlanCreate