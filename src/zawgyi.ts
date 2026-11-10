// Zawgyi-One <-> Myanmar Unicode.
//
// The conversion rules and the phase-by-phase rule engine are ported from
// Google's "myanmar-tools" (https://github.com/google/myanmar-tools,
// npm "myanmar-tools" 1.2.0, files resources/Z2U.js, resources/U2Z.js and
// src/zawgyi_converter.ts). These are the same transliteration rules that ICU
// and Android use for "Zawgyi-my".
//
//   Copyright 2017 Google LLC
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//
// Modifications in this package: the rules are stored as compact tuples, the
// engine walks the string with sticky regexes instead of re-slicing it (linear
// instead of quadratic on long pastes), Unicode output is NFC-normalised, the
// two end-of-text digit rules no longer fire after whitespace (so "... 4" at the
// end of a text stays a four instead of becoming the lagaung sign), and
// zawgyiProbability() is a small hand-written heuristic rather than Google's
// Markov model (which would add ~28 KB of binary data).

/** [pattern (anchored at the current position), replacement ($1...), flags] */
type Rule = [string, string, number?];
type Phase = Rule[];

/** Rule only applies at the very start of the string. */
const AT_START = 1;
/** After replacing, keep the replacement in the input so later rules see it. */
const REVISIT = 2;

