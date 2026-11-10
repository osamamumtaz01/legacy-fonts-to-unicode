// FM Abhaya (and the rest of the FM family: FM Malithi, FM Bindumathi, FM Emanee ...)
// <-> Sinhala Unicode.
//
// FM fonts are "ASCII fonts": the text is Latin-1 letters and punctuation that the
// font draws as Sinhala glyphs, typed in visual order (the kombuva ෙ before its
// consonant, the repaya after it, pre-joined glyphs such as ම් or දු).
//
// The glyph table is taken from the "Pandukabhaya" FM Abhaya mapping
// (pandukabhaya/mappings/fm_abhaya.json, https://github.com/akuruAI/pandukabhaya),
//   Copyright (c) 2024 akuruAI, MIT License,
// which is a cleaned-up version of the UCSC Language Technology Research Laboratory
// converter, also published as npm "sinhala-unicode-coverter"
// (https://github.com/Open-SL/sinhala-unicode-converter, Janaka Chathuranga, MIT).
// The test sentences used while porting come from Pandukabhaya's tests/test_cases.json.
//
//   Permission is hereby granted, free of charge, to any person obtaining a copy of
//   this software and associated documentation files (the "Software"), to deal in
//   the Software without restriction, including without limitation the rights to
//   use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//   the Software, and to permit persons to whom the Software is furnished to do so,
//   subject to the following conditions: The above copyright notice and this
//   permission notice shall be included in all copies or substantial portions of
//   the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
//
// Instead of the original ~1,000 hard-coded "kombuva + consonant + sign" combinations,
// this file maps each glyph once and then reorders with a few general rules, and
// adds the Unicode -> FM direction (which neither source package provides).

const ZWJ = String.fromCharCode(0x200d);
const KOMBU = String.fromCharCode(0xe000); // placeholder for a kombuva typed before its consonant
const REPAYA = String.fromCharCode(0xe001); // placeholder for a repaya typed after its consonant
const SANYAKA = String.fromCharCode(0xe002); // placeholder for the ` prefix glyph
const AL = '්';
const JOIN = AL + ZWJ; // al-lakuna + ZWJ: yansaya, rakaransaya, touching letters, repaya

// ---------------------------------------------------------------------------
// Glyph table: FM key -> Unicode (in typing order).
// ---------------------------------------------------------------------------

const CONSONANTS: Record<string, string> = {
  l: 'ක', L: 'ඛ', '.': 'ග', '>': 'ඝ', X: 'ඞ', 'Õ': 'ඟ', p: 'ච', P: 'ඡ', c: 'ජ', '®': 'ඣ',
  '[': 'ඤ', 'Ø': 'ඤ', '{': 'ඥ', '×': 'ඥ', g: 'ට', G: 'ඨ', v: 'ඩ', V: 'ඪ', K: 'ණ', '~': 'ඬ',
  ';': 'ත', ':': 'ථ', o: 'ද', O: 'ධ', k: 'න', '|': 'ඳ', m: 'ප', M: 'ඵ', n: 'බ', N: 'භ',
  u: 'ම', U: 'ඹ', h: 'ය', r: 'ර', ',': 'ල', j: 'ව', Y: 'ශ', I: 'ෂ', i: 'ස', y: 'හ',
  '<': 'ළ', '*': 'ෆ',
};

