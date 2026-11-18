/**
 * Centralized validation helpers shared by all Customer App forms and
 * Next.js `/api/customer/*` route handlers.
 *
 * Rules match the `mithranagroapp` PrestaShop module so invalid values are
 * caught early in the UI for usability and rejected authoritatively on the server.
 */

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

const INDIAN_STATE_MAP = new Map<string, string>(
  INDIAN_STATES.map((state) => [state.toLowerCase(), state]),
);

const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;
const INDIAN_PINCODE_RE = /^[1-9]\d{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Allow Unicode letters, spaces, hyphens, apostrophes, and periods (no digits or symbols).
const PERSON_NAME_RE = /^[\p{L}][\p{L}\s'.-]*$/u;
const CONTROL_CHARS_RE = /[\x00-\x1F\x7F]/;

export interface ValidationResult<T = string> {
  ok: boolean;
  value: T;
  error?: string;
}

export function validateIndianMobile(raw: unknown): ValidationResult {
  if (typeof raw !== "string") {
    return { ok: false, value: "", error: "Enter a 10-digit Indian mobile number." };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, value: "", error: "Mobile number is required." };
  }
  // Reject any spaces, +91 prefixes, letters, punctuation, or != 10 digits.
  if (raw !== trimmed || !INDIAN_MOBILE_RE.test(trimmed)) {
    return {
      ok: false,
      value: trimmed,
      error: "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.",
    };
  }
  return { ok: true, value: trimmed };
}

export function validateIndianPincode(raw: unknown): ValidationResult {
  if (typeof raw !== "string") {
    return { ok: false, value: "", error: "Enter a valid 6-digit PIN code." };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, value: "", error: "PIN code is required." };
  }
  if (raw !== trimmed || !INDIAN_PINCODE_RE.test(trimmed)) {
    return {
      ok: false,
      value: trimmed,
      error: "Enter a valid 6-digit PIN code (cannot start with 0).",
    };
  }
  return { ok: true, value: trimmed };
}

export function validateEmail(raw: unknown): ValidationResult {
  if (typeof raw !== "string") {
    return { ok: false, value: "", error: "Enter a valid email address." };
  }
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, value: "", error: "Email address is required." };
  }
  if (trimmed.length > 254 || /\s/.test(trimmed) || !EMAIL_RE.test(trimmed)) {
    return { ok: false, value: trimmed, error: "Enter a valid email address." };
  }
  return { ok: true, value: trimmed };
}

export function validatePersonName(
  raw: unknown,
  opts: { min?: number; max?: number; requireFullName?: boolean; label?: string } = {},
): ValidationResult {
  const min = opts.min ?? 2;
  const max = opts.max ?? 80;
  const fieldLabel = opts.label ?? "Full name";
  if (typeof raw !== "string") {
    return { ok: false, value: "", error: `${fieldLabel} is required.` };
  }
  const normalized = raw.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return { ok: false, value: "", error: `${fieldLabel} is required.` };
  }
  if (normalized.length < min || normalized.length > max) {
    return {
      ok: false,
      value: normalized,
      error: `${fieldLabel} must be between ${min} and ${max} characters.`,
    };
  }
  if (!PERSON_NAME_RE.test(normalized)) {
    return {
      ok: false,
      value: normalized,
      error: `${fieldLabel} may only contain letters, spaces, hyphens, and apostrophes.`,
    };
  }
  if (opts.requireFullName && normalized.split(" ").length < 2) {
    return {
      ok: false,
      value: normalized,
      error: "Enter both first and last name.",
    };
  }
  return { ok: true, value: normalized };
}

export function validatePassword(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || raw.length === 0) {
    return { ok: false, value: "", error: "Password is required." };
  }
  if (raw.length < 8) {
    return { ok: false, value: raw, error: "Password must be at least 8 characters." };
  }
  if (raw.length > 72) {
    return { ok: false, value: raw, error: "Password must not exceed 72 characters." };
  }
  if (CONTROL_CHARS_RE.test(raw)) {
    return { ok: false, value: raw, error: "Password contains unsupported control characters." };
  }
  return { ok: true, value: raw };
}

export function validateTextLength(
  raw: unknown,
  opts: { min: number; max: number; label: string; required?: boolean },
): ValidationResult {
  const required = opts.required ?? opts.min > 0;
  if (typeof raw !== "string") {
    return required
      ? { ok: false, value: "", error: `${opts.label} is required.` }
      : { ok: true, value: "" };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return required
      ? { ok: false, value: "", error: `${opts.label} is required.` }
      : { ok: true, value: "" };
  }
  if (trimmed.length < opts.min) {
    return {
      ok: false,
      value: trimmed,
      error: `${opts.label} must be at least ${opts.min} characters.`,
    };
  }
  if (trimmed.length > opts.max) {
    return {
      ok: false,
      value: trimmed,
      error: `${opts.label} must not exceed ${opts.max} characters.`,
    };
  }
  return { ok: true, value: trimmed };
}

export function validateIndianState(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, value: "", error: "Select a state or union territory." };
  }
  const canonical = INDIAN_STATE_MAP.get(raw.trim().toLowerCase());
  if (!canonical) {
    return { ok: false, value: raw.trim(), error: "Select a valid Indian state or union territory." };
  }
  return { ok: true, value: canonical };
}

export interface AddressInput {
  label?: unknown;
  name?: unknown;
  phone?: unknown;
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  state?: unknown;
  pincode?: unknown;
}

export interface ValidatedAddress {
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export function validateAddressFields(input: AddressInput): {
  ok: boolean;
  values: ValidatedAddress;
  errors: Record<string, string>;
} {
  const labelRes = validateTextLength(input.label, { min: 2, max: 30, label: "Address label" });
  const nameRes = validatePersonName(input.name, { min: 2, max: 80, requireFullName: true, label: "Full name" });
  const phoneRes = validateIndianMobile(input.phone);
  const line1Res = validateTextLength(input.line1, { min: 5, max: 150, label: "Address line 1" });
  const line2Res = validateTextLength(input.line2 ?? "", { min: 0, max: 150, label: "Address line 2", required: false });
  const cityRes = validateTextLength(input.city, { min: 2, max: 60, label: "City" });
  const stateRes = validateIndianState(input.state);
  const pincodeRes = validateIndianPincode(input.pincode);

  const errors: Record<string, string> = {};
  if (!labelRes.ok && labelRes.error) errors.label = labelRes.error;
  if (!nameRes.ok && nameRes.error) errors.name = nameRes.error;
  if (!phoneRes.ok && phoneRes.error) errors.phone = phoneRes.error;
  if (!line1Res.ok && line1Res.error) errors.line1 = line1Res.error;
  if (!line2Res.ok && line2Res.error) errors.line2 = line2Res.error;
  if (!cityRes.ok && cityRes.error) errors.city = cityRes.error;
  if (!stateRes.ok && stateRes.error) errors.state = stateRes.error;
  if (!pincodeRes.ok && pincodeRes.error) errors.pincode = pincodeRes.error;

  return {
    ok: Object.keys(errors).length === 0,
    values: {
      label: labelRes.value,
      name: nameRes.value,
      phone: phoneRes.value,
      line1: line1Res.value,
      line2: line2Res.value,
      city: cityRes.value,
      state: stateRes.value,
      pincode: pincodeRes.value,
    },
    errors,
  };
}
