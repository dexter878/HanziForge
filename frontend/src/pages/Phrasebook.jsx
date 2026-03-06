import { useState, useEffect } from 'react'
import api from '../services/api'
import AudioButton from '../components/AudioButton'

const CATEGORIES = [
    { id: 'приветствия', name: 'Приветствия', icon: '👋' },
    { id: 'еда', name: 'Еда и напитки', icon: '🍜' },
    { id: 'транспорт', name: 'Транспорт', icon: '🚇' },
    { id: 'отель', name: 'Отель', icon: '🏨' },
    { id: 'экстренное', name: 'Экстренные', icon: '🆘' },
    { id: 'покупки', name: 'Покупки', icon: '🛒' },
    { id: 'направления', name: 'Направления', icon: '🧭' },
]

export default function Phrasebook() {
    const [phrases, setPhrases] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchPhrases()
    }, [selectedCategory])

    const fetchPhrases = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (selectedCategory) params.append('category', selectedCategory)
            params.append('limit', '200')

            const response = await api.get(`/api/phrases?${params}`)
            setPhrases(response.data)
        } catch (error) {
            console.error('Ошибка загрузки:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredPhrases = phrases.filter(phrase => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            phrase.zh.includes(searchQuery) ||
            phrase.pinyin.toLowerCase().includes(query) ||
            phrase.ru.toLowerCase().includes(query)
        )
    })

    const groupedPhrases = filteredPhrases.reduce((acc, phrase) => {
        const category = phrase.category
        if (!acc[category]) acc[category] = []
        acc[category].push(phrase)
        return acc
    }, {})

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">🗣️ Разговорник</h1>
            </div>

            {/* Поиск */}
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск фразы..."
                className="input"
            />

            {/* Категории */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-ghost'}`}
                >
                    Все
                </button>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>

            {/* Фразы */}
            {loading ? (
                <div className="text-center py-12 text-dark-muted">Загрузка...</div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedPhrases).map(([category, categoryPhrases]) => (
                        <div key={category}>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                {CATEGORIES.find(c => c.id === category)?.icon}
                                {CATEGORIES.find(c => c.id === category)?.name || category}
                            </h2>
                            <div className="space-y-2">
                                {categoryPhrases.map(phrase => (
                                    <div
                                        key={phrase.id}
                                        className="card flex items-center gap-4 hover:border-primary-500/50"
                                    >
                                        <AudioButton
                                            text={phrase.zh}
                                            audioSrc={phrase.audio_mp3}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="chinese-text text-xl">{phrase.zh}</span>
                                                <span className="pinyin">{phrase.pinyin}</span>
                                            </div>
                                            <div className="text-dark-muted">{phrase.ru}</div>
                                        </div>
                                        {phrase.is_common && (
                                            <span className="badge bg-yellow-500/20 text-yellow-400">Частая</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredPhrases.length === 0 && !loading && (
                <div className="text-center py-12 text-dark-muted">
                    Фразы не найдены
                </div>
            )}
        </div>
    )
}
