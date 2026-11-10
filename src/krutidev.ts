/**
 * Kruti Dev 010 (legacy Hindi font encoding) <-> Unicode Devanagari.
 *
 * `toUnicode` is what people call "Kruti Dev to Mangal": Mangal is simply a
 * Unicode Devanagari font, so converting to Unicode is all that is needed.
 *
 * The Kruti Dev -> Unicode character table and the general approach (ordered
 * replacement, then moving the short-i matra and the reph into Unicode order)
 * are ported from:
 *
 *   @bharattype/hindi-transliteration v1.0.1 (src: krutidevToUnicode)
 *   https://github.com/bharattype/bharattype-hindi-transliteration
 *   Licence: MIT
 *
 *   MIT License
 *   Copyright (c) 2026 BharatType
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 *
 * Changes from the original: the short-i (f) and reph (Z) reordering were
 * rewritten as cluster-aware regular expressions (they now handle nukta and
 * multi-consonant conjuncts), a few glyphs were added (ª, Ç, ¯, ®), visarga vs
 * colon is decided by context, and the Unicode -> Kruti Dev direction
 * (`fromUnicode`) is new code written for this package.
 */

// ---------------------------------------------------------------------------
// Shared Devanagari character classes
// ---------------------------------------------------------------------------

/** Any Devanagari consonant, including the precomposed nukta letters. */
const C = '[\\u0915-\\u0939\\u0958-\\u095F\\u0978-\\u097F]';
const NUKTA = '़';
const VIRAMA = '्';
/** A consonant with optional nukta. */
const CN = `${C}${NUKTA}?`;
/** A consonant cluster: zero or more half consonants followed by a full one. */
const CLUSTER = `(?:${CN}${VIRAMA})*${CN}`;
/** Dependent vowel signs and the marks that sit on a syllable. */
const MARKS = '[\\u0900-\\u0903\\u093A\\u093B\\u093E-\\u094C\\u094E\\u094F\\u0955-\\u0957\\u0962\\u0963]';

// ---------------------------------------------------------------------------
// Kruti Dev -> Unicode
// ---------------------------------------------------------------------------

/**
 * Ordered replacement table. ORDER MATTERS: longer / more specific sequences
 * come before the shorter ones they contain. Entries whose output is still
 * Kruti Dev (e.g. "sas" -> "sa") are clean-ups applied before the real mapping.
 */