const TO_UNICODE: Record<string, string> = {
  ...CONSONANTS,
  // independent vowels (ආ ඇ ඈ ඌ ඎ ඒ ඓ ඖ are composed afterwards, see COMPOSE)
  w: 'අ', b: 'ඉ', B: 'ඊ', W: 'උ', R: 'ඍ', 'Ì': 'ඏ', 'Ï': 'ඐ', t: 'එ', T: 'ඔ', '´': 'ඕ',
  // ` is a prefix glyph that turns the next letter into its sanyaka or touching
  // form (`. = ඟ, `o = ඳ, `j = ද්‍ව ...), see PREFIXED below
  '`': SANYAKA, CO: 'ඣ', '\\': 'ඳ',
  // half letters and pre-joined conjuncts
  C: 'ක' + JOIN, F: 'ත' + JOIN, J: 'න' + JOIN, 'Ë': 'ක' + JOIN + 'ෂ', '†': 'ත' + JOIN + 'ථ',
  '…': 'ත' + JOIN + 'ව', '‡': 'න' + JOIN + 'ද', '„': 'ද' + JOIN + 'ව', 'Š': 'ද' + JOIN + 'ධ',
  'ø': 'ද' + JOIN + 'ර', 'ˆ': 'න' + JOIN + 'දා', '‹': 'ද' + JOIN + 'ධි', '‰': 'ද' + JOIN + 'වි',
  '“': 'ර' + JOIN + 'ණ', '›': 'ශ' + JOIN + 'රී',
  // yansaya, rakaransaya, repaya
  H: JOIN + 'ය', '%': JOIN + 'ර', _: REPAYA, 'œ': JOIN + 'ය' + REPAYA, '¾': 'ර' + AL,
  // vowel signs and other marks
  f: KOMBU, a: AL, A: AL, d: 'ා', e: 'ැ', E: 'ෑ', s: 'ි', S: 'ී', q: 'ු', '=': 'ු', Q: 'ූ',
  '+': 'ූ', D: 'ෘ', '!': 'ෟ', x: 'ං', '#': 'ඃ', '½': 'ඃ', ' ‘': 'ි', ' ’': 'ී',
  // ra + u / uu / ae / aee have their own shapes
  re: 'රු', rE: 'රූ', '/': 'රැ', '?': 'රෑ',
  // consonant + vowel-sign ligatures
  '¢': 'ඳි', '£': 'ඳී', '§': 'දී', '¨': 'ලු', 'ª': 'ඳූ', '¯': 'ඣි', 'ˉ': 'ඣි', '°': 'ඣී',
  '±': 'දැ', 'À': 'ඨි', 'Á': 'ඨී', 'Â': 'ඡී', 'Ä': 'ඛ්', 'Å': 'ඛි', 'Æ': 'ලූ', 'Ç': 'ඛී',
  'È': 'දි', 'É': 'ච්', 'Ê': 'ජ්', 'Í': 'රී', 'Î': 'ඪි', 'Ð': 'ඪී', 'Ñ': 'චි', 'Ò': 'ථී',
  'Ó': 'ථි', 'Ô': 'ජී', 'Ö': 'චී', 'Ù': 'ඞ්', 'Ú': 'ඵී', 'Ü': 'ට්', 'Ý': 'ඵි', 'Þ': 'දා',
  'ß': 'රි', 'à': 'ටී', 'á': 'ටි', 'â': 'ඩ්', 'ã': 'ඞී', 'ä': 'ඩි', 'å': 'ඬ්', 'ç': 'ඬි',
  'è': 'ධ්', 'é': 'ඬී', 'ê': 'ධි', 'ë': 'ධී', 'ì': 'බි', 'í': 'බ්', 'î': 'බී', 'ï': 'ම්',
  'ð': 'ජි', 'ñ': 'මි', 'ò': 'ඹ්', 'ó': 'මී', 'ô': 'ඹි', 'õ': 'ව්', 'ö': 'ඹී', '÷': 'ඳු',
  'ù': 'වී', 'ú': 'වි', 'û': 'ඤු', 'ü': 'ඤූ', 'ý': 'ඡි', 'þ': 'ඡ්', 'ÿ': 'දු', '¥': 'දූ', 'ƒ': 'ඳැ',
  'Œ': 'ණී', '‚': 'ණි', '¿': 'ළු',
  // punctuation: FM puts . and , on ' and " because the period and comma keys are letters
  "'": '.', '"': ',', '$': '/', '&': ')', '(': ':', ')': '*', '@': '?', ']': '%', '^': '(',
  '}': '=', '¦': ';', 'æ': '!', '¬': '+', '«': '×', '∙': '×', '\u00ad': '÷', '−': '÷',
  '¡': '•', '²': '•', '¤': '–', '³': '⋆', '˜': '"', '—': '"', '™': '{', 'š': '}', Z: '’',
  z: '‘', '•': 'x', 'µ': 'i', '¶': 'v', '¸': 'I', '¹': 'V', 'º': 'X',
};

