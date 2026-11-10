/**
 * Preeti (legacy Nepali font encoding) <-> Unicode Devanagari.
 *
 * Preeti -> Unicode: the character map and the post-processing rules are
 * ported from:
 *
 *   preeti2unicode v1.0.7 (src/rules.js, src/index.js)
 *   by Roj Tamang, Navraj Bhattarai — https://www.npmjs.com/package/preeti2unicode
 *   Licence: MIT
 *
 *   Copyright (c) Roj Tamang, Navraj Bhattarai
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 *
 * Unicode -> Preeti: the glyph table is based on:
 *
 *   unicode-to-preeti v1.0.0 by Milkesh Shrestha
 *   https://www.npmjs.com/package/unicode-to-preeti
 *   Licence: ISC
 *
 *   Copyright (c) Milkesh Shrestha
 *   Permission to use, copy, modify, and/or distribute this software for any
 *   purpose with or without fee is hereby granted, provided that the above
 *   copyright notice and this permission notice appear in all copies.
 *   THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 *   WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 *   MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 *   SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER
 *   RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
 *   NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE
 *   USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * Changes from the originals: the short-i ("l") and reph ("{") reordering were
 * rewritten as cluster-aware regular expressions (the published Preeti rules
 * had the short-i rule disabled), the "m" glyph combinations (फ, झ, ऊ, क्र,
 * क्त, फ्र) work with vowel signs typed in between, "-"/"_" are parentheses
 * as in the Preeti font, a few wrong reverse entries were fixed (न्न, ड्ढ),
 * and the reverse direction re-orders whole syllables instead of using the
 * original regexes.
 */

// ---------------------------------------------------------------------------
// Shared Devanagari character classes
// ---------------------------------------------------------------------------

const C = '[\\u0915-\\u0939\\u0958-\\u095F\\u0978-\\u097F]';
const NUKTA = '़';
const VIRAMA = '्';
const CN = `${C}${NUKTA}?`;
const CLUSTER = `(?:${CN}${VIRAMA})*${CN}`;
const MARKS = '[\\u0900-\\u0903\\u093A\\u093B\\u093E-\\u094C\\u094E\\u094F\\u0955-\\u0957\\u0962\\u0963]';

// ---------------------------------------------------------------------------
// Preeti -> Unicode
// ---------------------------------------------------------------------------