// Rules: myanmar-tools resources/Z2U.js and resources/U2Z.js, one array per phase.
const Z2U: Phase[] = [
  [
    ['([\u1000-\u1021])\u103A\u1064', '\u1004\u103A\u1039$1\u103B'],
    ['([\u1000-\u1021])\u1064', '\u1004\u103A\u1039$1'],
    ['\u1064', '\u1004\u103A\u1039'],
    ['([\u1000-\u1021])\u108B', '\u1004\u103A\u1039$1\u102D'],
    ['([\u1000-\u1021])\u108C', '\u1004\u103A\u1039$1\u102E'],
    ['([\u1000-\u1021])\u108D', '\u1004\u103A\u1039$1\u1036'],
    ['([\u1000-\u1021])\u103A\u1033\u108B', '\u1004\u103A\u1039$1\u103B\u102D\u102F'],
    ['([\u1000-\u1021])\u103A\u108B', '\u1004\u103A\u1039$1\u103B\u102D'],
    ['([\u1000-\u1021])\u103A\u108C', '\u1004\u103A\u1039$1\u103B\u102E'],
    ['([\u1000-\u1021])\u103A\u108D', '\u1004\u103A\u1039$1\u103B\u1036'],
    ['([\u1000-\u1021])\u103A\u108E', '$1\u103B\u102D\u1036'],
    ['\u108B', '\u1004\u103A\u1039\u102D'],
    ['\u108C', '\u1004\u103A\u1039\u102E'],
    ['\u108D', '\u1004\u103A\u1039\u1036'],
    ['\u106A', '\u1009'],
    ['\u106B', '\u100A'],
    ['\u108F', '\u1014'],
    ['\u1090', '\u101B'],
    ['\u1086', '\u103F'],
    ['[\u103A\u107D]', '\u103B'],
    ['([\u103B\u107E-\u1084])+', '\u103C'],
    ['\u103C*\u108A', '\u103D\u103E'],
    ['\u103C', '\u103D'],
    ['[\u103D\u1087]', '\u103E'],
    ['\u1088', '\u103E\u102F'],
    ['\u1089', '\u103E\u1030'],
    ['\u1033', '\u102F'],
    ['\u1034', '\u1030'],
    ['\u1039', '\u103A'],
    ['[\u1094\u1095]', '\u1037'],
    ['\u1025\u1039', '\u1009\u103A'],
    ['\u1025\u1061', '\u1009\u1039\u1001'],
    ['\u1025\u1062', '\u1009\u1039\u1002'],
    ['\u1025\u1065', '\u1009\u1039\u1005'],
    ['\u1025\u1068', '\u1009\u1039\u1007'],
    ['\u1025\u1076', '\u1009\u1039\u1013'],
    ['\u1025\u1078', '\u1009\u1039\u1015'],
    ['\u1025\u107A', '\u1009\u1039\u1017'],
    ['\u1025\u1079', '\u1009\u1039\u1016'],
    ['\u105A', '\u102B\u103A'],
    ['\u1060', '\u1039\u1000'],
    ['\u1061', '\u1039\u1001'],
    ['\u1062', '\u1039\u1002'],
    ['\u1063', '\u1039\u1003'],
    ['\u1065', '\u1039\u1005'],
    ['[\u1066\u1067]', '\u1039\u1006'],
    ['\u1068', '\u1039\u1007'],
    ['\u1069', '\u1039\u1008'],
    ['\u106C', '\u1039\u100B'],
    ['\u106D', '\u1039\u100C'],
    ['\u1070', '\u1039\u100F'],
    ['[\u1071\u1072]', '\u1039\u1010'],
    ['\u1096', '\u1039\u1010\u103D'],
    ['[\u1073\u1074]', '\u1039\u1011'],
    ['\u1075', '\u1039\u1012'],
    ['\u1076', '\u1039\u1013'],
    ['\u1077', '\u1039\u1014'],
    ['\u1078', '\u1039\u1015'],
    ['\u1079', '\u1039\u1016'],
    ['\u107A', '\u1039\u1017'],
    ['[\u107B\u1093]', '\u1039\u1018'],
    ['\u107C', '\u1039\u1019'],
    ['\u1085', '\u1039\u101C'],
    ['\u108E', '\u102D\u1036'],
    ['\u106E', '\u100D\u1039\u100D'],
    ['\u106F', '\u100D\u1039\u100E'],
    ['\u1091', '\u100F\u1039\u100D'],
    ['\u1092', '\u100B\u1039\u100C'],
    ['\u1097', '\u100B\u1039\u100B'],
    ['\u104E', '\u104E\u1004\u103A\u1038'],
  ],
  [
    ['\u1040([^\u1040-\u1049])', '\u101D$1', 1],
    ['\u1044([^\u1040-\u1049])', '\u104E$1', 3],
    ['([^\u1040-\u1049\\s])\u1040$', '$1\u101D'],  // site change: not after whitespace ("... ၀" stays a zero)
    ['([^\u1040-\u1049\\s])\u1044$', '$1\u104E'],  // site change: "အပိုဒ် ၄" keeps the four
    ['([\u102B-\u103F])\u1040([^\u1040-\u1049])', '$1\u101D$2'],
    ['([\u102B-\u103F])\u1044([^\u1040-\u1049])', '$1\u104E$2'],
    ['\u1047(?=[\u102B-\u103E])', '\u101B'], // site addition: 7 carrying a vowel sign or medial is the letter ra
    ['\u1031\u1047', '\u1031\u101B'], // site addition: e-vowel + 7 is e-vowel + ra
  ],
  [
    ['([ \u00A0\u1680\u2000-\u200D\u202F\u205F\u2060\u3000\uFEFF])\u1037', '\u1037$1'],
    ['([ \u00A0\u1680\u2000-\u200D\u202F\u205F\u2060\u3000\uFEFF]+)([\u102B-\u1030\u1032-\u103B\u103D\u103E])', '$2'],
    ['\u1037+', '\u1037'],
    ['\u1031+\u1004\u103A\u1039([\u1000-\u1021])', '\u1004\u103A\u1039$1\u1031'],
    ['\u1031+\u1037+([\u1000-\u1021])', '$1\u1031\u1037'],
    ['\u1031+\u103C([\u1000-\u1021])', '$1\u103C\u1031'],
    ['\u1031+([\u1000-\u1021])([\u103B\u103D\u103E]+)', '$1$2\u1031'],
    ['\u1031+([\u1000-\u102A])', '$1\u1031'],
  ],
  [
    ['\u103B\u103A', '\u103A\u103B'],
    ['\u1025\u102E', '\u1026'],
    ['\u103A\u1037', '\u1037\u103A'],
    ['\u1036([\u103B-\u103E]*)([\u102B-\u1030\u1032]+)', '$1$2\u1036'],
    ['([\u102B\u102C\u102F\u1030])([\u102D\u102E\u1032])', '$2$1'],
    ['\u103C([\u1000-\u1021])', '$1\u103C'],
  ],
  [
    ['([\u103B-\u103E])\u1039([\u1000-\u1021])', '\u1039$2$1'],
    ['\u103C\u103A\u1039([\u1000-\u1021])', '\u103A\u1039$1\u103C'],
    ['\u1036([\u103B-\u103E]+)', '$1\u1036'],
  ],
  [
    ['([\u103C-\u103E]+)\u103B', '\u103B$1'],
    ['([\u103D\u103E]+)\u103C', '\u103C$1'],
    ['\u103E\u103D', '\u103D\u103E'],
    ['([\u1031]+)([\u102B-\u1030\u1032]*)\u1039([\u1000-\u1021])', '\u1039$3$1$2'],
    ['([\u102B-\u1030\u1032]+)\u1039([\u1000-\u1021])', '\u1039$2$1'],
    ['([\u103B-\u103E]*)([\u1031]+)([\u103B-\u103E]*)', '$1$3$2'],
    ['\u1037([\u102D-\u1030\u1032\u1036\u103B-\u103E]+)', '$1\u1037'],
    ['([\u102B-\u1030\u1032]+)([\u103B-\u103E]+)', '$2$1'],
    ['([\u1000-\u1021])([\u102B-\u1032\u1036\u103B-\u103E])\u103A([\u1000-\u1021])', '$1\u103A$2$3'],
  ],
  [
    ['\u1005\u103B', '\u1008'],
    ['([\u102B-\u1032])([\u103B-\u103E])', '$2$1'],
    ['([\u103C-\u103E])\u103B', '\u103B$1'],
    ['([\u103D\u103E])\u103C', '\u103C$1'],
    ['\u103E\u103D', '\u103D\u103E'],
    ['\u1038([\u000136u\u102B-\u1030\u1032\u1037\u103A-\u103F])', '$1\u1038'],
    ['\u1036\u102F', '\u102F\u1036'],
  ],
  [
    ['\u102D\u102D+', '\u102D'],
    ['\u102E\u102E+', '\u102E'],
    ['\u102F\u102F+', '\u102F'],
    ['\u1030\u1030+', '\u1030'],
    ['\u1032\u1032+', '\u1032'],
    ['\u1036\u1036+', '\u1036'],
    ['\u1037\u1037+', '\u1037'],
    ['\u1039\u1039+', '\u1039'],
    ['\u103A\u103A+', '\u103A'],
    ['\u103B\u103B+', '\u103B'],
    ['\u103C\u103C+', '\u103C'],
    ['\u103D\u103D+', '\u103D'],
    ['\u103E\u103E+', '\u103E'],
    ['\u102F[\u1030\u103A]', '\u102F'],
    ['\u102D\u102E', '\u102E'],
    ['([ \u00A0\u1680\u2000-\u200D\u202F\u205F\u2060\u3000\uFEFF])+([\u102B-\u1032\u1036-\u103E])', '$2'],
    ['\u200B+', '', 1],
    ['\u200B+$', ''],
    ['[ \u00A0\u1680\u2000-\u200D\u202F\u205F\u2060\u3000\uFEFF]*\u200B[ \u00A0\u1680\u2000-\u200D\u202F\u205F\u2060\u3000\uFEFF]*', '\u200B'],
  ],
];