const KD_TO_UNICODE: ReadonlyArray<readonly [string, string]> = [
  ['ñ', '॰'],
  ['Q+Z', 'QZ+'],
  ['sas', 'sa'],
  ['aa', 'a'],
  [')Z', 'र्द्ध'],
  ['ZZ', 'Z'],
  // Kruti Dev swaps the curly-quote glyph slots.
  ['‘', '"'],
  ['’', '"'],
  ['“', "'"],
  ['”', "'"],
  // Devanagari digits live in the high slots; ASCII 0-9 stay Western digits.
  ['å', '०'],
  ['ƒ', '१'],
  ['„', '२'],
  ['…', '३'],
  ['†', '४'],
  ['‡', '५'],
  ['ˆ', '६'],
  ['‰', '७'],
  ['Š', '८'],
  ['‹', '९'],
  // Nukta letters
  ['¶+', 'फ़्'],
  ['d+', 'क़'],
  ['[+k', 'ख़'],
  ['[+', 'ख़्'],
  ['x+', 'ग़'],
  ['T+', 'ज़्'],
  ['t+', 'ज़'],
  ['M+', 'ड़'],
  ['<+', 'ढ़'],
  ['Q+', 'फ़'],
  [';+', 'य़'],
  ['j+', 'ऱ'],
  ['u+', 'ऩ'],
  // Conjunct glyphs
  ['Ùk', 'त्त'],
  ['Ù', 'त्त्'],
  ['ä', 'क्त'],
  ['–', 'दृ'],
  ['—', 'कृ'],
  ['é', 'न्न'],
  ['™', 'न्न्'],
  ['=kk', '=k'],
  ['f=k', 'f='],
  ['à', 'ह्न'],
  ['á', 'ह्य'],
  ['â', 'हृ'],
  ['ã', 'ह्म'],
  ['ºz', 'ह्र'],
  ['º', 'ह्'],
  ['í', 'द्द'],
  ['{k', 'क्ष'],
  ['{', 'क्ष्'],
  ['=', 'त्र'],
  ['«', 'त्र्'],
  ['Nî', 'छ्य'],
  ['Vî', 'ट्य'],
  ['Bî', 'ठ्य'],
  ['Mî', 'ड्य'],
  ['<î', 'ढ्य'],
  ['|', 'द्य'],
  ['K', 'ज्ञ'],
  ['}', 'द्व'],
  ['J', 'श्र'],
  ['Vª', 'ट्र'],
  ['Mª', 'ड्र'],
  ['<ªª', 'ढ्र'],
  ['Nª', 'छ्र'],
  ['Ø', 'क्र'],
  ['Ý', 'फ्र'],
  ['nzZ', 'र्द्र'],
  ['æ', 'द्र'],
  ['ç', 'प्र'],
  ['Á', 'प्र'],
  ['xz', 'ग्र'],
  ['#', 'रु'],
  [':', 'रू'],
  // Independent vowels
  ['v‚', 'ऑ'],
  ['vks', 'ओ'],
  ['vkS', 'औ'],
  ['vk', 'आ'],
  ['v', 'अ'],
  ['b±', 'ईं'],
  ['Ã', 'ई'],
  ['bZ', 'ई'],
  ['b', 'इ'],
  ['m', 'उ'],
  ['Å', 'ऊ'],
  [',s', 'ऐ'],
  [',', 'ए'],
  ['_', 'ऋ'],
  // Consonants (half glyph + "k" = full consonant)
  ['ô', 'क्क'],
  ['d', 'क'],
  ['Dk', 'क'],
  ['D', 'क्'],
  ['[k', 'ख'],
  ['[', 'ख्'],
  ['x', 'ग'],
  ['Xk', 'ग'],
  ['X', 'ग्'],
  ['Ä', 'घ'],
  ['?k', 'घ'],
  ['?', 'घ्'],
  ['³', 'ङ'],
  ['pkS', 'चौ'],
  ['p', 'च'],
  ['Pk', 'च'],
  ['P', 'च्'],
  ['N', 'छ'],
  ['t', 'ज'],
  ['Tk', 'ज'],
  ['T', 'ज्'],
  ['>', 'झ'],
  ['÷', 'झ्'],
  ['¥', 'ञ'],
  ['ê', 'ट्ट'],
  ['ë', 'ट्ठ'],
  ['V', 'ट'],
  ['B', 'ठ'],
  ['ì', 'ड्ड'],
  ['ï', 'ड्ढ'],
  ['M', 'ड'],
  ['<', 'ढ'],
  ['.k', 'ण'],
  ['.', 'ण्'],
  ['r', 'त'],
  ['Rk', 'त'],
  ['R', 'त्'],
  ['Fk', 'थ'],
  ['F', 'थ्'],
  [')', 'द्ध'],
  ['n', 'द'],
  ['/k', 'ध'],
  ['èk', 'ध'],
  ['/', 'ध्'],
  ['Ë', 'ध्'],
  ['è', 'ध्'],
  ['u', 'न'],
  ['Uk', 'न'],
  ['U', 'न्'],
  ['i', 'प'],
  ['Ik', 'प'],
  ['I', 'प्'],
  ['Q', 'फ'],
  ['¶', 'फ्'],
  ['c', 'ब'],
  ['Ck', 'ब'],
  ['C', 'ब्'],
  ['Hk', 'भ'],
  ['H', 'भ्'],
  ['e', 'म'],
  ['Ek', 'म'],
  ['E', 'म्'],
  [';', 'य'],
  ['¸', 'य्'],
  ['j', 'र'],
  ['y', 'ल'],
  ['Yk', 'ल'],
  ['Y', 'ल्'],
  ['G', 'ळ'],
  ['o', 'व'],
  ['Ok', 'व'],
  ['O', 'व्'],
  ["'k", 'श'],
  ["'", 'श्'],
  ['"k', 'ष'],
  ['"', 'ष्'],
  ['l', 'स'],
  ['Lk', 'स'],
  ['L', 'स्'],
  ['g', 'ह'],
  // More ligature glyphs
  ['È', 'ीं'],
  ['z', '्र'],
  ['Ì', 'द्द'],
  ['Í', 'ट्ट'],
  ['Î', 'ट्ठ'],
  ['Ï', 'ड्ड'],
  ['Ñ', 'कृ'],
  ['Ò', 'भ'],
  ['Ó', '्य'],
  ['Ô', 'ड्ढ'],
  ['Ö', 'झ्'],
  ['Ük', 'श'],
  ['Ü', 'श्'],
  ['ª', '्र'], // ra-phala under round consonants (ट ठ ड ढ छ)
  // Vowel signs and marks
  ['‚', 'ॉ'],
  ['ks', 'ो'],
  ['kS', 'ौ'],
  ['k', 'ा'],
  ['h', 'ी'],
  ['q', 'ु'],
  ['w', 'ू'],
  ['`', 'ृ'],
  ['s', 'े'],
  ['S', 'ै'],
  ['®', 'ैं'],
  ['a', 'ं'],
  ['¡', 'ँ'],
  ['%', 'ः'],
  ['W', 'ॅ'],
  ['•', 'ऽ'],
  ['·', 'ऽ'],
  ['∙', 'ऽ'],
  ['~j', '्र'],
  ['~', '्'],
  ['+', '़'],
  // Punctuation
  ['\\', '?'],
  ['^', '‘'],
  ['*', '’'],
  ['Þ', '“'],
  ['ß', '”'],
  ['(', ';'],
  ['¼', '('],
  ['½', ')'],
  ['¿', '{'],
  ['À', '}'],
  ['¾', '='],
  ['A', '।'],
  ['-', '.'],
  ['&', '-'],
  ['Œ', '॰'],
  [']', ','],
  ['@', '/'],
];

