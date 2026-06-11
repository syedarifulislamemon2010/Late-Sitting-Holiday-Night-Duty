/**
 * Production-grade Offline Bengali Font & Encoding Converter
 * Handles Bijoy ANSI / SutonnyMJ <-> Unicode bidirectional conversion
 * 
 * DESIGNED FOR JANATA BANK PLC.
 * CBS Integrated Development Cell
 */

// 1. Bijoy ANSI to Unicode Mapping (treated as regex patterns for 100% compatibility)
export const BIJOY_TO_UNICODE_MAP: [string, string][] = [
  ['0', '০'],
  ['1', '১'],
  ['2', '২'],
  ['3', '৩'],
  ['4', '৪'],
  ['5', '৫'],
  ['6', '৬'],
  ['7', '৭'],
  ['8', '৮'],
  ['9', '৯'],
  ['i¨', 'র‌্য'],
  ['ª¨', '্র্য'],
  ['¤cÖ', 'ম্প্র'],
  ['²', 'ক্ষ্ম'],
  ['°', 'ক্ক'],
  ['±', 'ক্ট'],
  ['³', 'ক্ত'],
  ['K¡', 'ক্ব'],
  ['¯Œ', 'স্ক্র'],
  ['µ', 'ক্র'],
  ['K¬', 'ক্ল'],
  ['¶', 'ক্ষ'],
  ['ÿ', 'ক্ষ'],
  ['·', 'ক্স'],
  ['¸', 'গু'],
  ['»', 'গ্ধ'],
  ['Mœ', 'গ্ন'],
  ['M¥', 'গ্ম'],
  ['M­', 'গ্ল'],
  ['Mø', 'গ্ল'],
  ['¼', 'ঙ্ক'],
  ['•¶', 'ঙ্ক্ষ'],
  ['•L', 'ঙ্খ'],
  ['½', 'ঙ্গ'],
  ['•N', 'ঙ্ঘ'],
  ['•', 'ক্স'],
  ['”Q¡', 'চ্ছ্ব'],
  ['”Q¦', 'চ্ছ্ব'],
  ['”P', 'চ্চ'],
  ['”Q', 'চ্ছ'],
  ['”T', 'চ্ঞ'],
  ['¾¡', 'জ্জ্ব'],
  ['¾', 'জ্জ'],
  ['À', 'জ্ঝ'],
  ['Á', 'জ্ঞ'],
  ['R¡', 'জ্ব'],
  ['Â', 'ঞ্চ'],
  ['Ã', 'ঞ্ছ'],
  ['Ä', 'ঞ্জ'],
  ['Å', 'ঞ্ঝ'],
  ['Æ', 'ট্ট'],
  ['U¡', 'ট্ব'],
  ['U¥', 'ট্ম'],
  ['Ç', 'ড্ড'],
  ['È', 'ণ্ট'],
  ['É', 'ণ্ঠ'],
  ['Ý', 'ন্স'],
  ['Ê', 'ণ্ড'],
  ['š‘', 'ন্তু'],
  ['Y\\^', 'ণ্ব'],
  ['Ë¡', 'ত্ত্ব'],
  ['Ë', 'ত্ত'],
  ['Ì', 'ত্থ'],
  ['Z¥', 'ত্ম'],
  ['š—¡', 'ন্ত্ব'],
  ['Z¡', 'ত্ব'],
  ['Î', 'ত্র'],
  ['_¡', 'থ্ব'],
  ['›Ø', 'ন্দ্ব'],
  ['˜M', 'দ্গ'],
  ['˜N', 'দ্ঘ'],
  ['Ï', 'দ্দ'],
  ['×', 'দ্ধ'],
  ['˜¡', 'দ্ব'],
  ['Ø', 'দ্ব'],
  ['™¢', 'দ্ভ'],
  ['Ù', 'দ্ম'],
  ['`ª“', 'দ্রু'],
  ['aŸ', 'ধ্ব'],
  ['a¥', 'ধ্ম'],
  ['›U', 'ন্ট'],
  ['Ú', 'ন্ঠ'],
  ['Û', 'ন্ড'],
  ['šÍ', 'ন্ত'],
  ['š—', 'ন্ত'],
  ['š¿', 'ন্ত্র'],
  ['š’', 'ন্থ'],
  ['›`', 'ন্দ'],
  ['Ü', 'ন্ধ'],
  ['bœ', 'ন্ন'],
  ['š\\^', 'ন্ব'],
  ['b¥', 'ন্ম'],
  ['Þ', 'প্ট'],
  ['ß', 'প্ত'],
  ['cœ', 'প্ন'],
  ['à', 'প্প'],
  ['cø', 'প্ল'],
  ['c­', 'প্ল'],
  ['á', 'প্স'],
  ['d¬', 'ফ্ল'],
  ['â', 'ব্জ'],
  ['ã', 'ব্দ'],
  ['ä', 'ব্ধ'],
  ['eŸ', 'ব্ব'],
  ['e­', 'ব্ল'],
  ['eø', 'ব্ল'],
  ['å“', 'ভ্রু'],
  ['å', 'ভ্র'],
  ['gœ', 'ম্ন'],
  ['¤ú', 'ম্প'],
  ['ç', 'ম্ফ'],
  ['¤\\^', 'ম্ব'],
  ['¤¢', 'ম্ভ'],
  ['¤£', 'ম্ভ্র'],
  ['¤§', 'ম্ম'],
  ['¤­', 'ম্ল'],
  ['¤ø', 'ম্ল'],
  ['i“', 'রু'],
  ['iæ', 'রু'],
  ['iƒ', 'রূ'],
  ['é', 'ল্ক'],
  ['ê', 'ল্গ'],
  ['ë', 'ল্ট'],
  ['ì', 'ল্ড'],
  ['í', 'ল্প'],
  ['î', 'ল্ফ'],
  ['j¦', 'ল্ব'],
  ['j¥', 'ল্ম'],
  ['j­', 'ল্ল'],
  ['jø', 'ল্ল'],
  ['ï', 'শু'],
  ['ð', 'শ্চ'],
  ['kœ', 'শ্ন'],
  ['k¦', 'শ্ব'],
  ['k¥', 'শ্ম'],
  ['k­', 'শ্ল'],
  ['kø', 'শ্ল'],
  ['®‹', 'ষ্ক'],
  ['®Œ', 'ষ্ক্র'],
  ['ó', 'ষ্ট'],
  ['ô', 'ষ্ঠ'],
  ['ò', 'ষ্ণ'],
  ['®ú', 'ষ্প'],
  ['õ', 'ষ্ফ'],
  ['®§', 'ষ্ম'],
  ['¯‹', 'স্ক'],
  ['÷', 'স্ট'],
  ['ö', 'স্খ'],
  ['¯—', 'স্ত'],
  ['¯Í', 'স্ত'],
  ['¯‘', 'স্তু'],
  ['¯¿', 'স্ত্র'],
  ['¯’', 'স্থ'],
  ['mœ', 'স্ন'],
  ['¯ú', 'স্প'],
  ['ù', 'স্ফ'],
  ['¯\\^', 'স্ব'],
  ['¯§', 'স্ম'],
  ['¯­', 'স্ল'],
  ['¯ø', 'স্ল'],
  ['û', 'হু'],
  ['nè', 'হ্ণ'],
  ['nŸ', 'হ্ব'],
  ['ý', 'হ্ন'],
  ['þ', 'হ্ম'],
  ['n¬', 'হ্ল'],
  ['ü', 'হৃ'],
  ['©', 'র্'],
  ['Av', 'আ'],
  ['A', 'অ'],
  ['B', 'ই'],
  ['C', 'ঈ'],
  ['D', 'উ'],
  ['E', 'ঊ'],
  ['F', 'ঋ'],
  ['G', 'এ'],
  ['H', 'ঐ'],
  ['I', 'ও'],
  ['J', 'ঔ'],
  ['K', 'ক'],
  ['L', 'খ'],
  ['M', 'গ'],
  ['N', 'ঘ'],
  ['O', 'ঙ'],
  ['P', 'চ'],
  ['Q', 'ছ'],
  ['R', 'জ'],
  ['S', 'ঝ'],
  ['T', 'ঞ'],
  ['U', 'ট'],
  ['V', 'ঠ'],
  ['W', 'ড'],
  ['X', 'ঢ'],
  ['Y', 'ণ'],
  ['Z', 'ত'],
  ['_', 'থ'],
  ['`', 'দ'],
  ['a', 'ধ'],
  ['b', 'ন'],
  ['c', 'প'],
  ['d', 'ফ'],
  ['e', 'ব'],
  ['f', 'ভ'],
  ['g', 'ম'],
  ['h', 'য'],
  ['i', 'র'],
  ['j', 'ল'],
  ['k', 'শ'],
  ['l', 'ষ'],
  ['m', 'স'],
  ['n', 'হ'],
  ['o', 'ড়'],
  ['p', 'ঢ়'],
  ['q', 'য়'],
  ['r', 'ৎ'],
  ['v', 'া'],
  ['w', 'ি'],
  ['x', 'ী'],
  ['y', 'ু'],
  ['z', 'ু'],
  ['æ', 'ু'],
  ['~', 'ূ'],
  ['‚', 'ূ'],
  ['„', 'ৃ'],
  ['‡', 'ে'],
  ['†', 'ে'],
  ['‰', 'ৈ'],
  ['\\ˆ', 'ৈ'],
  ['Š', 'ৗ'],
  ['Ð', '-'],
  ['Ô', '‘'],
  ['Õ', '’'],
  ['\\|', '।'],
  ['\\\\', '॥'],
  ['Ò', '“'],
  ['Ó', '”'],
  ['s', 'ং'],
  ['t', 'ঃ'],
  ['u', 'ঁ'],
  ['ª', '্র'],
  ['Ö', '্র'],
  ['«', '্র'],
  ['¨', '্য'],
  ['\\&', '্'],
  ['…', 'ৃ'],
];

