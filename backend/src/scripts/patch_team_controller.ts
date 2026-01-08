
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../controllers/team.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The block we want to replace. We will match the start and end to be safe.
const startMarker = "} else if (question.questionType === 'match_following') {";
const endMarker = "} else {";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find match_following block');
    process.exit(1);
}

// Ensure we found the correct block
console.log(`Found block at ${startIndex} to ${endIndex}`);

const newLogic = `    } else if (question.questionType === 'match_following') {
      try {
        let submittedPairs = typeof answer === 'string' ? JSON.parse(answer) : answer;
        if (!submittedPairs || typeof submittedPairs !== 'object') {
           console.error('Invalid match answer:', answer);
           submittedPairs = {};
        }

        const options = JSON.parse(question.options as string || '[]');
        console.log('Match Logic:', { submittedPairs, optionsLen: options.length });

        let correctCount = 0;
        const totalCount = options.length;

        options.forEach((termOpt: any) => {
          const droppedId = submittedPairs[termOpt.id];
          if (droppedId) {
            const droppedItem = options.find((o: any) => o.id === droppedId);
            if (droppedItem && droppedItem.matchId === termOpt.matchId) {
              correctCount++;
            }
          }
        });

        const scorePercentage = totalCount > 0 ? (correctCount / totalCount) : 0;
        pointsAwarded = Math.round(question.points * scorePercentage);
        isCorrect = correctCount === totalCount;
        
        additionalData = { correctCount, totalCount };
      } catch (error: any) {
        console.error('Match Error:', error);
        isCorrect = false;
        pointsAwarded = 0;
        additionalData = { correctCount: 0, totalCount: 0, error: error.message };
      }
    `;

// Replace content
const before = content.substring(0, startIndex);
const after = content.substring(endIndex);
const newContent = before + newLogic + after;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully patched team.controller.ts');
