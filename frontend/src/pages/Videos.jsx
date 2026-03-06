import { useState } from 'react'
import AudioButton from '../components/AudioButton'

// Временные данные для видео (в реальном приложении загружались бы из API)
const SAMPLE_VIDEOS = [
    {
        id: 1,
        title: 'HSK1 Урок 1: Приветствия',
        level: 1,
        duration: '5:30',
        thumbnail: '🎬',
        subtitles: [
            { time: 0, zh: '你好！', pinyin: 'nǐ hǎo!', ru: 'Привет!' },
            { time: 3, zh: '你好吗？', pinyin: 'nǐ hǎo ma?', ru: 'Как дела?' },
            { time: 6, zh: '我很好。', pinyin: 'wǒ hěn hǎo.', ru: 'У меня всё хорошо.' },
            { time: 9, zh: '谢谢！', pinyin: 'xiè xiè!', ru: 'Спасибо!' },
            { time: 12, zh: '再见！', pinyin: 'zài jiàn!', ru: 'До свидания!' },
        ]
    },
    {
        id: 2,
        title: 'HSK1 Урок 2: Знакомство',
        level: 1,
        duration: '7:15',
        thumbnail: '🎬',
        subtitles: [
            { time: 0, zh: '你叫什么名字？', pinyin: 'nǐ jiào shén me míng zì?', ru: 'Как тебя зовут?' },
            { time: 4, zh: '我叫李明。', pinyin: 'wǒ jiào lǐ míng.', ru: 'Меня зовут Ли Мин.' },
            { time: 8, zh: '你是哪国人？', pinyin: 'nǐ shì nǎ guó rén?', ru: 'Откуда ты?' },
            { time: 12, zh: '我是俄罗斯人。', pinyin: 'wǒ shì é luó sī rén.', ru: 'Я из России.' },
        ]
    },
    {
        id: 3,
        title: 'HSK2 Урок 1: В ресторане',
        level: 2,
        duration: '8:45',
        thumbnail: '🎬',
        subtitles: [
            { time: 0, zh: '欢迎光临！', pinyin: 'huān yíng guāng lín!', ru: 'Добро пожаловать!' },
            { time: 3, zh: '请问要点什么？', pinyin: 'qǐng wèn yào diǎn shén me?', ru: 'Что будете заказывать?' },
            { time: 7, zh: '我想吃宫保鸡丁。', pinyin: 'wǒ xiǎng chī gōng bǎo jī dīng.', ru: 'Хочу курицу гунбао.' },
        ]
    },
]

export default function Videos() {
    const [selectedVideo, setSelectedVideo] = useState(null)
    const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0)
    const [hskFilter, setHskFilter] = useState(null)

    const filteredVideos = SAMPLE_VIDEOS.filter(v =>
        hskFilter === null || v.level === hskFilter
    )

    const handleSubtitleClick = (subtitle) => {
        // Воспроизвести аудио для субтитра
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(subtitle.zh)
            utterance.lang = 'zh-CN'
            utterance.rate = 0.8
            window.speechSynthesis.speak(utterance)
        }
    }

    // Список видео
    if (!selectedVideo) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">🎥 Видео уроки</h1>

                {/* HSK фильтр */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setHskFilter(null)}
                        className={`btn ${hskFilter === null ? 'btn-primary' : 'btn-ghost'}`}
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

                {/* Список видео */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVideos.map(video => (
                        <div
                            key={video.id}
                            onClick={() => setSelectedVideo(video)}
                            className="card cursor-pointer hover:scale-105 transition-transform"
                        >
                            <div className="aspect-video bg-dark-border rounded-lg flex items-center justify-center text-6xl mb-3">
                                {video.thumbnail}
                            </div>
                            <h3 className="font-semibold">{video.title}</h3>
                            <div className="flex items-center gap-3 mt-2 text-sm text-dark-muted">
                                <span className={`badge badge-hsk${video.level}`}>HSK {video.level}</span>
                                <span>⏱️ {video.duration}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredVideos.length === 0 && (
                    <div className="text-center py-12 text-dark-muted">
                        Видео не найдены для выбранного уровня
                    </div>
                )}

                {/* Информация */}
                <div className="card bg-dark-card/50 text-center">
                    <p className="text-dark-muted">
                        💡 Нажмите на любой субтитр, чтобы услышать произношение и перейти в словарь
                    </p>
                </div>
            </div>
        )
    }

    // Просмотр видео
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSelectedVideo(null)}
                    className="btn btn-ghost"
                >
                    ← Назад
                </button>
                <h1 className="text-xl font-bold">{selectedVideo.title}</h1>
            </div>

            {/* Видео плеер */}
            <div className="card">
                <div className="aspect-video bg-dark-border rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-8xl mb-4">🎬</div>
                        <p className="text-dark-muted">
                            Видео плеер (демо-версия)
                        </p>
                        <p className="text-sm text-dark-muted mt-2">
                            В полной версии здесь будет видео с интерактивными субтитрами
                        </p>
                    </div>
                </div>
            </div>

            {/* Субтитры */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">📝 Интерактивные субтитры</h2>
                <div className="space-y-3">
                    {selectedVideo.subtitles.map((subtitle, index) => (
                        <div
                            key={index}
                            onClick={() => handleSubtitleClick(subtitle)}
                            className={`p-4 rounded-lg cursor-pointer transition-all ${currentSubtitleIndex === index
                                    ? 'bg-primary-600/20 border border-primary-500'
                                    : 'bg-dark-border hover:bg-dark-border/80'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <AudioButton
                                    text={subtitle.zh}
                                    size="sm"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="chinese-text text-xl">{subtitle.zh}</span>
                                        <span className="pinyin">{subtitle.pinyin}</span>
                                    </div>
                                    <div className="text-dark-muted">{subtitle.ru}</div>
                                </div>
                                <span className="text-sm text-dark-muted">
                                    {Math.floor(subtitle.time / 60)}:{String(subtitle.time % 60).padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Совет */}
            <div className="text-center text-sm text-dark-muted">
                💡 Нажмите на субтитр для воспроизведения аудио
            </div>
        </div>
    )
}
