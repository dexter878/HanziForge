import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
    { path: '/', label: 'Главная', icon: '🏠' },
    { path: '/словарь', label: 'Словарь', icon: '📖' },
    { path: '/пиньинь', label: 'Пиньинь', icon: '🔤' },
    { path: '/письмо', label: 'Письмо', icon: '✍️' },
    { path: '/изучение', label: 'Упражнения', icon: '🧠' },
    { path: '/видео', label: 'Видео', icon: '🎥' },
    { path: '/тесты', label: 'Тесты HSK', icon: '📝' },
    { path: '/флешкарты', label: 'Флешкарты', icon: '🗂️' },
    { path: '/разговорник', label: 'Разговорник', icon: '🗣️' },
    { path: '/ocr', label: 'Распознавание', icon: '📷' },
    { path: '/прогресс', label: 'Прогресс', icon: '📊' },
]

export default function Layout({ children, isOnline }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen flex">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-dark-card border-r border-dark-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-dark-border">
                        <NavLink to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-lg chinese-text">汉</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-lg text-dark-text">Hanzi Forge</h1>
                                <p className="text-xs text-dark-muted">Изучение китайского</p>
                            </div>
                        </NavLink>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => `
                  nav-link ${isActive ? 'active' : ''}
                `}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-dark-border">
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-dark-muted">
                                {isOnline ? 'Онлайн' : 'Офлайн режим'}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-h-screen">
                <header className="md:hidden sticky top-0 z-30 bg-dark-bg/95 backdrop-blur border-b border-dark-border">
                    <div className="flex items-center justify-between p-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 hover:bg-dark-border rounded-lg"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <NavLink to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold chinese-text">汉</span>
                            </div>
                            <span className="font-bold">Hanzi Forge</span>
                        </NavLink>

                        <div className="w-10" />
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
