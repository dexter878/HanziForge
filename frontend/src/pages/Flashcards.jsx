import { useState, useEffect } from 'react'
import api from '../services/api'
import AudioButton from '../components/AudioButton'
import { trackProgress } from '../services/progress'

export default function Flashcards() {
    const [flashcards, setFlashcards] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [hskLevel, setHskLevel] = useState(1)
    const [stats, setStats] = useState({ learned: 0, total: 0 })
    const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 })

    useEffect(() => {
        fetchFlashcards()
    }, [hskLevel])

    const fetchFlashcards = async () => {
        try {
            const response = await api.get(`/api/flashcards?hsk_level=${hskLevel}&limit=100`)
            setFlashcards(response.data)
            setCurrentIndex(0)
            setFlipped(false)
            setStats({
                total: response.data.length,
                learned: response.data.filter(f => f.repetitions > 2).length
            })
        } catch (error) {
            console.error('Ошибка загрузки:', error)
        }
    }

    const currentCard = flashcards[currentIndex]

    const handleAnswer = async (quality) => {
        // quality: 0 = снова, 1 = трудно, 3 = хорошо, 5 = легко

        if (currentCard) {
            try {
                await api.put(`/api/flashcards/${currentCard.id}`, { quality })
                trackProgress('flashcard', currentCard.id, quality >= 3)
            } catch (error) {
                console.error('Ошибка сохранения:', error)
            }
        }

        setSessionStats(prev => ({
            reviewed: prev.reviewed + 1,
            correct: prev.correct + (quality >= 3 ? 1 : 0)
        }))

        // Следующая карточка
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setFlipped(false)
        } else {
            // Сессия завершена
            fetchFlashcards()
        }
    }

    const getDifficultyColor = (quality) => {
        switch (quality) {
            case 0: return 'bg-red-600 hover:bg-red-700'
            case 1: return 'bg-orange-600 hover:bg-orange-700'
            case 3: return 'bg-green-600 hover:bg-green-700'
            case 5: return 'bg-blue-600 hover:bg-blue-700'
            default: return 'bg-dark-border'
        }
    }

    if (flashcards.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">🗂️ Флешкарты</h1>

                {/* HSK выбор */}
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map(level => (
                        <button
                            key={level}
                            onClick={() => setHskLevel(level)}
                            className={`btn ${hskLevel === level ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            HSK {level}
                        </button>
                    ))}
                </div>

                <div className="text-center py-12 text-dark-muted">
                    Нет флешкарт для HSK {hskLevel}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-2xl font-bold">🗂️ Флешкарты</h1>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-dark-muted">
                        Изучено: <span className="text-green-500 font-bold">{stats.learned}</span>/{stats.total}
                    </span>
                    <span className="text-dark-muted">
                        Сессия: <span className="text-primary-500 font-bold">{sessionStats.reviewed}</span>
                    </span>
                </div>
            </div>

            {/* HSK выбор */}
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map(level => (
                    <button
                        key={level}
                        onClick={() => setHskLevel(level)}
                        className={`btn ${hskLevel === level ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        HSK {level}
                    </button>
                ))}
            </div>

            {/* Прогресс */}
            <div className="progress-bar">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${(currentIndex / flashcards.length) * 100}%` }}
                />
            </div>

            {/* Карточка */}
            {currentCard && (
                <div
                    className={`flashcard cursor-pointer ${flipped ? 'flipped' : ''}`}
                    onClick={() => setFlipped(!flipped)}
                    style={{ height: '300px' }}
                >
                    <div className="flashcard-inner">
                        {/* Лицевая сторона */}
                        <div className="flashcard-front">
                            <div className="hanzi-large chinese-text text-primary-500">
                                {currentCard.front_zh}
                            </div>
                            <div className="text-dark-muted mt-4">Нажмите для ответа</div>
                        </div>

                        {/* Обратная сторона */}
                        <div className="flashcard-back">
                            <div className="text-center">
                                <div className="hanzi-medium chinese-text text-primary-500">
                                    {currentCard.front_zh}
                                </div>
                                <div className="pinyin text-xl mt-2">{currentCard.front_pinyin}</div>
                                <div className="text-xl mt-4">{currentCard.back_ru}</div>
                                <AudioButton
                                    text={currentCard.front_zh}
                                    audioSrc={currentCard.audio_mp3}
                                    size="lg"
                                    className="mt-4"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Кнопки оценки */}
            {flipped && (
                <div className="flex justify-center gap-3 animate-fade-in">
                    <button
                        onClick={() => handleAnswer(0)}
                        className={`btn ${getDifficultyColor(0)} text-white min-w-[100px]`}
                    >
                        Снова
                    </button>
                    <button
                        onClick={() => handleAnswer(1)}
                        className={`btn ${getDifficultyColor(1)} text-white min-w-[100px]`}
                    >
                        Трудно
                    </button>
                    <button
                        onClick={() => handleAnswer(3)}
                        className={`btn ${getDifficultyColor(3)} text-white min-w-[100px]`}
                    >
                        Хорошо
                    </button>
                    <button
                        onClick={() => handleAnswer(5)}
                        className={`btn ${getDifficultyColor(5)} text-white min-w-[100px]`}
                    >
                        Легко
                    </button>
                </div>
            )}

            {/* Информация о карточке */}
            {currentCard && (
                <div className="text-center text-sm text-dark-muted">
                    Карточка {currentIndex + 1} из {flashcards.length} •
                    Повторений: {currentCard.repetitions} •
                    Интервал: {currentCard.interval} дн.
                </div>
            )}

            {/* Инструкция */}
            <div className="card bg-dark-card/50 text-center">
                <h3 className="font-semibold mb-2">💡 Spaced Repetition (SM-2)</h3>
                <p className="text-sm text-dark-muted">
                    Оценивайте свои знания честно. Карточки, которые вы знаете хорошо,
                    будут показываться реже. Сложные карточки — чаще.
                </p>
            </div>
        </div>
    )
}