/** One Preeti keystroke -> Unicode. Characters not listed pass through. */
const PREETI_TO_UNICODE: Readonly<Record<string, string>> = {
  // Lower case
  a: 'ब', b: 'द', c: 'अ', d: 'म', e: 'भ', f: 'ा', g: 'न', h: 'ज', i: 'ष्',
  j: 'व', k: 'प', l: 'ि', n: 'ल', o: 'य', p: 'उ', q: 'त्र', r: 'च', s: 'क',
  t: 'त', u: 'ग', v: 'ख', w: 'ध', x: 'ह', y: 'थ', z: 'श',
  // "m" is a glyph fragment resolved by the rules below (फ झ ऊ क्र क्त).
  // Upper case
  A: 'ब्', B: 'द्य', C: 'ऋ', D: 'म्', E: 'भ्', F: 'ँ', G: 'न्', H: 'ज्',
  I: 'क्ष्', J: 'व्', K: 'प्', L: 'ी', M: 'ः', N: 'ल्', O: 'इ', P: 'ए',
  Q: 'त्त', R: 'च्', S: 'क्', T: 'त्', U: 'ग्', V: 'ख्', W: 'ध्', X: 'ह्',
  Y: 'थ्', Z: 'श्',
  // Digit keys are letters in Preeti
  '0': 'ण्', '1': 'ज्ञ', '2': 'द्द', '3': 'घ', '4': 'द्ध',
  '5': 'छ', '6': 'ट', '7': 'ठ', '8': 'ड', '9': 'ढ',
  // Shifted digit keys are the Devanagari digits
  ')': '०', '!': '१', '@': '२', '#': '३', '$': '४',
  '%': '५', '^': '६', '&': '७', '*': '८', '(': '९',
  // Punctuation keys
  '[': 'ृ', ']': 'े', '{': '{', '}': 'ै', '\\': '्', '|': '्र',
  ';': 'स', ':': 'स्', "'": 'ु', '"': 'ू', ',': ',', '.': '।', '/': 'र',
  '<': '?', '>': 'श्र', '?': 'रु', '=': '.', '+': 'ं', '-': '(', '_': ')',
  '`': 'ञ', '~': 'ञ्',
  // Extended (Windows-1252) slots
  '¿': 'रू', '§': 'ट्ट', '£': 'घ्', '•': 'ड्ड', '«': '्र', '„': 'ध्र',
  'ˆ': 'फ्', 'Î': 'ङ्ख', '¶': 'ठ्ठ', '¢': 'द्घ', 'ª': 'ङ', 'Ý': 'ट्ठ',
  'Å': 'हृ', 'Í': 'ङ्क', '¥': 'र्\u200D', '¡': 'ज्ञ्', '©': 'र', '‘': 'ॅ', '˜': 'ऽ',
  'Ø': '्य', 'Ì': 'न्न', '´': 'झ', '°': 'ङ्ढ', '‹': 'ङ्घ', '¤': 'झ्', '‰': 'झ्',
  '›': 'द्र', 'å': 'द्व', 'ß': 'द्म', 'Ë': 'ङ्ग', 'ç': 'ॐ', 'Þ': '़',
  '÷': '/', '×': '×', '±': '+', 'Ö': '=', 'Û': '!', 'Ü': '%', 'Ù': ';',
  'Ú': '’', '…': '‘', 'æ': '“', 'Æ': '”',
};

/** Bases that join the Preeti "m" glyph to make another letter. */
const M_JOIN: Readonly<Record<string, string>> = {
  'त्र': 'क्र', 'त्त': 'क्त', 'उ': 'ऊ', 'भ': 'झ', 'प': 'फ',
};
const VOWEL_SIGNS = '[\\u093E-\\u094C\\u0901-\\u0903]';
const RE_M_JOIN = new RegExp(`(त्र|त्त|उ|भ|प)((?:्र)?)(${VOWEL_SIGNS}*)m`, 'g');
const RE_SHORT_I = new RegExp(`ि(${CLUSTER})`, 'g');
const RE_REPH = new RegExp(`(${CLUSTER}${MARKS}*)\\{`, 'g');
const RE_NASAL_BEFORE_SIGN = /([ंँ])([ािीुूृेैोौः]+)/g;
const RE_DEVANAGARI_BEFORE = /[ऀ-ॏॕ-ॣ]/;

/** Plain string replacements applied after the reordering, in order. */
const PREETI_CLEANUPS: ReadonlyArray<readonly [string, string]> = [
  ['ँँ', 'ँ'], ['ंं', 'ं'], ['ेे', 'े'], ['ैै', 'ै'], ['ुु', 'ु'], ['ूू', 'ू'],
  ['टृ', 'ट्ट'],
  ['ेा', 'ाे'], ['ैा', 'ाै'],
  ['अाे', 'ओ'], ['अाै', 'औ'], ['अा', 'आ'], ['एे', 'ऐ'],
  ['ाे', 'ो'], ['ाै', 'ौ'],
];

function replaceAll(text: string, find: string, replacement: string): string {
  return text.split(find).join(replacement);
}

