/**
 * Expanded pinyin quiz data for Dong Chinese-style trainer.
 * - Quiz questions per lesson (listen & pick)
 * - Extended confusable sound groups (12 groups)
 * - Extended speaking items (20+ phrases with categories)
 * - Tonal minimal pairs
 */

// ========== LESSON QUIZZES ==========
// Each quiz has: type ('listen'|'identify'|'tone'), prompt, audio token, options, answer

export const LESSON_QUIZZES = {
    'lesson-1': [
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'ba1', options: ['ba', 'pa', 'ma', 'fa'], answer: 'ba' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'pa2', options: ['ba', 'pa', 'ma', 'fa'], answer: 'pa' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'ma3', options: ['ba', 'pa', 'ma', 'fa'], answer: 'ma' },
        { type: 'tone', prompt: 'Какой тон у "bà"?', audio: 'ba4', options: [1, 2, 3, 4], answer: 4 },
        { type: 'identify', prompt: 'Какой иероглиф произносится "mā"?', audio: 'ma1', options: ['妈', '马', '骂', '吗'], answer: '妈' },
    ],
    'lesson-2': [
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'da1', options: ['da', 'ta', 'na', 'la'], answer: 'da' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'ta1', options: ['da', 'ta', 'na', 'la'], answer: 'ta' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'ni3', options: ['ni', 'li', 'di', 'ti'], answer: 'ni' },
        { type: 'tone', prompt: 'Какой тон у "tā"?', audio: 'ta1', options: [1, 2, 3, 4], answer: 1 },
        { type: 'identify', prompt: 'Какой иероглиф произносится "dà"?', audio: 'da4', options: ['大', '他', '你', '里'], answer: '大' },
    ],
    'lesson-3': [
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'ge1', options: ['ge', 'ke', 'he'], answer: 'ge' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'ke4', options: ['ge', 'ke', 'he'], answer: 'ke' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'he2', options: ['ge', 'ke', 'he'], answer: 'he' },
        { type: 'tone', prompt: 'Какой тон у "hé"?', audio: 'he2', options: [1, 2, 3, 4], answer: 2 },
        { type: 'identify', prompt: 'Какой иероглиф произносится "gè"?', audio: 'ge4', options: ['个', '刻', '和', '大'], answer: '个' },
    ],
    'lesson-4': [
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'ji1', options: ['ji', 'qi', 'xi'], answer: 'ji' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'qi1', options: ['ji', 'qi', 'xi'], answer: 'qi' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'xi1', options: ['ji', 'qi', 'xi'], answer: 'xi' },
        { type: 'tone', prompt: 'Какой тон у "jī"?', audio: 'ji1', options: [1, 2, 3, 4], answer: 1 },
        { type: 'identify', prompt: 'Какой иероглиф произносится "xī"?', audio: 'xi1', options: ['机', '期', '西', '字'], answer: '西' },
    ],
    'lesson-5': [
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'zhi1', options: ['zhi', 'chi', 'shi', 'ri'], answer: 'zhi' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'chi1', options: ['zhi', 'chi', 'shi', 'ri'], answer: 'chi' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'shi4', options: ['zhi', 'chi', 'shi', 'ri'], answer: 'shi' },
        { type: 'tone', prompt: 'Какой тон у "rì"?', audio: 'ri4', options: [1, 2, 3, 4], answer: 4 },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'ri4', options: ['zhi', 'chi', 'shi', 'ri'], answer: 'ri' },
    ],
    'lesson-6': [
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'zi4', options: ['zi', 'ci', 'si'], answer: 'zi' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'ci4', options: ['zi', 'ci', 'si'], answer: 'ci' },
        { type: 'listen', prompt: 'Какой слог вы слышите?', audio: 'si4', options: ['zi', 'ci', 'si'], answer: 'si' },
        { type: 'tone', prompt: 'Какой тон у "sì"?', audio: 'si4', options: [1, 2, 3, 4], answer: 4 },
        { type: 'identify', prompt: 'Какой иероглиф произносится "zì"?', audio: 'zi4', options: ['字', '次', '四', '日'], answer: '字' },
    ],
    'lesson-7': [
        { type: 'listen', prompt: 'Какая финаль?', audio: 'ma1', options: ['a', 'o', 'e', 'ü'], answer: 'a' },
        { type: 'listen', prompt: 'Какая финаль?', audio: 'wo3', options: ['a', 'o', 'e', 'ü'], answer: 'o' },
        { type: 'listen', prompt: 'Какая финаль?', audio: 'de5', options: ['a', 'o', 'e', 'ü'], answer: 'e' },
        { type: 'listen', prompt: 'Какая финаль?', audio: 'nv3', options: ['a', 'o', 'e', 'ü'], answer: 'ü' },
        { type: 'tone', prompt: 'Какой тон у "wǒ"?', audio: 'wo3', options: [1, 2, 3, 4], answer: 3 },
    ],
    'lesson-8': [
        { type: 'listen', prompt: 'Какая финаль?', audio: 'ban1', options: ['an', 'en', 'ang', 'eng'], answer: 'an' },
        { type: 'listen', prompt: 'Какая финаль?', audio: 'men5', options: ['an', 'en', 'ang', 'eng'], answer: 'en' },
        { type: 'listen', prompt: 'Какая финаль?', audio: 'shang4', options: ['an', 'en', 'ang', 'eng'], answer: 'ang' },
        { type: 'listen', prompt: 'Какая финаль?', audio: 'zhong1', options: ['an', 'en', 'ang', 'ong'], answer: 'ong' },
        { type: 'tone', prompt: 'Какой тон у "bàn"?', audio: 'ban4', options: [1, 2, 3, 4], answer: 4 },
    ],
    'lesson-9': [
        { type: 'listen', prompt: 'Какой дифтонг?', audio: 'zai4', options: ['ai', 'ao', 'ou', 'ie'], answer: 'ai' },
        { type: 'listen', prompt: 'Какой дифтонг?', audio: 'hao3', options: ['ai', 'ao', 'ou', 'ie'], answer: 'ao' },
        { type: 'listen', prompt: 'Какой дифтонг?', audio: 'you3', options: ['ai', 'ao', 'ou', 'ie'], answer: 'ou' },
        { type: 'listen', prompt: 'Какой дифтонг?', audio: 'xie4', options: ['ai', 'ao', 'ou', 'ie'], answer: 'ie' },
        { type: 'tone', prompt: 'Какой тон у "zài"?', audio: 'zai4', options: [1, 2, 3, 4], answer: 4 },
    ],
    'lesson-10': [
        { type: 'listen', prompt: 'Что вы слышите?', audio: 'ji1', options: ['jī', 'zhī'], answer: 'jī' },
        { type: 'listen', prompt: 'Что вы слышите?', audio: 'zhi1', options: ['jī', 'zhī'], answer: 'zhī' },
        { type: 'listen', prompt: 'Что вы слышите?', audio: 'qi1', options: ['qī', 'chī'], answer: 'qī' },
        { type: 'listen', prompt: 'Что вы слышите?', audio: 'chi1', options: ['qī', 'chī'], answer: 'chī' },
        { type: 'listen', prompt: 'Что вы слышите?', audio: 'xi1', options: ['xī', 'shī'], answer: 'xī' },
    ],
    'lesson-11': [
        { type: 'tone', prompt: 'Как звучит "你好" на практике?', audio: 'ni3', options: ['3+3', '2+3', '1+3', '4+3'], answer: '2+3' },
        { type: 'tone', prompt: 'Какой тон у 不 перед 4-м тоном?', audio: 'bu2', options: [1, 2, 3, 4], answer: 2 },
        { type: 'identify', prompt: 'Как произносится 不是?', audio: 'bu2', options: ['bù shì', 'bú shì', 'bǔ shì', 'bū shì'], answer: 'bú shì' },
        { type: 'tone', prompt: 'Какой тон у 一 перед 4-м тоном?', audio: 'yi1', options: [1, 2, 3, 4], answer: 2 },
        { type: 'identify', prompt: 'Правило sandhi 3+3:', audio: 'ni3', options: ['Первый 3-й не меняется', 'Первый 3-й → 2-й', 'Оба → 1-й', 'Оба → 4-й'], answer: 'Первый 3-й → 2-й' },
    ],
    'lesson-12': [
        { type: 'listen', prompt: 'Какую фразу вы слышите?', audio: 'ni3', options: ['你好', '谢谢', '我是', '中国'], answer: '你好' },
        { type: 'listen', prompt: 'Какую фразу вы слышите?', audio: 'xie4', options: ['你好', '谢谢', '再见', '不客气'], answer: '谢谢' },
        { type: 'identify', prompt: 'Как правильно произнести "我是学生"?', audio: 'wo3', options: ['wǒ shì xué shēng', 'wó shì xué shēng', 'wǒ shí xué shēng', 'wǒ shì xuē shēng'], answer: 'wǒ shì xué shēng' },
        { type: 'tone', prompt: 'Сколько тонов в слове "中国人"?', audio: 'zhong1', options: ['2', '3', '4', '5'], answer: '3' },
        { type: 'identify', prompt: 'Ритм фразы "你好吗" это...', audio: 'ni3', options: ['2+2', '2+1', '1+2', '3 отдельных'], answer: '2+1' },
    ],
}

