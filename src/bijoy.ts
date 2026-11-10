/**
 * Bijoy (SutonnyMJ ANSI) <-> Unicode Bangla converter.
 *
 * The glyph table is taken from these MIT-licensed projects:
 *   - bijoy2unicode 1.0.2 by Md. Jehad (Jehadur Rahman Emran)
 *     https://www.npmjs.com/package/bijoy2unicode
 *     MIT License, Copyright (c) 2026 Md. Jehad (Jehadur Rahman Emran)
 *   - unicode2ascii 1.1.0 by Md. Nimuzzaman (Unicode -> Bijoy table)
 *     https://github.com/nayeem-bd/unicode2ascii
 *     MIT License, Copyright (c) 2024 Md. Nimuzzaman
 *   - @codesigntheory/bnbijoy2unicode 1.3.0 by Utsob Roy (MIT), used to
 *     settle entries where the first two disagree.
 *
 * MIT License text from those projects:
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a
 *   copy of this software and associated documentation files (the
 *   "Software"), to deal in the Software without restriction, including
 *   without limitation the rights to use, copy, modify, merge, publish,
 *   distribute, sublicense, and/or sell copies of the Software, and to permit
 *   persons to whom the Software is furnished to do so, subject to the
 *   following conditions:
 *
 *   The above copyright notice and this permission notice shall be included
 *   in all copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 *   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 *   NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 *   DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 *   OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 *   USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * The reordering code below is a rewrite (a single-pass cluster parser rather
 * than the original regex chains), so it handles pre-base vowel signs, split
 * o/au signs, reph, phalas and signs typed out of order in one place.
 */

const HASANTA = '্';
const ZWNJ = '‌';
/** Private-use stand-in for the reph glyph (©) while reordering. */
const REPH = '';

// ---------------------------------------------------------------------------
// Bijoy -> Unicode glyph table (visual order; reordered afterwards)
// ---------------------------------------------------------------------------