/** Convert Preeti encoded text to Unicode Devanagari (NFC). */
export function toUnicode(input: string): string {
  if (!input) return '';
  let text = '';
  for (const ch of input.replace(/\r\n?/g, '\n')) text += PREETI_TO_UNICODE[ch] ?? ch;

  // Half form + "f" (the aa bar) = full consonant, e.g. "0f" = ण, "If" = क्ष.
  text = replaceAll(text, VIRAMA + 'ा', '');
  // "m" glyph joins: km = फ, em = झ, pm = ऊ, qm = क्र, Qm = क्त, k|m = फ्र.
  text = text.replace(RE_M_JOIN, (_m, base: string, ra: string, signs: string) => M_JOIN[base] + ra + signs);
  // "O{" = ई (the reph glyph completes इ).
  text = replaceAll(text, 'इ{', 'ई');
  // Short-i "l" is typed before the whole cluster; Unicode wants it after.
  text = text.replace(RE_SHORT_I, '$1ि');
  // Reph "{" is typed after the syllable; Unicode wants र् before the cluster.
  text = text.replace(RE_REPH, 'र्$1');
  text = replaceAll(text, '{', 'र्');
  // Anusvara / chandrabindu typed before a vowel sign goes after it.
  text = text.replace(RE_NASAL_BEFORE_SIGN, '$2$1');
  for (const [find, replacement] of PREETI_CLEANUPS) text = replaceAll(text, find, replacement);
  // "M" is visarga after a letter, a plain colon anywhere else.
  text = text.replace(/ः/g, (m, offset: number, whole: string) =>
    offset > 0 && RE_DEVANAGARI_BEFORE.test(whole[offset - 1]) ? m : ':',
  );
  return text.normalize('NFC');
}

// ---------------------------------------------------------------------------
// Unicode -> Preeti
// ---------------------------------------------------------------------------

const P_I = '\uE000';
const P_REPH = '\uE001';
const P_EYELASH_RA = '\uE002';

/** Full consonants -> Preeti. */
const PREETI_CONSONANTS: Readonly<Record<string, string>> = {
  'क': 's', 'ख': 'v', 'ग': 'u', 'घ': '3', 'ङ': 'ª',
  'च': 'r', 'छ': '5', 'ज': 'h', 'झ': '´', 'ञ': '`',
  'ट': '6', 'ठ': '7', 'ड': '8', 'ढ': '9', 'ण': '0f',
  'त': 't', 'थ': 'y', 'द': 'b', 'ध': 'w', 'न': 'g',
  'प': 'k', 'फ': 'km', 'ब': 'a', 'भ': 'e', 'म': 'd',
  'य': 'o', 'र': '/', 'ल': 'n', 'व': 'j', 'श': 'z', 'ष': 'if', 'स': ';', 'ह': 'x',
};

/** Consonants without a vertical bar take the « ra-phala instead of |. */
const PREETI_ROUND = new Set(['ट', 'ठ', 'ड', 'ढ', 'छ']);