// ========== EXTENDED CONFUSABLE GROUPS ==========

export const CONFUSABLE_GROUPS = [
    { name: 'j / zh', description: 'Передне-нёбный vs ретрофлексный', tokens: ['ji1', 'zhi1', 'ji4', 'zhi4'] },
    { name: 'q / ch', description: 'Мягкий vs твёрдый', tokens: ['qi1', 'chi1', 'qi2', 'chi2'] },
    { name: 'x / sh', description: 'Свистящий vs шипящий', tokens: ['xi1', 'shi1', 'xi4', 'shi4'] },
    { name: 'z / c / s', description: 'Альвеолярная тройка', tokens: ['zi4', 'ci4', 'si4'] },
    { name: 'n / l', description: 'Носовой vs боковой', tokens: ['ni3', 'li3', 'na4', 'la4'] },
    { name: 'zh / z', description: 'Ретрофлексный vs альвеолярный', tokens: ['zhi1', 'zi4', 'zhe4', 'ze2'] },
    { name: 'ch / c', description: 'Ретрофлексный vs альвеолярный', tokens: ['chi1', 'ci4', 'che1', 'ce4'] },
    { name: 'sh / s', description: 'Ретрофлексный vs свистящий', tokens: ['shi1', 'si4', 'she4', 'se4'] },
    { name: 'an / ang', description: 'Переднее n vs заднее ng', tokens: ['ban1', 'bang1', 'fan1', 'fang2'] },
    { name: 'en / eng', description: 'Переднее n vs заднее ng', tokens: ['men5', 'meng2', 'fen1', 'feng1'] },
    { name: 'in / ing', description: 'Переднее n vs заднее ng', tokens: ['xin1', 'xing2', 'jin1', 'jing1'] },
    { name: 'b / p', description: 'Без придыхания vs с придыханием', tokens: ['ba1', 'pa1', 'ba4', 'pa4'] },
]