// 2. Unicode to Bijoy ANSI Mapping (literal replacements)
export const UNICODE_TO_BIJOY_MAP: [string, string][] = [
  ['।', '|'],
  ['‘', 'Ô'],
  ['’', 'Õ'],
  ['“', 'Ò'],
  ['”', 'Ó'],
  ['্র্য', 'ª¨'],
  ['ম্প্র', '¤cÖ'],
  ['র‌্য', 'i¨'],
  ['ক্ষ্ম', '²'],
  ['ক্ক', '°'],
  ['ক্ট', '±'],
  ['ক্ত', '³'],
  ['ক্ব', 'K¡'],
  ['স্ক্র', '¯Œ'],
  ['ক্র', 'µ'],
  ['ক্ল', 'K¬'],
  ['ক্ষ', '¶'],
  ['ক্স', '·'],
  ['গু', '¸'],
  ['গ্ধ', '»'],
  ['গ্ন', 'Mœ'],
  ['গ্ম', 'M¥'],
  ['গ্ল', 'M­'],
  ['গ্রু', 'Mªy'],
  ['ঙ্ক', '¼'],
  ['ঙ্ক্ষ', '•¶'],
  ['ঙ্খ', '•L'],
  ['ঙ্গ', '½'],
  ['ঙ্ঘ', '•N'],
  ['চ্ছ্ব', '”Q¡'],
  ['চ্চ', '”P'],
  ['চ্ছ', '”Q'],
  ['চ্ঞ', '”T'],
  ['জ্জ্ব', '¾¡'],
  ['জ্জ', '¾'],
  ['জ্ঝ', 'À'],
  ['জ্ঞ', 'Á'],
  ['জ্ব', 'R¡'],
  ['ঞ্চ', 'Â'],
  ['ঞ্ছ', 'Ã'],
  ['ঞ্জ', 'Ä'],
  ['ঞ্ঝ', 'Å'],
  ['ট্ট', 'Æ'],
  ['ট্ব', 'U¡'],
  ['ট্ম', 'U¥'],
  ['ড্ড', 'Ç'],
  ['ণ্ট', 'È'],
  ['ণ্ঠ', 'É'],
  ['ন্স', 'Ý'],
  ['ণ্ড', 'Ê'],
  ['ন্তু', 'š‘'],
  ['ণ্ব', 'Y^'],
  ['ত্ত্ব', 'Ë¡'],
  ['ত্ত', 'Ë'],
  ['ত্থ', 'Ì'],
  ['ত্ন', 'Zœ'],
  ['ত্ম', 'Z¥'],
  ['ন্ত্ব', 'š—¡'],
  ['ত্ব', 'Z¡'],
  ['থ্ব', '_¡'],
  ['দ্গ', '˜M'],
  ['দ্ঘ', '˜N'],
  ['দ্দ', 'Ï'],
  ['দ্ধ', '×'],
  ['দ্ব', 'Ø'],
  ['দ্ভ', '™¢'],
  ['দ্ম', 'Ù'],
  ['দ্রু', '`ª“'],
  ['ধ্ব', 'aŸ'],
  ['ধ্ম', 'a¥'],
  ['ন্ট', '›U'],
  ['ন্ঠ', 'Ú'],
  ['ন্ড', 'Û'],
  ['ন্ত্র', 'š¿'],
  ['ন্ত', 'š—'],
  ['স্ত্র', '¯¿'],
  ['ত্র', 'Î'],
  ['ন্থ', 'š’'],
  ['ন্দ', '›`'],
  ['ন্দ্ব', '›Ø'],
  ['ন্ধ', 'Ü'],
  ['ন্ন', 'bœ'],
  ['ন্ব', 'š^'],
  ['ন্ম', 'b¥'],
  ['প্ট', 'Þ'],
  ['প্ত', 'ß'],
  ['প্ন', 'cœ'],
  ['প্প', 'à'],
  ['প্ল', 'c­'],
  ['প্স', 'á'],
  ['ফ্ল', 'd¬'],
  ['ব্জ', 'â'],
  ['ব্দ', 'ã'],
  ['ব্ধ', 'ä'],
  ['ব্ব', 'eŸ'],
  ['ব্ল', 'e­'],
  ['ভ্র', 'å'],
  ['ম্ন', 'gœ'],
  ['ম্প', '¤ú'],
  ['ম্ফ', 'ç'],
  ['ম্ব', '¤^'],
  ['ম্ভ', '¤¢'],
  ['ম্ভ্র', '¤£'],
  ['ম্ম', '¤§'],
  ['ম্ল', '¤­'],
  ['্র', '«'],
  ['রু', 'i“'],
  ['রূ', 'iƒ'],
  ['ল্ক', 'é'],
  ['ল্গ', 'ê'],
  ['ল্ট', 'ë'],
  ['ল্ড', 'ì'],
  ['ল্প', 'í'],
  ['ল্ফ', 'î'],
  ['ল্ব', 'j¦'],
  ['ল্ম', 'j¥'],
  ['ল্ল', 'j­'],
  ['শু', 'ï'],
  ['শ্চ', 'ð'],
  ['শ্ন', 'kœ'],
  ['শ্ব', 'k¦'],
  ['শ্ম', 'k¥'],
  ['শ্ল', 'k­'],
  ['ষ্ক', '®‹'],
  ['ষ্ক্র', '®Œ'],
  ['ষ্ট', 'ó'],
  ['ষ্ঠ', 'ô'],
  ['ষ্ণ', 'ò'],
  ['ষ্প', '®ú'],
  ['ষ্ফ', 'õ'],
  ['ষ্ম', '®§'],
  ['স্ক', '¯‹'],
  ['স্ট', '÷'],
  ['স্খ', 'ö'],
  ['স্ত', '¯—'],
  ['স্তু', '¯‘'],
  ['স্থ', '¯’'],
  ['স্ন', 'mœ'],
  ['স্প', '¯ú'],
  ['স্ফ', 'ù'],
  ['স্ব', '¯^'],
  ['স্ম', '¯§'],
  ['স্ল', '¯­'],
  ['হু', 'û'],
  ['হ্ণ', 'nè'],
  ['হ্ব', 'nŸ'],
  ['হ্ন', 'ý'],
  ['হ্ম', 'þ'],
  ['হ্ল', 'n¬'],
  ['হৃ', 'ü'],
  ['র্', '©'],
  ['্য', '¨'],
  ['্', '&'],
  ['আ', 'Av'],
  ['অ', 'A'],
  ['ই', 'B'],
  ['ঈ', 'C'],
  ['উ', 'D'],
  ['ঊ', 'E'],
  ['ঋ', 'F'],
  ['এ', 'G'],
  ['ঐ', 'H'],
  ['ও', 'I'],
  ['ঔ', 'J'],
  ['ক', 'K'],
  ['খ', 'L'],
  ['গ', 'M'],
  ['ঘ', 'N'],
  ['ঙ', 'O'],
  ['চ', 'P'],
  ['ছ', 'Q'],
  ['জ', 'R'],
  ['ঝ', 'S'],
  ['ঞ', 'T'],
  ['ট', 'U'],
  ['ঠ', 'V'],
  ['ড', 'W'],
  ['ঢ', 'X'],
  ['ণ', 'Y'],
  ['ত', 'Z'],
  ['থ', '_'],
  ['দ', '`'],
  ['ধ', 'a'],
  ['ন', 'b'],
  ['প', 'c'],
  ['ফ', 'd'],
  ['ব', 'e'],
  ['ভ', 'f'],
  ['ম', 'g'],
  ['য', 'h'],
  ['র', 'i'],
  ['ল', 'j'],
  ['শ', 'k'],
  ['ষ', 'l'],
  ['স', 'm'],
  ['হ', 'n'],
  ['ড়', 'o'],
  ['ঢ়', 'p'],
  ['য়', 'q'],
  ['ৎ', 'r'],
  ['০', '0'],
  ['১', '1'],
  ['২', '2'],
  ['৩', '3'],
  ['৪', '4'],
  ['৫', '5'],
  ['৬', '6'],
  ['৭', '7'],
  ['৮', '8'],
  ['৯', '9'],
  ['া', 'v'],
  ['ি', 'w'],
  ['ী', 'x'],
  ['ু', 'y'],
  ['ূ', '~'],
  ['ৃ', '…'],
  ['ে', '‡'],
  ['ৈ', '‰'],
  ['ৗ', 'Š'],
  ['ং', 's'],
  ['ঃ', 't'],
  ['ঁ', 'u'],
];

