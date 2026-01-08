'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Code, Eye, Info, FileCode } from 'lucide-react';

interface HtmlCssQuestion {
  id: string;
  questionNumber: number;
  title: string;
  description: string;
  providedHtml: string;
  providedCss: string;
  targetSelector: string;
  idealCss: string;
  requiredProperties: string[];
  scoringCriteria: {
    idealMethod: { properties: string[]; points: number };
    alternativeMethod: { properties: string[]; pointsDeduction: number };
    optionalProperties: string[];
  };
  points: number;
}

interface HtmlCssChallengeProps {
  question: HtmlCssQuestion;
  teamNumber: number;
  isController: boolean;
  onSubmit: (css: string, timeTaken: number, startTime: Date) => Promise<{ isCorrect: boolean; pointsAwarded: number }>;
  readOnly?: boolean;
  showAnswer?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNextQuestion?: boolean;
  hasPreviousQuestion?: boolean;
  isSubmitted?: boolean;
  nextQuestionIsBidRound?: boolean;
}

export default function HtmlCssChallenge({
  question,
  teamNumber,
  isController,
  onSubmit,
  readOnly = false,
  showAnswer = false,
  onNext,
  onPrevious,
  hasNextQuestion = false,
  hasPreviousQuestion = false,
  nextQuestionIsBidRound = false,
  isSubmitted: isSubmittedProp = false,
}: HtmlCssChallengeProps) {
  const [userCss, setUserCss] = useState<string>('');
  const [startTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null);
  const [showFullHtml, setShowFullHtml] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'target'>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract expected image from description if present (looking for data URI in markdown image or specifically tagged)
  // Or since I can't easily pass new props without schema change, I'll look for a specific marker in description?
  // Actually, I can just check if question.description contains an image, or just add a hardcoded check for Q6 for now?
  // Better: The user asked to "show window of actual output". I'll add a "Target" tab.
  // I will check if there is an image in the description (not ideal) or just rely on a new prop I can't pass yet...
  // Wait, I can pass it via `hints` if I wanted, but standard way is best.
  // For now, I will hardcode the expected output for Question 6 based on ID/Number if I have to, OR better:
  // I can detect if `question.description` has an image and use that?
  // Let's implement the tab switching UI first.

  // Timer
  useEffect(() => {
    if (readOnly || isSubmitted) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, readOnly, isSubmitted]);

  // Update live preview
  useEffect(() => {
    if (iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (iframeDoc) {
        // Smart wrapping:
        // If userCss contains '{', assume they are writing full selectors/rulesets -> Don't wrap.
        // If targetSelector is present AND userCss has no braces, wrap it.
        // Otherwise, treat as global.

        let userStyle = userCss;

        const hasBraces = /[{}]/.test(userCss);
        if (question.targetSelector && !hasBraces) {
          userStyle = `${question.targetSelector} { ${userCss} }`;
        }

        const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <style>
    ${question.providedCss}

    ${userStyle}
  </style>
</head>
<body>
  ${question.providedHtml}
</body>
</html>
        `;
        iframeDoc.open();
        iframeDoc.write(fullHtml);
        iframeDoc.close();
      }
    }
  }, [userCss, question]);

  const handleSubmit = async () => {
    const timeTaken = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const result = await onSubmit(userCss, timeTaken, startTime);
    setResult(result);
    setIsSubmitted(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6">
      {/* Header with Navigation and Timer */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Top Row: Navigation Buttons & Timer */}
        <div className="flex items-center justify-between w-full">
          {/* Left: Previous Button */}
          <div>
            {!readOnly && hasPreviousQuestion && onPrevious && (
              <Button
                onClick={onPrevious}
                size="sm"
                variant="outline"
                className="bg-purple-700/80 hover:bg-purple-600 text-white font-semibold px-4 py-2 text-sm border-purple-500"
              >
                ← Previous
              </Button>
            )}
          </div>

          {/* Right: Next Button + Timer */}
          <div className="flex items-center gap-3">
            {!readOnly && !isSubmitted && (
              <div className="flex items-center gap-2 bg-purple-800/80 px-4 py-2 rounded-lg border border-purple-500/50 shadow-md">
                <Clock className="w-4 h-4 text-purple-200" />
                <span className="text-white font-mono font-bold text-lg">
                  {formatTime(elapsedTime)}
                </span>
              </div>
            )}
            {!readOnly && hasNextQuestion && onNext && (
              <Button
                onClick={onNext}
                size="sm"
                className={nextQuestionIsBidRound
                  ? "bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-bold px-4 py-2 text-sm animate-pulse"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-4 py-2 text-sm"
                }
              >
                {nextQuestionIsBidRound ? "Bid Round →" : "Next →"}
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Row: Title (Centered) */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Question {question.questionNumber}: {question.title}
          </h1>
          <p className="text-purple-200 text-base">{question.points} points</p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="bg-gradient-to-br from-purple-800 to-indigo-800 border-2 border-purple-600 shadow-2xl mb-6">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <Info className="w-8 h-8 text-purple-200 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Instructions</h2>
                <Button
                  onClick={() => setShowFullHtml(!showFullHtml)}
                  variant="outline"
                  className="bg-purple-700 hover:bg-purple-600 text-white border-purple-500"
                >
                  <FileCode className="w-4 h-4 mr-2" />
                  {showFullHtml ? 'Hide' : 'View'} Full HTML
                </Button>
              </div>
              <div className="text-purple-100 text-lg leading-relaxed space-y-3">
                <p>{question.description}</p>
                <div className="bg-purple-900/50 border border-purple-500 rounded-lg p-4 mt-4">
                  <p className="font-semibold text-purple-200">Target Element:</p>
                  <code className="text-yellow-300 font-mono text-xl">{question.targetSelector}</code>
                </div>
                <p className="text-sm text-purple-300 mt-4">
                  💡 <strong>Tip:</strong> Focus on positioning the element correctly. Styling properties like colors and fonts are optional.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full HTML View */}
      {showFullHtml && (
        <Card className="bg-slate-900 border-2 border-purple-500 shadow-2xl mb-6">
          <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-3 border-b border-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-white" />
                <span className="text-lg font-semibold text-white">Complete HTML Document</span>
              </div>
              <Button
                onClick={() => setShowFullHtml(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-purple-600"
              >
                ✕
              </Button>
            </div>
          </div>
          <CardContent className="p-0">
            <pre className="bg-[#1e1e1e] text-green-400 font-mono text-sm p-6 overflow-x-auto max-h-[500px] overflow-y-auto">
              {`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <style>
${question.providedCss}

    ${question.targetSelector} {
      /* Your CSS will be applied here */
    }
  </style>
</head>
<body>
${question.providedHtml}
</body>
</html>`}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Split View: Code Editor (Left) | Live Preview (Right) */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* CSS Code Editor */}
        <Card className="bg-slate-900 border-4 border-slate-700 shadow-2xl">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-900">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-purple-400" />
              <span className="text-lg font-semibold text-white">
                {question.targetSelector
                  ? `Write CSS for ${question.targetSelector}`
                  : 'Write Global CSS (Target specific classes)'}
              </span>
            </div>
          </div>
          <CardContent className="p-0">
            <textarea
              value={userCss}
              onChange={(e) => !readOnly && !isSubmitted && setUserCss(e.target.value)}
              disabled={readOnly || isSubmitted}
              placeholder={`/* Write your CSS here to position the card */\n/* You can use any CSS properties */\n/* Example: */\nbackground-color: lightblue;\npadding: 10px;\n/* Add positioning properties... */`}
              className="w-full h-[600px] bg-[#1e1e1e] text-green-400 font-mono text-base p-6 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
              style={{
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                tabSize: 2
              }}
            />
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="bg-slate-900 border-4 border-slate-700 shadow-2xl">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-900">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${activeTab === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Live Preview
                </button>
                <button
                  onClick={() => setActiveTab('target')}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${activeTab === 'target'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Target Output
                </button>
              </div>
            </div>
          </div>
          <CardContent className="p-0">
            {activeTab === 'preview' ? (
              <iframe
                ref={iframeRef}
                title="Live Preview"
                className="w-full h-[600px] bg-white border-0"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="w-full h-[600px] bg-white flex items-center justify-center p-4">
                {/* 
                    For Q6 specifically, or generally if we have a target image. 
                    Since I couldn't change schema, I'll hardcode the SVG for Q6 here or 
                    try to parse it. 
                    Actually, I'll paste the same expected output SVG here for the "Target" tab
                    if questionNumber === 6.
                 */}
                {/* 
                    Target Image Logic:
                    Show if Question Number is 6 OR Title contains "Stacking" (case insensitive)
                 */}
                {(question.questionNumber === 6 || question.title.toLowerCase().includes('stacking')) ? (
                  <div className="text-center">
                    <img
                      src={`data:image/svg+xml;base64,${btoa(`<svg width="300" height="250" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="50" width="100" height="150" fill="#ff4444" rx="10" stroke="white" stroke-width="2" />
  <rect x="80" y="60" width="100" height="150" fill="#44ff44" rx="10" stroke="white" stroke-width="2" />
  <rect x="110" y="70" width="100" height="150" fill="#4444ff" rx="10" stroke="white" stroke-width="2" />
  <text x="50" y="240" font-family="Arial" font-size="14" fill="#ccc">Target: Stacked diagonally</text>
</svg>`)}`}
                      alt="Target Output"
                      className="max-w-full max-h-full shadow-lg border-2 border-slate-200 rounded-lg"
                    />
                    <p className="text-slate-500 mt-4">Expected Result</p>
                  </div>
                ) : (
                  <div className="text-slate-400">No target image available for this question.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Control Buttons - Only for Controllers */}
      {isController && !readOnly && !isSubmitted && (
        <Card className="bg-slate-800 border-2 border-slate-600 mb-6">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <Button
                onClick={handleSubmit}
                disabled={userCss.trim() === ''}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 px-12 text-lg shadow-lg disabled:opacity-50"
              >
                Submit Solution
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isSubmitted && result && (
        <Card className={`border-2 mb-6 ${result.isCorrect
          ? 'bg-green-900/50 border-green-500'
          : 'bg-red-900/50 border-red-500'
          }`}>
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              {result.isCorrect ? (
                <>
                  <CheckCircle className="w-12 h-12 text-green-400" />
                  <div>
                    <h3 className="text-3xl font-bold text-white">Excellent Work!</h3>
                    <p className="text-green-200 text-lg mt-1">You positioned the card correctly!</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 text-red-400" />
                  <div>
                    <h3 className="text-3xl font-bold text-white">Good Attempt!</h3>
                    <p className="text-red-200 text-lg mt-1">The card wasn't positioned correctly, but keep trying!</p>
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-lg text-white">
              <div className="bg-black/30 p-4 rounded-lg">
                <p className="text-gray-300">Points Earned:</p>
                <p className="text-2xl font-bold">{result.pointsAwarded} / {question.points}</p>
              </div>
              <div className="bg-black/30 p-4 rounded-lg">
                <p className="text-gray-300">Time Taken:</p>
                <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show Ideal Solution */}
      {showAnswer && (
        <Card className="bg-gradient-to-r from-emerald-900 to-green-900 border-2 border-green-500 mb-6">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-white mb-4">💡 Ideal Solution</h3>
            <div className="bg-slate-900 p-6 rounded-lg border border-green-500">
              <pre className="text-green-400 font-mono text-base">
                {question.targetSelector} {'{'}
                {question.idealCss}
                {'}'}
              </pre>
            </div>
            <p className="text-green-200 mt-4">
              The ideal method uses <code className="bg-green-800 px-2 py-1 rounded text-yellow-300">position: absolute</code> with{' '}
              <code className="bg-green-800 px-2 py-1 rounded text-yellow-300">bottom</code> and{' '}
              <code className="bg-green-800 px-2 py-1 rounded text-yellow-300">right</code> properties.
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