/** Marker standing for the pre-base short-i matra (Kruti Dev "f"). */
const I_MARK = 'f';
/** Marker standing for the reph (Kruti Dev "Z"), resolved after the table. */
const REPH_MARK = 'Z';

const RE_SHORT_I = new RegExp(`${I_MARK}(ं?)(${CLUSTER})`, 'g');
const RE_REPH = new RegExp(`(${CLUSTER}${MARKS}*)${REPH_MARK}`, 'g');
const RE_DEVANAGARI_BEFORE = /[ऀ-ॏॕ-ॣ]/;

function replaceAll(text: string, find: string, replacement: string): string {
  return text.split(find).join(replacement);
}

/** Convert Kruti Dev 010 encoded text to Unicode Devanagari (NFC). */
export function toUnicode(input: string): string {
  if (!input) return '';
  let text = input.replace(/\r\n?/g, '\n');

  // 1. Ordered character conversion.
  for (const [find, replacement] of KD_TO_UNICODE) {
    if (text.includes(find)) text = replaceAll(text, find, replacement);
  }

  // 2. Glyphs that combine the short-i matra and/or reph with other marks.
  text = replaceAll(text, '±', REPH_MARK + 'ं'); // reph + anusvara
  text = replaceAll(text, 'Æ', 'र्' + I_MARK); // reph over a pre-base short i
  text = replaceAll(text, 'É', 'र्' + I_MARK + 'ं');
  text = replaceAll(text, 'Ç', I_MARK + 'ं'); // short i + anusvara
  text = replaceAll(text, '¯', I_MARK + 'ं');

  // 3. Short-i matra: "f" is typed before the whole consonant cluster
  //    (including half forms); Unicode wants it after the cluster.
  text = text.replace(RE_SHORT_I, (_m, anusvara: string, cluster: string) => cluster + 'ि' + anusvara);
  text = replaceAll(text, I_MARK, 'ि'); // stray f with no consonant after it

  // 4. Long i + reph glyph.
  text = replaceAll(text, 'Ê', 'ी' + REPH_MARK);

  // 5. Reph: "Z" is typed after the syllable (and its vowel signs);
  //    Unicode wants र् before the consonant cluster.
  text = replaceAll(text, VIRAMA + REPH_MARK, REPH_MARK);
  text = text.replace(RE_REPH, 'र्$1');
  text = replaceAll(text, REPH_MARK, 'र्'); // reph with nothing to attach to

  // 6. Clean-ups.
  text = replaceAll(text, VIRAMA + 'ा', ''); // half form + "k" bar = full consonant
  text = replaceAll(text, 'ंं', 'ं');
  // A nukta typed after the ra-phala belongs to the base consonant (Qz+ = फ़्र).
  text = text.replace(new RegExp(`(${C})्ऱ`, 'g'), '$1़्र');
  // "%" is visarga after a letter, a plain colon anywhere else.
  text = text.replace(/ः/g, (m, offset: number, whole: string) =>
    offset > 0 && RE_DEVANAGARI_BEFORE.test(whole[offset - 1]) ? m : ':',
  );
  text = text.replace(/[\u200B\uFEFF]/g, '');

  return text.normalize('NFC');
}

