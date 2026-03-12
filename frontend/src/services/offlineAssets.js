const tesseractLangCandidates = (lang) => [
    { url: `/tesseract/lang/${lang}.traineddata.gz`, gzip: true },
    { url: `/tesseract/lang/${lang}.traineddata`, gzip: false },
]

async function assetExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })
        return response.ok
    } catch {
        return false
    }
}

export async function getLocalTesseractOptions(lang = 'chi_sim') {
    for (const candidate of tesseractLangCandidates(lang)) {
        const exists = await assetExists(candidate.url)
        if (exists) {
            return {
                workerPath: '/tesseract/worker.min.js',
                corePath: '/tesseract/core',
                langPath: '/tesseract/lang',
                gzip: candidate.gzip,
            }
        }
    }

    return null
}

export function createLocalHanziWriterLoader() {
    return async (char) => {
        const response = await fetch(`/hanzi-writer-data/${encodeURIComponent(char)}.json`, {
            cache: 'force-cache',
        })

        if (!response.ok) {
            throw new Error(`LOCAL_HANZI_WRITER_DATA_MISSING:${char}`)
        }

        return response.json()
    }
}

export function isMissingLocalHanziWriterData(error) {
    return String(error?.message || '').startsWith('LOCAL_HANZI_WRITER_DATA_MISSING:')
}
