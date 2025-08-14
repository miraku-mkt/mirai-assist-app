import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText, 
  Calendar, 
  ClipboardCheck, 
  BarChart3,
  Plus,
  X,
  Edit3
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useInterviewStore } from '@/stores/interviewStore'
import { useDeadlineStore } from '@/stores/deadlineStore'
import { format, startOfToday, endOfToday, isWithinInterval, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'

interface TodayTask {
  id: string
  title: string
  description?: string
  type: 'manual' | 'interview' | 'deadline' | 'document'
  userId?: string
  documentType?: 'servicePlan' | 'weeklySchedule' | 'needsAssessment' | 'monitoringReport'
  status: 'pending' | 'completed'
  estimatedTime?: string
  createdAt: Date
}

const TodayTasksList: React.FC = () => {
  const navigate = useNavigate()
  const { getUserById, setCurrentUser } = useUserStore()
  const { interviews } = useInterviewStore()
  const { getUpcomingDeadlines } = useDeadlineStore()
  
  const [manualTasks, setManualTasks] = useState<TodayTask[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskTime, setNewTaskTime] = useState('')
  
  const today = startOfToday()

  // 手動タスクの永続化
  useEffect(() => {
    const savedTasks = localStorage.getItem('mirai-assist-today-tasks')
    if (savedTasks) {
      try {
        const tasks = JSON.parse(savedTasks)
        // 今日のタスクのみをフィルタ（古いタスクは除外）
        const todayTasksOnly = tasks.filter((task: TodayTask) => {
          const taskDate = new Date(task.createdAt)
          return taskDate.toDateString() === today.toDateString()
        })
        setManualTasks(todayTasksOnly)
      } catch (error) {
        console.error('Failed to load today tasks:', error)
      }
    }
  }, [today])

  // 手動タスクが変更されたら保存
  useEffect(() => {
    if (manualTasks.length > 0) {
      localStorage.setItem('mirai-assist-today-tasks', JSON.stringify(manualTasks))
    }
  }, [manualTasks])

  // 今日のタスクを取得
  const getTodayTasks = (): TodayTask[] => {
    const tasks: TodayTask[] = [...manualTasks]
    
    // デバッグ用
    console.log('Manual tasks:', manualTasks)

    // 今日の面談予定を追加
    const todayInterviews = interviews.filter(interview => 
      isSameDay(new Date(interview.scheduledDate), today) && 
      interview.status === 'scheduled'
    )

    todayInterviews.forEach(interview => {
      const user = getUserById(interview.userId)
      const userName = user?.actualName || '利用者不明'
      
      tasks.push({
        id: `interview-${interview.id}`,
        title: `面談: ${userName}`,
        description: `${format(new Date(interview.scheduledDate), 'HH:mm')} - ${interview.purpose}`,
        type: 'interview',
        userId: interview.userId,
        status: 'pending',
        createdAt: new Date(interview.createdAt)
      })
    })

    // 今日が期限の書類を追加
    const todayDeadlines = getUpcomingDeadlines(0) // 今日まで
    
    todayDeadlines.forEach(deadline => {
      if (isSameDay(deadline.userSetDeadline || deadline.suggestedDeadline, today)) {
        const user = getUserById(deadline.userId)
        const userName = user?.actualName || '利用者不明'
        
        tasks.push({
          id: `deadline-${deadline.id}`,
          title: `期限: ${deadline.documentType}`,
          description: `${userName}さんの書類提出期限`,
          type: 'deadline',
          userId: deadline.userId,
          documentType: deadline.documentType,
          status: 'pending',
          createdAt: new Date(deadline.createdAt)
        })
      }
    })

    return tasks.sort((a, b) => {
      // タイプ順: 期限 > 面談 > 手動タスク
      const typeOrder = { deadline: 0, interview: 1, manual: 2, document: 3 }
      return typeOrder[a.type] - typeOrder[b.type]
    })
  }

  const todayTasks = getTodayTasks()
  const completedTasks = todayTasks.filter(task => task.status === 'completed')
  const pendingTasks = todayTasks.filter(task => task.status !== 'completed')

  // 手動タスクの追加
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    
    const newTask: TodayTask = {
      id: `manual-${Date.now()}`,
      title: newTaskTitle,
      description: newTaskTime ? `予定時間: ${newTaskTime}` : undefined,
      type: 'manual',
      status: 'pending',
      estimatedTime: newTaskTime || undefined,
      createdAt: new Date()
    }
    
    setManualTasks(prev => [...prev, newTask])
    setNewTaskTitle('')
    setNewTaskTime('')
    setShowAddForm(false)
  }

  // タスクの完了切り替え
  const toggleTaskComplete = (taskId: string) => {
    const task = todayTasks.find(t => t.id === taskId)
    if (!task) return
    
    if (task.type === 'manual') {
      setManualTasks(prev => 
        prev.map(t => 
          t.id === taskId 
            ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
            : t
        )
      )
    }
    // 面談や期限タスクの完了処理は別途実装可能
  }

  // 手動タスクの削除
  const deleteTask = (taskId: string) => {
    setManualTasks(prev => prev.filter(t => t.id !== taskId))
  }

  // タスククリック処理
  const handleTaskClick = (task: TodayTask) => {
    if (task.type === 'interview' && task.userId) {
      // 面談の場合はカレンダーに移動
      navigate('/calendar')
    } else if (task.userId) {
      // 書類関連の場合は書類作成画面に移動
      const user = getUserById(task.userId)
      if (user) {
        setCurrentUser(user)
        navigate(`/documents/${task.userId}`)
      }
    }
  }

  const getTaskIcon = (task: TodayTask) => {
    switch (task.type) {
      case 'interview':
        return <Calendar className="w-4 h-4 text-blue-600" />
      case 'deadline':
        return <Clock className="w-4 h-4 text-red-600" />
      case 'document':
        return <FileText className="w-4 h-4 text-green-600" />
      case 'manual':
      default:
        return <ClipboardCheck className="w-4 h-4 text-gray-600" />
    }
  }

  const getTaskTypeLabel = (task: TodayTask) => {
    switch (task.type) {
      case 'interview':
        return { label: '面談', color: 'bg-blue-100 text-blue-800' }
      case 'deadline':
        return { label: '期限', color: 'bg-red-100 text-red-800' }
      case 'document':
        return { label: '書類', color: 'bg-green-100 text-green-800' }
      case 'manual':
      default:
        return { label: 'タスク', color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2" />
              今日のタスク
              {pendingTasks.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {pendingTasks.length}件
                </span>
              )}
            </h2>
            <div className="flex items-center justify-between mt-1">
              <p className="text-gray-600">
                今日行う予定の作業
              </p>
              {completedTasks.length > 0 && (
                <span className="text-sm text-green-600">
                  完了: {completedTasks.length}件
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-secondary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            追加
          </button>
        </div>
      </div>

      {/* タスク追加フォーム */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タスク名
              </label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="input-field"
                placeholder="例：資料作成、電話連絡、会議準備"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                予定時間（任意）
              </label>
              <input
                type="text"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="input-field"
                placeholder="例：30分、1時間"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAddTask}
                className="btn-primary"
              >
                追加
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewTaskTitle('')
                  setNewTaskTime('')
                }}
                className="btn-secondary"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {todayTasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-green-800 font-medium">今日のタスクはありません</p>
          <p className="text-green-600 text-sm mt-1">
            タスクを追加して今日の予定を管理しましょう
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingTasks.map((task) => {
            const typeInfo = getTaskTypeLabel(task)
            
            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    className="flex-shrink-0"
                  >
                    <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {getTaskIcon(task)}
                      <span className="font-medium text-gray-900">{task.title}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {task.type === 'manual' && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {(task.type === 'interview' || task.type === 'deadline') && (
                    <button
                      onClick={() => handleTaskClick(task)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {completedTasks.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <p className="text-sm text-gray-500 font-medium mb-2">完了済み</p>
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-2"
                >
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    className="flex-shrink-0"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </button>
                  <span className="text-gray-500 line-through text-sm">{task.title}</span>
                  {task.type === 'manual' && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>今日のタスク管理:</strong> 手動でタスクを追加したり、今日の面談予定・期限が自動で表示されます。
        </p>
      </div>
    </div>
  )
}

export default TodayTasksList