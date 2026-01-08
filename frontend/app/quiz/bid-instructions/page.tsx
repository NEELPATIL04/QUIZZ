'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BidRoundInstructions from '@/components/BidRoundInstructions';
import { api } from '@/lib/api';

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
      const data = await api.getEnabledQuestions();

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
      const mcqQuestions = parsedData
        .filter((q: any) => q.questionType === 'mcq_bidding')
        .sort((a: any, b: any) => a.questionNumber - b.questionNumber);

      if (mcqQuestions.length > 0) {
        setTargetQuestion(mcqQuestions[0]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBidRoundStatus = async () => {
    try {
      // 1. Check for GLOBAL current question (Priority)
      try {
        const currentQData = await api.getCurrentQuestion();
        if (currentQData && currentQData.id) {
          const allQuestions = await api.getEnabledQuestions();
          const sortedQuestions = allQuestions.sort((a: any, b: any) => a.questionNumber - b.questionNumber);
          const index = sortedQuestions.findIndex((q: any) => q.id === currentQData.id);

          if (index !== -1) {
            const teamNumber = sessionStorage.getItem('teamNumber');
            if (teamNumber) {
              sessionStorage.setItem(`currentQuestionIndex_${teamNumber}`, index.toString());
            }
            // Always redirect if found active
            router.push('/quiz/team');
            return;
          }
        }
      } catch (e) {
        console.log("Global check failed", e);
      }

      if (!targetQuestion) return;

      // 2. Fallback: Check specific target question timer
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/mcq/${targetQuestion.id}/timer`, {
        cache: 'no-store'
      });
      const data = await response.json();

      if (data.timerState && data.timerState.bidRoundEnabled) {
        const allQuestions = await api.getEnabledQuestions();
        const sortedQuestions = allQuestions.sort((a: any, b: any) => a.questionNumber - b.questionNumber);
        const index = sortedQuestions.findIndex((q: any) => q.id === targetQuestion.id);

        if (index !== -1) {
          const teamNumber = sessionStorage.getItem('teamNumber');
          if (teamNumber) {
            sessionStorage.setItem(`currentQuestionIndex_${teamNumber}`, index.toString());
          }
          router.push('/quiz/team');
        }
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