// ---------------------------------------------------------------------------
// Unicode -> Kruti Dev
// ---------------------------------------------------------------------------

/** Private-use placeholders used while re-ordering, replaced at the end. */
const P_I = '\uE000';
const P_REPH = '\uE001';

/** Full consonants -> Kruti Dev. */
const KD_CONSONANTS: Readonly<Record<string, string>> = {
  'क': 'd', 'ख': '[k', 'ग': 'x', 'घ': '?k', 'ङ': '³',
  'च': 'p', 'छ': 'N', 'ज': 't', 'झ': '>', 'ञ': '¥',
  'ट': 'V', 'ठ': 'B', 'ड': 'M', 'ढ': '<', 'ण': '.k',
  'त': 'r', 'थ': 'Fk', 'द': 'n', 'ध': '/k', 'न': 'u',
  'प': 'i', 'फ': 'Q', 'ब': 'c', 'भ': 'Hk', 'म': 'e',
  'य': ';', 'र': 'j', 'ल': 'y', 'ळ': 'G', 'व': 'o',
  'श': "'k", 'ष': '"k', 'स': 'l', 'ह': 'g',
};

/** Consonants without a vertical bar take the ª ra-phala instead of z. */
const KD_ROUND = new Set(['ट', 'ठ', 'ड', 'ढ', 'छ']);

/**
 * Unicode sequence -> Kruti Dev 010 keystrokes. Applied by longest match, so
 * the order here does not matter. Nukta letters are keyed in their NFC
 * (decomposed) form, e.g. क + ़.
 */
