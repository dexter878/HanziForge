import { useState, useEffect } from 'react'
import api from '../services/api'
import AudioButton from '../components/AudioButton'
import { trackProgress } from '../services/progress'

const EXERCISE_TYPES = [
    { id: 'cloze', name: 'Заполни пропуск', icon: '📝' },
    { id: 'order', name: 'Расставь слова', icon: '🔀' },
    { id: 'choice', name: 'Выбери перевод', icon: '✅' },
]

export default function Exercises() {
    const [exerciseType, setExerciseType] = useState('cloze')
    const [sentences, setSentences] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userAnswer, setUserAnswer] = useState('')
    const [shuffledWords, setShuffledWords] = useState([])
    const [selectedOrder, setSelectedOrder] = useState([])
    const [result, setResult] = useState(null)
    const [score, setScore] = useState({ correct: 0, total: 0 })
    const [hskLevel, setHskLevel] = useState(1)

    useEffect(() => {
        fetchSentences()
    }, [hskLevel])

    useEffect(() => {
        if (sentences.length > 0) {
            prepareExercise()
        }
    }, [currentIndex, exerciseType, sentences])

    const fetchSentences = async () => {
        try {
            const response = await api.get(`/api/sentences/random?count=20&hsk_level=${hskLevel}`)
            setSentences(response.data)
            setCurrentIndex(0)
            setScore({ correct: 0, total: 0 })
        } catch (error) {
            console.error('Ошибка загрузки:', error)
        }
    }

    const prepareExercise = () => {
        const sentence = sentences[currentIndex]
        if (!sentence) return

        setResult(null)
        setUserAnswer('')
        setSelectedOrder([])

        if (exerciseType === 'order') {
            // Разбиваем на слова и перемешиваем
            const words = sentence.text_zh.replace(/[。？！，、]/g, '').split('')
            const shuffled = [...words].sort(() => Math.random() - 0.5)
            setShuffledWords(shuffled)
        }
    }

    const currentSentence = sentences[currentIndex]

    const checkAnswer = () => {
        if (!currentSentence) return

        let isCorrect = false

        if (exerciseType === 'cloze') {
            // Проверка cloze теста
            const expected = currentSentence.text_zh.replace(/[。？！]/g, '')
            isCorrect = userAnswer.trim() === expected
        } else if (exerciseType === 'order') {
            // Проверка порядка слов
            const userText = selectedOrder.join('')
            const expected = currentSentence.text_zh.replace(/[。？！，、]/g, '')
            isCorrect = userText === expected
        } else if (exerciseType === 'choice') {
            // Проверка выбора (userAnswer содержит индекс)
            isCorrect = userAnswer === currentSentence.translation_ru
        }

        setResult(isCorrect ? 'correct' : 'incorrect')
        setScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
        }))
        trackProgress('sentence', currentSentence.id, isCorrect)
    }

    const nextExercise = () => {
        if (currentIndex < sentences.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            fetchSentences()
        }
    }

    const handleWordClick = (word, index) => {
        if (selectedOrder.includes(word + index)) return
        setSelectedOrder(prev => [...prev, word])
        setShuffledWords(prev => prev.filter((_, i) => i !== index))
    }

    const removeWord = (index) => {
        const word = selectedOrder[index]
        setSelectedOrder(prev => prev.filter((_, i) => i !== index))
        setShuffledWords(prev => [...prev, word])
    }

    const generateChoices = () => {
        if (!currentSentence) return []

        // Генерируем 3 неправильных варианта + 1 правильный
        const wrongAnswers = [
            'Неправильный перевод 1',
            'Неправильный перевод 2',
            'Неправильный перевод 3',
        ]

        // Берём переводы из других предложений
        const otherTranslations = sentences
            .filter(s => s.id !== currentSentence.id)
            .map(s => s.translation_ru)
            .slice(0, 3)

        const choices = [...otherTranslations, currentSentence.translation_ru]
            .sort(() => Math.random() - 0.5)

        return choices.length >= 4 ? choices.slice(0, 4) : [...choices, ...wrongAnswers].slice(0, 4)
    }

    if (!currentSentence) {
        return (
            <div className="text-center py-12">
                <div className="text-dark-muted">Загрузка упражнений...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-2xl font-bold">🧠 Упражнения</h1>
                <div className="flex items-center gap-4">
                    <span className="text-dark-muted">
                        Счёт: <span className="text-green-500 font-bold">{score.correct}</span>/
                        <span className="text-dark-text">{score.total}</span>
                    </span>
                </div>
            </div>

            {/* Выбор типа упражнения */}
            <div className="flex gap-2 flex-wrap">
                {EXERCISE_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => { setExerciseType(type.id); prepareExercise(); }}
                        className={`btn ${exerciseType === type.id ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        {type.icon} {type.name}
                    </button>
                ))}
            </div>

            {/* HSK фильтр */}
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map(level => (
                    <button
                        key={level}
                        onClick={() => setHskLevel(level)}
                        className={`btn btn-sm ${hskLevel === level ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        HSK {level}
                    </button>
                ))}
            </div>

            {/* Упражнение */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-dark-muted">
                        Упражнение {currentIndex + 1} из {sentences.length}
                    </span>
                    <AudioButton
                        text={currentSentence.text_zh}
                        audioSrc={currentSentence.audio_mp3}
                    />
                </div>

                {/* Cloze тест */}
                {exerciseType === 'cloze' && (
                    <div className="space-y-4">
                        <div className="text-lg">
                            <span className="text-dark-muted">Перевод: </span>
                            {currentSentence.translation_ru}
                        </div>
                        <div className="text-sm text-dark-muted">
                            Пиньинь: {currentSentence.pinyin}
                        </div>
                        <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Напишите предложение на китайском..."
                            className="input chinese-text text-xl"
                            disabled={result !== null}
                        />
                    </div>
                )}

                {/* Порядок слов */}
                {exerciseType === 'order' && (
                    <div className="space-y-4">
                        <div className="text-lg">
                            <span className="text-dark-muted">Перевод: </span>
                            {currentSentence.translation_ru}
                        </div>

                        {/* Выбранные слова */}
                        <div className="min-h-[60px] p-4 bg-dark-bg rounded-lg border-2 border-dashed border-dark-border flex flex-wrap gap-2">
                            {selectedOrder.length === 0 ? (
                                <span className="text-dark-muted">Нажимайте на иероглифы в правильном порядке</span>
                            ) : (
                                selectedOrder.map((word, index) => (
                                    <button
                                        key={index}
                                        onClick={() => removeWord(index)}
                                        className="px-3 py-2 bg-primary-600 text-white rounded-lg chinese-text text-xl hover:bg-primary-700"
                                        disabled={result !== null}
                                    >
                                        {word}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Доступные слова */}
                        <div className="flex flex-wrap gap-2">
                            {shuffledWords.map((word, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleWordClick(word, index)}
                                    className="px-3 py-2 bg-dark-border hover:bg-dark-border/80 rounded-lg chinese-text text-xl"
                                    disabled={result !== null}
                                >
                                    {word}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Множественный выбор */}
                {exerciseType === 'choice' && (
                    <div className="space-y-4">
                        <div className="text-2xl chinese-text text-center py-4">
                            {currentSentence.text_zh}
                        </div>
                        <div className="text-sm text-dark-muted text-center">
                            {currentSentence.pinyin}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {generateChoices().map((choice, index) => (
                                <button
                                    key={index}
                                    onClick={() => setUserAnswer(choice)}
                                    className={`p-4 rounded-lg text-left transition-all ${userAnswer === choice
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-dark-border hover:bg-dark-border/80'
                                        } ${result && choice === currentSentence.translation_ru
                                            ? 'ring-2 ring-green-500'
                                            : ''
                                        }`}
                                    disabled={result !== null}
                                >
                                    {choice}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Результат */}
                {result && (
                    <div className={`mt-4 p-4 rounded-lg ${result === 'correct' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {result === 'correct' ? '✅ Правильно!' : '❌ Неправильно'}
                        {result === 'incorrect' && (
                            <div className="mt-2 text-dark-text">
                                Правильный ответ: <span className="chinese-text">{currentSentence.text_zh}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Кнопки */}
                <div className="flex justify-end gap-3 mt-6">
                    {result === null ? (
                        <button onClick={checkAnswer} className="btn btn-primary">
                            ✓ Проверить
                        </button>
                    ) : (
                        <button onClick={nextExercise} className="btn btn-primary">
                            ➡️ Далее
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
