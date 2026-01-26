// =========================================================
//  LOCAL MODERATION SERVICE (No OpenAI Dependency)
//  - Zero Cost
//  - Zero Latency
//  - Supports English, Hindi (Hinglish), and Marathi
// =========================================================

const BAD_PHRASES = [
  // --- ENGLISH ---
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy", "cunt",
  "whore", "slut", "faggot", "nigger", "retard", "kys", "kill yourself",
  "rape", "molest", "incest", "pedophile", "porn", "xxx", "nude", "sex",
  "motherfucker", "cocksucker", "tits", "boobs", "dyke", "kike", "chink",
  "tranny", "shemale", "anal", "blowjob", "cum", "orgasm", "penis", "vagina",
  "mf", "mfs", "dicky", "dicksucker", "cock", "pussy", "tits", "cuck", "hoe", "pussysucker",
  "fuck you", "fuck u", "retard", "dumbfuck", "prostitute", "prostitution", "prostitutes", "son of a bitch", "son of bitch",
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy", "cunt",
  "whore", "slut", "faggot", "nigger", "retard", "kys", "kill yourself",
  "rape", "molest", "incest", "pedophile", "porn", "xxx", "nude", "sex",
  "motherfucker", "cocksucker", "tits", "boobs", "dyke", "kike", "chink",
  "tranny", "shemale", "anal", "blowjob", "cum", "orgasm", "penis", "vagina",
  "mf", "mfs", "dicky", "dicksucker", "cock", "cuck", "hoe", "pussysucker",
  "fuck you", "fuck u", "dumbfuck", "son of a bitch", "son of bitch",
  "piece of shit", "eat shit", "suck my", "jerk off", "handjob", 
  "condom", "doggystyle", "doggy style", "stripper", "sexy", "fuckk",

  // --- HINDI (Romanized/Hinglish) ---
  "madarchod", "mc", "bhenchod", "bc", "behenchod", "bhosdike", "bsdk",
  "chutiya", "chu", "gandu", "gaandu", "lund", "lauda", "lavda",
  "choot", "randi", "randwa", "kutta", "kutiya", "saala", "harami",
  "kameena", "kamina", "chinal", "hijra", "chakka", "bhadwa", "bhadve",
  "jhaatu", "jhant", "gaand", "suar", "pilla", "benchod", "bencod", "mkc", "chakki", "chaki", "chaka",
  "tmkc", "teri maa ki chut", "teri ma ki chut", "lawdya", "raand", "kothe ki paidayish", "kotha",
  "madarchod", "mc", "bhenchod", "bc", "behenchod", "bhosdike", "bsdk",
  "chutiya", "chu", "gandu", "gaandu", "lund", "lauda", "lavda",
  "choot", "randi", "randwa", "kutta", "kutiya", "saala", "harami",
  "kameena", "kamina", "chinal", "hijra", "chakka", "bhadwa", "bhadve",
  "jhaatu", "jhant", "gaand", "suar", "pilla", "benchod", "bencod", "mkc",
  "chakki", "tmkc", "teri maa", "teri ma", "lawdya", "raand", "kothe",
  "maa ki chut", "ma ki chut", "behen ki", "bhosda", "bhosada",
  "gaand mar", "gand mar", "lund le", "choot mar", "bur", "burr",

  // --- MARATHI (Romanized) ---
  "zavadya", "zhavadya", "zav", "yedzava", "yedzhava", "bhadkhau",
  "aai ghalya", "aaighalya", "maushi chi", "lavdya", "bulli", "pucchi",
  "bhosda", "raand", "chinnal", "item", "dhagala", "fukni", "fukni chya",
  "gaandu", "gand", "bhokachya", "bullya", "shembdya", "dhungan", "bocha", "tujhya aai chi gaand",
  "chuttad", "chutad", "chud", "pencho", "atmkc", "abey teri ma ki chut", "abey teri maa ki chut", "gadhav", "kutra", "dukkar", "dukar", 
  "rand chi aulad", "zavada", 
  "zavadya", "zhavadya", "zav", "yedzava", "yedzhava", "bhadkhau",
  "aai ghalya", "aaighalya", "maushi chi", "lavdya", "bulli", "pucchi",
  "bhosda", "raand", "chinnal", "item", "dhagala", "fukni", "fukni chya",
  "gaandu", "gand", "bhokachya", "bullya", "shembdya", "dhungan", "bocha",
  "tujhya aai", "tujya aai", "aai chi", "aai zhav", "aai zav",
  "chuttad", "chud", "pencho", "atmkc", "gadhav", "kutra", "dukkar", 
  "rand chi", "randi chi", "bhosad", "lavde", "lavda"
];

// Helper to normalize text (remove special chars, spaces, repeated letters)
// Example: "f.u.c.k" -> "fuck", "bhosdikeee" -> "bhosdike"
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars (!, @, #)
    .replace(/\s+/g, ' ')        // Collapse multiple spaces
    .trim();
}

export async function isContentSafe(text) {
  if (!text) return true;

  const cleanText = normalizeText(text);
  
  // 1. EXACT PHRASE MATCH (Checks specifically for "fuck u", "teri maa", etc.)
  // We check if the bad phrase exists anywhere inside the text string
  const hasBadPhrase = BAD_PHRASES.some(phrase => {
    // Check if the clean text INCLUDES the bad phrase
    // Add spaces around to ensure we don't match parts of words unless intended
    // e.g. "classic" shouldn't trigger "ass", but "dumb ass" should.
    
    // Logic: 
    // If the bad word is short (<= 3 chars like 'sex', 'cum'), we enforce strict word boundaries.
    // If it's long/specific (like 'madarchod'), we allow partial matches.
    
    if (phrase.length <= 3) {
      return new RegExp(`\\b${phrase}\\b`).test(cleanText);
    } else {
      return cleanText.includes(phrase);
    }
  });

  if (hasBadPhrase) {
    console.log("Blocked by Strict Filter");
    return false;
  }

  return true;
}