const U2Z: Phase[] = [
  [
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u103B', '$1\u103A\u1064'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u102D\u1036', '$1\u108E'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u102D', '$1\u108B'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u102E', '$1\u108C'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u1036', '$1\u108D'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u1031', '$1\u1031\u1064'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u103B\u102D\u102F', '$1\u103A\u1033\u108B'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u103B\u102D', '$1\u103A\u108B'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u103B\u102E\u102F', '$1\u103A\u108C\u1033'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u103B\u102E', '$1\u103A\u108C'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u103B\u1036', '$1\u103A\u108D'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])\u103C', '$1\u103B\u1064'],
    ['[\u1004\u101B\u105A]\u103A\u1039\u102D', '\u108B'],
    ['[\u1004\u101B\u105A]\u103A\u1039\u102E', '\u108C'],
    ['[\u1004\u101B\u105A]\u103A\u1039\u1036', '\u108D'],
    ['[\u1004\u101B\u105A]\u103A\u1039([\u1000-\u1021])', '$1\u1064'],
    ['\u1025([\u102B-\u1030\u1032])\u1038', '\u106A$1\u1038'],
    ['\u1025\u102F\u1036', '\u1025\u1036\u1033'],
    ['\u102D\u1036', '\u108E'],
    ['\u103D\u103E', '\u108A'],
    ['\u103E\u102F', '\u1088'],
    ['\u103E\u1030', '\u1089'],
    ['\u103A', '\u1039'],
    ['\u103B', '\u103A'],
    ['\u103C', '\u103B'],
    ['\u103D', '\u103C'],
    ['\u103E', '\u103D'],
    ['\u103F', '\u1086'],
    ['([\u1019])\u103E\u1030', '$1\u103D\u1034'],
    ['\u102B\u103A', '\u105A'],
    ['\u1039\u1010\u103D', '\u1096'],
    ['\u1039\u1000', '\u1060'],
    ['\u1039\u1001', '\u1061'],
    ['\u1039\u1002', '\u1062'],
    ['\u1039\u1003', '\u1063'],
    ['\u1039\u1005', '\u1065'],
    ['\u1039\u1006', '\u1067'],
    ['\u1039\u1007', '\u1068'],
    ['\u1039\u1008', '\u1069'],
    ['\u1039\u100B', '\u106C'],
    ['\u1039\u100C', '\u106D'],
    ['\u1039\u100F', '\u1070'],
    ['\u1039\u1010', '\u1072'],
    ['\u1039\u1011', '\u1074'],
    ['\u1039\u1012', '\u1075'],
    ['\u1039\u1013', '\u1076'],
    ['\u1039\u1014', '\u1077'],
    ['\u1039\u1015', '\u1078'],
    ['\u1039\u1016', '\u1079'],
    ['\u1039\u1017', '\u107A'],
    ['\u1039\u1018', '\u1093'],
    ['\u1039\u1019', '\u107C'],
    ['\u1039\u101C', '\u1085'],
    ['\u100D\u1039\u100D', '\u106E'],
    ['\u100D\u1039\u100E', '\u106F'],
    ['\u100F\u1039\u100D', '\u1091'],
    ['\u100B\u1039\u100C', '\u1092'],
    ['\u100B\u1039\u100B', '\u1097'],
    ['\u104E\u1004\u103A\u1038', '\u104E'],
  ],
  [
    ['\u1014([\u1060-\u1068\u106C\u106D\u1070-\u107C\u1085\u1093\u1096])([\u102D\u102E\u1032\u1036\u1039\u1064]*)\u103B', '\u103B\u108F$1$2'],
    ['\u1014\u103B([\u103C\u103D]*)(\u1031*)', '$2\u103B\u108F$1'],
    ['([\u1000-\u1021])\u103B([\u103C\u103D]*)\u1031', '\u1031\u103B$1$2'],
    ['([\u1000-\u1021])\u103B', '\u103B$1'],
    ['([\u1000-\u1021])\u103D\u1031\u1037', '\u1031$1\u1094\u103D'],
    ['([\u1000-\u1021])(\u108A)\u1031', '\u1031$1$2'],
    ['([\u1000-\u1021])\u1064\u103B', '\u103B$1\u1064'],
    ['([\u1000-\u1021])([\u103A\u103C\u103D]+)\u1031', '\u1031$1$2'],
    ['([\u1000-\u1021])([\u1060-\u1068\u106C\u106D\u1070-\u107C\u1085\u1093\u1096])([\u102D\u102E\u1032\u1036\u1039\u1064]*)\u103B', '\u103B$1$2$3'],
    ['([\u1000-\u102A])\u1031', '\u1031$1'],
    ['\u1014([\u1060-\u1068\u106C\u106D\u1070-\u107C\u1085\u1093\u1096])', '\u108F$1'],
    ['\u1014([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A])([\u102D\u102E\u1032\u1036\u1039\u1064])\u1037', '\u108F$1$2\u1094'],
    ['\u1014([\u102D\u102E\u1032\u1036\u1039\u1064])([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A])\u1037', '\u108F$1$2\u1094'],
    ['\u1014([\u102D\u102E\u1032\u1036\u1039\u1064])\u1037', '\u1014$1\u1094'],
    ['\u1014\u1032\u1037', '\u1014\u1032\u1094'],
    ['\u1014\u1037', '\u1014\u1094'],
    ['\u1014\u1032([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A])\u1037', '\u108F$1\u1032\u1094'],
    ['\u1014([\u102D\u102E\u1032\u1036\u1039\u1064])([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A])', '\u108F$1$2'],
    ['\u1014([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A])([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u108F$1$2'],
    ['\u1014([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A])\u1037', '\u108F$1\u1094'],
    ['\u1014([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A])', '\u108F$1'],
    ['([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A])([\u102D\u102E\u1032\u1036\u1039\u1064]*)\u1037', '$1$2\u1094'],
    ['([^\u1040-\u1049])\u1040([\u102B-\u103F])', '$1\u101D$2'],
    ['([^\u1040-\u1049])\u104E', '$1\u1044'],
    ['\u1031\u1040([^\u1040-\u1049])', '\u1031\u101D$1'],
    ['\u1009\u103A', '\u1025\u103A'],
    ['\u1025\u102E', '\u1026'],
    ['\u1037\u103A', '\u103A\u1037'],
    ['([\u102B\u102C\u102F\u1030])([\u102D\u102E\u1032])', '$2$1'],
  ],
  [
    ['\u103A\u103C', '\u103C\u107D'],
    ['\u103C\u1094', '\u103C\u1095'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])([\u1060-\u1068\u106C\u106D\u1070-\u107C\u1085\u1093\u1096])([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u1083$1$2$3'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])([\u1060-\u1068\u106C\u106D\u1070-\u107C\u1085\u1093\u1096])([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u1084$1$2$3'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])([\u1060-\u1068\u106C\u106D\u1070-\u107C\u1085\u1093\u1096])', '\u1081$1$2'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])([\u1060-\u1068\u106C\u106D\u1070-\u107C\u1085\u1093\u1096])', '\u1082$1$2'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])([\u103C\u108A])([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u1083$1$2$3'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])([\u103C\u108A])([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u1084$1$2$3'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])\u103D([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u107F$1\u1087$2'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])\u103D([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u1080$1\u1087$2'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])\u102F([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u107F$1\u1033$2'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])\u102F([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u1080$1\u1033$2'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])\u1030([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u107F$1\u1034$2'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])\u1030([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u1080$1\u1034$2'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A]*)([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u107F$1$2$3'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A]*)([\u102D\u102E\u1032\u1036\u1039\u1064])', '\u1080$1$2$3'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])([\u103C\u108A])', '\u1081$1$2'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])([\u103C\u108A])', '\u1082$1$2'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])\u103D', '\u103B$1\u1087'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])\u103D', '\u107E$1\u1087'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])\u102F', '\u103B$1\u1033'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])\u102F', '\u107E$1\u1033'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])\u1030', '\u103B$1\u1034'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])\u1030', '\u107E$1\u1034'],
    ['[\u103B\u107E-\u1084]([\u100A\u106B])', '\u1082$1'],
    ['[\u103B\u107E-\u1084]([\u1009\u106A])', '\u103B\u106A'],
    ['[\u103B\u107E-\u1084]([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])', '\u103B$1'],
    ['[\u103B\u107E-\u1084]([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])', '\u107E$1'],
    ['\u1009([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A])', '\u106A$1'],
    ['\u100A([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A])', '\u106B$1'],
    ['\u103D\u102D', '\u102D\u103D'],
    ['\u103A([\u102D\u102E\u1032\u1036\u1039\u1064])\u102F[\u1037\u1094\u1095]', '\u103A$1\u1033\u1095'],
    ['\u103A\u102F[\u1037\u1094\u1095]', '\u103A\u1033\u1095'],
    ['\u103A\u102F', '\u103A\u1033'],
    ['\u1064\u102E', '\u108C'],
  ],
  [
    ['\u1037([\u102D-\u1030\u1032\u1036])', '$1\u1037'],
    ['([\u1000-\u1021])([\u102B-\u1032\u1036\u103B-\u103E])\u103A([\u1000-\u1021])', '$1\u103A$2$3'],
    ['\u103D\u102F', '\u1088'],
    ['\u1033\u1094', '\u1033\u1095'],
    ['([\u103B\u107E-\u1084])([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A]*)([\u102D\u102E\u1032\u1036\u1039\u1064]*)\u102F', '$1$2$3$4\u1033'],
    ['([\u103B\u107E-\u1084])([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A]*)([\u102D\u102E\u1032\u1036\u1039\u1064]*)\u102F', '$1$2$3$4\u1033'],
    ['([\u103B\u107E-\u1084])([\u1001\u1002\u1004\u1005\u1007\u100B-\u100E\u1012\u1013\u1015-\u1017\u1019\u101D\u1020\u1025\u1026\u108F])([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A]*)([\u102D\u102E\u1032\u1036\u1039\u1064]*)\u1030', '$1$2$3$4\u1034'],
    ['([\u103B\u107E-\u1084])([\u1000\u1003\u1006\u1009\u100A\u100F-\u1011\u1018\u101C\u101E\u101F\u1021])([\u102F\u1030\u1037\u103C\u103D\u1087-\u108A]*)([\u102D\u102E\u1032\u1036\u1039\u1064]*)\u1030', '$1$2$3$4\u1034'],
  ],
  [
    ['([\u103D\u103E])\u103C', '\u103C$1'],
    ['\u103E\u103D', '\u103D\u103E'],
    ['\u1038([\u102B-\u1030\u1032\u103C-\u103F])', '$1\u1038'],
    ['\u1038([\u1036\u1037\u103A])', '$1\u1038'],
    ['\u103A([\u1064\u108B-\u108E])\u102D\u102F', '\u103A$1\u102D\u1033'],
    ['\u103A\u102D\u102F', '\u103A\u102D\u1033'],
  ],
  [
    ['([\u1000-\u1021])\u103B\u103A', '$1\u103A\u103B'],
    ['([\u103C-\u103E])\u103B', '\u103B$1'],
    ['([\u103D\u103E])\u103C', '\u103C$1'],
    ['\u103E\u103D', '\u103D\u103E'],
    ['([\u102D-\u1030\u1032])\u103A([\u1000-\u1021])\u103A', '$1$2\u103A'],
    ['\u102D\u103A', '\u102D'],
    ['\u102E\u103A', '\u102E'],
    ['\u102F\u103A', '\u102F'],
    ['\u102D\u102E', '\u102E'],
    ['\u102F\u1030', '\u102F'],
    ['\u102B\u102B+', '\u102B'],
    ['\u102C\u102C+', '\u102C'],
    ['\u102D\u102D+', '\u102D'],
    ['\u102E\u102E+', '\u102E'],
    ['\u102F\u102F+', '\u102F'],
    ['\u1030\u1030+', '\u1030'],
    ['\u1031\u1031+', '\u1031'],
    ['\u1032\u1032+', '\u1032'],
    ['\u1036\u1036+', '\u1036'],
    ['\u103A\u103A+', '\u103A'],
    ['\u103B\u103B+', '\u103B'],
    ['\u103C\u103C+', '\u103C'],
    ['\u103D\u103D+', '\u103D'],
    ['\u103E\u103E+', '\u103E'],
    ['([\u102F\u1033])\u102D', '\u102D$1'],
    ['([\u102F\u1033])\u1036', '\u1036$1'],
    ['\u1037\u1039', '\u1039\u1037'],
    ['\u1032\u103C', '\u103C\u1032'],
    ['\u102E\u103C', '\u103C\u102E'],
    ['\u103D\u1088', '\u1088'],
  ],
];

