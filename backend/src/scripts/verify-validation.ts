const optionsStr = `[{"key":"A","text":"[1, 2, 3, 10, 20, 30]"},{"key":"B","text":"[1, 2, 3]"},{"key":"C","text":"Infinite loop / program never finishes"},{"key":"D","text":"[1, 2, 3, 10]"}]`;
const answerStr = "Infinite loop / program never finishes";
const correctStr = "C";

console.log('--- Verification Start ---');

// Logic from team.controller.ts
let options = [];
try {
    if (typeof optionsStr === 'string') {
        const firstParse = JSON.parse(optionsStr);
        if (typeof firstParse === 'string') {
            options = JSON.parse(firstParse);
        } else {
            options = firstParse;
        }
    }
} catch (e) {
    console.log('Parse error', e);
}

console.log('Options length:', options.length);
console.log('Option C text:', options.find(o => o.key === 'C').text);

const resolveToKeys = (val) => {
    if (!val) return [];

    let parsed;
    try {
        parsed = JSON.parse(val);
    } catch (e) {
        parsed = val;
    }

    const values = Array.isArray(parsed) ? parsed : [parsed];

    return values.map((v) => {
        const s = String(v).trim();

        // 1. Check if it matches a Key directly (case-insensitive)
        const matchedByKey = options.find((o) => o.key && o.key.toLowerCase() === s.toLowerCase());
        if (matchedByKey) {
            console.log(`Resolved "${s}" to key "${matchedByKey.key}" (matched by key)`);
            return matchedByKey.key.toUpperCase();
        }

        // 2. Check if it matches Option Text (case-insensitive)
        const matchedByText = options.find((o) => o.text && o.text.trim().toLowerCase() === s.toLowerCase());
        if (matchedByText) {
            console.log(`Resolved "${s}" to key "${matchedByText.key}" (matched by text)`);
            return matchedByText.key.toUpperCase();
        }

        console.log(`Could not resolve "${s}" to a key`);
        return s.toUpperCase();
    });
}

const userKeys = resolveToKeys(answerStr).sort();
const correctKeys = resolveToKeys(correctStr).sort();

console.log('User Keys:', JSON.stringify(userKeys));
console.log('Correct Keys:', JSON.stringify(correctKeys));
console.log('Match?', JSON.stringify(userKeys) === JSON.stringify(correctKeys));
