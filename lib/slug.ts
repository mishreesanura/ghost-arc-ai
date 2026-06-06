function transliterate(str: string): string {
  // Map common accented letters and umlauts to their ASCII equivalents
  const customMap: { [key: string]: string } = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue',
    'ß': 'ss', 'æ': 'ae', 'ø': 'o', 'å': 'a', 'œ': 'oe',
    'Æ': 'ae', 'Ø': 'o', 'Å': 'a', 'Œ': 'oe',
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
    'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u',
    'ñ': 'n', 'ç': 'c',
    'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
    'À': 'a', 'È': 'e', 'Ì': 'i', 'Ò': 'o', 'Ù': 'u',
    'Â': 'a', 'Ê': 'e', 'Î': 'i', 'Ô': 'o', 'Û': 'u',
    'Ñ': 'n', 'Ç': 'c'
  };

  let result = "";
  for (const char of str) {
    if (customMap[char]) {
      result += customMap[char];
    } else {
      result += char;
    }
  }

  // Normalize Unicode to decompose diacritics and strip remaining ones
  return result
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    // Strip anything that is still not an ASCII letter, digit, space, hyphen or underscore
    .replace(/[^\x00-\x7F]/g, "");
}

export function generateSlug(name: string, options?: { asciiOnly?: boolean }): string {
  let text = name;
  if (options?.asciiOnly) {
    text = transliterate(text);
  }

  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-") // Allow Unicode letters (\p{L}) and numbers (\p{N})
    .replace(/-+/g, "-")              // Collapse duplicate hyphens
    .replace(/^-+|-+$/g, "");         // Trim leading/trailing hyphens
}
