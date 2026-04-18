/**
 * Strips HTML tags and dangerous characters to prevent XSS.
 * Use on any user-supplied text before storing or rendering.
 */
export function sanitizeText(value) {
  if (typeof value !== "string") return ""
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/`/g, "&#x60;")
    .replace(/\//g, "&#x2F;")
    .trim()
}

/**
 * Strips everything except letters, numbers, spaces, hyphens, dots, commas.
 * Safe for names, addresses, etc.
 */
export function sanitizeAlphanumeric(value) {
  if (typeof value !== "string") return ""
  return value.replace(/[^a-zA-ZÀ-ÿ0-9\s\-.,#°ñÑ]/g, "").trim()
}

/**
 * Validates an email format.
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Checks if a Dominican cédula has a valid format: 001-0000000-0
 */
export function isValidCedula(value) {
  return /^\d{3}-\d{7}-\d$/.test(value)
}

/**
 * Checks if a Dominican RNC has a valid format: 1-00-00000-0
 */
export function isValidRNC(value) {
  return /^\d-\d{2}-\d{5}-\d$/.test(value)
}

/**
 * Checks if a phone number has a valid Dominican format: 809-000-0000
 */
export function isValidPhone(value) {
  return /^(809|829|849)-\d{3}-\d{4}$/.test(value)
}

/**
 * Sanitizes an entire form object by running sanitizeText on all string fields.
 * Safe to use before submitting to Supabase.
 */
export function sanitizeForm(formObj) {
  const cleaned = {}
  for (const [key, value] of Object.entries(formObj)) {
    cleaned[key] = typeof value === "string" ? sanitizeText(value) : value
  }
  return cleaned
}
