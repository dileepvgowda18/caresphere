import medicalReference from '../data/medicalReference.js';

// Normalize raw text so comparisons are consistent across OCR output, punctuation, and spacing.
function normalizeText(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Escape special characters so test-name patterns can be matched safely as regular expressions.
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Reject lines that are clearly not laboratory results, such as dates, phone numbers, ages, or stock IDs.
function shouldIgnoreLine(text) {
  if (typeof text !== 'string') {
    return true;
  }

  const trimmedText = text.trim();

  if (!trimmedText) {
    return true;
  }

  if (/^(age|dob|address|phone|mobile|contact|stock|id|date|prescription|rx|refill|take|tablet|tablets|capsule|capsules|bid|tid|qid|prn|qty|quantity)/i.test(trimmedText)) {
    return true;
  }

  if (/^\d{1,4}([/-]\d{1,2}){1,2}$/.test(trimmedText)) {
    return true;
  }

  if (/^\+?\d[\d\s()-]{6,}\d$/.test(trimmedText)) {
    return true;
  }

  if (/^#?\d{3,}$/.test(trimmedText)) {
    return true;
  }

  return false;
}

// Extract a numeric value from a text fragment, including values with units such as "10.2 g/dL".
function parseNumericValue(text) {
  if (typeof text !== 'string') {
    return null;
  }

  const match = text.match(/(-?\d+(?:\.\d+)?)/);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

// Extract the unit portion from a text fragment after the numeric value, such as "mg/dL" or "g/dL".
function extractUnit(text) {
  if (typeof text !== 'string') {
    return '';
  }

  const match = text.match(/-?\d+(?:\.\d+)?\s*([a-zA-Z%/.-]+(?:\s*[a-zA-Z%/.-]+)*)/i);

  if (!match) {
    return '';
  }

  const unit = match[1].trim();
  return unit === '.' ? '' : unit;
}

// Build a lookup of common aliases so OCR text can match known laboratory tests even when the label is shortened.
function getAliasMap() {
  return {
    hemoglobin: ['hb'],
    wbc: ['white blood cells'],
    rbc: ['red blood cells'],
    platelets: ['plt'],
    glucose: ['blood sugar'],
    hba1c: ['glycated hemoglobin', 'glycohemoglobin'],
    creatinine: ['cr'],
    urea: ['bun'],
    sodium: ['na'],
    potassium: [],
    calcium: [],
    magnesium: [],
    phosphate: ['phosphorus'],
    vitamind: ['vit d', 'vitamin d'],
    vitaminb12: ['b12', 'vit b12'],
    folate: ['folic acid'],
    tsh: ['thyroid stimulating hormone'],
    t3: ['triiodothyronine'],
    t4: ['thyroxine'],
    freet4: ['free thyroxine'],
    ldl: ['low density lipoprotein'],
    hdl: ['high density lipoprotein'],
    triglycerides: ['tg'],
    totalcholesterol: ['cholesterol', 'chol', 'tc'],
    alt: ['sgpt'],
    ast: ['sgot'],
    bilirubin: ['bili'],
    albumin: ['alb'],
    totalprotein: ['total proteins'],
    crp: ['c reactive protein'],
    esr: ['sed rate'],
    ferritin: ['ferr'],
    iron: ['fe'],
    transferrinsaturation: ['transferrin saturation'],
    uricacid: ['ua', 'uric']
  };
}

// Match OCR text to the most relevant laboratory test from the reference database.
function matchTestName(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return null;
  }

  if (shouldIgnoreLine(text)) {
    return null;
  }

  const normalizedText = normalizeText(text);
  const aliasMap = getAliasMap();

  const candidates = medicalReference
    .map((entry) => ({
      entry,
      normalizedName: normalizeText(entry.name),
      aliases: (aliasMap[normalizeText(entry.name).replace(/\s+/g, '')] || []).map((alias) => normalizeText(alias))
    }))
    .sort((a, b) => b.normalizedName.length - a.normalizedName.length);

  for (const candidate of candidates) {
    const searchTerms = [candidate.normalizedName, ...candidate.aliases];

    for (const term of searchTerms) {
      if (!term) {
        continue;
      }

      const leadingPattern = new RegExp(`^${escapeRegExp(term)}(?:\\s|:|-|\\/|\\.)`);
      if (leadingPattern.test(normalizedText)) {
        return candidate.entry;
      }
    }
  }

  return null;
}

// Parse the normal range string into a lower and upper numeric boundary for comparison.
function parseNormalRange(normalRange) {
  if (typeof normalRange !== 'string') {
    return null;
  }

  const compact = normalRange.replace(/\s+/g, ' ').trim();

  const numericValues = compact.match(/\d+(?:\.\d+)?/g);

  if (!numericValues || numericValues.length === 0) {
    return null;
  }

  const numbers = numericValues.map(Number);

  if (compact.includes('<')) {
    return { lower: null, upper: numbers[0] };
  }

  if (compact.includes('>')) {
    return { lower: numbers[0], upper: null };
  }

  if (numbers.length >= 2) {
    return { lower: Math.min(...numbers), upper: Math.max(...numbers) };
  }

  return { lower: numbers[0], upper: numbers[0] };
}

// Compare a numeric value against the parsed range and return Low, Normal, or High.
function compareValueToRange(value, normalRange) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Normal';
  }

  const parsedRange = parseNormalRange(normalRange);

  if (!parsedRange) {
    return 'Normal';
  }

  if (parsedRange.lower !== null && value < parsedRange.lower) {
    return 'Low';
  }

  if (parsedRange.upper !== null && value > parsedRange.upper) {
    return 'High';
  }

  return 'Normal';
}

// Analyze OCR text and return structured lab results for any recognized tests.
function analyzeMedicalReport(extractedText) {
  if (typeof extractedText !== 'string' || extractedText.trim() === '') {
    return [];
  }

  const lines = extractedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const results = [];

  lines.forEach((line) => {
    const referenceEntry = matchTestName(line);

    if (!referenceEntry) {
      return;
    }

    const numericValue = parseNumericValue(line);

    if (numericValue === null) {
      return;
    }

    const unit = extractUnit(line);
    const status = compareValueToRange(numericValue, referenceEntry.normalRange);

    results.push({
      testName: referenceEntry.name,
      value: String(numericValue),
      unit,
      status,
      normalRange: referenceEntry.normalRange,
      simpleExplanation: referenceEntry.simpleExplanation,
      recommendation: referenceEntry.recommendation
    });
  });

  return results;
}

export { analyzeMedicalReport };
export default analyzeMedicalReport;
