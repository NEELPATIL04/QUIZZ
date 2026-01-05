'use client';

import { useState } from 'react';
import BrokenHtmlChallenge from '@/components/BrokenHtmlChallenge';
import { sampleBrokenHtmlQuestion1, sampleBrokenHtmlQuestion2, sampleBrokenHtmlQuestion3 } from '@/lib/sampleBrokenHtmlQuestion';
import { Button } from '@/components/ui/button';

export default function TestBrokenHtmlPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const questions = [sampleBrokenHtmlQuestion1, sampleBrokenHtmlQuestion2, sampleBrokenHtmlQuestion3];

  const handleSubmit = async (tree: any, timeTaken: number, startTime: Date) => {
    console.log('Submitted tree:', tree);
    console.log('Time taken:', timeTaken);

    // Simple validation: check if there are any validation errors
    // In a real implementation, this would compare with the correct tree
    return {
      isCorrect: true,
      pointsAwarded: questions[currentQuestion].points,
    };
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Question Selector */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Button
          onClick={() => setCurrentQuestion(0)}
          variant={currentQuestion === 0 ? 'default' : 'outline'}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Question 1 (Easy)
        </Button>
        <Button
          onClick={() => setCurrentQuestion(1)}
          variant={currentQuestion === 1 ? 'default' : 'outline'}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Question 2 (Medium)
        </Button>
        <Button
          onClick={() => setCurrentQuestion(2)}
          variant={currentQuestion === 2 ? 'default' : 'outline'}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Question 3 (Hard)
        </Button>
      </div>

      {/* Challenge Component */}
      <BrokenHtmlChallenge
        question={questions[currentQuestion]}
        teamNumber={1}
        isController={true}
        onSubmit={handleSubmit}
        readOnly={false}
        showAnswer={false}
        hasNextQuestion={currentQuestion < questions.length - 1}
        hasPreviousQuestion={currentQuestion > 0}
        onNext={() => setCurrentQuestion(prev => Math.min(prev + 1, questions.length - 1))}
        onPrevious={() => setCurrentQuestion(prev => Math.max(prev - 1, 0))}
        nextQuestionIsBidRound={currentQuestion === questions.length - 1}
      />
    </div>
  );
}