// Set of common English words/terms to protect from Bijoy conversion
export const ENGLISH_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
  'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
  'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'love', 'country',
  'bank', 'janata', 'bangladesh', 'cell', 'development', 'integrated', 'customization', 'office', 'order', 'leave', 'roster',
  'allowance', 'billing', 'lunch', 'closing', 'executive', 'panel', 'portal', 'admin', 'system', 'date', 'month', 'year',
  'name', 'id', 'role', 'report', 'menu', 'login', 'logout', 'is', 'are', 'was', 'were', 'been', 'has', 'have', 'had',
  'does', 'did', 'should', 'might', 'must', 'shall', 'located', 'head', 'department',
  'online', 'banking', 'cbs', 'dgm', 'agm', 'plc', 'so', 'po', 'spo', 'it', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt',
  'generator', 'generation', 'real', 'time', 'mode', 'auto', 'detect', 'convert', 'copy', 'clear', 'download', 'help',
  'employee', 'user', 'trash', 'recycle', 'bin', 'holiday', 'night', 'duty', 'late', 'sitting', 'active', 'sheet',
  'payment', 'record', 'duties', 'allowances', 'total', 'grand', 'claim', 'stamp', 'revenue', 'deduction',
  'net', 'payable', 'words', 'taka', 'only', 'june', 'december', 'realtime', 'offline', 'accuracy', 'version', 'english', 'bangla', 'bengali', 'font',
  'converter', 'compat', 'sutonnymj', 'bayanno', 'ekushey', 'legacy', 'variants', 'r09', 'r22'
]);

