'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Undo2, Redo2, RotateCcw } from 'lucide-react';

interface GitQuestion {
  id: string;
  questionNumber: number;
  title: string;
  story: string;
  availableCommands: string[];
  completedCommands: string[];
  correctAnswer: string[];
  points: number;
}

interface CompletedCommand {
  command: string;
  output: string;
  isError?: boolean;
}

interface GitQuizInterfaceProps {
  question: GitQuestion;
  teamNumber: number;
  onSubmit: (answer: string[], timeTaken: number, startTime: Date) => Promise<{ isCorrect: boolean; pointsAwarded: number }>;
  readOnly?: boolean;
  showAnswer?: boolean;
  isController?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNextQuestion?: boolean;
  hasPreviousQuestion?: boolean;
  isSubmitted?: boolean;
  nextQuestionIsBidRound?: boolean;
}

// Validate command sequence and generate realistic Git output
const validateAndGenerateOutput = (
  command: string,
  executedNewCommands: string[],
  allExecutedCommands: CompletedCommand[]
): { output: string; isError: boolean } => {
  const lowerCmd = command.toLowerCase().trim();

  // Check git log
  if (lowerCmd === 'git log --oneline') {
    return {
      output: `i7j8k9l (HEAD -> main) Add styling, script, and about page\ne4f5g6h Update UI in index.html\na1b2c3d Add initial index.html`,
      isError: false
    };
  }

  // Check git show
  if (lowerCmd.startsWith('git show')) {
    const parts = lowerCmd.split(' ');
    const commitId = parts[2] || 'e4f5g6h';
    return {
      output: `commit ${commitId}\nAuthor: John <john@example.com>\nDate:   ${new Date().toDateString()}\n\n    Update UI in index.html\n\ndiff --git a/index.html b/index.html\nindex 1234567..abcdefg 100644\n--- a/index.html\n+++ b/index.html\n@@ -1,2 +1,5 @@\n <html>\n+  <head><title>My Project</title></head>\n+  <body>\n+    <h1>Welcome!</h1>\n+  </body>\n </html>`,
      isError: false
    };
  }

  // Check git push origin feature-branch
  if (lowerCmd === 'git push origin feature-branch') {
    // Should not have checked out main yet
    if (executedNewCommands.some(cmd => cmd.toLowerCase().includes('git checkout main'))) {
      return {
        output: `error: src refspec feature-branch does not match any\nerror: failed to push some refs to 'origin'`,
        isError: true
      };
    }
    return {
      output: `Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.\nDelta compression using up to 8 threads\nCompressing objects: 100% (3/3), done.\nWriting objects: 100% (3/3), 321 bytes | 321.00 KiB/s, done.\nTotal 3 (delta 2), reused 0 (delta 0)\nTo https://github.com/john/project.git\n * [new branch]      feature-branch -> feature-branch`,
      isError: false
    };
  }

  // Check git checkout main
  if (lowerCmd === 'git checkout main') {
    return {
      output: `Switched to branch 'main'\nYour branch is up to date with 'origin/main'.`,
      isError: false
    };
  }

  // Check git merge feature-branch
  if (lowerCmd === 'git merge feature-branch') {
    // Must have checked out main first
    if (!executedNewCommands.some(cmd => cmd.toLowerCase().includes('git checkout main'))) {
      return {
        output: `fatal: refusing to merge unrelated histories`,
        isError: true
      };
    }
    return {
      output: `Updating a1b2c3d..i7j8k9l\nFast-forward\n index.html   |  7 +++++--\n style.css    | 45 +++++++++++++++++++++++++++++++++++++++++++++\n app.js       | 30 ++++++++++++++++++++++++++++++\n about.html   | 15 +++++++++++++++\n 4 files changed, 95 insertions(+), 2 deletions(-)`,
      isError: false
    };
  }

  // Check git push origin main
  if (lowerCmd === 'git push origin main') {
    // Must have merged first
    if (!executedNewCommands.some(cmd => cmd.toLowerCase().includes('git merge'))) {
      return {
        output: `Everything up-to-date`,
        isError: false
      };
    }
    return {
      output: `Enumerating objects: 12, done.\nCounting objects: 100% (12/12), done.\nDelta compression using up to 8 threads\nCompressing objects: 100% (8/8), done.\nWriting objects: 100% (8/8), 1.2 KiB | 1.2 MiB/s, done.\nTotal 8 (delta 4), reused 0 (delta 0)\nTo https://github.com/john/project.git\n   a1b2c3d..i7j8k9l  main -> main`,
      isError: false
    };
  }

  return { output: '', isError: false };
};

