import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'

const features = [
    {
        path: '/словарь',
        title: 'Словарь',
        icon: '📖',
        description: 'Поиск иероглифов, пиньинь, порядок черт',
        color: 'from-blue-500 to-blue-700'
    },
    {
        path: '/пиньинь',
        title: 'Пиньинь',
        icon: '🔤',
        description: 'Тоны, уроки lesson_1...lesson_12 и тренажеры слуха',
        color: 'from-teal-500 to-teal-700'
    },
    {
        path: '/письмо',
        title: 'Письмо',
        icon: '✍️',
        description: 'Практика написания иероглифов',
        color: 'from-green-500 to-green-700'
    },
    {
        path: '/изучение',
        title: 'Упражнения',
        icon: '🧠',
        description: 'Пропуски, перестановки, выбор ответа',
        color: 'from-purple-500 to-purple-700'
    },
    {
        path: '/видео',
        title: 'Видео',
        icon: '🎥',
        description: 'HSK-видео с интерактивными субтитрами',
        color: 'from-pink-500 to-pink-700'
    },
    {
        path: '/тесты',
        title: 'Тесты HSK',
        icon: '📝',
        description: 'Слушание, чтение, письмо',
        color: 'from-yellow-500 to-yellow-700'
    },
    {
        path: '/флешкарты',
        title: 'Флешкарты',
        icon: '🗂️',
        description: 'Интервальное повторение (алгоритм SM-2)',
        color: 'from-cyan-500 to-cyan-700'
    },
    {
        path: '/разговорник',
        title: 'Разговорник',
        icon: '🗣️',
        description: 'Фразы для поездок по темам',
        color: 'from-orange-500 to-orange-700'
    },
    {
        path: '/ocr',
        title: 'Распознавание (OCR)',
        icon: '📷',
        description: 'Распознавание иероглифов с фото',
        color: 'from-indigo-500 to-indigo-700'
    },
    {
        path: '/прогресс',
        title: 'Прогресс',
        icon: '📊',
        description: 'Статистика, цели и динамика обучения',
        color: 'from-red-500 to-red-700'
    }
]

export default function Home() {
    const [stats, setStats] = useState(null)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/stats')
            setStats(response.data)
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error)
        }
    }

    return (
        <div className="space-y-8">
            <section className="text-center py-8">
                <div className="inline-flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <span className="text-white text-4xl chinese-text font-bold">汉</span>
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Hanzi <span className="text-primary-500">Forge</span>
                </h1>
                <p className="text-xl text-dark-muted max-w-2xl mx-auto">
                    Изучайте китайский офлайн: словарь, пиньинь, письмо, тесты, флешкарты и разговорные фразы.
                </p>
            </section>

            {stats && (
                <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="card text-center">
                        <div className="text-3xl font-bold text-primary-500">{stats.characters}</div>
                        <div className="text-sm text-dark-muted">Иероглифов</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-3xl font-bold text-green-500">{stats.sentences}</div>
                        <div className="text-sm text-dark-muted">Предложений</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-3xl font-bold text-yellow-500">{stats.tests}</div>
                        <div className="text-sm text-dark-muted">Тестов</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-3xl font-bold text-blue-500">{stats.flashcards}</div>
                        <div className="text-sm text-dark-muted">Флешкарт</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-3xl font-bold text-purple-500">{stats.phrases}</div>
                        <div className="text-sm text-dark-muted">Фраз</div>
                    </div>
                </section>
            )}

            <section>
                <h2 className="text-2xl font-bold mb-6">Начать обучение</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature) => (
                        <Link
                            key={feature.path}
                            to={feature.path}
                            className="card group hover:scale-[1.02] transition-transform"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                                    {feature.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg group-hover:text-primary-500 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-dark-muted">{feature.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="card bg-gradient-to-r from-primary-600/20 to-primary-800/20 border-primary-500/30">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">Готовы начать?</h3>
                        <p className="text-dark-muted">
                            Стартуйте со словаря HSK1 или зайдите в раздел «Пиньинь» и проходите уроки от `lesson_1`.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/словарь" className="btn btn-primary">
                            📖 Словарь
                        </Link>
                        <Link to="/пиньинь" className="btn btn-secondary">
                            🔤 Пиньинь
                        </Link>
                    </div>
                </div>
            </section>

            <section className="text-center text-sm text-dark-muted">
                <p>💡 Совет: нажмите <kbd className="px-2 py-1 bg-dark-border rounded">Enter</kbd> для воспроизведения аудио</p>
            </section>
        </div>
    )
}
