'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ArrowLeft, Eye } from 'lucide-react';
import GitQuizInterface from '@/components/GitQuizInterface';
import HtmlCssChallenge from '@/components/HtmlCssChallenge';

export default function QuestionPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestion();
  }, [params.questionId]);

  const fetchQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const questions = await api.getQuestions(token);
      const q = questions.find((q: any) => q.id === params.questionId);

      if (q) {
        setQuestion(q);
      } else {
        alert('Question not found');
        router.push('/dashboard/questions');
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      alert('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading preview...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">Question not found</p>
            <Button onClick={() => router.push('/dashboard/questions')} className="mt-4">
              Back to Questions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/questions')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Questions
                </Button>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Eye className="h-6 w-6 text-blue-600" />
                    Preview Mode - Admin View
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    This is how teams will see the question
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800">
                  Question #{question.questionNumber}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Question Preview */}
        {question.questionType === 'git_challenge' ? (
          <GitQuizInterface
            question={{
              id: question.id,
              questionNumber: question.questionNumber,
              title: question.title,
              story: question.story || '',
              availableCommands: question.availableCommands ? JSON.parse(question.availableCommands) : [],
              completedCommands: question.completedCommands ? JSON.parse(question.completedCommands) : [],
              correctAnswer: question.correctAnswer ? JSON.parse(question.correctAnswer) : [],
              points: question.points,
            }}
            teamNumber={0} // Preview mode - no team
            isController={true} // Admin sees all controls in preview
            onSubmit={async (answer, timeTaken, startTime) => {
              // This won't be called in read-only mode
              return { isCorrect: false, pointsAwarded: 0 };
            }}
            readOnly={true} // Admin can only VIEW, not interact
            showAnswer={true} // Always show answer in preview mode
          />
        ) : question.questionType === 'html_css_challenge' ? (
          <HtmlCssChallenge
            question={{
              id: question.id,
              questionNumber: question.questionNumber,
              title: question.title,
              description: question.description || '',
              providedHtml: question.providedHtml || '',
              providedCss: question.providedCss || '',
              targetSelector: question.targetSelector || '',
              idealCss: question.idealCss || '',
              requiredProperties: question.requiredProperties ? JSON.parse(question.requiredProperties) : [],
              scoringCriteria: question.scoringCriteria ? JSON.parse(question.scoringCriteria) : {},
              points: question.points,
            }}
            teamNumber={0}
            isController={true}
            onSubmit={async (css, timeTaken, startTime) => {
              return { isCorrect: false, pointsAwarded: 0 };
            }}
            readOnly={false}
            showAnswer={true}
          />
        ) : question.questionType === 'js_engine_challenge' ? (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
            JS Engine Challenge Preview Not Fully Implemented in this View
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Question {question.questionNumber}: {question.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {question.description && (
                  <p className="text-muted-foreground">{question.description}</p>
                )}
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <p className="font-semibold text-green-900">Correct Answer:</p>
                  <p className="text-lg font-mono mt-2">{question.correctAnswer}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Points: {question.points}</p>
                  <p>Type: {question.questionType || 'text_answer'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-2 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Preview Mode</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You're viewing this question as an admin. Teams will see the same interface when this question is enabled.
                  In preview mode, you can test the drag-and-drop functionality and see the correct answer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
