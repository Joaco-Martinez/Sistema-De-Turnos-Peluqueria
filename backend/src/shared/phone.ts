export function onlyDigitsPlus(v: string) {
  const trimmed = v.trim();
  if (!trimmed) return "";
  const keepPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  return keepPlus ? `+${digits}` : digits;
}

export function normalizePhoneE164(
  raw: string,
  opts: { countryCode?: string; addMobileNine?: boolean } = {}
) {
  const { countryCode = "+54", addMobileNine = true } = opts;
  let v = onlyDigitsPlus(raw);

  if (v.startsWith("+")) return v;
  if (!v) return "";
  if (countryCode === "+54" && addMobileNine && !v.startsWith("9")) {
    v = "9" + v;
  }
  return `${countryCode}${v}`;
}

export function isE164(phone: string) {
  return /^\+\d{8,15}$/.test(phone);
}

export function toWhatsAppAddress(phoneE164: string) {
  return phoneE164.startsWith("whatsapp:") ? phoneE164 : `whatsapp:${phoneE164}`;
}