const BIJOY_TO_UNICODE: Record<string, string> = {
  // Two-glyph sequences (matched before single glyphs)
  Av: 'আ',
  'i¨': 'র‌্য', // র‌্য (ra + ZWNJ + ya-phala), e.g. র‌্যাব
  '„„': 'ৃ',
  // ø is স্ন on its own, but ্ল after these letters
  Mø: 'গ্ল',
  cø: 'প্ল',
  eø: 'ব্ল',
  jø: 'ল্ল',
  kø: 'শ্ল',
  '¤ø': 'ম্ল',
  '¯ø': 'স্ল',

  // Independent vowels
  A: 'অ', B: 'ই', C: 'ঈ', D: 'উ', E: 'ঊ', F: 'ঋ', G: 'এ', H: 'ঐ', I: 'ও', J: 'ঔ',

  // Consonants
  K: 'ক', L: 'খ', M: 'গ', N: 'ঘ', O: 'ঙ', P: 'চ', Q: 'ছ', R: 'জ', S: 'ঝ', T: 'ঞ',
  U: 'ট', V: 'ঠ', W: 'ড', X: 'ঢ', Y: 'ণ', Z: 'ত', _: 'থ', '`': 'দ', a: 'ধ', b: 'ন',
  c: 'প', d: 'ফ', e: 'ব', f: 'ভ', g: 'ম', h: 'য', i: 'র', j: 'ল', k: 'শ', l: 'ষ',
  m: 'স', n: 'হ', o: 'ড়', p: 'ঢ়', q: 'য়', r: 'ৎ',
  s: 'ং', t: 'ঃ', u: 'ঁ',

  // Digits
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',

  // Vowel signs (several glyph variants per sign)
  v: 'া',
  w: 'ি',
  x: 'ী',
  y: 'ু', z: 'ু', '“': 'ু', '–': 'ু', 'æ': 'ু',
  '~': 'ূ', 'ƒ': 'ূ', '‚': 'ূ',
  '„': 'ৃ', '…': 'ৃ',
  '†': 'ে', '‡': 'ে',
  'ˆ': 'ৈ', '‰': 'ৈ',
  'Š': 'ৗ',

  // Hasanta, reph, phalas and other partial forms
  '&': HASANTA,
  '©': REPH,
  '¨': '্য',
  'ª': '্র', '«': '্র', 'Ö': '্র',
  '^': '্ব', 'Ÿ': '্ব', '¡': '্ব', '¦': '্ব',
  '¬': '্ল', '­': '্ল',
  '¥': '্ম', '§': '্ম',
  'œ': '্ন', 'è': '্ন',
  '‹': '্ক',
  'Œ': '্ক্র',
  '—': '্ত', 'Í': '্ত',
  '‘': '্তু',
  '’': '্থ',
  '¢': '্ভ',
  '£': '্ভ্র',
  'ú': '্প',
  '¿': '্ত্র',
  '•': 'ঙ্',
  '”': 'চ্',
  '˜': 'দ্', '™': 'দ্',
  'š': 'ন্', '›': 'ন্',
  '¤': 'ম্',
  '®': 'ষ্',
  '¯': 'স্',

  // Full conjunct glyphs
  '°': 'ক্ক', '±': 'ক্ট', '²': 'ক্ষ্ণ', '³': 'ক্ত', '´': 'ক্ম', 'µ': 'ক্র',
  '¶': 'ক্ষ', 'ÿ': 'ক্ষ', '·': 'ক্স', '¸': 'গু', '¹': 'জ্ঞ', 'º': 'গ্দ', '»': 'গ্ধ',
  '¼': 'ঙ্ক', '½': 'ঙ্গ', '¾': 'জ্জ', 'À': 'জ্ঝ', 'Á': 'জ্ঞ', 'Â': 'ঞ্চ', 'Ã': 'ঞ্ছ',
  'Ä': 'ঞ্জ', 'Å': 'ঞ্ঝ', 'Æ': 'ট্ট', 'Ç': 'ড্ড', 'È': 'ণ্ট', 'É': 'ণ্ঠ', 'Ê': 'ণ্ড',
  'Ë': 'ত্ত', 'Ì': 'ত্থ', 'Î': 'ত্র', 'Ï': 'দ্দ', '×': 'দ্ধ', 'Ø': 'দ্ব', 'Ù': 'দ্ম',
  'Ú': 'ন্ঠ', 'Û': 'ন্ড', 'Ü': 'ন্ধ', 'Ý': 'ন্স', 'Þ': 'প্ট', 'ß': 'প্ত', 'à': 'প্প',
  'á': 'প্স', 'â': 'ব্জ', 'ã': 'ব্দ', 'ä': 'ব্ধ', 'å': 'ভ্র', 'ç': 'ম্ফ', 'é': 'ল্ক',
  'ê': 'ল্গ', 'ë': 'ল্ট', 'ì': 'ল্ড', 'í': 'ল্প', 'î': 'ল্ফ', 'ï': 'শু', 'ð': 'শ্চ',
  'ñ': 'শ্ছ', 'ò': 'ষ্ণ', 'ó': 'ষ্ট', 'ô': 'ষ্ঠ', 'õ': 'ষ্ফ', 'ö': 'স্খ', '÷': 'স্ট',
  'ø': 'স্ন', 'ù': 'স্ফ', 'û': 'হু', 'ü': 'হৃ', 'ý': 'হ্ন', 'þ': 'হ্ম',

  // Punctuation
  '|': '।',
  'Ò': '“', 'Ó': '”', 'Ô': '‘', 'Õ': '’',
  'Ð': '-', 'Ñ': '-',
  '\\': '', // stray glyph in SutonnyMJ documents; dropped by all source converters
};

const MAX_BIJOY_KEY = 2;

// ---------------------------------------------------------------------------
// Character classes
// ---------------------------------------------------------------------------

const CONSONANTS = new Set(
  'কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়'.split(''),
);
const PRE_KARS = new Set(['ি', 'ে', 'ৈ']);
const POST_KARS = new Set(['া', 'ী', 'ু', 'ূ', 'ৃ', 'ৗ', 'ো', 'ৌ']);
const SIGNS = new Set(['ঁ', 'ং', 'ঃ']);

const isCons = (c: string | undefined): boolean => c !== undefined && CONSONANTS.has(c);

// ---------------------------------------------------------------------------
// Bijoy -> Unicode
// ---------------------------------------------------------------------------

function mapGlyphs(s: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    let matched = false;
    for (let len = MAX_BIJOY_KEY; len >= 1; len--) {
      const key = s.substr(i, len);
      if (key.length === len && key in BIJOY_TO_UNICODE) {
        for (const ch of BIJOY_TO_UNICODE[key]) out.push(ch);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out.push(s[i]);
      i++;
    }
  }
  // A half form (¯ = স্) followed by a phala glyph (’ = ্থ) yields two
  // hasantas in a row; one is enough.
  return out.filter((c, idx) => !(c === HASANTA && out[idx - 1] === HASANTA));
}

interface Cluster {
  text: string;
  kars: string[];
  signs: string[];
  reph: boolean;
  end: number;
}

/**
 * Read a consonant cluster starting at `start` together with everything Bijoy
 * types after it: phalas, vowel signs, reph and ঁ ং ঃ (in any order).
 */
function readCluster(a: string[], start: number): Cluster {
  let text = a[start];
  let k = start + 1;
  const kars: string[] = [];
  const signs: string[] = [];
  let reph = false;

  const absorbConjuncts = (): boolean => {
    let grew = false;
    for (;;) {
      if (a[k] === HASANTA && isCons(a[k + 1])) {
        text += HASANTA + a[k + 1];
        k += 2;
        grew = true;
      } else if (a[k] === ZWNJ && a[k + 1] === HASANTA && a[k + 2] === 'য' && text.endsWith('র')) {
        text += ZWNJ + HASANTA + 'য'; // র‌্য
        k += 3;
        grew = true;
      } else {
        return grew;
      }
    }
  };

  absorbConjuncts();
  for (;;) {
    const c = a[k];
    if (c === REPH && !reph) {
      reph = true;
      k++;
    } else if (c !== undefined && POST_KARS.has(c)) {
      kars.push(c);
      k++;
    } else if (c !== undefined && SIGNS.has(c)) {
      signs.push(c);
      k++;
    } else if (c === HASANTA && isCons(a[k + 1]) && (kars.length > 0 || signs.length > 0 || reph)) {
      // A phala typed after the vowel sign (e.g. Zz¨ = ত্যু): it still
      // belongs to the cluster.
      absorbConjuncts();
    } else {
      break;
    }
  }
  return { text, kars, signs, reph, end: k };
}

function emitCluster(out: string[], cl: Cluster, preKar: string | null, deferred: string[]): void {
  const kars = cl.kars.slice();
  let vowel = '';
  if (preKar === 'ে' && kars[0] === 'া') {
    vowel = 'ো';
    kars.shift();
  } else if (preKar === 'ে' && kars.includes('ৗ')) {
    vowel = 'ৌ';
    kars.splice(kars.indexOf('ৗ'), 1);
  } else if (preKar) {
    vowel = preKar;
  }
  if (cl.reph) out.push('র', HASANTA);
  out.push(cl.text, vowel, ...kars, ...deferred, ...cl.signs);
}

/** Convert Bijoy (SutonnyMJ) ANSI text to Unicode Bangla (NFC). */
export function toUnicode(s: string): string {
  if (!s) return '';
  const a = mapGlyphs(s);
  const out: string[] = [];
  let i = 0;
  while (i < a.length) {
    const c = a[i];
    if (PRE_KARS.has(c)) {
      // Bijoy types ি ে ৈ before the consonant; ঁ may sit between them.
      let j = i + 1;
      const deferred: string[] = [];
      while (a[j] === 'ঁ') deferred.push(a[j++]);
      if (isCons(a[j])) {
        const cl = readCluster(a, j);
        emitCluster(out, cl, c, deferred);
        i = cl.end;
        continue;
      }
      out.push(c);
      i++;
      continue;
    }
    if (isCons(c)) {
      const cl = readCluster(a, i);
      emitCluster(out, cl, null, []);
      i = cl.end;
      continue;
    }
    out.push(c === REPH ? 'র' + HASANTA : c);
    i++;
  }
  return out.join('').replace(/অা/g, 'আ').normalize('NFC');
}

// ---------------------------------------------------------------------------
// Unicode -> Bijoy
// ---------------------------------------------------------------------------

const CONSONANT_GLYPH: Record<string, string> = {
  ক: 'K', খ: 'L', গ: 'M', ঘ: 'N', ঙ: 'O', চ: 'P', ছ: 'Q', জ: 'R', ঝ: 'S', ঞ: 'T',
  ট: 'U', ঠ: 'V', ড: 'W', ঢ: 'X', ণ: 'Y', ত: 'Z', থ: '_', দ: '`', ধ: 'a', ন: 'b',
  প: 'c', ফ: 'd', ব: 'e', ভ: 'f', ম: 'g', য: 'h', র: 'i', ল: 'j', শ: 'k', ষ: 'l',
  স: 'm', হ: 'n', 'ড়': 'o', 'ঢ়': 'p', 'য়': 'q',
};

/** Conjuncts (and a few consonant + vowel-sign ligatures) with their own glyphs. */
const CONJUNCT_GLYPH: Record<string, string> = {
  'ক্ক': '°', 'ক্ট': '±', 'ক্ষ্ণ': '²', 'ক্ত': '³', 'ক্ম': '´', 'ক্র': 'µ', 'ক্ষ': 'ÿ',
  'ক্স': '·', 'গ্দ': 'º', 'গ্ধ': '»', 'ঙ্ক': '¼', 'ঙ্গ': '½', 'জ্জ': '¾', 'জ্ঝ': 'À',
  'জ্ঞ': 'Á', 'ঞ্চ': 'Â', 'ঞ্ছ': 'Ã', 'ঞ্জ': 'Ä', 'ঞ্ঝ': 'Å', 'ট্ট': 'Æ', 'ড্ড': 'Ç',
  'ণ্ট': 'È', 'ণ্ঠ': 'É', 'ণ্ড': 'Ê', 'ত্ত': 'Ë', 'ত্থ': 'Ì', 'ত্র': 'Î', 'দ্দ': 'Ï',
  'দ্ধ': '×', 'দ্ব': 'Ø', 'দ্ম': 'Ù', 'ন্ঠ': 'Ú', 'ন্ড': 'Û', 'ন্ধ': 'Ü', 'ন্স': 'Ý',
  'প্ট': 'Þ', 'প্ত': 'ß', 'প্প': 'à', 'প্স': 'á', 'ব্জ': 'â', 'ব্দ': 'ã', 'ব্ধ': 'ä',
  'ভ্র': 'å', 'ম্ফ': 'ç', 'ল্ক': 'é', 'ল্গ': 'ê', 'ল্ট': 'ë', 'ল্ড': 'ì', 'ল্প': 'í',
  'ল্ফ': 'î', 'শ্চ': 'ð', 'শ্ছ': 'ñ', 'ষ্ণ': 'ò', 'ষ্ট': 'ó', 'ষ্ঠ': 'ô', 'ষ্ফ': 'õ',
  'স্খ': 'ö', 'স্ট': '÷', 'স্ন': 'ø', 'স্ফ': 'ù', 'হ্ন': 'ý', 'হ্ম': 'þ',
  // Half-form + glyph pairs from unicode2ascii
  'ন্ত': 'šÍ', 'ন্তু': 'š‘', 'ন্ত্র': 'š¿', 'ন্ত্ব': 'šÍ¡', 'ন্থ': 'š’', 'ন্দ': '›`',
  'ন্ট': '›U', 'ন্দ্ব': '›Ø', 'ন্ব': 'š^', 'ন্ন': 'bœ', 'ন্ম': 'b¥',
  'স্ত': '¯Í', 'স্তু': '¯‘', 'স্ত্র': '¯¿', 'স্থ': '¯’', 'স্ক': '¯‹', 'স্ক্র': '¯Œ',
  'স্প': '¯ú', 'স্ব': '¯^', 'স্ম': '¯§', 'স্ল': '¯¬',
  'ষ্ক': '®‹', 'ষ্ক্র': '®Œ', 'ষ্প': '®ú', 'ষ্ম': '®§',
  'ম্প': '¤ú', 'ম্ব': '¤^', 'ম্ভ': '¤¢', 'ম্ভ্র': '¤£', 'ম্ম': '¤§', 'ম্ল': '¤¬',
  'ঙ্ক্ষ': '•ÿ', 'ঙ্খ': '•L', 'ঙ্ঘ': '•N',
  'চ্চ': '”P', 'চ্ছ': '”Q', 'চ্ছ্ব': '”Q¡', 'চ্ঞ': '”T',
  'দ্গ': '˜M', 'দ্ঘ': '˜N', 'দ্ভ': '™¢',
  'জ্ব': 'R¡', 'ত্ব': 'Z¡', 'ত্ত্ব': 'Ë¡', 'থ্ব': '_¡', 'ত্ম': 'Z¥',
  // Consonant + vowel-sign ligatures
  'গু': '¸', 'শু': 'ï', 'হু': 'û', 'হৃ': 'ü', 'রু': 'i“', 'রূ': 'iƒ',
};

