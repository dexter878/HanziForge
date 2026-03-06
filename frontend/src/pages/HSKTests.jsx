import { useState, useEffect } from 'react'
import api from '../services/api'
import AudioButton from '../components/AudioButton'
import { trackProgress } from '../services/progress'

export default function HSKTests() {
    const [tests, setTests] = useState([])
    const [currentTest, setCurrentTest] = useState(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [showResult, setShowResult] = useState(false)
    const [score, setScore] = useState({ correct: 0, total: 0 })
    const [hskLevel, setHskLevel] = useState(1)
    const [testType, setTestType] = useState(null)
    const [testStarted, setTestStarted] = useState(false)

    useEffect(() => {
        if (testStarted) {
            fetchTests()
        }
    }, [hskLevel, testType, testStarted])

    const fetchTests = async () => {
        try {
            const params = new URLSearchParams()
            params.append('level', hskLevel)
            if (testType) params.append('test_type', testType)
            params.append('limit', '10')

            const response = await api.get(`/api/tests?${params}`)
            setTests(response.data)
            setCurrentIndex(0)
            setCurrentTest(response.data[0])
            setScore({ correct: 0, total: 0 })
        } catch (error) {
            console.error('Ошибка загрузки тестов:', error)
        }
    }

    const startTest = () => {
        setTestStarted(true)
        setScore({ correct: 0, total: 0 })
    }

    const checkAnswer = () => {
        if (!currentTest || selectedAnswer === null) return

        const options = JSON.parse(currentTest.options_json)
        const isCorrect = options[selectedAnswer] === currentTest.answer

        setShowResult(true)
        setScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
        }))
        trackProgress('test', currentTest.id, isCorrect)
    }

    const nextQuestion = () => {
        setSelectedAnswer(null)
        setShowResult(false)

        if (currentIndex < tests.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setCurrentTest(tests[currentIndex + 1])
        } else {
            // Тест завершён
            setTestStarted(false)
        }
    }

    const getOptions = () => {
        if (!currentTest) return []
        try {
            return JSON.parse(currentTest.options_json)
        } catch {
            return []
        }
    }

    // Экран выбора теста
    if (!testStarted) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">📝 Тесты HSK</h1>

                {score.total > 0 && (
                    <div className="card bg-gradient-to-r from-primary-600/20 to-primary-800/20 text-center">
                        <h2 className="text-xl font-bold mb-2">Результат теста</h2>
                        <div className="text-4xl font-bold">
                            <span className="text-green-500">{score.correct}</span>
                            <span className="text-dark-muted"> / </span>
                            <span>{score.total}</span>
                        </div>
                        <div className="text-lg mt-2">
                            {Math.round(score.correct / score.total * 100)}% правильных ответов
                        </div>
                    </div>
                )}

                {/* Выбор уровня */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Выберите уровень HSK</h2>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {[1, 2, 3, 4, 5, 6].map(level => (
                            <button
                                key={level}
                                onClick={() => setHskLevel(level)}
                                className={`p-4 rounded-xl text-center transition-all ${hskLevel === level
                                        ? 'bg-primary-600 text-white scale-105'
                                        : 'bg-dark-border hover:bg-dark-border/80'
                                    }`}
                            >
                                <div className="text-2xl font-bold">HSK {level}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Выбор типа теста */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Выберите тип теста</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={() => { setTestType('listening'); startTest(); }}
                            className="p-6 bg-dark-border hover:bg-primary-600/20 rounded-xl text-center transition-all"
                        >
                            <div className="text-4xl mb-2">🎧</div>
                            <div className="text-lg font-semibold">Слушание</div>
                            <div className="text-sm text-dark-muted">Аудио вопросы</div>
                        </button>
                        <button
                            onClick={() => { setTestType('reading'); startTest(); }}
                            className="p-6 bg-dark-border hover:bg-primary-600/20 rounded-xl text-center transition-all"
                        >
                            <div className="text-4xl mb-2">📖</div>
                            <div className="text-lg font-semibold">Чтение</div>
                            <div className="text-sm text-dark-muted">Текстовые вопросы</div>
                        </button>
                        <button
                            onClick={() => { setTestType(null); startTest(); }}
                            className="p-6 bg-dark-border hover:bg-primary-600/20 rounded-xl text-center transition-all"
                        >
                            <div className="text-4xl mb-2">📝</div>
                            <div className="text-lg font-semibold">Смешанный</div>
                            <div className="text-sm text-dark-muted">Все типы вопросов</div>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Тест
    if (!currentTest) {
        return <div className="text-center py-12 text-dark-muted">Загрузка теста...</div>
    }

    const options = getOptions()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">📝 HSK {hskLevel} Тест</h1>
                <div className="flex items-center gap-4">
                    <span className="text-dark-muted">
                        Вопрос {currentIndex + 1} из {tests.length}
                    </span>
                    <span className="text-green-500 font-bold">{score.correct}/{score.total}</span>
                </div>
            </div>

            {/* Прогресс */}
            <div className="progress-bar">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${(currentIndex / tests.length) * 100}%` }}
                />
            </div>

            <div className="card">
                {/* Тип теста */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="badge bg-primary-500/20 text-primary-400">
                        {currentTest.test_type === 'listening' ? '🎧 Слушание' :
                            currentTest.test_type === 'reading' ? '📖 Чтение' : '✍️ Письмо'}
                    </span>
                </div>

                {/* Вопрос */}
                <div className="text-center py-6">
                    <div className="text-2xl chinese-text mb-4">{currentTest.question_zh}</div>
                    {currentTest.test_type === 'listening' && (
                        <AudioButton
                            text={currentTest.question_zh}
                            audioSrc={currentTest.audio_mp3}
                            size="lg"
                        />
                    )}
                </div>

                {/* Варианты ответов */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                    {options.map((option, index) => {
                        let buttonClass = 'bg-dark-border hover:bg-dark-border/80'

                        if (selectedAnswer === index && !showResult) {
                            buttonClass = 'bg-primary-600 text-white'
                        }

                        if (showResult) {
                            if (option === currentTest.answer) {
                                buttonClass = 'bg-green-600 text-white'
                            } else if (selectedAnswer === index) {
                                buttonClass = 'bg-red-600 text-white'
                            }
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => !showResult && setSelectedAnswer(index)}
                                className={`p-4 rounded-lg text-left transition-all ${buttonClass}`}
                                disabled={showResult}
                            >
                                <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                                {option}
                            </button>
                        )
                    })}
                </div>

                {/* Объяснение */}
                {showResult && currentTest.explanation_ru && (
                    <div className="mt-4 p-4 bg-dark-bg rounded-lg">
                        <div className="text-sm text-dark-muted">Объяснение:</div>
                        <div>{currentTest.explanation_ru}</div>
                    </div>
                )}

                {/* Кнопки */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={() => setTestStarted(false)}
                        className="btn btn-ghost"
                    >
                        ← Выход
                    </button>
                    {!showResult ? (
                        <button
                            onClick={checkAnswer}
                            className="btn btn-primary"
                            disabled={selectedAnswer === null}
                        >
                            Проверить
                        </button>
                    ) : (
                        <button onClick={nextQuestion} className="btn btn-primary">
                            {currentIndex < tests.length - 1 ? 'Далее →' : 'Завершить'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
