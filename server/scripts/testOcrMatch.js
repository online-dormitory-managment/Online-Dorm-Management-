const { cityMatchesBackOcr, strictContains, normalizeAscii } = require('../src/utils/fydaAddressMatch');

console.log("Test 4 - bahidar missing 'r' vs bahir dar:", cityMatchesBackOcr("Bahir Dar", "woreda bahidar kebele 04"));
console.log("Test 5 - bahir dar vs Addis?", cityMatchesBackOcr("Addis Ababa", "woreda bahidar kebele 04"));
console.log("Test 6 - 'a' bypass?", cityMatchesBackOcr("a", "woreda bahidar kebele 04"));