// Helper functions for character categorization
export function isBanglaDigit(c: string): boolean {
  return c >= '০' && c <= '৯';
}

export function isBanglaPreKar(c: string): boolean {
  return c === 'ি' || c === 'ৈ' || c === 'ে';
}

export function isBanglaPostKar(c: string): boolean {
  return (
    c === 'া' ||
    c === 'ো' ||
    c === 'ৌ' ||
    c === 'ৗ' ||
    c === 'ু' ||
    c === 'ূ' ||
    c === 'ী' ||
    c === 'ৃ'
  );
}

export function isBanglaKar(c: string): boolean {
  return isBanglaPreKar(c) || isBanglaPostKar(c);
}

export function isBanglaBanjonborno(c: string): boolean {
  return (
    c === 'ক' || c === 'খ' || c === 'গ' || c === 'ঘ' || c === 'ঙ' ||
    c === 'চ' || c === 'ছ' || c === 'জ' || c === 'ঝ' || c === 'ঞ' ||
    c === 'ট' || c === 'ঠ' || c === 'ড' || c === 'ঢ' || c === 'ণ' ||
    c === 'ত' || c === 'থ' || c === 'দ' || c === 'ধ' || c === 'ন' ||
    c === 'প' || c === 'ফ' || c === 'ব' || c === 'ভ' || c === 'ম' ||
    c === 'য' || c === 'র' || c === 'ল' || c === 'শ' || c === 'ষ' ||
    c === 'স' || c === 'হ' || c === 'ড়' || c === 'ঢ়' || c === 'য়' ||
    c === 'ড়' || c === 'ঢ়' || c === 'য়' ||
    c === 'ৎ' || c === 'ং' || c === 'ঃ' || c === 'ঁ'
  );
}

