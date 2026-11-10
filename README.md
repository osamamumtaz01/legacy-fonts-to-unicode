# legacy-fonts-to-unicode

Convert text typed in legacy "ASCII" fonts to Unicode, and back:

| Module | Font | Script |
|---|---|---|
| `krutidev` | Kruti Dev 010 | Hindi (Devanagari) |
| `preeti` | Preeti | Nepali (Devanagari) |
| `bijoy` | Bijoy / SutonnyMJ | Bangla |
| `bamini` | Bamini | Tamil |
| `fmabhaya` | FM Abhaya and the other FM fonts | Sinhala |
| `zawgyi` | Zawgyi-One | Myanmar |

No dependencies. Works in Node and the browser.

Try them in the browser: [Kruti Dev to Unicode](https://treeet.com/krutidev-to-unicode/) ·
[Preeti to Unicode](https://treeet.com/preeti-to-unicode/) · [Bijoy to Unicode](https://treeet.com/bijoy-to-unicode/) ·
[Bamini to Unicode](https://treeet.com/bamini-to-unicode/) · [Zawgyi to Unicode](https://treeet.com/zawgyi-to-unicode/) ·
[all font converters](https://treeet.com/font-converters/)

```sh
npm install legacy-fonts-to-unicode
```

```js
import { krutidev, preeti, bijoy, zawgyi } from 'legacy-fonts-to-unicode';
// or one converter only:
import { toUnicode, fromUnicode } from 'legacy-fonts-to-unicode/krutidev';

krutidev.toUnicode("Hkkjr ,d fo'kky ns'k gS");  // 'भारत एक विशाल देश है'
krutidev.fromUnicode('भारत');                   // 'Hkkjr'
preeti.toUnicode('g]kfn');                       // 'नेपाल'
bijoy.toUnicode('Avwg evsjvq Mvb MvB');          // 'আমি বাংলায় গান গাই'
zawgyi.toUnicode('ျမန္မာ');                      // 'မြန်မာ'
zawgyi.zawgyiProbability('ျမန္မာ');              // about 0.9: likely Zawgyi
```

Each module exports `toUnicode(text)` and `fromUnicode(text)`.

## Why these fonts need converting

These fonts draw letters over the codes of English keys, so Kruti Dev "Hkkjr" only shows
as भारत when the font is installed. Unicode gives every letter its own code, so the text
works on phones, in email and on the web, and can be searched. Offices, courts, printers
and exam boards across South Asia still use the old fonts, so text goes both ways.

## What to watch for

- English words inside legacy text can't be told apart from the font's letter codes, so
  they come out as script letters. Retype them after converting.
- In Kruti Dev a colon right after a word shares a code with the visarga (ः).
- Legacy fonts can't hold English letters, so keep English in a separate font after
  `fromUnicode`.

## Credits and licence

The character tables and rules are adapted from open-source projects. Each source file
names its sources and keeps their licence notice; [NOTICE](NOTICE) lists them all. The
Zawgyi converter is adapted from Google's myanmar-tools under the Apache License 2.0
([LICENSE-APACHE](LICENSE-APACHE)); everything else is MIT ([LICENSE](LICENSE)).

Made for [Treeet](https://treeet.com/), free file tools that run in your browser.
