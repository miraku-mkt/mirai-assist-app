import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Calendar,
  User,
  CheckSquare,
  Loader,
  CheckCircle,
  AlertCircle,
  Trash2,
  Bot,
  Plus,
  X
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useDocumentStore } from '@/stores/documentStore'
import { MonitoringReport, MonitoringItem } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { generateDocumentWithAI } from '@/utils/aiPrompts'

// アップロードファイルの型定義
type UploadedFile = {
  id: string
  file: File
  type: 'interview' | 'service_provider' | 'meeting' | 'other'
  name: string
  content?: string
  status: 'uploading' | 'ready' | 'error'
}

type FileType = {
  key: 'interview' | 'service_provider' | 'meeting' | 'other'
  label: string
  description: string
  required: boolean
}

const MonitoringCreate: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { getUserById } = useUserStore()
  const { addMonitoringReport } = useDocumentStore()
  
  const [formData, setFormData] = useState({
    reportDate: format(new Date(), 'yyyy-MM-dd'),
    monitoringDate: format(new Date(), 'yyyy-MM-dd'),
    userAgreementName: ''
  })
  
  // 3ステップ進行管理
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  
  // アップロードファイル管理
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<{
    comprehensiveSupport: string
    overallStatus: string
    monitoringItems: Partial<MonitoringItem>[]
  } | null>(null)
  
  // ファイルタイプ定義
  const fileTypes: FileType[] = [
    {
      key: 'interview',
      label: '面談記録',
      description: '利用者との面談記録（振り返り・対話・見通しの内容）',
      required: true
    },
    {
      key: 'service_provider',
      label: '事業所聞き取り記録',
      description: 'サービス提供事業所からの聞き取り内容',
      required: false
    },
    {
      key: 'meeting',
      label: 'サービス担当者会議記録',
      description: '関係者会議の記録や資料',
      required: false
    },
    {
      key: 'other',
      label: 'その他関連資料',
      description: '医療機関の情報、家族からの情報など',
      required: false
    }
  ]


  const user = userId ? getUserById(userId) : null

  useEffect(() => {
    if (user && user.actualName) {
      setFormData(prev => ({
        ...prev,
        userAgreementName: user.actualName
      }))
    }
  }, [user?.actualName])

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
  const handleGenerateReport = async () => {
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

      // AI生成（モニタリング報告書プロンプトを使用）
      const result = await generateDocumentWithAI(
        'monitoringReport', 
        {}, 
        {
          interviewText: allContent,
          userInfo: user
        }
      )
      
      setGeneratedReport({
        comprehensiveSupport: result.comprehensiveSupport || '',
        overallStatus: result.overallStatus || '',
        monitoringItems: result.monitoringItems || []
      })
      
      // 生成完了後、ステップ3へ移行
      setTimeout(() => {
        setCurrentStep(3)
      }, 500)
    } catch (error) {
      console.error('AI生成エラー:', error)
      alert('モニタリング報告書の生成に失敗しました')
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
      // AI生成が完了したらステップ3へ
      if (generatedReport) {
        setCurrentStep(3)
      }
    }
  }

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)
    }
  }

  // AI生成後のステップ3移行
  const handleGenerateComplete = async () => {
    await handleGenerateReport()
    if (generatedReport) {
      setCurrentStep(3)
    }
  }

  // 生成されたレポートの編集
  const updateGeneratedReport = (field: string, value: any) => {
    if (!generatedReport) return
    setGeneratedReport(prev => prev ? { ...prev, [field]: value } : null)
  }

  const updateMonitoringItem = (index: number, field: string, value: any) => {
    if (!generatedReport) return
    setGeneratedReport(prev => {
      if (!prev) return null
      const updatedItems = [...prev.monitoringItems]
      updatedItems[index] = { ...updatedItems[index], [field]: value }
      return { ...prev, monitoringItems: updatedItems }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId) {
      alert('利用者IDが不正です')
      return
    }

    if (!formData.reportDate || !formData.monitoringDate) {
      alert('報告書作成日とモニタリング実施日は必須です')
      return
    }

    if (!generatedReport) {
      alert('まずAI生成を実行してください')
      return
    }

    const reportData = {
      userId,
      reportDate: new Date(formData.reportDate),
      monitoringDate: new Date(formData.monitoringDate),
      userAgreementName: formData.userAgreementName,
      comprehensiveSupport: generatedReport.comprehensiveSupport,
      overallStatus: generatedReport.overallStatus,
      monitoringItems: generatedReport.monitoringItems.filter(item => 
        item.supportGoal && item.supportGoal.trim() !== ''
      ) as MonitoringItem[]
    }

    addMonitoringReport(reportData)
    
    alert('モニタリング報告書が作成されました')
    navigate('/monitoring')
  }

  const handleBack = () => {
    navigate('/monitoring')
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
            <h1 className="text-2xl font-bold text-gray-900">モニタリング報告書作成</h1>
            <p className="text-gray-600 mt-1">
              {user.actualName}さんの関連資料をアップロードしてAIが専門的な報告書を生成します
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
              { step: 1, title: '基本情報', description: '報告書の基本情報と関連資料', icon: FileText },
              { step: 2, title: 'AI生成', description: '専門的なモニタリング報告書を自動生成', icon: Bot },
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
                <div className="form-group">
                  <label className="form-label">報告書作成日 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => handleFormChange('reportDate', e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">モニタリング実施日 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={formData.monitoringDate}
                    onChange={(e) => handleFormChange('monitoringDate', e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="form-group md:col-span-2">
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
                  disabled={!formData.reportDate || !formData.monitoringDate}
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
              以下の資料をアップロードしてください。AIが専門的な知識に基づいてモニタリング報告書を生成します。
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
                  onClick={handleGenerateReport}
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
        {currentStep === 3 && generatedReport && (
          <div className="card">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                ステップ3: 確認・編集
              </h2>
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-green-800 text-sm">
                  ✅ AIが専門的な知識に基づいてモニタリング報告書を生成しました。内容を確認し、必要に応じて修正してください。手動での詳細な編集も可能です。
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="form-group">
                  <label className="form-label">総合的な援助の方針</label>
                  <textarea
                    value={generatedReport.comprehensiveSupport}
                    onChange={(e) => updateGeneratedReport('comprehensiveSupport', e.target.value)}
                    className="input-field"
                    rows={4}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">全体の状況</label>
                  <textarea
                    value={generatedReport.overallStatus}
                    onChange={(e) => updateGeneratedReport('overallStatus', e.target.value)}
                    className="input-field"
                    rows={4}
                  />
                </div>

                {/* モニタリング項目 */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">モニタリング項目</h3>
                  <div className="space-y-4">
                    {generatedReport.monitoringItems.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">項目 {index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="form-group">
                            <label className="form-label">支援目標</label>
                            <input
                              type="text"
                              value={item.supportGoal || ''}
                              onChange={(e) => updateMonitoringItem(index, 'supportGoal', e.target.value)}
                              className="input-field"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">達成時期</label>
                            <input
                              type="text"
                              value={item.completionPeriod || ''}
                              onChange={(e) => updateMonitoringItem(index, 'completionPeriod', e.target.value)}
                              className="input-field"
                            />
                          </div>

                          <div className="form-group md:col-span-2">
                            <label className="form-label">サービス提供状況</label>
                            <textarea
                              value={item.serviceStatus || ''}
                              onChange={(e) => updateMonitoringItem(index, 'serviceStatus', e.target.value)}
                              className="input-field"
                              rows={2}
                            />
                          </div>

                          <div className="form-group md:col-span-2">
                            <label className="form-label">本人の感想・満足度</label>
                            <textarea
                              value={item.userSatisfaction || ''}
                              onChange={(e) => updateMonitoringItem(index, 'userSatisfaction', e.target.value)}
                              className="input-field"
                              rows={2}
                            />
                          </div>

                          <div className="form-group md:col-span-2">
                            <label className="form-label">支援目標の達成度</label>
                            <textarea
                              value={item.goalAchievement || ''}
                              onChange={(e) => updateMonitoringItem(index, 'goalAchievement', e.target.value)}
                              className="input-field"
                              rows={2}
                            />
                          </div>

                          <div className="form-group md:col-span-2">
                            <label className="form-label">今後の課題・解決方法</label>
                            <textarea
                              value={item.currentIssues || ''}
                              onChange={(e) => updateMonitoringItem(index, 'currentIssues', e.target.value)}
                              className="input-field"
                              rows={2}
                            />
                          </div>

                          <div className="form-group md:col-span-2">
                            <label className="form-label">その他留意事項</label>
                            <textarea
                              value={item.otherNotes || ''}
                              onChange={(e) => updateMonitoringItem(index, 'otherNotes', e.target.value)}
                              className="input-field"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                disabled={!generatedReport}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                モニタリング報告書を保存
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default MonitoringCreate