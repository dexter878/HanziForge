import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Progress() {
    const { user, login, register, logout, loading: authLoading } = useAuth()
    const [progress, setProgress] = useState(null)
    const [isLogin, setIsLogin] = useState(true)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (user) {
            fetchProgress()
        }
    }, [user])

    const fetchProgress = async () => {
        try {
            const response = await api.get('/api/progress')
            setProgress(response.data)
        } catch (err) {
            console.error('Не удалось загрузить прогресс:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isLogin) {
                await login(username, password)
            } else {
                await register(username, password)
            }
            setUsername('')
            setPassword('')
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка авторизации')
        } finally {
            setLoading(false)
        }
    }

    const exportProgress = () => {
        if (!progress) return

        const data = JSON.stringify(progress, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `hanzi-forge-progress-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (authLoading) {
        return <div className="text-center py-10 text-dark-muted">Загрузка аккаунта...</div>
    }

    if (!user) {
        return (
            <div className="max-w-md mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-center">Прогресс</h1>

                <div className="card">
                    <div className="flex mb-6">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 text-center ${isLogin ? 'border-b-2 border-primary-500 text-primary-500' : 'text-dark-muted'}`}
                        >
                            Вход
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 text-center ${!isLogin ? 'border-b-2 border-primary-500 text-primary-500' : 'text-dark-muted'}`}
                        >
                            Регистрация
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-dark-muted mb-1">Имя пользователя</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input"
                                required
                                minLength={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-dark-muted mb-1">Пароль</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                required
                                minLength={4}
                            />
                        </div>

                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Создать аккаунт'}
                        </button>
                    </form>
                </div>

                <div className="text-center text-sm text-dark-muted">
                    Войдите, чтобы сохранять личный прогресс и синхронизировать его между сессиями.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Прогресс</h1>
                <div className="flex items-center gap-4">
                    <span className="text-dark-muted">Пользователь: {user.username}</span>
                    <button onClick={logout} className="btn btn-ghost text-sm">
                        Выйти
                    </button>
                </div>
            </div>

            <div className="text-sm text-dark-muted">
                Прогресс хранится отдельно для каждого аккаунта. Другие пользователи не влияют на вашу статистику.
            </div>

            {progress && (
                <>
                    <div className="card bg-gradient-to-r from-primary-600/20 to-primary-800/20 border-primary-500/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-dark-muted">Выполнено сегодня</div>
                                <div className="text-4xl font-bold">
                                    {progress.today_completed}
                                    <span className="text-lg text-dark-muted">/{progress.daily_goal}</span>
                                </div>
                            </div>
                            <div className="text-6xl">🔥</div>
                        </div>
                        <div className="progress-bar mt-4">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${Math.min(100, (progress.today_completed / progress.daily_goal) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="card text-center">
                            <div className="text-3xl font-bold text-primary-500">{progress.learned_characters}</div>
                            <div className="text-sm text-dark-muted">Иероглифы</div>
                            <div className="text-xs text-dark-muted">из {progress.total_characters}</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-3xl font-bold text-green-500">{progress.practiced_sentences}</div>
                            <div className="text-sm text-dark-muted">Предложения</div>
                            <div className="text-xs text-dark-muted">из {progress.total_sentences}</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-3xl font-bold text-cyan-500">{progress.practiced_tests ?? 0}</div>
                            <div className="text-sm text-dark-muted">Тесты HSK</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-3xl font-bold text-purple-500">{progress.practiced_pinyin ?? 0}</div>
                            <div className="text-sm text-dark-muted">Сессии пиньиня</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-3xl font-bold text-yellow-500">{progress.streak_days}</div>
                            <div className="text-sm text-dark-muted">Дней подряд</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-3xl font-bold text-blue-500">{progress.daily_goal}</div>
                            <div className="text-sm text-dark-muted">Цель в день</div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Прогресс HSK</h2>
                        <div className="space-y-3">
                            {Object.entries(progress.hsk_progress).map(([level, percent]) => (
                                <div key={level} className="flex items-center gap-4">
                                    <div className="w-16 text-sm font-medium">HSK {level}</div>
                                    <div className="flex-1 progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <div className="w-12 text-right text-sm">{percent}%</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button onClick={exportProgress} className="btn btn-secondary">Экспорт JSON</button>
                        <button onClick={fetchProgress} className="btn btn-ghost">Обновить</button>
                    </div>
                </>
            )}
        </div>
    )
}
