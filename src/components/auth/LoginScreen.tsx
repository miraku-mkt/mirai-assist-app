import React, { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const LoginScreen: React.FC = () => {
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [isFirstTime, setIsFirstTime] = useState(false)
  const { authenticate, pin: storedPin } = useAuthStore()

  React.useEffect(() => {
    setIsFirstTime(!storedPin)
  }, [storedPin])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (pin.length < 4) {
      setError('PINコードは4桁以上で入力してください')
      return
    }

    const success = authenticate(pin)
    if (!success) {
      setError('PINコードが正しくありません')
      setPin('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ミライアシスト
            </h1>
            <p className="text-gray-600">
              相談支援専門員向けAI書類作成支援
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="pin" className="form-label">
                {isFirstTime ? 'PINコードを設定してください' : 'PINコードを入力してください'}
              </label>
              <div className="relative">
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="input-field pr-12"
                  placeholder={isFirstTime ? '新しいPINコード（4桁以上）' : 'PINコードを入力'}
                  autoComplete="current-password"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPin ? 'PINコードを非表示' : 'PINコードを表示'}
                >
                  {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {error && <p className="error-message">{error}</p>}
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={!pin}
            >
              {isFirstTime ? 'PINコードを設定してログイン' : 'ログイン'}
            </button>
          </form>

          {isFirstTime && (
            <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-800">
                <strong>重要:</strong> 設定したPINコードは忘れないよう注意深く管理してください。
                PINコードを忘れた場合、すべてのデータにアクセスできなくなります。
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              セキュリティのため、8時間後に自動的にログアウトされます
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen