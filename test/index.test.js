import test from 'node:test';
import assert from 'node:assert/strict';
import { krutidev, preeti, bijoy, bamini, fmabhaya, zawgyi } from '../dist/index.js';

const cases = [
  ['krutidev', krutidev, "Hkkjr ,d fo'kky ns'k gS", 'भारत एक विशाल देश है'],
  ['preeti', preeti, 'g]kfn xfd|f] b]z xf]', 'नेपाल हाम्रो देश हो'],
  ['bijoy', bijoy, 'Avwg evsjvq Mvb MvB', 'আমি বাংলায় গান গাই'],
  ['bamini', bamini, 'jkpo; xU mofhd nkhop', 'தமிழ் ஒரு அழகான மொழி'],
  ['fmabhaya', fmabhaya, "› ,xldj ,iaik rgls'", 'ශ්‍රී ලංකාව ලස්සන රටකි.'],
  ['zawgyi', zawgyi, 'ျမန္မာ', 'မြန်မာ']
];

for (const [name, mod, legacy, unicode] of cases) {
  test(`${name}: to Unicode`, () => assert.equal(mod.toUnicode(legacy).normalize('NFC'), unicode.normalize('NFC')));
  test(`${name}: round trip`, () => assert.equal(mod.toUnicode(mod.fromUnicode(unicode)).normalize('NFC'), unicode.normalize('NFC')));
}