// Longest key first so that e.g. "`." wins over "." and "re" over "r".
const KEYS = Object.keys(TO_UNICODE).sort((a, b) => b.length - a.length);
const TOKEN = new RegExp(KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&')).join('|'), 'g');

// Text copied out of an old Word file sometimes arrives with the C1 control codes
// (U+0080-U+009F) instead of the Windows-1252 characters the font was designed for.
const CP1252: Record<number, string> = {
  0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰',
  0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•',
  0x96: '–', 0x97: '—', 0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ',
};

const CONS = '\u0D9A-\u0DC6'; // Sinhala consonants
const SIGNS = '\u0DCA\u0DCF-\u0DDF\u0DF2\u0DF3'; // dependent vowel signs and al-lakuna
const CLUSTER = `[${CONS}](?:${JOIN}[${CONS}])*`; // consonant + touching/yansaya/rakaransaya

const PREFIXED: Record<string, string> = {
  'ග': 'ඟ', 'ජ': 'ඦ', 'ඡ': 'ඦ', 'ඩ': 'ඬ', 'ද': 'ඳ', 'ධ': 'ද' + JOIN + 'ධ', 'ව': 'ද' + JOIN + 'ව', 'ඨ': 'ට' + JOIN + 'ඨ',
};

// Reordering rules applied after the glyphs are mapped (order matters).
const REORDER: [RegExp, string][] = [
  // rakaransaya / yansaya typed after a vowel sign or al-lakuna: "ì%" = බි + ්‍ර -> බ්‍රි
  [new RegExp(`([${SIGNS}]+)(${JOIN}[යර])`, 'g'), '$2$1'],
  // repaya glyph typed after its consonant (and any vowel signs): "u_" -> ර්‍ම
  [new RegExp(`(${CLUSTER})([${SIGNS}ංඃ]*)${REPAYA}`, 'g'), 'ර' + JOIN + '$1$2'],
  // two kombuvas before a consonant cluster = kombu deka (ෛ); one = ෙ
  [new RegExp(`${KOMBU}${KOMBU}(${CLUSTER})`, 'g'), '$1ෛ'],
  [new RegExp(`${KOMBU}(${CLUSTER})`, 'g'), '$1ෙ'],
  [new RegExp(`${KOMBU}එ`, 'g'), 'ඓ'],
];

// Sign + sign and vowel + sign combinations that Unicode writes as one letter.
// (ෙ + ් / ා / ෟ are left to NFC, which composes them into ේ ො ෝ ෞ.)
const COMPOSE: [string, string][] = [
  ['ෘෘ', 'ෲ'], ['අා', 'ආ'], ['අැ', 'ඇ'], ['අෑ', 'ඈ'], ['උෟ', 'ඌ'], ['ඍෘ', 'ඎ'],
  ['එ' + AL, 'ඒ'], ['ඔෟ', 'ඖ'], ['ඔ' + AL, 'ඕ'],
];

/** FM Abhaya / FM-family text -> Sinhala Unicode (NFC). */
export function toUnicode(s: string): string {
  let t = s.replace(/[\u0080-\u009f]/g, (c) => CP1252[c.charCodeAt(0)] ?? c);
  t = t.replace(TOKEN, (k) => TO_UNICODE[k]);
  t = t.replace(new RegExp(`${SANYAKA}([${CONS}]?)`, 'g'), (_, c: string) => PREFIXED[c] ?? '`' + c);
  for (const [re, sub] of REORDER) t = t.replace(re, sub);
  t = t.replaceAll(KOMBU, 'ෙ').replaceAll(REPAYA, '');
  for (const [seq, sub] of COMPOSE) t = t.replaceAll(seq, sub);
  return t.normalize('NFC');
}

// ---------------------------------------------------------------------------
// Unicode -> FM. Works syllable by syllable: [repaya] cluster [signs].
// ---------------------------------------------------------------------------

const invert = (m: Record<string, string>) => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(m)) out[v] ??= k; // first key wins
  return out;
};

const CONS_KEY: Record<string, string> = { ...invert(CONSONANTS), 'ඟ': '`.', 'ඦ': '`P', 'ඣ': '®' };

const VOWEL_KEY: Record<string, string> = {
  'අ': 'w', 'ආ': 'wd', 'ඇ': 'we', 'ඈ': 'wE', 'ඉ': 'b', 'ඊ': 'B', 'උ': 'W', 'ඌ': 'W!',
  'ඍ': 'R', 'ඎ': 'RD', 'ඏ': 'Ì', 'ඐ': 'Ï', 'එ': 't', 'ඒ': 'ta', 'ඓ': 'ft', 'ඔ': 'T',
  'ඕ': '´', 'ඖ': 'T!',
};

const SIGN_KEY: Record<string, string> = {
  '්': 'a', 'ා': 'd', 'ැ': 'e', 'ෑ': 'E', 'ි': 's', 'ී': 'S', 'ු': 'q', 'ූ': 'Q', 'ෘ': 'D',
  'ෲ': 'DD', 'ෟ': '!', 'ං': 'x', 'ඃ': '#',
};

// Single consonant + one sign drawn as one glyph (or with a special sign shape).
const LIGATURE: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(TO_UNICODE).filter(([k, v]) => k.length === 1 && /^[\u0D9A-\u0DC6][\u0DCA\u0DD0-\u0DD6]$/.test(v) && !'Þ±ƒˉ¥'.includes(k)).map(([k, v]) => [v, k]),
  ),
  'රු': 're', 'රූ': 'rE', 'රැ': '/', 'රෑ': '?',
  'කු': 'l=', 'කූ': 'l+', 'ගු': '.=', 'ගූ': '.+', 'තු': ';=', 'තූ': ';+',
};

