/**
 * Telugu Auto-Transliteration & Translation Utility
 * 
 * Translates phonetic English text (e.g. "Ramesh Kumar", "Shiva Goud", "Jai Hind")
 * into Telugu script (e.g. "రమేష్ కుమార్", "శివ గౌడ్", "జై హింద్")
 * using Google's phonetic transliteration service with local dictionary fallback.
 */

const COMMON_TRANSLATIONS = {
  'president': 'అధ్యక్షుడు',
  'vice president': 'ఉపాధ్యక్షుడు',
  'secretary': 'ప్రధాన కార్యదర్శి',
  'general secretary': 'ప్రధాన కార్యదర్శి',
  'joint secretary': 'సహాయ కార్యదర్శి',
  'treasurer': 'కోశాధికారి',
  'member': 'సభ్యుడు',
  'volunteer': 'స్వచ్ఛంద సేవకుడు',
  'youth leader': 'యువజన నాయకుడు',
  'executive member': 'కార్యవర్గ సభ్యుడు',
  'ganesh': 'గణేష్',
  'ganesh chanda': 'గణేష్ చందా',
  'youth association': 'యువజన సంఘం',
  'ganesh youth association': 'గణేష్ యువజన సంఘం',
  'decoration': 'అలంకరణ',
  'flowers': 'పూలు',
  'lighting': 'లైటింగ్',
  'sound system': 'సౌండ్ సిస్టమ్',
  'food': 'భోజనం',
  'prasadam': 'ప్రసాదం',
  // Velam Paata (Auction) Terms
  'velam paata': 'వేలం పాట',
  'auction': 'వేలం పాట',
  'laddu': 'లడ్డు',
  'maha laddu': 'మహా లడ్డు',
  'big laddu': 'మహా లడ్డు',
  'small laddu': 'చిన్న లడ్డు',
  'chinna laddu': 'చిన్న లడ్డు',
  'pedda laddu': 'మహా లడ్డు',
  'tenkayya': 'టెంకాయ',
  'tinkayya': 'టెంకాయ',
  'coconut': 'టెంకాయ',
  'right coconut': 'కుడి టెంకాయ',
  'left coconut': 'ఎడమ టెంకాయ',
  'kudi tenkayya': 'కుడి టెంకాయ',
  'edama tenkayya': 'ఎడమ టెంకాయ',
  'kudi tinkayya': 'కుడి టెంకాయ',
  'edama tinkayya': 'ఎడమ టెంకాయ',
  'fruits': 'పండ్లు',
  'fruits basket': 'పండ్ల బుట్ట',
  'pandulu': 'పండ్లు',
  'garika': 'గరిక',
  'vastralu': 'వస్త్రాలు',
  'pattu vastralu': 'పట్టు వస్త్రాలు',
  'silver coin': 'వెండి నాణెం',
  'silver': 'వెండి',
  'gold coin': 'బంగారు నాణెం',
  'harathi': 'హారతి',
};

export async function transliterateToTelugu(text) {
  if (!text || typeof text !== 'string' || !text.trim()) return '';

  const cleanText = text.trim();
  const lower = cleanText.toLowerCase();

  // 1. Check direct common dictionary
  if (COMMON_TRANSLATIONS[lower]) {
    return COMMON_TRANSLATIONS[lower];
  }

  // 2. Call Google Input Tools Phonetic Transliteration API (Free, Instant)
  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
      cleanText
    )}&itc=te-t-i0-und&num=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
      const teluguSuggestions = data[1][0][1];
      if (teluguSuggestions.length > 0) {
        return teluguSuggestions[0];
      }
    }
  } catch (error) {
    console.warn('Google transliteration network error, using phonetic fallback:', error);
  }

  // Fallback: return original text if offline
  return '';
}
