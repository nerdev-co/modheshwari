const latinToDevanagari: Record<string, string> = {
  a: "अ", aa: "आ", i: "इ", ee: "ई", u: "उ", oo: "ऊ",
  e: "ए", ai: "ऐ", o: "ओ", au: "औ",
  ka: "क", kha: "ख", ga: "ग", gha: "घ", nga: "ङ",
  cha: "च", chha: "छ", ja: "ज", jha: "झ", nya: "ञ",
  ta: "ट", tha: "ठ", da: "ड", dha: "ढ", na: "ण",
  ta2: "त", tha2: "थ", da2: "द", dha2: "ध", na2: "न",
  pa: "प", pha: "फ", ba: "ब", bha: "भ", ma: "म",
  ya: "य", ra: "र", la: "ल", va: "व", sha: "श",
  shha: "ष", sa: "स", ha: "ह",
  ksha: "क्ष", tra: "त्र", gya: "ज्ञ",
  " ": " ",
};

const wordMap: Record<string, string> = {
  // Common first names
  "narendra": "नरेंद्र",
  "modi": "मोदी",
  "rahul": "राहुल",
  "gandhi": "गांधी",
  "amit": "अमित",
  "shah": "शाह",
  "yogi": "योगी",
  "adityanath": "आदित्यनाथ",
  "priyanka": "प्रियंका",
  "sonia": "सोनिया",
  "manmohan": "मनमोहन",
  "singh": "सिंह",
  "kumar": "कुमार",
  "sharma": "शर्मा",
  "verma": "वर्मा",
  "gupta": "गुप्ता",
  "aggarwal": "अग्रवाल",
  "jain": "जैन",
  "mehta": "मेहता",
  "rao": "राव",
  "patel": "पटेल",
  "reddy": "रेड्डी",
  "nair": "नायर",
  "menon": "मेनन",
  "iyer": "अय्यर",
  "iyengar": "अंगर",
  "mukherjee": "मुखर्जी",
  "banerjee": "बनर्जi",
  "das": "दास",
  "bose": "बोस",
  "sen": "सेन",
  "roy": "रॉय",
  "ghosh": "घोष",
  "chatterjee": "चटर्जी",
  "bhattacharya": "भट्टाचार्य",
  "lahiri": "लाहिड़ी",
  // Common words
  "ji": "जी",
  "sahab": "साहब",
  "bhai": "भाई",
  "ben": "बेन",
  "kumar": "कुमार",
  "devi": "देवी",
  "prasad": "प्रसाद",
  "chand": "चंद",
  "ram": "राम",
  "krishna": "कृष्ण",
  "shiva": "शिव",
  "vishnu": "विष्णु",
  "durga": "दुर्गा",
  "lakshmi": "लक्ष्मी",
  "saraswati": "सरस्वती",
};

/**
 * Transliterates a Latin script name to Devanagari.
 * Uses word-level mapping for known names, falls back to basic phonetic mapping.
 */
export function transliterateToDevanagari(text: string): string {
  const lower = text.toLowerCase().trim();

  // Check if already in Devanagari
  if (/[\u0900-\u097F]/.test(text)) {
    return text;
  }

  // Try word-level mapping first
  const words = lower.split(/\s+/);
  const mapped = words.map((word) => {
    if (wordMap[word]) return wordMap[word];
    // Try removing common suffixes
    const cleaned = word.replace(/(ji|sahab|bhai|ben|kumar|devi)$/i, "");
    if (wordMap[cleaned]) {
      const suffix = word.slice(cleaned.length);
      const suffixMap: Record<string, string> = {
        ji: "जी", sahab: "साहब", bhai: "भाई", ben: "बेन",
        kumar: "कुमार", devi: "देवी",
      };
      return wordMap[cleaned] + (suffixMap[suffix.toLowerCase()] || "");
    }
    return null;
  });

  // If all words were mapped, return
  if (mapped.every((m) => m !== null)) {
    return mapped.join(" ");
  }

  // Fallback: basic phonetic transliteration
  return basicTransliterate(lower);
}

function basicTransliterate(text: string): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    // Try 3-char, then 2-char, then 1-char match
    let matched = false;
    for (const len of [3, 2, 1]) {
      const chunk = text.slice(i, i + len);
      if (latinToDevanagari[chunk]) {
        result += latinToDevanagari[chunk];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Keep original character if no mapping found
      result += text[i];
      i++;
    }
  }

  return result;
}

/**
 * Formats a number in Hindi (Devanagari) numerals.
 */
export function formatHindiNumber(num: number): string {
  const hindiDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return num.toString().replace(/\d/g, (d) => hindiDigits[parseInt(d)]);
}
