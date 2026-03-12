import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import AudioButton from '../components/AudioButton'
import { trackProgress } from '../services/progress'
import { createLocalHanziWriterLoader, isMissingLocalHanziWriterData } from '../services/offlineAssets'

const WRITING_MODES = [
    { id: 'demo', label: 'Демонстрация' },
    { id: 'quiz', label: 'Тренировка' },
    { id: 'worksheet', label: 'Прописи' },
]

const WORKSHEET_CELLS = 16
const GUIDE_CELLS = 4

function buildWorksheetCells(char) {
    return Array.from({ length: WORKSHEET_CELLS }, (_, index) => ({
        id: `${char}-${index}`,
        guide: index < GUIDE_CELLS,
    }))
}

function normalizeSingleCharacter(value) {
    const first = Array.from((value || '').trim())[0]
    return first || ''
}

function createCustomCharacter(char) {
    return {
        id: `custom-${char}`,
        char,
        pinyin: '',
        pinyin_tone_numbers: '',
        meaning_ru: 'Пользовательский иероглиф (stroke order из HanziWriter)',
        audio_mp3: '',
        stroke_count: 0,
        radical: '',
    }
}

export default function Writing() {
    const { char } = useParams()
    const navigate = useNavigate()
    const [characters, setCharacters] = useState([])
    const [selectedChar, setSelectedChar] = useState(null)
    const [hskFilter, setHskFilter] = useState(1)
    const [mode, setMode] = useState('quiz')
    const [streak, setStreak] = useState(0)
    const [lastAccuracy, setLastAccuracy] = useState(null)
    const [lastMistakes, setLastMistakes] = useState(0)
    const [sessionScore, setSessionScore] = useState({ passed: 0, attempts: 0 })
    const [isLoadingWriter, setIsLoadingWriter] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const [manualChar, setManualChar] = useState('')
    const [writerError, setWriterError] = useState('')
    const writerRef = useRef(null)
    const writerInstanceRef = useRef(null)

    const worksheetCells = useMemo(
        () => buildWorksheetCells(selectedChar?.char || '字'),
        [selectedChar?.char]
    )

    useEffect(() => {
        fetchCharacters()
    }, [hskFilter])

    useEffect(() => {
        if (char) {
            fetchCharacterDetails(char)
        } else if (characters.length > 0 && !selectedChar) {
            setSelectedChar(characters[0])
        }
    }, [char, characters])

    useEffect(() => {
        if (!selectedChar || !writerRef.current || mode === 'worksheet') {
            destroyWriter()
            return
        }
        initWriter(mode)
    }, [selectedChar, mode])

    useEffect(() => () => destroyWriter(), [])

    const fetchCharacters = async () => {
        try {
            const response = await api.get(`/api/characters?hsk_level=${hskFilter}&limit=80`)
            setCharacters(response.data)
        } catch (error) {
            console.error('Ошибка загрузки иероглифов:', error)
        }
    }

    const fetchCharacterDetails = async (character) => {
        const normalizedChar = normalizeSingleCharacter(character)
        if (!normalizedChar) {
            return
        }
        try {
            const response = await api.get(`/api/characters/${encodeURIComponent(normalizedChar)}`)
            setSelectedChar(response.data)
            setManualChar(normalizedChar)
        } catch (error) {
            setSelectedChar(createCustomCharacter(normalizedChar))
            setManualChar(normalizedChar)
        }
    }

    const openManualCharacter = () => {
        const normalizedChar = normalizeSingleCharacter(manualChar)
        if (!normalizedChar) {
            return
        }
        navigate(`/письмо/${encodeURIComponent(normalizedChar)}`)
    }

    const destroyWriter = () => {
        if (writerInstanceRef.current) {
            try {
                writerInstanceRef.current.cancelQuiz()
            } catch {
                // ignore
            }
            writerInstanceRef.current = null
        }
        if (writerRef.current) {
            writerRef.current.innerHTML = ''
        }
    }

    const createQuizSession = () => {
        const writer = writerInstanceRef.current
        if (!writer || !selectedChar) return

        writer.quiz({
            onComplete: async (summaryData = {}) => {
                const totalMistakes = summaryData.totalMistakes ?? 0
                const totalStrokes = Math.max(selectedChar.stroke_count || 0, 1)
                const acc = Math.max(0, Math.round((1 - totalMistakes / (totalStrokes * 2)) * 100))
                const passed = acc >= 75

                setLastAccuracy(acc)
                setLastMistakes(totalMistakes)
                setSessionScore((prev) => ({
                    passed: prev.passed + (passed ? 1 : 0),
                    attempts: prev.attempts + 1,
                }))

                await trackProgress('character', selectedChar.char, passed)

                if (passed) {
                    setStreak((prev) => prev + 1)
                } else {
                    setStreak(0)
                }
            },
        })
    }

    const initWriter = async (writerMode) => {
        if (!selectedChar || !writerRef.current) return

        setIsLoadingWriter(true)
        setIsAnimating(false)
        setWriterError('')
        destroyWriter()

        try {
            const HanziWriter = (await import('hanzi-writer')).default
            const isQuiz = writerMode === 'quiz'

            const writer = HanziWriter.create(writerRef.current, selectedChar.char, {
                charDataLoader: createLocalHanziWriterLoader(),
                width: 340,
                height: 340,
                padding: 24,
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 250,
                showOutline: true,
                showCharacter: !isQuiz,
                strokeColor: '#ef4444',
                radicalColor: '#f59e0b',
                outlineColor: '#334155',
                drawingColor: '#22c55e',
                highlightColor: '#f59e0b',
                drawingWidth: 18,
                showHintAfterMisses: 2,
                highlightOnComplete: true,
            })

            writerInstanceRef.current = writer

            if (isQuiz) {
                createQuizSession()
            }
        } catch (error) {
            if (isMissingLocalHanziWriterData(error)) {
                setWriterError('Для этого иероглифа не добавлен локальный stroke-order JSON в frontend/public/hanzi-writer-data.')
            } else {
                setWriterError('Локальный модуль письма не удалось запустить.')
            }
            console.error('Ошибка инициализации письма:', error)
        } finally {
            setIsLoadingWriter(false)
        }
    }

    const runAnimation = () => {
        const writer = writerInstanceRef.current
        if (!writer || isAnimating) return

        setIsAnimating(true)

        try {
            if (mode === 'quiz') {
                writer.cancelQuiz()
            }

            writer.animateCharacter({
                onComplete: () => {
                    setIsAnimating(false)
                    if (mode === 'quiz') {
                        createQuizSession()
                    }
                },
            })
        } catch (error) {
            setIsAnimating(false)
            console.error('Ошибка анимации штрихов:', error)
        }
    }

    const revealCharacter = () => {
        const writer = writerInstanceRef.current
        if (!writer) return

        writer.showCharacter()

        if (mode === 'quiz') {
            window.setTimeout(() => {
                writer.hideCharacter()
            }, 1500)
        }
    }

    const showOutlineHint = () => {
        const writer = writerInstanceRef.current
        if (!writer) return

        writer.showOutline()
        window.setTimeout(() => writer.hideOutline(), 1500)
    }

    const resetCurrent = () => {
        setLastAccuracy(null)
        setLastMistakes(0)
        initWriter(mode)
    }

    const goNextCharacter = () => {
        if (!selectedChar || characters.length === 0) return

        const currentIndex = characters.findIndex((item) => item.char === selectedChar.char)
        const safeIndex = currentIndex < 0 ? 0 : currentIndex
        const nextIndex = (safeIndex + 1) % characters.length

        setSelectedChar(characters[nextIndex])
        setLastAccuracy(null)
        setLastMistakes(0)
    }

    const changeMode = (nextMode) => {
        setMode(nextMode)
        setLastAccuracy(null)
        setLastMistakes(0)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-bold">Практика письма</h1>
                <div className="flex items-center gap-4 text-sm">
                    <div>
                        Серия: <span className="text-yellow-400 font-semibold">{streak}</span>
                    </div>
                    <div>
                        Сессия: <span className="text-green-400 font-semibold">{sessionScore.passed}</span>/{sessionScore.attempts}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map((level) => (
                    <button
                        key={level}
                        onClick={() => {
                            setHskFilter(level)
                            setSelectedChar(null)
                        }}
                        className={`btn ${hskFilter === level ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        HSK {level}
                    </button>
                ))}
            </div>
            <div className="card">
                <div className="text-sm text-dark-muted mb-2">
                    Любой иероглиф для тренировки (например, 哥)
                </div>
                <div className="flex gap-2 flex-wrap">
                    <input
                        value={manualChar}
                        onChange={(event) => setManualChar(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                openManualCharacter()
                            }
                        }}
                        placeholder="Введите 1 иероглиф"
                        className="input flex-1 min-w-[220px]"
                        maxLength={2}
                    />
                    <button onClick={openManualCharacter} className="btn btn-primary">
                        Открыть
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 space-y-4">
                    <div className="card strokeorder-board space-y-4">
                        {selectedChar && (
                            <>
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <div className="text-xs uppercase tracking-wide text-dark-muted">Символ</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="hanzi-medium chinese-text text-primary-500">{selectedChar.char}</span>
                                            <div>
                                                <div className="pinyin text-lg">{selectedChar.pinyin || '—'}</div>
                                                <div className="text-xs text-dark-muted">{selectedChar.pinyin_tone_numbers || '—'}</div>
                                            </div>
                                            {(selectedChar.pinyin_tone_numbers || selectedChar.audio_mp3) && (
                                                <AudioButton
                                                    text={selectedChar.char}
                                                    pinyin={selectedChar.pinyin_tone_numbers}
                                                    audioSrc={selectedChar.audio_mp3}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm text-dark-muted">
                                        Штрихов: <span className="text-dark-text font-semibold">{selectedChar.stroke_count || '?'}</span>
                                        {' · '}
                                        Радикал: <span className="text-dark-text font-semibold">{selectedChar.radical || '—'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {WRITING_MODES.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => changeMode(item.id)}
                                            className={`btn ${mode === item.id ? 'btn-primary' : 'btn-secondary'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>

                                {mode === 'worksheet' ? (
                                    <div className="space-y-4">
                                        <div className="text-sm text-dark-muted">
                                            Лист прописей в формате 田字格: первые клетки с образцом, остальные для самостоятельной тренировки.
                                        </div>
                                        <div className="worksheet-grid">
                                            {worksheetCells.map((cell) => (
                                                <div key={cell.id} className={`tianzi-cell ${cell.guide ? 'guide' : ''}`}>
                                                    <span className="chinese-text">{cell.guide ? selectedChar.char : ''}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end">
                                            <button onClick={() => window.print()} className="btn btn-primary">
                                                Печать листа
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-center">
                                            <div
                                                ref={writerRef}
                                                className="writing-canvas"
                                                style={{ width: 340, height: 340 }}
                                            />
                                        </div>

                                        {isLoadingWriter && (
                                            <div className="text-center text-sm text-dark-muted">Загрузка анимации штрихов...</div>
                                        )}

                                        {writerError && (
                                            <div className="mx-auto max-w-[420px] rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
                                                {writerError}
                                            </div>
                                        )}

                                        <div className="flex justify-center gap-2 flex-wrap">
                                            <button onClick={runAnimation} className="btn btn-secondary" disabled={isAnimating}>
                                                {isAnimating ? 'Идет анимация...' : 'Показать порядок'}
                                            </button>
                                            <button onClick={revealCharacter} className="btn btn-secondary">
                                                Показать иероглиф
                                            </button>
                                            <button onClick={showOutlineHint} className="btn btn-secondary">
                                                Контур
                                            </button>
                                            <button onClick={resetCurrent} className="btn btn-secondary">
                                                Сбросить
                                            </button>
                                            <button onClick={goNextCharacter} className="btn btn-primary">
                                                Следующий
                                            </button>
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
                                        <div className="text-xs text-dark-muted mb-1">Точность</div>
                                        <div className={`text-2xl font-bold ${lastAccuracy === null ? 'text-dark-muted' : lastAccuracy >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                                            {lastAccuracy === null ? '—' : `${lastAccuracy}%`}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
                                        <div className="text-xs text-dark-muted mb-1">Ошибки</div>
                                        <div className="text-2xl font-bold">{lastAccuracy === null ? '—' : lastMistakes}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
                                        <div className="text-xs text-dark-muted mb-1">Значение</div>
                                        <div className="text-base">{selectedChar.meaning_ru || '—'}</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="card max-h-[760px] overflow-y-auto">
                    <h3 className="font-semibold mb-3">Иероглифы HSK {hskFilter}</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {characters.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedChar(item)}
                                className={`p-2 rounded-lg text-center transition-all ${selectedChar?.char === item.char
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-dark-border hover:bg-dark-border/80'
                                    }`}
                                title={item.meaning_ru}
                            >
                                <span className="chinese-text text-xl">{item.char}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card bg-dark-card/50">
                <h3 className="font-semibold mb-2">Как тренироваться</h3>
                <ul className="text-sm text-dark-muted space-y-1">
                    <li>• Режим "Демонстрация" показывает порядок штрихов как в stroke-order словарях.</li>
                    <li>• Режим "Тренировка" проверяет направление и последовательность штрихов.</li>
                    <li>• Режим "Прописи" дает лист 田字格 для повторения и печати.</li>
                    <li>• Цель тренировки: стабильная точность 75% и выше.</li>
                </ul>
            </div>
        </div>
    )
}