/** Unicode sequence -> Preeti keystrokes, applied by longest match. */
const UNICODE_TO_PREETI: Readonly<Record<string, string>> = {
  [P_I]: 'l',
  [P_REPH]: '{',

  // Independent vowels
  'अ': 'c', 'आ': 'cf', 'इ': 'O', 'ई': 'O{', 'उ': 'p', 'ऊ': 'pm', 'ऋ': 'C',
  'ए': 'P', 'ऐ': 'P]', 'ओ': 'cf]', 'औ': 'cf}', 'ऑ': 'cf‘', 'ॐ': 'ç',

  ...PREETI_CONSONANTS,

  // Half consonants with their own glyph
  'क्': 'S', 'ख्': 'V', 'ग्': 'U', 'घ्': '£', 'च्': 'R', 'ज्': 'H', 'झ्': '‰',
  'ञ्': '~', 'ण्': '0', 'त्': 'T', 'थ्': 'Y', 'ध्': 'W', 'न्': 'G', 'प्': 'K',
  'फ्': 'ˆ', 'ब्': 'A', 'भ्': 'E', 'म्': 'D', 'ल्': 'N', 'व्': 'J', 'श्': 'Z',
  'ष्': 'i', 'स्': ':', 'ह्': 'X',

  // Conjunct glyphs
  'क्ष': 'If', 'क्ष्': 'I', 'त्र': 'q', 'ज्ञ': '1', 'ज्ञ्': '¡', 'श्र': '>',
  'द्द': '2', 'द्ध': '4', 'द्य': 'B', 'द्व': 'å', 'द्म': 'ß', 'द्घ': '¢',
  'द्र': '›', 'ध्र': '„', 'ट्ट': '§', 'ट्ठ': 'Ý', 'ड्ड': '•', 'ठ्ठ': '¶',
  'त्त': 'Q', 'क्त': 'Qm', 'क्र': 'qm', 'फ्र': 'k|m', 'न्न': 'Ì',
  'ङ्क': 'Í', 'ङ्ख': 'Î', 'ङ्ग': 'Ë', 'ङ्घ': '‹', 'हृ': 'Å',
  'रु': '?', 'रू': '¿',
  'ट्र': '6«', 'ठ्र': '7«', 'ड्र': '8«', 'ढ्र': '9«',
  '्र': '|', '्य': 'Ø',

  // Vowel signs and marks
  'ा': 'f', 'ी': 'L', 'ु': "'", 'ू': '"', 'ृ': '[', 'े': ']', 'ै': '}',
  'ो': 'f]', 'ौ': 'f}', 'ॉ': 'f‘', 'ॅ': '‘', 'ं': '+', 'ँ': 'F', 'ः': 'M',
  '्': '\\', '़': 'Þ', 'ऽ': '˜',

  // Digits: Preeti shows Devanagari digits on the shifted number keys.
  '०': ')', '१': '!', '२': '@', '३': '#', '४': '$',
  '५': '%', '६': '^', '७': '&', '८': '*', '९': '(',
  '0': ')', '1': '!', '2': '@', '3': '#', '4': '$',
  '5': '%', '6': '^', '7': '&', '8': '*', '9': '(',

  // Punctuation
  '।': '.', '॥': '..', '.': '=', ',': ',', '?': '<', '/': '÷', '(': '-', ')': '_',
  ';': 'Ù', ':': 'M', '!': 'Û', '%': 'Ü', '=': 'Ö', '+': '±',
  '‘': '…', '’': 'Ú', '“': 'æ', '”': 'Æ', "'": 'Ú', '"': 'Æ', '-': '–',
};

/** Adds consonant + ्र (full consonant + ra-phala, e.g. प्र = k|) and the eyelash ra. */
const UNICODE_TO_PREETI_ALL: Readonly<Record<string, string>> = (() => {
  const table: Record<string, string> = { ...UNICODE_TO_PREETI, [P_EYELASH_RA]: '¥' };
  for (const [cons, keys] of Object.entries(PREETI_CONSONANTS)) {
    const key = cons + VIRAMA + 'र';
    if (!(key in table)) table[key] = keys + (PREETI_ROUND.has(cons) ? '«' : '|');
  }
  return table;
})();

const PREETI_MAX_KEY = Math.max(...Object.keys(UNICODE_TO_PREETI_ALL).map((k) => k.length));

const RE_SYLLABLE = new RegExp(`(र्(?=${CN}))?(${CLUSTER})(${MARKS}*)`, 'g');

function reorderForLegacy(text: string): string {
  return text.replace(RE_SYLLABLE, (_m, reph: string | undefined, cluster: string, marks: string) => {
    const hasShortI = marks.includes('ि');
    let signs = hasShortI ? marks.replace('ि', '') : marks;
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
      const mapped = table[text.slice(i, i + len)];
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

/**
 * Convert Unicode Devanagari (Nepali) text to Preeti keystrokes.
 * ASCII digits become Preeti's Devanagari digits, and a hyphen becomes an en
 * dash, because Preeti uses the "-" key for "(".
 */
export function fromUnicode(input: string): string {
  if (!input) return '';
  let text = input.normalize('NFC').replace(/\r\n?/g, '\n');
  text = text.replace(/[\u200B\u200C\uFEFF]/g, '');
  // Keep the eyelash ra (र्\u200D) as Preeti's own glyph before re-ordering.
  text = text.replace(/र्\u200D/g, P_EYELASH_RA).replace(/\u200D/g, '');
  text = reorderForLegacy(text);
  return mapLongestMatch(text, UNICODE_TO_PREETI_ALL, PREETI_MAX_KEY);
}