export function isBanglaSoroborno(c: string): boolean {
  return (
    c === 'অ' || c === 'আ' || c === 'ই' || c === 'ঈ' ||
    c === 'উ' || c === 'ঊ' || c === 'ঋ' || c === 'ঌ' ||
    c === 'এ' || c === 'ঐ' || c === 'ও' || c === 'ঔ'
  );
}

export function isBanglaNukta(c: string): boolean {
  return c === 'ঁ';
}

export function isBanglaHalant(c: string): boolean {
  return c === '্';
}

export function isSpace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\n' || c === '\r';
}

export function isASCII(c: string): boolean {
  const code = c.charCodeAt(0);
  return code >= 0 && code < 128;
}

export function isLikelyEnglishNoContext(word: string): boolean {
  if (!word) return true;
  
  if (/[\u0980-\u09FF]/.test(word)) return false;
  
  const hasNonAscii = /[^\x00-\x7F]/.test(word);
  if (hasNonAscii) return false;
  
  if (word.length === 1) return false;
  
  if (/^\d+$/.test(word)) return true;
  
  if (ENGLISH_WORDS.has(word.toLowerCase())) return true;
  
  const isStdCap = /^[a-z]+$|^[A-Z]+$|^[A-Z][a-z]+$/.test(word);
  if (!isStdCap) return false;
  
  if (word.includes('_')) return false;
  
  if (/[qQ][^uU\s]/.test(word)) return false;
  
  const lowerWord = word.toLowerCase();
  if (/w[acdefgijkmnopqrsuvxyz]/.test(lowerWord)) return false;
  if (/vw|vg|sj|wj|ew|vq$|qy/.test(lowerWord)) return false;
  if (lowerWord.startsWith('evs')) return false;
  
  if (word.length <= 2) {
    const shortEng = new Set(['a', 'an', 'as', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'we', 'am', 'ok']);
    return shortEng.has(lowerWord);
  }
  
  return true;
}