/** Half (pre-hasanta) forms used when no conjunct glyph exists. */
const HALF_GLYPH: Record<string, string> = {
  'ঙ্': '•', 'চ্': '”', 'দ্': '˜', 'ন্': 'š', 'ম্': '¤', 'ষ্': '®', 'স্': '¯',
};

/** Below/after-base forms (phalas). */
const PHALA_GLYPH: Record<string, string> = {
  '্য': '¨', '্র': 'Ö', '্ব': '¡', '্ল': '¬', '্ম': '¥', '্ন': 'œ', '্ক': '‹',
  '্ক্র': 'Œ', '্ত': 'Í', '্তু': '‘', '্থ': '’', '্প': 'ú', '্ভ': '¢', '্ভ্র': '£',
  '্ত্র': '¿',
};

const KAR_GLYPH: Record<string, string> = {
  'া': 'v', 'ি': 'w', 'ী': 'x', 'ু': 'y', 'ূ': '~', 'ৃ': '…', 'ে': '‡', 'ৈ': '‰', 'ৗ': 'Š',
};

const OTHER_GLYPH: Record<string, string> = {
  অ: 'A', আ: 'Av', ই: 'B', ঈ: 'C', উ: 'D', ঊ: 'E', ঋ: 'F', এ: 'G', ঐ: 'H', ও: 'I', ঔ: 'J',
  'ং': 's', 'ঃ': 't', 'ঁ': 'u', 'ৎ': 'r', '্': '&',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  '।': '|', '॥': '||',
  '“': 'Ò', '”': 'Ó', '‘': 'Ô', '’': 'Õ',
  '‌': '', '‍': '',
};

const lookupMax = (table: Record<string, string>): number =>
  Math.max(...Object.keys(table).map((k) => k.length));
const CONJ_MAX = lookupMax(CONJUNCT_GLYPH);
const PHALA_MAX = lookupMax(PHALA_GLYPH);

function longest(table: Record<string, string>, max: number, s: string, at: number): string | null {
  for (let len = Math.min(max, s.length - at); len >= 2; len--) {
    const key = s.substr(at, len);
    if (key in table) return key;
  }
  return null;
}

/** ্ব takes a different glyph after some letters in SutonnyMJ. */
function baFalaGlyph(prev: string): string {
  if ('ণনমস'.includes(prev)) return '^';
  if ('লশ'.includes(prev)) return '¦';
  if ('ধব'.includes(prev)) return 'Ÿ';
  return '¡';
}