const UNICODE_TO_KD: Readonly<Record<string, string>> = {
  [P_I]: 'f',
  [P_REPH]: 'Z',

  // Independent vowels
  'अ': 'v', 'आ': 'vk', 'इ': 'b', 'ई': 'bZ', 'उ': 'm', 'ऊ': 'Å', 'ऋ': '_',
  'ए': ',', 'ऐ': ',s', 'ओ': 'vks', 'औ': 'vkS', 'ऑ': 'v‚', 'ऍ': ',W',

  ...KD_CONSONANTS,

  // Half consonants that have their own glyph
  'क्': 'D', 'ख्': '[', 'ग्': 'X', 'घ्': '?', 'च्': 'P', 'ज्': 'T', 'झ्': '÷',
  'ण्': '.', 'त्': 'R', 'थ्': 'F', 'ध्': '/', 'न्': 'U', 'प्': 'I', 'फ्': '¶',
  'ब्': 'C', 'भ्': 'H', 'म्': 'E', 'य्': '¸', 'ल्': 'Y', 'व्': 'O', 'श्': "'",
  'ष्': '"', 'स्': 'L', 'ह्': 'º',

  // Nukta letters (decomposed)
  'क़': 'd+', 'ख़': '[+k', 'ख़्': '[+', 'ग़': 'x+', 'ज़': 't+', 'ज़्': 'T+',
  'ड़': 'M+', 'ढ़': '<+', 'फ़': 'Q+', 'फ़्': '¶+', 'य़': ';+',

  // Conjunct glyphs
  'क्ष': '{k', 'क्ष्': '{', 'त्र': '=', 'त्र्': '«', 'ज्ञ': 'K', 'श्र': 'J',
  'द्ध': ')', 'द्व': '}', 'द्य': '|', 'द्द': 'Ì', 'ट्ट': 'Í', 'ट्ठ': 'Î',
  'ड्ड': 'Ï', 'ड्ढ': 'Ô', 'न्न': 'é', 'न्न्': '™', 'त्त': 'Ùk', 'त्त्': 'Ù',
  'क्त': 'ä', 'ह्न': 'à', 'ह्य': 'á', 'ह्म': 'ã', 'हृ': 'â', 'ह्र': 'ºz',
  'क्र': 'Ø', 'फ्र': 'Ý', 'द्र': 'æ', 'प्र': 'iz', 'ग्र': 'xz',
  'ट्र': 'Vª', 'ठ्र': 'Bª', 'ड्र': 'Mª', 'ढ्र': '<ª', 'छ्र': 'Nª',
  'छ्य': 'Nî', 'ट्य': 'Vî', 'ठ्य': 'Bî', 'ड्य': 'Mî', 'ढ्य': '<î',
  'रु': '#', 'रू': ':', 'दृ': '–', 'कृ': 'Ñ',
  '्र': 'z',

  // Vowel signs and marks
  'ा': 'k', 'ी': 'h', 'ु': 'q', 'ू': 'w', 'ृ': '`', 'े': 's', 'ै': 'S',
  'ो': 'ks', 'ौ': 'kS', 'ॉ': '‚', 'ॅ': 'W', 'ं': 'a', 'ँ': '¡', 'ः': '%',
  '्': '~', '़': '+', 'ऽ': '·',

  // Devanagari digits (ASCII 0-9 are kept as they are)
  '०': 'å', '१': 'ƒ', '२': '„', '३': '…', '४': '†',
  '५': '‡', '६': 'ˆ', '७': '‰', '८': 'Š', '९': '‹',

  // Punctuation
  '।': 'A', '॥': 'AA', '॰': 'Œ', '.': '-', ',': ']', '-': '&', '–': '&', '—': '&',
  '/': '@', ';': '(', ':': '%', '?': '\\', '(': '¼', ')': '½', '{': '¿', '}': 'À',
  '=': '¾', '‘': '^', '’': '*', '“': 'Þ', '”': 'ß', "'": '*', '"': 'ß',
};

/** Consonant + ्र with no dedicated glyph: full consonant + ra-phala (e.g. ब्र = cz). */
const UNICODE_TO_KD_ALL: Readonly<Record<string, string>> = (() => {
  const table: Record<string, string> = { ...UNICODE_TO_KD };
  for (const [cons, kd] of Object.entries(KD_CONSONANTS)) {
    const key = cons + VIRAMA + 'र';
    if (!(key in table)) table[key] = kd + (KD_ROUND.has(cons) ? 'ª' : 'z');
  }
  return table;
})();

const KD_MAX_KEY = Math.max(...Object.keys(UNICODE_TO_KD_ALL).map((k) => k.length));

/** One syllable: optional reph, a consonant cluster, then its vowel signs. */
const RE_SYLLABLE = new RegExp(`(र्(?=${CN}))?(${CLUSTER})(${MARKS}*)`, 'g');

function reorderForLegacy(text: string): string {
  return text.replace(RE_SYLLABLE, (_m, reph: string | undefined, cluster: string, marks: string) => {
    const hasShortI = marks.includes('ि');
    let signs = hasShortI ? marks.replace('ि', '') : marks;
    // Nasal marks are typed after the reph.
    const nasal = signs.replace(/[^ंँ]/g, '');
    signs = signs.replace(/[ंँ]/g, '');
    return (hasShortI ? P_I : '') + cluster + signs + (reph ? P_REPH : '') + nasal;
  });
}

function mapLongestMatch(text: string, table: Readonly<Record<string, string>>, maxKey: number): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (let len = Math.min(maxKey, text.length - i); len > 0; len--) {
      const piece = text.slice(i, i + len);
      const mapped = table[piece];
      if (mapped !== undefined) {
        out += mapped;
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += text[i];
      i++;
    }
  }
  return out;
}

/** Convert Unicode Devanagari (Hindi) text to Kruti Dev 010 keystrokes. */
export function fromUnicode(input: string): string {
  if (!input) return '';
  let text = input.normalize('NFC').replace(/\r\n?/g, '\n');
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
  text = reorderForLegacy(text);
  return mapLongestMatch(text, UNICODE_TO_KD_ALL, KD_MAX_KEY);
}
