const { cityMatchesBackOcr, fuzzyContains, normalizeAscii } = require('../src/utils/fydaAddressMatch');

// Simulate a back FYDA text output from Tesseract containing noise and some Amharic leftovers
const backText1 = `
Region Amhara
Zone West Gojam
Wereda Bahir Dar Zuria
Kebele 04
House No New
Blood Type O+
`;

const backText2 = `
woreda bahirdar
`;

console.log("Test 1 - Bahir Dar vs clear text:", cityMatchesBackOcr("Bahir Dar", backText1)); // Expect true
console.log("Test 2 - Bahir Dar vs squished text:", cityMatchesBackOcr("Bahir Dar", backText2)); // Expect true
console.log("Test 3 - Addis Ababa vs text:", cityMatchesBackOcr("Addis Ababa", "Addis Abeba")); // Expect true

console.log("\nFuzzy Contains bahirdar vs bahir dar:", fuzzyContains("bahirdar", "bahir dar")); // Expect true? Wait, normalizeAscii takes "bahir dar" -> "bahirdar"