/**
 * Encode a consonant cluster (C, ্, ZWNJ only) into SutonnyMJ glyphs, using
 * conjunct glyphs where they exist and half forms / phalas / & otherwise.
 */
function encodeCluster(s: string): string {
  let out = '';
  let p = 0;
  while (p < s.length) {
    const c = s[p];
    if (c === HASANTA || c === ZWNJ) {
      if (c === ZWNJ) {
        p++;
        continue;
      }
      const ph = longest(PHALA_GLYPH, PHALA_MAX, s, p);
      if (ph) {
        out += ph === '্ব' ? baFalaGlyph(s[p - 1]) : PHALA_GLYPH[ph];
        p += ph.length;
      } else {
        out += '&';
        p++;
      }
      continue;
    }
    const conj = longest(CONJUNCT_GLYPH, CONJ_MAX, s, p);
    if (conj && conj.length > 2) {
      out += CONJUNCT_GLYPH[conj];
      p += conj.length;
      continue;
    }
    // Prefer base + phala (e.g. ন্য = b¨) over a half form.
    if (s[p + 1] === HASANTA && longest(PHALA_GLYPH, PHALA_MAX, s, p + 1)) {
      out += CONSONANT_GLYPH[c] ?? c;
      p++;
      continue;
    }
    const half = s.substr(p, 2);
    if (half in HALF_GLYPH && isCons(s[p + 2])) {
      out += HALF_GLYPH[half];
      p += 2;
      continue;
    }
    out += CONSONANT_GLYPH[c] ?? c;
    p++;
  }
  return out;
}

/** Convert Unicode Bangla to Bijoy (SutonnyMJ) ANSI text. */
export function fromUnicode(s: string): string {
  if (!s) return '';
  const a = s
    .normalize('NFC')
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/য়/g, 'য়')
    .split('');
  let out = '';
  let i = 0;
  while (i < a.length) {
    let reph = false;
    let j = i;
    if (a[j] === 'র' && a[j + 1] === HASANTA && isCons(a[j + 2])) {
      reph = true;
      j += 2;
    }
    if (!isCons(a[j])) {
      const c = a[i];
      out += OTHER_GLYPH[c] ?? KAR_GLYPH[c] ?? (c === 'ো' ? '‡v' : c === 'ৌ' ? '‡Š' : c);
      i++;
      continue;
    }

    // Consonant cluster: C (্ C)* with র‌্য allowed.
    let k = j + 1;
    for (;;) {
      if (a[k] === HASANTA && isCons(a[k + 1])) k += 2;
      else if (a[k] === ZWNJ && a[k + 1] === HASANTA && a[k + 2] === 'য' && a[k - 1] === 'র') k += 3;
      else break;
    }
    const cluster = a.slice(j, k).join('');

    // Vowel sign: pre-base glyph, post-base Unicode sign
    let pre = '';
    let post = '';
    const v = a[k];
    if (v === 'ি' || v === 'ে' || v === 'ৈ') {
      pre = KAR_GLYPH[v];
      k++;
    } else if (v === 'ো' || v === 'ৌ') {
      pre = '‡';
      post = v === 'ো' ? 'া' : 'ৗ';
      k++;
    } else if (v !== undefined && v in KAR_GLYPH) {
      post = v;
      k++;
    }

    let body: string;
    let tail = '';
    if (post && (cluster + post) in CONJUNCT_GLYPH) {
      body = CONJUNCT_GLYPH[cluster + post]; // গু শু হু হৃ রু রূ ন্তু স্তু
    } else if (post === 'ু' && cluster.endsWith('্ত')) {
      body = encodeCluster(cluster.slice(0, -2)) + '‘'; // ্তু
    } else {
      body = encodeCluster(cluster);
      tail = post ? KAR_GLYPH[post] : '';
    }

    let signs = '';
    while (a[k] === 'ঁ' || a[k] === 'ং' || a[k] === 'ঃ') signs += OTHER_GLYPH[a[k++]];

    out += pre + body + (reph ? '©' : '') + tail + signs;
    i = k;
  }
  return out;
}