// ========== TONAL MINIMAL PAIRS ==========

export const TONE_PAIRS = [
    { base: 'ma', meaning: { 1: '妈 мама', 2: '麻 конопля', 3: '马 лошадь', 4: '骂 ругать' } },
    { base: 'shi', meaning: { 1: '诗 поэзия', 2: '十 десять', 3: '使 посол', 4: '是 быть' } },
    { base: 'mai', meaning: { 2: '买 покупать', 3: '买 покупать', 4: '卖 продавать' } },
    { base: 'tang', meaning: { 1: '汤 суп', 2: '糖 сахар', 3: '躺 лежать', 4: '烫 горячий' } },
    { base: 'da', meaning: { 1: '搭 строить', 2: '答 отвечать', 3: '打 бить', 4: '大 большой' } },
    { base: 'ji', meaning: { 1: '机 машина', 2: '及 достигать', 3: '几 сколько', 4: '记 помнить' } },
    { base: 'wen', meaning: { 1: '温 тёплый', 2: '文 культура', 3: '吻 поцелуй', 4: '问 спросить' } },
    { base: 'yan', meaning: { 1: '烟 дым', 2: '盐 соль', 3: '眼 глаз', 4: '验 проверять' } },
]

// ========== EXTENDED SPEAKING ITEMS ==========

