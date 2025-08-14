import React, { useState, useMemo } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  MapPin,
  User,
  Plus
} from 'lucide-react'
import { useInterviewStore } from '@/stores/interviewStore'
import { useUserStore } from '@/stores/userStore'
import { InterviewSession } from '@/types'
import InterviewForm from './InterviewForm'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  addWeeks,
  startOfDay,
  isToday
} from 'date-fns'
import { ja } from 'date-fns/locale'

type ViewMode = 'month' | 'week'

interface CalendarEvent {
  interview: InterviewSession
  userName: string
}

const InterviewCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showInterviewForm, setShowInterviewForm] = useState(false)
  const [editingInterview, setEditingInterview] = useState<InterviewSession | null>(null)

  const { interviews } = useInterviewStore()
  const { users, getUserById } = useUserStore()

  // カレンダーに表示する日付範囲を計算
  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // 月曜始まり
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    }
  }, [currentDate, viewMode])

  // 各日付の面談イベントを取得
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return interviews
      .filter(interview => {
        const interviewDate = startOfDay(new Date(interview.scheduledDate))
        return isSameDay(interviewDate, date) && interview.status === 'scheduled'
      })
      .map(interview => {
        const user = getUserById(interview.userId)
        const userRecord = users.find(u => u.id === interview.userId)
        const userName = user?.actualName || userRecord?.anonymizedName || '不明'
        
        // デバッグ用
        console.log(`Interview for user ${interview.userId}: user?.actualName="${user?.actualName}", userRecord?.anonymizedName="${userRecord?.anonymizedName}", final userName="${userName}"`)
        
        return {
          interview,
          userName
        }
      })
      .sort((a, b) => 
        new Date(a.interview.scheduledDate).getTime() - new Date(b.interview.scheduledDate).getTime()
      )
  }

  // ナビゲーション
  const navigatePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, -1))
    } else {
      setCurrentDate(addWeeks(currentDate, -1))
    }
  }

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(addWeeks(currentDate, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 日付セルのクリックハンドラ
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const events = getEventsForDate(date)
    if (events.length > 0) {
      setShowEventModal(true)
    }
  }

  // 時間フォーマット
  const formatTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: ja })
  }

  // 面談の継続時間を計算（分）
  const getInterviewDurationMinutes = (interview: InterviewSession): number => {
    const start = new Date(interview.scheduledDate)
    const end = new Date(interview.endDate)
    return (end.getTime() - start.getTime()) / (1000 * 60)
  }

  // 時間スロットの高さを基にした面談の高さを計算
  const getInterviewHeight = (interview: InterviewSession): number => {
    const durationMinutes = getInterviewDurationMinutes(interview)
    const slotHeightPx = 80 // h-20 = 5rem = 80px
    const slotDurationMinutes = 60 // 1時間
    return Math.max(16, (durationMinutes / slotDurationMinutes) * slotHeightPx) // 最小16px
  }

  // 面談の開始位置を計算（時間スロット内のoffset）
  const getInterviewTopOffset = (interview: InterviewSession): number => {
    const startDate = new Date(interview.scheduledDate)
    const startMinutes = startDate.getMinutes()
    const slotHeightPx = 80 // h-20 = 5rem = 80px
    return (startMinutes / 60) * slotHeightPx
  }

  // 面談作成・編集のハンドラ
  const handleNewInterview = (date?: Date) => {
    setSelectedDate(date || new Date())
    setEditingInterview(null)
    setShowInterviewForm(true)
  }

  const handleEditInterview = (interview: InterviewSession) => {
    setEditingInterview(interview)
    setShowInterviewForm(true)
  }

  const handleInterviewSaved = () => {
    setShowEventModal(false)
    // 必要に応じてカレンダーを再描画
  }

  // 月表示のレンダリング
  const renderMonthView = () => {
    const weeks = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7))
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* 曜日ヘッダー */}
        {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
          <div 
            key={day} 
            className={`p-3 text-center text-sm font-medium bg-gray-50 border-r border-gray-200 ${
              index === 6 ? 'border-r-0' : ''
            }`}
          >
            {day}
          </div>
        ))}
        
        {/* 日付セル */}
        {weeks.map((week, weekIndex) => (
          week.map((day, dayIndex) => {
            const events = getEventsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)
            
            return (
              <div
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                onDoubleClick={() => handleNewInterview(day)}
                className={`min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  dayIndex === 6 ? 'border-r-0' : ''
                } ${
                  weekIndex === weeks.length - 1 ? 'border-b-0' : ''
                } ${
                  !isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''
                } ${
                  isDayToday ? 'bg-blue-50' : ''
                }`}
                title="ダブルクリックで面談予定を追加"
              >
                <div className={`text-sm font-medium mb-1 ${
                  isDayToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {events.slice(0, 3).map((event, index) => (
                    <div
                      key={event.interview.id}
                      className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                      title={`${formatTime(new Date(event.interview.scheduledDate))}-${formatTime(new Date(event.interview.endDate))} ${event.userName} - ${event.interview.purpose}`}
                    >
                      <div className="font-medium truncate">
                        {formatTime(new Date(event.interview.scheduledDate))}-{formatTime(new Date(event.interview.endDate))} {event.userName}
                      </div>
                      <div className="truncate text-blue-600">
                        {event.interview.purpose}
                      </div>
                    </div>
                  ))}
                  
                  {events.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{events.length - 3}件
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ))}
      </div>
    )
  }

  // 週表示のレンダリング
  const renderWeekView = () => {
    const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8) // 8:00-20:00

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-8">
          {/* 時間軸ヘッダー */}
          <div className="bg-gray-50 border-r border-gray-200">
            <div className="h-16 p-3 text-center text-sm font-medium border-b border-gray-200 flex items-center justify-center">
              時間
            </div>
            {timeSlots.map((hour, index) => (
              <div 
                key={hour} 
                className={`h-20 p-2 text-xs text-gray-600 flex items-start justify-center pt-1 ${
                  index < timeSlots.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <span className="text-center">{hour}:00</span>
              </div>
            ))}
          </div>
          
          {/* 日付列 */}
          {calendarDays.map((day, dayIndex) => {
            const events = getEventsForDate(day)
            const isDayToday = isToday(day)
            
            return (
              <div 
                key={day.toString()}
                className={`border-r border-gray-200 ${dayIndex === 6 ? 'border-r-0' : ''}`}
              >
                {/* 日付ヘッダー */}
                <div className={`h-16 p-3 text-center border-b border-gray-200 flex flex-col items-center justify-center ${
                  isDayToday ? 'bg-blue-50 text-blue-600 font-medium' : 'bg-gray-50'
                }`}>
                  <div className="text-sm font-medium">
                    {format(day, 'M/d', { locale: ja })}
                  </div>
                  <div className="text-xs">
                    {format(day, 'E', { locale: ja })}
                  </div>
                </div>
                
                {/* 時間スロット */}
                {timeSlots.map((hour, slotIndex) => {
                  // この時間スロットで開始する面談を取得
                  const hourEvents = events.filter(event => {
                    const eventStartHour = new Date(event.interview.scheduledDate).getHours()
                    return eventStartHour === hour
                  })
                  
                  return (
                    <div 
                      key={hour} 
                      className={`h-20 relative cursor-pointer hover:bg-gray-50 ${
                        slotIndex < timeSlots.length - 1 ? 'border-b border-gray-200' : ''
                      }`}
                      onClick={() => handleDateClick(day)}
                      onDoubleClick={() => handleNewInterview(day)}
                      title="ダブルクリックで面談予定を追加"
                    >
                      {/* 面談イベントを絶対位置で表示 */}
                      {hourEvents.map((event, eventIndex) => {
                        const height = getInterviewHeight(event.interview)
                        const topOffset = getInterviewTopOffset(event.interview)
                        const durationMinutes = getInterviewDurationMinutes(event.interview)
                        
                        return (
                          <div
                            key={event.interview.id}
                            className="absolute left-1 right-1 bg-blue-100 text-blue-800 rounded border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors"
                            style={{
                              top: `${topOffset}px`,
                              height: `${height}px`,
                              zIndex: 10
                            }}
                            title={`${event.userName} - ${event.interview.purpose}\n時間: ${formatTime(new Date(event.interview.scheduledDate))} - ${formatTime(new Date(event.interview.endDate))} (${durationMinutes}分)\n場所: ${event.interview.location}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditInterview(event.interview)
                            }}
                          >
                            <div className="p-1 h-full flex flex-col justify-center text-xs">
                              <div className="font-medium truncate">
                                {formatTime(new Date(event.interview.scheduledDate))}-{formatTime(new Date(event.interview.endDate))}
                              </div>
                              <div className="truncate text-blue-700">
                                {event.userName}
                              </div>
                              {height > 40 && (
                                <div className="truncate text-blue-600 text-[10px]">
                                  {event.interview.purpose}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">面談カレンダー</h1>
          <p className="text-gray-600 mt-1">
            面談予定の確認・管理
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleNewInterview()}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            面談予定を追加
          </button>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            今日
          </button>
          
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              月
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              週
            </button>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <button
          onClick={navigatePrevious}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          前の{viewMode === 'month' ? '月' : '週'}
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900">
          {viewMode === 'month' 
            ? format(currentDate, 'yyyy年M月', { locale: ja })
            : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'M/d', { locale: ja })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'M/d', { locale: ja })}`
          }
        </h2>
        
        <button
          onClick={navigateNext}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          次の{viewMode === 'month' ? '月' : '週'}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      {/* カレンダー表示 */}
      <div className="card p-0">
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}
      </div>

      {/* イベント詳細モーダル */}
      {showEventModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {format(selectedDate, 'yyyy年M月d日(E)', { locale: ja })} の面談予定
                </h2>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {getEventsForDate(selectedDate).map((event) => (
                  <div key={event.interview.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatTime(new Date(event.interview.scheduledDate))} - {formatTime(new Date(event.interview.endDate))}
                          </div>
                          <div className="text-sm text-gray-600">
                            {event.interview.purpose}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditInterview(event.interview)}
                        className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
                      >
                        編集
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">利用者:</span>
                        <span className="font-medium">{event.userName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">場所:</span>
                        <span>{event.interview.location}</span>
                      </div>
                    </div>

                    {event.interview.participants && event.interview.participants.length > 0 && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-600">参加者:</span>
                        <span className="ml-2">{event.interview.participants.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}

                {getEventsForDate(selectedDate).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    この日の面談予定はありません
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="btn-secondary"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 面談作成・編集フォーム */}
      <InterviewForm
        isOpen={showInterviewForm}
        onClose={() => {
          setShowInterviewForm(false)
          setEditingInterview(null)
        }}
        interview={editingInterview}
        selectedDate={selectedDate}
        onSave={handleInterviewSaved}
      />
    </div>
  )
}

export default InterviewCalendar