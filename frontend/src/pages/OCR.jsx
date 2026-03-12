import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import AudioButton from '../components/AudioButton'
import { getLocalTesseractOptions } from '../services/offlineAssets'

export default function OCR() {
    const [image, setImage] = useState(null)
    const [recognizedChars, setRecognizedChars] = useState([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)
    const dropzoneRef = useRef(null)

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            processFile(file)
        }
    }

    const processFile = (file) => {
        if (!file.type.startsWith('image/')) {
            setError('Пожалуйста, выберите изображение')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            setImage(e.target.result)
            setError(null)
            recognizeText(e.target.result)
        }
        reader.readAsDataURL(file)
    }

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()

        const file = e.dataTransfer.files[0]
        if (file) {
            processFile(file)
        }
    }, [])

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const recognizeText = async (imageSrc) => {
        setIsProcessing(true)
        setRecognizedChars([])

        try {
            // Динамический импорт Tesseract.js
            const Tesseract = await import('tesseract.js')
            const tesseractOptions = await getLocalTesseractOptions('chi_sim')

            if (!tesseractOptions) {
                setError('Локальная OCR-модель chi_sim не найдена. Добавьте файл chi_sim.traineddata(.gz) в frontend/public/tesseract/lang.')
                return
            }

            const result = await Tesseract.recognize(imageSrc, 'chi_sim', {
                ...tesseractOptions,
                logger: m => {
                    if (m.status === 'recognizing text') {
                        // Можно показать прогресс
                    }
                }
            })

            // Извлекаем китайские символы
            const text = result.data.text
            const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []

            // Создаём уникальный список
            const uniqueChars = [...new Set(chineseChars)]

            setRecognizedChars(uniqueChars.map(char => ({
                char,
                pinyin: '...',
                meaning: '...'
            })))

            // Пытаемся получить информацию о каждом символе
            for (let i = 0; i < uniqueChars.length && i < 20; i++) {
                try {
                    const response = await fetch(`/api/characters/${encodeURIComponent(uniqueChars[i])}`)
                    if (response.ok) {
                        const data = await response.json()
                        setRecognizedChars(prev => prev.map(item =>
                            item.char === uniqueChars[i]
                                ? { ...item, pinyin: data.pinyin, meaning: data.meaning_ru, audio: data.audio_mp3 }
                                : item
                        ))
                    }
                } catch (e) {
                    // Символ не найден в базе
                }
            }

        } catch (err) {
            console.error('OCR ошибка:', err)
            setError('Ошибка распознавания. Попробуйте другое изображение.')
        } finally {
            setIsProcessing(false)
        }
    }

    const clearImage = () => {
        setImage(null)
        setRecognizedChars([])
        setError(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">📷 OCR Распознавание</h1>
            </div>

            {/* Зона загрузки */}
            {!image && (
                <div
                    ref={dropzoneRef}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="card border-2 border-dashed border-dark-border hover:border-primary-500 cursor-pointer transition-all"
                >
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📸</div>
                        <h3 className="text-xl font-semibold mb-2">Загрузите изображение</h3>
                        <p className="text-dark-muted">
                            Перетащите файл сюда или нажмите для выбора
                        </p>
                        <p className="text-sm text-dark-muted mt-2">
                            Поддерживаются: JPG, PNG, GIF
                        </p>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Ошибка */}
            {error && (
                <div className="card bg-red-500/20 border-red-500/50 text-red-400">
                    {error}
                </div>
            )}

            {/* Превью изображения */}
            {image && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Загруженное изображение</h3>
                        <button onClick={clearImage} className="btn btn-ghost">
                            ✕ Удалить
                        </button>
                    </div>
                    <img
                        src={image}
                        alt="Uploaded"
                        className="max-w-full max-h-[400px] mx-auto rounded-lg"
                    />
                </div>
            )}

            {/* Индикатор обработки */}
            {isProcessing && (
                <div className="card text-center">
                    <div className="animate-pulse">
                        <div className="text-4xl mb-4">🔍</div>
                        <div className="text-lg">Распознавание текста...</div>
                        <div className="text-sm text-dark-muted mt-2">
                            Это может занять несколько секунд
                        </div>
                    </div>
                </div>
            )}

            {/* Результаты */}
            {recognizedChars.length > 0 && (
                <div className="card">
                    <h3 className="font-semibold mb-4">
                        Распознано иероглифов: {recognizedChars.length}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {recognizedChars.map((item, index) => (
                            <Link
                                key={index}
                                to={`/словарь/${item.char}`}
                                className="card hover:scale-105 transition-transform text-center"
                            >
                                <div className="hanzi-medium chinese-text text-primary-500">
                                    {item.char}
                                </div>
                                <div className="pinyin">{item.pinyin}</div>
                                <div className="text-sm text-dark-muted truncate">{item.meaning}</div>
                                {item.audio && (
                                    <AudioButton
                                        text={item.char}
                                        audioSrc={item.audio}
                                        size="sm"
                                        className="mx-auto mt-2"
                                    />
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Инструкция */}
            <div className="card bg-dark-card/50">
                <h3 className="font-semibold mb-2">💡 Советы для лучшего распознавания</h3>
                <ul className="text-sm text-dark-muted space-y-1">
                    <li>• Используйте чёткие изображения с хорошим освещением</li>
                    <li>• Избегайте размытых или искажённых текстов</li>
                    <li>• Лучше всего работает с печатным текстом</li>
                    <li>• Рукописный текст может распознаваться хуже</li>
                </ul>
            </div>
        </div>
    )
}