export const SPEAKING_CATEGORIES = [
    {
        name: '👋 Приветствия',
        items: [
            { hanzi: '你好', pinyin: 'nǐ hǎo', ru: 'привет' },
            { hanzi: '你好吗', pinyin: 'nǐ hǎo ma', ru: 'как дела?' },
            { hanzi: '早上好', pinyin: 'zǎo shang hǎo', ru: 'доброе утро' },
            { hanzi: '晚上好', pinyin: 'wǎn shang hǎo', ru: 'добрый вечер' },
            { hanzi: '再见', pinyin: 'zài jiàn', ru: 'до свидания' },
        ],
    },
    {
        name: '🙏 Вежливость',
        items: [
            { hanzi: '谢谢', pinyin: 'xiè xiè', ru: 'спасибо' },
            { hanzi: '不客气', pinyin: 'bú kè qì', ru: 'пожалуйста (не за что)' },
            { hanzi: '对不起', pinyin: 'duì bu qǐ', ru: 'извините' },
            { hanzi: '没关系', pinyin: 'méi guān xi', ru: 'ничего страшного' },
            { hanzi: '请', pinyin: 'qǐng', ru: 'пожалуйста (прошу)' },
        ],
    },
    {
        name: '🔢 Числа',
        items: [
            { hanzi: '一二三', pinyin: 'yī èr sān', ru: 'один два три' },
            { hanzi: '四五六', pinyin: 'sì wǔ liù', ru: 'четыре пять шесть' },
            { hanzi: '七八九十', pinyin: 'qī bā jiǔ shí', ru: 'семь восемь девять десять' },
            { hanzi: '多少钱', pinyin: 'duō shao qián', ru: 'сколько стоит?' },
        ],
    },
    {
        name: '❓ Вопросы',
        items: [
            { hanzi: '这是什么', pinyin: 'zhè shì shén me', ru: 'что это?' },
            { hanzi: '你叫什么名字', pinyin: 'nǐ jiào shén me míng zi', ru: 'как тебя зовут?' },
            { hanzi: '你是哪国人', pinyin: 'nǐ shì nǎ guó rén', ru: 'из какой ты страны?' },
            { hanzi: '在哪里', pinyin: 'zài nǎ lǐ', ru: 'где?' },
        ],
    },
    {
        name: '🗣️ Повседневные',
        items: [
            { hanzi: '我是学生', pinyin: 'wǒ shì xué shēng', ru: 'я студент' },
            { hanzi: '我不知道', pinyin: 'wǒ bù zhī dào', ru: 'я не знаю' },
            { hanzi: '中国', pinyin: 'zhōng guó', ru: 'Китай' },
            { hanzi: '不是', pinyin: 'bú shì', ru: 'не является' },
            { hanzi: '我喜欢', pinyin: 'wǒ xǐ huān', ru: 'мне нравится' },
            { hanzi: '没有', pinyin: 'méi yǒu', ru: 'нет / не имею' },
        ],
    },
]

// All speaking items flat for random practice
export const ALL_SPEAKING_ITEMS = SPEAKING_CATEGORIES.flatMap(c => c.items)
