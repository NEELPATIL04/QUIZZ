'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BidRoundInstructions from '@/components/BidRoundInstructions';

function BidInstructionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetQuestionId = searchParams.get('questionId');

  const [targetQuestion, setTargetQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTargetQuestion();

    // Poll every 2 seconds to check if bid round is enabled
    const interval = setInterval(() => {
      checkBidRoundStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [targetQuestionId]);

  const fetchTargetQuestion = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/public/questions/enabled');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await response.json();

      // Parse options if needed
      const parsedData = data.map((q: any) => ({
        ...q,
        options: q.options && typeof q.options === 'string' ? JSON.parse(q.options) : q.options || []
      }));

      // If we have a target ID, look for it specifically
      if (targetQuestionId) {
        const found = parsedData.find((q: any) => q.id === targetQuestionId);
        if (found) {
          setTargetQuestion(found);
          setLoading(false);
          return;
        }
      }

      // Fallback: Use logic for "first MCQ question" if no ID or ID not found
      // This supports legacy behavior or deep linking without ID
      const mcqQuestions = parsedData
        .filter((q: any) => q.questionType === 'mcq_bidding')
        .sort((a: any, b: any) => a.questionNumber - b.questionNumber);

      if (mcqQuestions.length > 0) {
        setTargetQuestion(mcqQuestions[0]);
      }
    } catch (error) {
      console.error('Error fetching MCQ questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBidRoundStatus = async () => {
    try {
      if (!targetQuestion) return;

      const response = await fetch(`http://localhost:5000/api/quiz/mcq/${targetQuestion.id}/timer`, {
        cache: 'no-store'
      });
      const data = await response.json();

      // If bid round is enabled, set question index and navigate back to team page
      if (data.timerState && data.timerState.bidRoundEnabled) {
        // Find the index of the TARGET MCQ question
        const allQuestionsResponse = await fetch('http://localhost:5000/api/public/questions/enabled');
        if (!allQuestionsResponse.ok) {
          throw new Error('Failed to fetch questions');
        }
        const allQuestions = await allQuestionsResponse.json();
        const sortedQuestions = allQuestions.sort((a: any, b: any) => a.questionNumber - b.questionNumber);
        const mcqIndex = sortedQuestions.findIndex((q: any) => q.id === targetQuestion.id);

        // Store the index in session storage
        const teamNumber = sessionStorage.getItem('teamNumber');
        if (teamNumber && mcqIndex !== -1) {
          sessionStorage.setItem(`currentQuestionIndex_${teamNumber}`, mcqIndex.toString());
        }

        router.push('/quiz/team');
      }
    } catch (error) {
      console.error('Error checking bid round status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Loading bid round...</p>
        </div>
      </div>
    );
  }

  if (!targetQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">No bid round questions found...</p>
        </div>
      </div>
    );
  }

  return (
    <BidRoundInstructions />
  );
}

export default function BidInstructionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BidInstructionsContent />
    </Suspense>
  );
}