// Touching-letter pairs with their own glyph (consonant + ්‍ + consonant).
const CONJUNCT: Record<string, string> = {
  ['ක' + JOIN + 'ෂ']: 'CI', ['ක' + JOIN + 'ව']: 'Cj', ['ත' + JOIN + 'ථ']: '†', ['ත' + JOIN + 'ව']: '…',
  ['න' + JOIN + 'ද']: '‡', ['න' + JOIN + 'ධ']: 'JO', ['ද' + JOIN + 'ව']: '„', ['ද' + JOIN + 'ධ']: 'Š',
  ['ට' + JOIN + 'ඨ']: '`G', ['ද' + JOIN + 'ර']: 'ø',
};
const HALF: Record<string, string> = { 'ක': 'C', 'ත': 'F', 'න': 'J' };

const PUNCT_KEY: Record<string, string> = {
  '.': "'", ',': '"', '/': '$', ')': '&', ':': '(', '*': ')', '?': '@', '%': ']', '(': '^',
  '=': '}', ';': '¦', '!': 'æ', '+': '¬', '×': '«', '÷': '\u00ad', '•': '¡', '–': '¤',
  '⋆': '³', '"': '˜', '“': '˜', '”': '˜', '{': '™', '}': 'š', '‘': 'z', '’': 'Z',
};

const isCons = (c: string | undefined) => c !== undefined && c >= 'ක' && c <= 'ෆ';

function clusterToFM(cons: string[]): string {
  let out = CONS_KEY[cons[0]] ?? cons[0];
  for (let i = 1; i < cons.length; i++) {
    const prev = cons[i - 1];
    const c = cons[i];
    const prevKey = CONS_KEY[prev] ?? prev;
    const pair = CONJUNCT[prev + JOIN + c];
    if (pair && out.endsWith(prevKey)) out = out.slice(0, -prevKey.length) + pair;
    else if (c === 'ය') out += 'H';
    else if (c === 'ර') out += '%';
    else if (HALF[prev] && out.endsWith(prevKey)) out = out.slice(0, -prevKey.length) + HALF[prev] + CONS_KEY[c];
    else out += 'a' + ZWJ + CONS_KEY[c];
  }
  return out;
}

const signsToFM = (signs: string) => [...signs].map((c) => SIGN_KEY[c] ?? c).join('');

/** Sinhala Unicode -> FM Abhaya / FM-family keystrokes. */
export function fromUnicode(s: string): string {
  const t = s.normalize('NFD'); // splits ේ ො ෝ ෞ into kombuva + sign
  let out = '';
  let i = 0;
  while (i < t.length) {
    const ch = t[i];
    if (t.startsWith('ශ' + JOIN + 'රී', i)) { out += '›'; i += 5; continue; }
    if (!isCons(ch)) {
      out += VOWEL_KEY[ch] ?? SIGN_KEY[ch] ?? PUNCT_KEY[ch] ?? ch;
      i++;
      continue;
    }
    // repaya: ර්‍ + consonant (ර්‍ය is ra + yansaya instead)
    let repaya = false;
    if (ch === 'ර' && t.startsWith(JOIN, i + 1) && isCons(t[i + 3]) && t[i + 3] !== 'ය') {
      repaya = true;
      i += 3;
    }
    const cons = [t[i++]];
    while (t.startsWith(JOIN, i) && isCons(t[i + 2])) { cons.push(t[i + 2]); i += 3; }
    let signs = '';
    while (i < t.length && /[\u0DCA\u0DCF-\u0DDF\u0DF2\u0DF3\u0D82\u0D83]/.test(t[i])) signs += t[i++];

    const base = clusterToFM(cons);
    let syl: string;
    const kombu = signs[0] === 'ෙ' ? 1 : signs[0] === 'ෛ' ? 2 : 0;
    if (kombu) {
      let rest = signs.slice(1);
      let tail = '';
      if (rest.startsWith('ා්')) { tail = 'da'; rest = rest.slice(2); }
      else if (rest.startsWith('ා')) { tail = 'd'; rest = rest.slice(1); }
      else if (rest.startsWith('ෟ')) { tail = '!'; rest = rest.slice(1); }
      let body = base;
      if (rest.startsWith('්')) {
        rest = rest.slice(1);
        const lig = cons.length === 1 ? LIGATURE[cons[0] + '්'] : undefined;
        body = lig ?? base + 'a';
      }
      syl = 'f'.repeat(kombu) + body + tail + signsToFM(rest);
    } else {
      const lig = cons.length === 1 && signs ? LIGATURE[cons[0] + signs[0]] : undefined;
      syl = lig ? lig + signsToFM(signs.slice(1)) : base + signsToFM(signs);
    }
    out += syl + (repaya ? '_' : '');
  }
  return out;
}