export default function GitQuizInterface({
  question,
  teamNumber,
  onSubmit,
  readOnly = false,
  showAnswer = false,
  isController = true,
  onNext,
  onPrevious,
  hasNextQuestion = false,
  hasPreviousQuestion = false,
  isSubmitted: isSubmittedProp = false,
  nextQuestionIsBidRound = false,
}: GitQuizInterfaceProps) {
  const [availableCommands, setAvailableCommands] = useState<string[]>(question.availableCommands);
  const [executedNewCommands, setExecutedNewCommands] = useState<CompletedCommand[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [startTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null);
  const [draggedCommand, setDraggedCommand] = useState<string | null>(null);
  const [isOverTerminal, setIsOverTerminal] = useState(false);

  // Timer
  useEffect(() => {
    if (readOnly || isSubmitted) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, readOnly, isSubmitted]);

  const executeCommand = (command: string) => {
    // Remove from available commands
    const newAvailable = availableCommands.filter(cmd => cmd !== command);
    setAvailableCommands(newAvailable);

    // Validate and generate output
    const executedCommandStrings = executedNewCommands.map(c => c.command);
    const allExecuted = [
      ...(Array.isArray(question.completedCommands) ? question.completedCommands : []).map(cmd => ({ command: cmd, output: '' })),
      ...executedNewCommands
    ];

    const { output, isError } = validateAndGenerateOutput(command, executedCommandStrings, allExecuted);

    // Add to executed commands
    const newExecuted = [...executedNewCommands, { command, output, isError }];
    setExecutedNewCommands(newExecuted);

    // Update history for undo/redo
    const newHistory = commandHistory.slice(0, historyIndex + 1);
    newHistory.push(newExecuted.map(c => c.command));
    setCommandHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const previousState = commandHistory[newIndex];

    // Restore previous state
    const newExecuted = previousState.map(cmd => {
      const existing = executedNewCommands.find(c => c.command === cmd);
      return existing || { command: cmd, output: '', isError: false };
    });

    setExecutedNewCommands(newExecuted);

    // Return command to available list
    const lastCommand = executedNewCommands[executedNewCommands.length - 1]?.command;
    if (lastCommand && !availableCommands.includes(lastCommand)) {
      setAvailableCommands([...availableCommands, lastCommand]);
    }

    setHistoryIndex(newIndex);
  };

  const handleRedo = () => {
    if (historyIndex >= commandHistory.length - 1) return;

    const newIndex = historyIndex + 1;
    const nextState = commandHistory[newIndex];

    const newExecuted = nextState.map(cmd => {
      const executedCommandStrings = nextState.slice(0, nextState.indexOf(cmd));
      const allExecuted = [
        ...(Array.isArray(question.completedCommands) ? question.completedCommands : []).map(c => ({ command: c, output: '' })),
      ];
      const { output, isError } = validateAndGenerateOutput(cmd, executedCommandStrings, allExecuted);
      return { command: cmd, output, isError };
    });

    setExecutedNewCommands(newExecuted);

    // Remove from available
    const commandToRemove = nextState[nextState.length - 1];
    setAvailableCommands(availableCommands.filter(cmd => cmd !== commandToRemove));

    setHistoryIndex(newIndex);
  };

  const handleReset = () => {
    setExecutedNewCommands([]);
    setAvailableCommands(question.availableCommands);
    setCommandHistory([[]]);
    setHistoryIndex(0);
  };

  const handleSubmit = async () => {
    const timeTaken = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const answer = executedNewCommands.map(cmd => cmd.command);

    const result = await onSubmit(answer, timeTaken, startTime);
    setResult(result);
    setIsSubmitted(true);
  };

  const handleDragStart = (command: string) => {
    setDraggedCommand(command);
  };

  const handleDragEnd = () => {
    setDraggedCommand(null);
    setIsOverTerminal(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTerminal(true);
  };

  const handleDragLeave = () => {
    setIsOverTerminal(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTerminal(false);

    if (draggedCommand && !readOnly && !isSubmitted) {
      executeCommand(draggedCommand);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // All completed commands (pre-completed + newly executed)
  const allCompletedCommands: CompletedCommand[] = [
    ...(Array.isArray(question.completedCommands) ? question.completedCommands : []).map(cmd => {
      const { output, isError } = validateAndGenerateOutput(cmd, [], []);
      return { command: cmd, output, isError };
    }),
    ...executedNewCommands
  ];

  const canSubmit = availableCommands.length === 0 && executedNewCommands.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header with Navigation and Timer */}
      <div className="mb-6 flex items-center justify-between">
        {/* Left: Previous Button (Swapped from Right) - Fixed Width */}
        <div className="w-64 flex justify-start items-center gap-4">
          {!readOnly && hasPreviousQuestion && onPrevious && (
            <Button
              onClick={onPrevious}
              size="lg"
              variant="outline"
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-3 text-base border-slate-500"
            >
              ← Previous Question
            </Button>
          )}
        </div>

        {/* Center: Title */}
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Question {question.questionNumber}: {question.title}
          </h1>
          <p className="text-slate-300 text-lg">{question.points} points</p>
        </div>

        {/* Right: Next Button + Timer (Next Swapped from Left) - Fixed Width */}
        <div className="w-64 flex justify-end items-center gap-4">
          {!readOnly && hasNextQuestion && onNext && (
            <Button
              onClick={onNext}
              size="lg"
              className={nextQuestionIsBidRound
                ? "bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-bold px-8 py-3 text-base animate-pulse"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3 text-base"
              }
            >
              {nextQuestionIsBidRound ? "🎯 Enter Bid Round →" : "Next Question →"}
            </Button>
          )}

          {!readOnly && !isSubmitted && (
            <div className="flex items-center gap-3 bg-slate-800 px-6 py-3 rounded-xl border-2 border-slate-600 shadow-lg">
              <Clock className="w-6 h-6 text-blue-400" />
              <span className="text-2xl font-mono font-bold text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Story Section - Full Width */}
      <Card className="bg-gradient-to-br from-blue-900 to-indigo-900 border-2 border-blue-600 shadow-2xl mb-6">
        <CardContent className="p-8">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            The Story
          </h2>
          <div className="text-slate-100 whitespace-pre-wrap leading-relaxed text-lg">
            {question.story}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout: Commands (50%) | Terminal (50%) */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Command Stack Column */}
        <Card className="bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-500 shadow-2xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Available Commands
            </h2>

            <p className="text-sm text-slate-300 mb-4">
              {readOnly ? 'Quiz completed' : 'Drag commands to terminal or click to execute'}
            </p>

            <div className="space-y-3 mb-6">
              {availableCommands.map((cmd, idx) => (
                <div
                  key={idx}
                  draggable={!readOnly && !isSubmitted}
                  onDragStart={() => handleDragStart(cmd)}
                  onDragEnd={handleDragEnd}
                  onClick={() => !readOnly && !isSubmitted && executeCommand(cmd)}
                  className={`
                      p-4 bg-slate-900 border-2 border-slate-600 rounded-lg shadow-lg
                      transition-all duration-200
                      ${!readOnly && !isSubmitted ? 'cursor-pointer hover:border-blue-400 hover:shadow-blue-500/50 hover:scale-105' : 'cursor-default opacity-50'}
                      ${draggedCommand === cmd ? 'opacity-50 scale-95' : ''}
                    `}
                >
                  <code className="text-sm font-mono text-green-400 font-semibold">
                    {cmd}
                  </code>
                </div>
              ))}

              {availableCommands.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-green-400 text-lg font-semibold">✅ All commands used!</p>
                  <p className="text-slate-400 text-sm mt-2">Scroll down to submit your answer</p>
                </div>
              )}
            </div>

            {/* Control Buttons - Only for Controllers */}
            {isController && !readOnly && !isSubmitted && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    variant="outline"
                    size="sm"
                    className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                  >
                    <Undo2 className="w-4 h-4 mr-1" />
                    Undo
                  </Button>
                  <Button
                    onClick={handleRedo}
                    disabled={historyIndex >= commandHistory.length - 1}
                    variant="outline"
                    size="sm"
                    className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                  >
                    <Redo2 className="w-4 h-4 mr-1" />
                    Redo
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="bg-slate-800 border-slate-600 text-white hover:bg-red-900"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>

              </div>
            )}

            {/* Results */}
            {isSubmitted && result && (
              <div className={`p-6 rounded-lg border-2 ${result.isCorrect
                ? 'bg-green-900/50 border-green-500'
                : 'bg-red-900/50 border-red-500'
                }`}>
                <div className="flex items-center gap-3 mb-3">
                  {result.isCorrect ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-green-400" />
                      <h3 className="text-2xl font-bold text-white">Correct!</h3>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-8 h-8 text-red-400" />
                      <h3 className="text-2xl font-bold text-white">Incorrect</h3>
                    </>
                  )}
                </div>
                <p className="text-lg text-white">
                  Points: <span className="font-bold">{result.pointsAwarded}</span>
                </p>
                <p className="text-lg text-white">
                  Time: <span className="font-bold">{formatTime(elapsedTime)}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Git Bash Terminal Column */}
        <Card className="bg-slate-900 border-4 border-slate-700 shadow-2xl overflow-hidden">
          {/* Terminal Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-900">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 text-center">
              <span className="text-sm font-semibold text-slate-200">Git Bash</span>
            </div>
          </div>

          {/* Terminal Body */}
          <div
            className={`
                bg-[#0C0C0C] p-6 font-mono text-sm h-[700px] overflow-y-auto
                transition-all duration-200
                ${isOverTerminal && !readOnly && !isSubmitted ? 'ring-4 ring-blue-500/50' : ''}
              `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Executed Commands */}
            {allCompletedCommands.map((cmd, index) => (
              <div key={index} className="mb-3">
                {/* Prompt */}
                <div className="mb-1">
                  <span className="text-green-400">user@MINGW64</span>
                  <span className="text-white"> </span>
                  <span className="text-yellow-300">~/project</span>
                  <span className="text-pink-400"> (main)</span>
                </div>

                {/* Command */}
                <div className="mb-1">
                  <span className="text-white">$ </span>
                  <span className={cmd.isError ? 'text-red-400' : 'text-cyan-300'}>{cmd.command}</span>
                </div>

                {/* Output */}
                {cmd.output && (
                  <div className={`whitespace-pre-wrap pl-2 mb-2 ${cmd.isError ? 'text-red-400' : 'text-gray-300'}`}>
                    {cmd.output}
                  </div>
                )}
              </div>
            ))}

            {/* Drop Zone Indicator */}
            {isOverTerminal && !readOnly && !isSubmitted && (
              <div className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center animate-pulse bg-blue-500/10">
                <svg className="w-12 h-12 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-blue-400 font-semibold">Drop command here</p>
              </div>
            )}

            {/* Current Prompt */}
            {!readOnly && !isSubmitted && (
              <div>
                <div className="mb-1">
                  <span className="text-green-400">user@MINGW64</span>
                  <span className="text-white"> </span>
                  <span className="text-yellow-300">~/project</span>
                  <span className="text-pink-400"> (main)</span>
                </div>
                <div>
                  <span className="text-white">$ </span>
                  <span className="animate-pulse text-white">▊</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Submit Button - Bottom (Everyone can see, only controllers can click) */}
      {!readOnly && !isSubmitted && canSubmit && (
        <Card className="bg-slate-800 border-2 border-slate-600 mb-6">
          <CardContent className="p-6">
            {isController ? (
              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-xl shadow-lg"
              >
                Submit Answer
              </Button>
            ) : (
              <div className="text-center py-4">
                <p className="text-yellow-400 text-lg font-semibold">⏳ Waiting for controller to submit...</p>
                <p className="text-slate-400 text-sm mt-2">Only the team controller can submit the answer</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show Answer */}
      {showAnswer && (
        <Card className="bg-gradient-to-r from-emerald-900 to-green-900 border-2 border-green-500">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Correct Answer Sequence:</h3>
            <div className="grid grid-cols-2 gap-3">
              {question.correctAnswer.map((cmd, idx) => (
                <div key={idx} className="bg-slate-900 p-3 rounded border border-green-500">
                  <code className="text-sm font-mono text-green-400">
                    {idx + 1}. {cmd}
                  </code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