interface CompiledRule { re: RegExp; sub: string; flags: number }

const compile = (phases: Phase[]): CompiledRule[][] =>
  phases.map((phase) => phase.map(([p, sub, flags = 0]) => ({ re: new RegExp(p, 'y'), sub, flags })));

let z2u: CompiledRule[][] | undefined;
let u2z: CompiledRule[][] | undefined;

const expand = (sub: string, m: RegExpExecArray) => sub.replace(/\$(\d)/g, (_, d: string) => m[+d] ?? '');

/**
 * One phase, with the same semantics as myanmar-tools' runPhase(): at each
 * position the rules are tried in order; a match emits its replacement and the
 * remaining rules continue from the new position; when no rule matched, one
 * code unit is copied through.
 */
function runPhase(rules: CompiledRule[], input: string): string {
  const out: string[] = [];
  let src = input;
  let i = 0;
  let atStart = true;
  while (i < src.length) {
    let found = false;
    for (const rule of rules) {
      if (rule.flags & AT_START && !atStart) continue;
      rule.re.lastIndex = i;
      const m = rule.re.exec(src);
      if (!m) continue;
      found = true;
      const rep = expand(rule.sub, m);
      if (rule.flags & REVISIT) {
        src = rep + src.slice(i + m[0].length);
        i = 0;
      } else {
        out.push(rep);
        i += m[0].length;
      }
    }
    if (!found) out.push(src[i++]);
    atStart = false;
  }
  return out.join('');
}

