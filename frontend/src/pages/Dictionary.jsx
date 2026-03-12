import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import AudioButton from '../components/AudioButton'
import { createLocalHanziWriterLoader, isMissingLocalHanziWriterData } from '../services/offlineAssets'

export default function Dictionary() {
    const { char } = useParams()
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [selectedChar, setSelectedChar] = useState(null)
    const [loading, setLoading] = useState(false)
    const [hskFilter, setHskFilter] = useState(null)
    const [writerError, setWriterError] = useState('')
    const writerRef = useRef(null)
    const writerInstanceRef = useRef(null)

    useEffect(() => {
        if (char) {
            fetchCharacterDetails(char)
        } else {
            fetchCharacters()
        }
    }, [char, hskFilter])

    useEffect(() => {
        // Инициализация hanzi-writer
        if (selectedChar && writerRef.current) {
            initHanziWriter(selectedChar.char)
        }
    }, [selectedChar])

    const fetchCharacters = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('limit', '50')
            if (hskFilter) params.append('hsk_level', hskFilter)

            const response = await api.get(`/api/characters?${params}`)
            setResults(response.data)
        } catch (error) {
            console.error('Ошибка загрузки:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchCharacterDetails = async (character) => {
        setLoading(true)
        try {
            const response = await api.get(`/api/characters/${encodeURIComponent(character)}`)
            setSelectedChar(response.data)
        } catch (error) {
            console.error('Иероглиф не найден:', error)
            navigate('/словарь')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!query.trim()) {
            fetchCharacters()
            return
        }

        setLoading(true)
        try {
            const response = await api.get(`/api/characters/search?q=${encodeURIComponent(query)}`)
            setResults(response.data)
            setSelectedChar(null)
        } catch (error) {
            console.error('Ошибка поиска:', error)
        } finally {
            setLoading(false)
        }
    }

    const initHanziWriter = async (character) => {
        if (writerInstanceRef.current) {
            writerInstanceRef.current = null
            writerRef.current.innerHTML = ''
        }

        setWriterError('')

        try {
            const HanziWriter = (await import('hanzi-writer')).default
            writerInstanceRef.current = HanziWriter.create(writerRef.current, character, {
                charDataLoader: createLocalHanziWriterLoader(),
                width: 200,
                height: 200,
                padding: 10,
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 200,
                strokeColor: '#dc2626',
                radicalColor: '#f59e0b',
                outlineColor: '#2a2a4a',
                drawingColor: '#10b981',
                showOutline: true,
                showCharacter: true,
            })
        } catch (error) {
            if (isMissingLocalHanziWriterData(error)) {
                setWriterError('Для этого иероглифа не добавлен локальный stroke-order JSON в frontend/public/hanzi-writer-data.')
            } else {
                setWriterError('Локальный модуль анимации штрихов не удалось запустить.')
            }
            console.error('Ошибка инициализации hanzi-writer:', error)
        }
    }

    const animateStrokes = () => {
        if (writerInstanceRef.current) {
            writerInstanceRef.current.animateCharacter()
        }
    }

    const getHskBadgeClass = (level) => {
        return `badge badge-hsk${level}`
    }

    // Детальный просмотр иероглифа
    if (selectedChar) {
        return (
            <div className="space-y-6">
                {/* Хлебные крошки */}
                <nav className="flex items-center gap-2 text-sm text-dark-muted">
                    <Link to="/словарь" className="hover:text-primary-500">Словарь</Link>
                    <span>/</span>
                    <span className="text-dark-text">{selectedChar.char}</span>
                </nav>

                {/* Основная информация */}
                <div className="card">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Иероглиф и анимация */}
                        <div className="flex flex-col items-center">
                            <div className="hanzi-large chinese-text text-primary-500 mb-4">
                                {selectedChar.char}
                            </div>

                            <div
                                ref={writerRef}
                                className="hanzi-writer-container mb-4"
                                style={{ minHeight: '200px', minWidth: '200px' }}
                            />

                            {writerError && (
                                <div className="mb-4 max-w-[320px] rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
                                    {writerError}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={animateStrokes} className="btn btn-primary">
                                    ▶️ Анимация штрихов
                                </button>
                                <AudioButton
                                    text={selectedChar.char}
                                    pinyin={selectedChar.pinyin_tone_numbers}
                                    audioSrc={selectedChar.audio_mp3}
                                    size="lg"
                                />
                            </div>
                        </div>

                        {/* Детали */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <div className="text-sm text-dark-muted mb-1">Пиньинь</div>
                                <div className="text-2xl pinyin">{selectedChar.pinyin}</div>
                                <div className="text-sm text-dark-muted">({selectedChar.pinyin_tone_numbers})</div>
                            </div>

                            <div>
                                <div className="text-sm text-dark-muted mb-1">Значение</div>
                                <div className="text-xl">{selectedChar.meaning_ru}</div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div>
                                    <span className="text-sm text-dark-muted">HSK: </span>
                                    <span className={getHskBadgeClass(selectedChar.hsk_level)}>
                                        HSK {selectedChar.hsk_level}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-dark-muted">Частотность: </span>
                                    <span className="text-yellow-500">#{selectedChar.frequency}</span>
                                </div>
                                {selectedChar.radical && (
                                    <div>
                                        <span className="text-sm text-dark-muted">Радикал: </span>
                                        <span className="chinese-text text-xl">{selectedChar.radical}</span>
                                    </div>
                                )}
                            </div>

                            {selectedChar.etymology_ru && (
                                <div>
                                    <div className="text-sm text-dark-muted mb-1">Этимология</div>
                                    <div className="text-dark-text">{selectedChar.etymology_ru}</div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Link to={`/письмо/${selectedChar.char}`} className="btn btn-secondary">
                                    ✍️ Практика письма
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Список иероглифов
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">📖 Словарь</h1>
            </div>

            {/* Поиск */}
            <form onSubmit={handleSearch} className="flex gap-3">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск по иероглифу, пиньинь или значению..."
                    className="input flex-1"
                />
                <button type="submit" className="btn btn-primary">
                    🔍 Поиск
                </button>
            </form>

            {/* HSK фильтр */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setHskFilter(null)}
                    className={`btn ${!hskFilter ? 'btn-primary' : 'btn-ghost'}`}
                >
                    Все
                </button>
                {[1, 2, 3, 4, 5, 6].map(level => (
                    <button
                        key={level}
                        onClick={() => setHskFilter(level)}
                        className={`btn ${hskFilter === level ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        HSK {level}
                    </button>
                ))}
            </div>

            {/* Результаты */}
            {loading ? (
                <div className="text-center py-12 text-dark-muted">Загрузка...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {results.map((item) => (
                        <Link
                            key={item.id}
                            to={`/словарь/${item.char}`}
                            className="card hover:scale-105 transition-transform text-center group"
                        >
                            <div className="hanzi-medium chinese-text text-primary-500 group-hover:scale-110 transition-transform">
                                {item.char}
                            </div>
                            <div className="pinyin text-lg">{item.pinyin}</div>
                            <div className="text-sm text-dark-muted truncate">{item.meaning_ru}</div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className={getHskBadgeClass(item.hsk_level)}>HSK{item.hsk_level}</span>
                                <AudioButton
                                    text={item.char}
                                    pinyin={item.pinyin_tone_numbers}
                                    audioSrc={item.audio_mp3}
                                    size="sm"
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {results.length === 0 && !loading && (
                <div className="text-center py-12 text-dark-muted">
                    Ничего не найдено. Попробуйте другой запрос.
                </div>
            )}
        </div>
    )
}
