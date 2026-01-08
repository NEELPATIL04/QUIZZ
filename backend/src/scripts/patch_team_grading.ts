
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../controllers/team.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Strategy: Find the start of the else block and the end of the file/function.
const marker = "// For text answer questions";
const startIdx = content.indexOf(marker);

if (startIdx === -1) {
    console.error('Could not find marker:', marker);
    process.exit(1);
}

// Find the opening brace before the marker (it's inside the else)
// actually the code is: `    } else {\n      // For text answer questions`
// So we find the marker.

// We want to replace from `// For text answer questions` up to the closing brace of the else block.
// The else block logic is:
// isCorrect = ...
// pointsAwarded = ...
// }

// Let's find the position of `pointsAwarded = isCorrect ? question.points : 0;`
const pointsLineMarker = "pointsAwarded = isCorrect ? question.points : 0;";
const pointsIdx = content.indexOf(pointsLineMarker, startIdx);

if (pointsIdx === -1) {
    console.error('Could not find points line');
    process.exit(1);
}

// Find the closing brace after pointsLine
const closingBraceIdx = content.indexOf("}", pointsIdx);

// The range to replace is from `startIdx` to `closingBraceIdx - 1` (roughly).
// Better: We replace the whole content from marker to end of `pointsAwarded` line?
// No, I want to inject the new logic.

const newLogic = `// Robust Grading (Text + Array Support)
      isCorrect = false;
      const cleanAnswer = answer ? String(answer).trim() : '';
      const cleanCorrect = question.correctAnswer ? String(question.correctAnswer).trim() : '';

      try {
        if (cleanAnswer.startsWith('[') && cleanCorrect.startsWith('[')) {
            const parsedAnswer = JSON.parse(cleanAnswer);
            const parsedCorrect = JSON.parse(cleanCorrect);

            if (Array.isArray(parsedAnswer) && Array.isArray(parsedCorrect)) {
                 const sortedAnswer = [...parsedAnswer].sort().map(s => String(s).trim().toLowerCase());
                 const sortedCorrect = [...parsedCorrect].sort().map(s => String(s).trim().toLowerCase());
                 isCorrect = JSON.stringify(sortedAnswer) === JSON.stringify(sortedCorrect);
            } else {
                 isCorrect = cleanAnswer.toLowerCase() === cleanCorrect.toLowerCase();
            }
        } else {
            isCorrect = cleanAnswer.toLowerCase() === cleanCorrect.toLowerCase();
        }
      } catch (e) {
        isCorrect = cleanAnswer.toLowerCase() === cleanCorrect.toLowerCase();
      }
      
      pointsAwarded = isCorrect ? question.points : 0;`;

// Construct the new content
// Remove old lines:
//   // For text answer questions
//   isCorrect = answer.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();
//   pointsAwarded = isCorrect ? question.points : 0;

// I will look for the exact string range again using the dump info.
// Dump: `isCorrect = answer.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase()`
// It seems `toLowerCase()` doesn't have semicolon in some versions? No, `team.controller.ts` line 387 has `;`.
// Maybe whitespace is weird.

// I'll regex replace.
const regex = /\/\/ For text answer questions[\s\S]*?pointsAwarded = isCorrect \? question\.points : 0;/;

if (!regex.test(content)) {
    console.error('Regex match failed');
    process.exit(1);
}

content = content.replace(regex, newLogic);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched grading logic via regex.');
