import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import LoginScreen from '@/components/auth/LoginScreen'
import Dashboard from '@/components/dashboard/Dashboard'
import UserManagement from '@/components/users/UserManagement'
import DocumentCreate from '@/components/documents/DocumentCreate'
import MonitoringManagement from '@/components/monitoring/MonitoringManagement'
import MonitoringCreate from '@/components/monitoring/MonitoringCreate'
import MonitoringView from '@/components/monitoring/MonitoringView'
import PlanManagement from '@/components/plan/PlanManagement'
import PlanCreate from '@/components/plan/PlanCreate'
import PlanView from '@/components/plan/PlanView'
import InterviewCalendar from '@/components/calendar/InterviewCalendar'
import Layout from '@/components/layout/Layout'

const App: React.FC = () => {
  const { isAuthenticated, checkAuthExpiry } = useAuthStore()

  useEffect(() => {
    // 認証の期限をチェック
    checkAuthExpiry()
    
    // 1分ごとに認証期限をチェック
    const interval = setInterval(checkAuthExpiry, 60000)
    
    return () => clearInterval(interval)
  }, [checkAuthExpiry])

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/documents/:userId" element={<DocumentCreate />} />
          <Route path="/plan" element={<PlanManagement />} />
          <Route path="/plan/create/:userId" element={<PlanCreate />} />
          <Route path="/plan/view/:planId" element={<PlanView />} />
          <Route path="/plan/edit/:planId" element={<PlanCreate />} />
          <Route path="/monitoring" element={<MonitoringManagement />} />
          <Route path="/monitoring/create/:userId" element={<MonitoringCreate />} />
          <Route path="/monitoring/view/:userId" element={<MonitoringView />} />
          <Route path="/calendar" element={<InterviewCalendar />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App