/**
 * Checks if a word token is likely to be standard English (acronym or vocabulary).
 * Uses capitalization structures and character bigrams/trigrams offline.
 * Supports surrounding context lookup for single character words.
 */
export function isLikelyEnglish(token: string, index?: number, allTokens?: string[]): boolean {
  // Clean punctuation from token edges
  const word = token.replace(/^[.,\/#!$%\^*;:{}=\-()?"'“”]+|[.,\/#!$%\^*;:{}=\-()?"'“”]+$/g, '');
  if (!word) return true;
  
  if (/[\u0980-\u09FF]/.test(word)) return false;
  
  const hasNonAscii = /[^\x00-\x7F]/.test(word);
  if (hasNonAscii) return false;
  
  if (word.length === 1) {
    if (index !== undefined && allTokens !== undefined) {
      let leftWord = '';
      for (let k = index - 1; k >= 0; k--) {
        const t = allTokens[k];
        if (t && !/^(\s+|[.,\/#!$%\^*;:{}=\-()?"'“”]+)$/.test(t)) {
          leftWord = t.replace(/^[.,\/#!$%\^*;:{}=\-()?"'“”]+|[.,\/#!$%\^*;:{}=\-()?"'“”]+$/g, '');
          break;
        }
      }
      let rightWord = '';
      for (let k = index + 1; k < allTokens.length; k++) {
        const t = allTokens[k];
        if (t && !/^(\s+|[.,\/#!$%\^*;:{}=\-()?"'“”]+)$/.test(t)) {
          rightWord = t.replace(/^[.,\/#!$%\^*;:{}=\-()?"'“”]+|[.,\/#!$%\^*;:{}=\-()?"'“”]+$/g, '');
          break;
        }
      }
      
      const leftIsEng = leftWord ? isLikelyEnglishNoContext(leftWord) : false;
      const rightIsEng = rightWord ? isLikelyEnglishNoContext(rightWord) : false;
      
      if (leftIsEng || rightIsEng) {
        return true;
      }
    }
    return false;
  }
  
  return isLikelyEnglishNoContext(word);
}

/**
 * Rearranges vowels and modifiers when converting from Bijoy ANSI to Unicode.
 * Follows S. M. Mahbub Murshed's original algorithm.
 */
export function rearrangeBijoyToUnicode(str: string, skipRef: boolean = false): string {
  for (let i = 0; i < str.length; i++) {
    // 1. Vowel/Nukta + Halant + Consonant -> Halant + Consonant + Vowel/Nukta
    if (
      i > 0 &&
      str.charAt(i) === '্' &&
      (isBanglaKar(str.charAt(i - 1)) || isBanglaNukta(str.charAt(i - 1))) &&
      i < str.length - 1
    ) {
      let temp = str.substring(0, i - 1);
      temp += str.charAt(i);
      temp += str.charAt(i + 1);
      temp += str.charAt(i - 1);
      temp += str.substring(i + 2);
      str = temp;
    }

    // 2. RA + Halant + Vowel -> Vowel + RA + Halant
    if (
      i > 0 &&
      i < str.length - 1 &&
      str.charAt(i) === '্' &&
      str.charAt(i - 1) === 'র' &&
      str.charAt(i - 2) !== '্' &&
      isBanglaKar(str.charAt(i + 1))
    ) {
      let temp = str.substring(0, i - 1);
      temp += str.charAt(i + 1);
      temp += str.charAt(i - 1);
      temp += str.charAt(i);
      temp += str.substring(i + 2);
      str = temp;
    }

    // 3. Move Reph (র + ্্) to the end of the consonant cluster
    if (!skipRef) {
      if (
        i < str.length - 1 &&
        str.charAt(i) === 'র' &&
        isBanglaHalant(str.charAt(i + 1)) &&
        !isBanglaHalant(str.charAt(i - 1) || '')
      ) {
        let j = 1;
        while (true) {
          if (i - j < 0) break;
          if (isBanglaBanjonborno(str.charAt(i - j)) && isBanglaHalant(str.charAt(i - j - 1) || '')) {
            j += 2;
          } else if (j === 1 && isBanglaKar(str.charAt(i - j))) {
            j++;
          } else {
            break;
          }
        }
        let temp = str.substring(0, i - j);
        temp += str.charAt(i);
        temp += str.charAt(i + 1);
        temp += str.substring(i - j, i);
        temp += str.substring(i + 2);
        str = temp;
        i += 1;
        continue;
      }
    }

    // 4. Move pre-kar (ে, ৈ, ি) after the consonant cluster
    if (
      i < str.length - 1 &&
      isBanglaPreKar(str.charAt(i)) &&
      !isSpace(str.charAt(i + 1))
    ) {
      let j = 1;
      while (isBanglaBanjonborno(str.charAt(i + j) || '')) {
        if (isBanglaHalant(str.charAt(i + j + 1) || '')) {
          j += 2;
        } else {
          break;
        }
      }
      let temp = str.substring(0, i);
      temp += str.substring(i + 1, i + j + 1);
      
      let l = 0;
      if (str.charAt(i) === 'ে' && str.charAt(i + j + 1) === 'া') {
        temp += 'ো';
        l = 1;
      } else if (str.charAt(i) === 'ে' && str.charAt(i + j + 1) === 'ৗ') {
        temp += 'ৌ';
        l = 1;
      } else {
        temp += str.charAt(i);
      }
      
      temp += str.substring(i + j + l + 1);
      str = temp;
      i += j;
    }

    // 5. Chandrabindu (ঁ) should be placed after kars
    if (
      i < str.length - 1 &&
      str.charAt(i) === 'ঁ' &&
      isBanglaPostKar(str.charAt(i + 1))
    ) {
      let temp = str.substring(0, i);
      temp += str.charAt(i + 1);
      temp += str.charAt(i);
      temp += str.substring(i + 2);
      str = temp;
    }
  }

  return str;
}

/**
 * Rearranges vowels and modifiers when converting from Unicode to Bijoy ANSI.
 */
export function rearrangeUnicodeToBijoy(str: string): string {
  let cY = 0;
  for (let i = 0; i < str.length; i++) {
    // 1. Move pre-kar (ে, ৈ, ি) before the preceding consonant cluster
    if (isBanglaPreKar(str.charAt(i))) {
      let j = 1;
      while (true) {
        if (i - j < 0) break;
        if (i - j <= cY) break;
        if (isBanglaBanjonborno(str.charAt(i - j))) {
          if (isBanglaHalant(str.charAt(i - j - 1) || '')) {
            j += 2;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      
      let temp = str.substring(0, i - j);
      temp += str.charAt(i);
      temp += str.substring(i - j, i);
      temp += str.substring(i + 1);
      str = temp;
      cY = i + 1;
      continue;
    }

    // 2. Move Reph (র + ্্) after the following consonant cluster and its vowels
    if (
      i < str.length - 1 &&
      str.charAt(i) === '্' &&
      str.charAt(i - 1) === 'র' &&
      !isBanglaHalant(str.charAt(i - 2) || '')
    ) {
      let j = 1;
      let aZ = 0;
      let postKar = 0;
      while (true) {
        const nextChar = str.charAt(i + j) || '';
        const nextNextChar = str.charAt(i + j + 1) || '';
        
        if (isBanglaBanjonborno(nextChar) && isBanglaHalant(nextNextChar)) {
          j += 2;
        } else if (isBanglaBanjonborno(nextChar) && isBanglaPreKar(nextNextChar)) {
          aZ = 1;
          break;
        } else if (isBanglaBanjonborno(nextChar) && isBanglaPostKar(nextNextChar)) {
          postKar = 1;
          break;
        } else {
          break;
        }
      }
      
      let temp = str.substring(0, i - 1);
      if (aZ === 1) {
        temp += str.substring(i + j + 1, i + j + 2); // pre-kar
        temp += str.substring(i + 1, i + j + 1); // consonant
        temp += str.charAt(i - 1); // "র"
        temp += str.charAt(i); // "্"
        temp += str.substring(i + j + 2);
        i += (j + 1);
      } else if (postKar === 1) {
        temp += str.substring(i + 1, i + j + 1); // consonant
        temp += str.substring(i + j + 1, i + j + 2); // post-kar
        temp += str.charAt(i - 1); // "র"
        temp += str.charAt(i); // "্"
        temp += str.substring(i + j + 2);
        i += (j + 1);
      } else {
        temp += str.substring(i + 1, i + j + 1); // consonant
        temp += str.charAt(i - 1); // "র"
        temp += str.charAt(i); // "্"
        temp += str.substring(i + j + 1);
        i += j;
      }
      str = temp;
      cY = i + 1;
      continue;
    }
  }
  return str;
}

/**
 * Automatically detects whether the text is Unicode or Bijoy ANSI.
 * Real-time responsive and offline.
 */
export function detectEncoding(text: string): 'UNICODE' | 'BIJOY_ANSI' {
  if (!text) return 'UNICODE';
  
  if (/[\u0980-\u09FF]/.test(text)) {
    return 'UNICODE';
  }
  
  const bijoySignatureRegex = /[‡ˆ‰Š‹ŒŽª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/;
  if (bijoySignatureRegex.test(text)) {
    return 'BIJOY_ANSI';
  }
  
  if (/‡[a-zA-Z]|w[a-zA-Z]|[a-zA-Z]v|[a-zA-Z]_[a-zA-Z]/.test(text)) {
    return 'BIJOY_ANSI';
  }
  
  return 'BIJOY_ANSI';
}

/**
 * Converts Bijoy ANSI/SutonnyMJ text to Unicode.
 * Preserves English tokens and existing Unicode tokens.
 */
export function convertBijoyToUnicode(text: string): string {
  if (!text) return '';
  
  // Split by words and preserve all separators (whitespace, punctuation)
  const tokens = text.split(/(\s+|[.,\/#!$%\^*;:{}=\-()?"'“”]+)/);
  
  const convertedTokens = tokens.map((token, idx) => {
    if (!token) return '';
    
    // 1. Keep separators as is
    if (/^(\s+|[.,\/#!$%\^*;:{}=\-()?"'“”]+)$/.test(token)) {
      return token;
    }
    
    // 2. Keep Unicode as is
    if (/[\u0980-\u09FF]/.test(token)) {
      return token;
    }
    
    // 3. Keep English as is
    if (isLikelyEnglish(token, idx, tokens)) {
      return token;
    }
    
    // Otherwise, convert Bijoy ANSI -> Unicode
    let result = token;
    for (const [asciiPattern, unicodeReplacement] of BIJOY_TO_UNICODE_MAP) {
      const regex = new RegExp(asciiPattern, 'g');
      result = result.replace(regex, unicodeReplacement);
    }
    
    result = rearrangeBijoyToUnicode(result, false);
    result = result.replace(/অা/g, 'আ');
    result = result.replace(/্্/g, '্');
    
    return result;
  });
  
  return convertedTokens.join('');
}

/**
 * Converts Unicode Bangla text to Bijoy ANSI/SutonnyMJ.
 * Preserves English tokens.
 */
export function convertUnicodeToBijoy(text: string): string {
  if (!text) return '';
  
  // Split by words and preserve all separators (whitespace, punctuation)
  const tokens = text.split(/(\s+|[.,\/#!$%\^*;:{}=\-()?"'“”]+)/);
  
  const convertedTokens = tokens.map(token => {
    if (!token) return '';
    
    // 1. Keep separators as is
    if (/^(\s+|[.,\/#!$%\^*;:{}=\-()?"'“”]+)$/.test(token)) {
      return token;
    }
    
    // 2. If it contains NO Unicode Bangla, it is English or already Bijoy - keep as is
    if (!/[\u0980-\u09FF]/.test(token)) {
      return token;
    }
    
    // Otherwise, convert Unicode -> Bijoy ANSI
    let result = token;
    result = result.replace(/ো/g, 'ো');
    result = result.replace(/ৌ/g, 'ৌ');
    
    result = rearrangeUnicodeToBijoy(result);
    
    for (const [unicodePattern, asciiReplacement] of UNICODE_TO_BIJOY_MAP) {
      result = result.replaceAll(unicodePattern, asciiReplacement);
    }
    
    return result;
  });
  
  return convertedTokens.join('');
}

export function toBanglaDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
}

export function getBanglaDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const bnDay = toBanglaDigits(parseInt(day, 10).toString().padStart(2, '0'));
  const bnMonth = toBanglaDigits(parseInt(month, 10).toString().padStart(2, '0'));
  const bnYear = toBanglaDigits(year);
  return `${bnDay}-${bnMonth}-${bnYear}`;
}

export function getBanglaMonthYearLabel(ym: string): string {
  if (!ym || !ym.includes('-')) return '';
  const [yearStr, monthStr] = ym.split('-');
  const month = parseInt(monthStr, 10);
  const banglaMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  return `${banglaMonths[month - 1]} ${toBanglaDigits(yearStr)}`;
}

export function getBanglaNumberWords(num: number): string {
  if (num === 0) return 'শূন্য';
  
  const singleWords = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const teenWords = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
  const doubleWords = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

  const convertTens = (n: number): string => {
    if (n < 10) return singleWords[n];
    if (n >= 10 && n < 20) return teenWords[n - 10];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return doubleWords[ten] + (unit > 0 ? ' ' + singleWords[unit] : '');
  };

  let wordStr = '';
  let tempNum = num;
  
  // Lac portion
  if (tempNum >= 100000) {
    const lac = Math.floor(tempNum / 100000);
    wordStr += convertTens(lac) + ' লক্ষ ';
    tempNum %= 100000;
  }

  // Thousand portion
  if (tempNum >= 1000) {
    const thousand = Math.floor(tempNum / 1000);
    wordStr += convertTens(thousand) + ' হাজার ';
    tempNum %= 1000;
  }
  
  // Hundred portion
  if (tempNum >= 100) {
    const hundred = Math.floor(tempNum / 100);
    wordStr += singleWords[hundred] + ' শত ';
    tempNum %= 100;
  }
  
  // Tens portion
  if (tempNum > 0) {
    wordStr += convertTens(tempNum);
  }
  
  return wordStr.trim() + ' টাকা মাত্র';
}

