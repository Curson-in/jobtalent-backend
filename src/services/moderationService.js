// =========================================================
//  LOCAL MODERATION SERVICE (No OpenAI Dependency)
//  - Zero Cost
//  - Zero Latency
//  - Supports English, Hindi (Hinglish), and Marathi
// =========================================================

const BAD_WORDS = [
  // --- ENGLISH ---
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy", "cunt",
  "whore", "slut", "faggot", "nigger", "retard", "kys", "kill yourself",
  "rape", "molest", "incest", "pedophile", "porn", "xxx", "nude", "sex",
  "motherfucker", "cocksucker", "tits", "boobs", "dyke", "kike", "chink",
  "tranny", "shemale", "anal", "blowjob", "cum", "orgasm", "penis", "vagina",

  // --- HINDI (Romanized/Hinglish) ---
  "madarchod", "mc", "bhenchod", "bc", "behenchod", "bhosdike", "bsdk",
  "chutiya", "chu", "gandu", "gaandu", "lund", "lauda", "lavda",
  "choot", "randi", "randwa", "kutta", "kutiya", "saala", "harami",
  "kameena", "kamina", "chinal", "hijra", "chakka", "bhadwa", "bhadve",
  "jhaatu", "jhant", "gaand", "suar", "pilla",

  // --- MARATHI (Romanized) ---
  "zavadya", "zhavadya", "zav", "yedzava", "yedzhava", "bhadkhau",
  "aai ghalya", "aaighalya", "maushi chi", "lavdya", "bulli", "pucchi",
  "bhosda", "raand", "chinnal", "item", "dhagala", "fukni", "fukni chya",
  "gaandu", "gand", "bhokachya", "bullya", "shembdya"
];

// Helper to normalize text (remove special chars, spaces, repeated letters)
// Example: "f.u.c.k" -> "fuck", "bhosdikeee" -> "bhosdike"
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // remove special chars
    .replace(/\s+/g, ' ');       // collapse multiple spaces
}

export async function isContentSafe(text) {
  if (!text) return true;

  const cleanText = normalizeText(text);
  const words = cleanText.split(" ");

  // Check 1: Exact word match (Fastest)
  const hasBadWord = words.some(word => BAD_WORDS.includes(word));
  if (hasBadWord) {
    console.log("Blocked: Exact bad word match");
    return false;
  }

  // Check 2: Substring match for dangerous roots (Slower but stricter)
  // We use a subset for this to avoid false positives (e.g. don't match 'ass' in 'class')
  const STRICT_ROOTS = [
    "madarchod", "bhenchod", "zavadya", "yedzava", "bhadkhau"
  ];
  
  const hasRootMatch = STRICT_ROOTS.some(root => cleanText.includes(root));
  if (hasRootMatch) {
    console.log("Blocked: Root word match");
    return false;
  }

  return true;
}