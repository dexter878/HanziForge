import api from './api'

/**
 * Best-effort progress tracking.
 * For guests (401) we silently skip, for other errors we log.
 */
export async function trackProgress(itemType, itemKey, correct) {
    if (!itemType || itemKey === undefined || itemKey === null) {
        return
    }

    try {
        await api.post('/api/progress', {
            item_type: String(itemType),
            item_key: String(itemKey),
            correct: Boolean(correct),
        })
    } catch (error) {
        if (error?.response?.status !== 401) {
            console.error('Progress tracking error:', error)
        }
    }
}

