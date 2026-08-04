// Import the drug interaction dataset so the helper can search it.
import drugInteractions from "../data/drugInteractions.js";

// Normalize a medicine name so comparisons are case-insensitive and ignore spaces or hyphens.
function normalizeMedicineName(name) {
  if (typeof name !== "string") {
    return "";
  }

  return name.trim().toLowerCase().replace(/[\s-]+/g, "");
}

function buildInteractionLookup(interactions) {
  const lookup = new Map();

  interactions.forEach((interaction) => {
    if (!interaction || typeof interaction !== "object") {
      return;
    }

    const medicineA = typeof interaction.medicineA === "string" ? interaction.medicineA.trim() : "";
    const medicineB = typeof interaction.medicineB === "string" ? interaction.medicineB.trim() : "";
    const severity = typeof interaction.severity === "string" ? interaction.severity.trim().toLowerCase() : "";
    const risk = typeof interaction.risk === "string" ? interaction.risk.trim() : "";
    const recommendation = typeof interaction.recommendation === "string" ? interaction.recommendation.trim() : "";

    if (!medicineA || !medicineB || !risk || !recommendation || !["high", "moderate", "low"].includes(severity)) {
      return;
    }

    const pairKey = `${normalizeMedicineName(medicineA)}|${normalizeMedicineName(medicineB)}`;

    if (!lookup.has(pairKey)) {
      lookup.set(pairKey, {
        medicineA,
        medicineB,
        severity: interaction.severity,
        risk,
        recommendation
      });
    }
  });

  return lookup;
}

// Check a list of medicines and return any known interactions between them.
function checkDrugInteractions(medicineNames) {
  // Return an empty array if the input is not a valid array.
  if (!Array.isArray(medicineNames)) {
    return [];
  }

  // Build a cleaned list of medicines to compare.
  const normalizedMedicines = medicineNames
    .filter((name) => typeof name === "string" && name.trim() !== "")
    .map((name) => ({
      original: name,
      normalized: normalizeMedicineName(name)
    }));

  // If there are fewer than two medicines, no pairs can be compared.
  if (normalizedMedicines.length < 2) {
    return [];
  }

  const interactionLookup = buildInteractionLookup(drugInteractions);
  const matchedInteractions = [];
  const seenInteractionKeys = new Set();

  // Compare every medicine against every other medicine in the input list.
  for (let i = 0; i < normalizedMedicines.length; i += 1) {
    for (let j = i + 1; j < normalizedMedicines.length; j += 1) {
      const firstMedicine = normalizedMedicines[i];
      const secondMedicine = normalizedMedicines[j];

      const forwardKey = `${firstMedicine.normalized}|${secondMedicine.normalized}`;
      const reverseKey = `${secondMedicine.normalized}|${firstMedicine.normalized}`;
      const match = interactionLookup.get(forwardKey) || interactionLookup.get(reverseKey);

      if (!match) {
        continue;
      }

      const interactionKey = `${normalizeMedicineName(match.medicineA)}|${normalizeMedicineName(match.medicineB)}`;

      if (!seenInteractionKeys.has(interactionKey)) {
        seenInteractionKeys.add(interactionKey);
        matchedInteractions.push({
          medicineA: match.medicineA,
          medicineB: match.medicineB,
          severity: match.severity,
          risk: match.risk,
          recommendation: match.recommendation
        });
      }
    }
  }

  return matchedInteractions;
}

export { checkDrugInteractions };
export default checkDrugInteractions;