const runAll = (phases: CompiledRule[][], s: string) => phases.reduce((acc, rules) => runPhase(rules, acc), s);

/** Zawgyi-encoded text -> standard Myanmar Unicode (NFC). Non-Myanmar text passes through. */
export function toUnicode(s: string): string {
  return runAll((z2u ??= compile(Z2U)), s).normalize('NFC');
}

/** Myanmar Unicode -> Zawgyi encoding (for display with the Zawgyi-One font). */
export function fromUnicode(s: string): string {
  return runAll((u2z ??= compile(U2Z)), s.normalize('NFC'));
}

// ---------------------------------------------------------------------------
// Zawgyi detector (heuristic, written for this package; not from myanmar-tools).
//
// Zawgyi reuses Unicode code points with different meanings: U+1039 is its
// asat (Unicode: virama), U+103A its ya-pin (Unicode: asat), U+103B its
// ya-yit (Unicode: ya-pin), U+103C/D its wa/ha (Unicode: ya-yit/wa), and it
// types the e-vowel (U+1031) and ya-yit before the consonant. It also uses
// U+1060-U+1097 for stacked and alternate glyphs. Each pattern below is
// evidence for one encoding; positive weights favour Zawgyi.
// ---------------------------------------------------------------------------

const FEATURES: [RegExp, number][] = [
  [/[\u1060-\u1097]/g, 2.5], // Zawgyi presentation forms (also Shan/Karen letters, see below)
  [/[\u1060-\u1097]\u103A/g, -3.5], // ...but followed by a real asat: Shan/Karen/Mon Unicode
  [/(?:^|[^\u1000-\u102A\u103B-\u103F\u104E])\u1031/g, 1.5], // e-vowel not after a consonant
  [/(?:^|[^\u1000-\u1021])[\u103B\u107E-\u1084]/g, 1.5], // ya-yit typed before its consonant
  [/\u1031[\u103B\u107E-\u1084]/g, 2], // e-vowel + ya-yit, both before the consonant
  [/\u1039(?![\u1000-\u1021])/g, 1], // U+1039 ending a syllable = Zawgyi asat
  [/\u1039/g, 0.6], // U+1039 is common in Zawgyi, rare (stacking only) in Unicode
  // Pali/Sanskrit stacks (doubled, unaspirated+aspirated, mba): Zawgyi writes these with U+1060-1069 glyphs
  [/([\u1000-\u1021])\u1039\1|\u1000\u1039\u1001|\u1002\u1039\u1003|\u1005\u1039\u1006|\u1007\u1039\u1008|\u100B\u1039\u100C|\u100D\u1039\u100E|\u1010\u1039\u1011|\u1012\u1039\u1013|\u1015\u1039\u1016|\u1017\u1039\u1018|\u1019\u1039\u1018/g, -2.1],
  [/[\u1000-\u1021]\u103A(?![\u1039\u1037\u1038])/g, 0.8], // Zawgyi ya-pin on a consonant
  [/\u103A[\u102B-\u1030\u1032\u1036]/g, 1], // ya-pin followed by a vowel sign
  [/\u103A[\u103C\u103D]/g, 1.5], // ya-pin + wa/ha (a Unicode asat never takes a medial)
  [/[\u1033\u1034]/g, 1.5], // Zawgyi alternate u / uu
  [/\u1036\u102F/g, 1.5], // Zawgyi order for "-\u102F\u1036"
  [/\u1037\u1039/g, 1.5], // dot below + Zawgyi asat (Unicode puts U+1037 before U+103A)
  [/\u103E/g, -1.5], // Unicode ha-htoe (unused by Zawgyi)
  [/\u103B[\u103C-\u103E]/g, -1], // Unicode medial sequences
  [/\u103A(?![\u102B-\u1030\u1032\u1036])/g, -1], // Unicode asat
  [/[\u102B\u102C\u1004\u1009\u100A\u1014\u1019\u1010\u1015\u1000\u1005]\u103A[\u1037\u1038]?(?![\u102B-\u1036])/g, -0.5],
  [/\u1004\u103A\u1039/g, -2], // Unicode kinzi
  [/\u102F\u1036/g, -1.5], // Unicode order for "-\u102F\u1036"
  [/\u1037\u103A/g, -0.5],
];

/**
 * Rough probability (0-1) that `s` is Zawgyi rather than Unicode Burmese.
 * 0.5 means "can't tell" (many short words are byte-identical in both);
 * returns 0 when the text has no Myanmar characters at all.
 */
export function zawgyiProbability(s: string): number {
  if (!/[\u1000-\u109F]/.test(s)) return 0;
  let score = 0;
  for (const [re, w] of FEATURES) score += w * (s.match(re)?.length ?? 0);
  return 1 / (1 + Math.exp(-score));
}
