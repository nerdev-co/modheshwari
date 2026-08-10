const BLOOD_GROUP_MAP: Record<string, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
};

const REVERSE_BLOOD_GROUP_MAP: Record<string, string> = {
  "A+": "A_POS",
  "A-": "A_NEG",
  "B+": "B_POS",
  "B-": "B_NEG",
  "AB+": "AB_POS",
  "AB-": "AB_NEG",
  "O+": "O_POS",
  "O-": "O_NEG",
};

export const BLOOD_GROUPS = Object.keys(REVERSE_BLOOD_GROUP_MAP);

/**
 * Performs format blood group operation.
 * @param {string} enumValue - Description of enumValue
 * @returns {string} Description of return value
 */
export function formatBloodGroup(enumValue: string | undefined | null): string {
  if (!enumValue) return "-";
  return BLOOD_GROUP_MAP[enumValue] || enumValue;
}

/**
 * Performs to blood group enum operation.
 * @param {string} input - Description of input
 * @returns {string} Description of return value
 */
export function toBloodGroupEnum(input: string): string {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, "");
  return REVERSE_BLOOD_GROUP_MAP[normalized] || normalized;
}
