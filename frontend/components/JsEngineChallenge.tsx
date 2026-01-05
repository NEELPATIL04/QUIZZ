'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, RotateCcw, Undo, Redo } from 'lucide-react';

interface CodeBlock {
  id: string;
  code: string;
  type: 'sync' | 'setTimeout' | 'promise' | 'microtask';
  delay?: number;
  location: 'source' | 'callStack' | 'webApi' | 'microtask' | 'macrotask' | 'executed';
  output?: string;
  timerRemaining?: number;
  path?: string[]; // Track the path this block has taken
}

interface JsEngineChallengeProps {
  question: any;
  teamNumber: number;
  isController: boolean;
  onSubmit: (answer: any, timeTaken: number, startTime: Date) => Promise<{ isCorrect: boolean; pointsAwarded: number }>;
  readOnly?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNextQuestion?: boolean;
  hasPreviousQuestion?: boolean;
  isSubmitted?: boolean;
  nextQuestionIsBidRound?: boolean;
}

const initialCodeBlocks: CodeBlock[] = [
  { id: '1', code: 'console.log("Start");', type: 'sync', location: 'source', output: 'Start' },
  { id: '2', code: 'setTimeout(() => {\n  console.log("Timeout 1");\n}, 1000);', type: 'setTimeout', delay: 1000, location: 'source', output: 'Timeout 1' },
  { id: '3', code: 'Promise.resolve().then(() => {\n  console.log("Promise 1");\n});', type: 'promise', location: 'source', output: 'Promise 1' },
  { id: '4', code: 'setTimeout(() => {\n  console.log("Timeout 2");\n}, 0);', type: 'setTimeout', delay: 0, location: 'source', output: 'Timeout 2' },
  { id: '5', code: 'queueMicrotask(() => {\n  console.log("Microtask 2");\n});', type: 'microtask', location: 'source', output: 'Microtask 2' },
  { id: '6', code: 'Promise.resolve().then(() => {\n  console.log("Promise 2");\n});', type: 'promise', location: 'source', output: 'Promise 2' },
  { id: '7', code: 'console.log("End");', type: 'sync', location: 'source', output: 'End' },
];

export default function JsEngineChallenge({
  question,
  teamNumber,
  isController,
  onSubmit,
  readOnly = false,
  onNext,
  onPrevious,
  hasNextQuestion,
  hasPreviousQuestion,
  isSubmitted: isSubmittedProp,
  nextQuestionIsBidRound = false,
}: JsEngineChallengeProps) {
  const [blocks, setBlocks] = useState<CodeBlock[]>(initialCodeBlocks);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [startTime] = useState(new Date());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [history, setHistory] = useState<{ blocks: CodeBlock[], console: string[] }[]>([
    { blocks: initialCodeBlocks, console: [] }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  // Save current state to history
  const saveToHistory = (newBlocks: CodeBlock[], newConsole: string[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, { blocks: newBlocks, console: newConsole }]);
    setHistoryIndex(newHistory.length);
  };

  // Undo to previous state
  const undo = () => {
    if (!isController || readOnly || isSubmitted) return;
    if (historyIndex > 0) {
      const previousIndex = historyIndex - 1;
      setHistoryIndex(previousIndex);
      setBlocks(history[previousIndex].blocks);
      setConsoleOutput(history[previousIndex].console);
    }
  };

  // Redo to next state
  const redo = () => {
    if (!isController || readOnly || isSubmitted) return;
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setBlocks(history[nextIndex].blocks);
      setConsoleOutput(history[nextIndex].console);
    }
  };

  // Timer countdown for Web API blocks
  useEffect(() => {
    if (readOnly || isSubmitted) return;

    const interval = setInterval(() => {
      setBlocks(prev => prev.map(block => {
        if (block.location === 'webApi' && block.timerRemaining !== undefined && block.timerRemaining > 0) {
          const newTime = block.timerRemaining - 100;
          return { ...block, timerRemaining: newTime };
        }
        return block;
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [readOnly, isSubmitted]);

  // Move from source to call stack
  const moveToCallStack = (blockId: string) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, location: 'callStack' as const } : block
    );
    saveToHistory(newBlocks, consoleOutput);
    setBlocks(newBlocks);
  };

  // Move ALL blocks from source to call stack
  const moveAllToCallStack = () => {
    if (!isController || readOnly || isSubmitted) return;
    const sourceBlocks = blocks.filter(b => b.location === 'source');
    if (sourceBlocks.length === 0) return;

    const newBlocks = blocks.map(block =>
      block.location === 'source' ? { ...block, location: 'callStack' as const } : block
    );
    saveToHistory(newBlocks, consoleOutput);
    setBlocks(newBlocks);
  };

  // Move block between zones by clicking
  const moveBlock = (blockId: string, targetLocation: CodeBlock['location']) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const newBlocks = blocks.map(b => {
      if (b.id === blockId) {
        const currentPath = b.path || [b.location];
        return {
          ...b,
          location: targetLocation,
          timerRemaining: targetLocation === 'webApi' ? block.delay : undefined,
          path: [...currentPath, targetLocation] // Track the path
        };
      }
      return b;
    });
    saveToHistory(newBlocks, consoleOutput);
    setBlocks(newBlocks);
  };

  // Execute from queue - adds to console output
  const executeFromQueue = (blockId: string) => {
    if (!isController || readOnly || isSubmitted) return;

    const block = blocks.find(b => b.id === blockId);
    if (!block || !block.output) return;

    const newConsole = [...consoleOutput, block.output];
    const newBlocks = blocks.map(b =>
      b.id === blockId ? { ...b, location: 'executed' as const } : b
    );

    setConsoleOutput(newConsole);
    saveToHistory(newBlocks, newConsole);
    setBlocks(newBlocks);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    if (!isController || readOnly || isSubmitted) {
      e.preventDefault();
      return;
    }

    e.stopPropagation();
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('blockId', blockId);

    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLocation: CodeBlock['location']) => {
    if (!isController || readOnly || isSubmitted) return;

    e.preventDefault();
    e.stopPropagation();

    const blockId = e.dataTransfer.getData('blockId') || draggedBlock;
    if (!blockId) return;

    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    // Allow dropping anywhere except source
    if (targetLocation === 'source') {
      setDraggedBlock(null);
      return;
    }

    // Special handling for console output - execute the block
    if (targetLocation === 'executed' && block.output) {
      const newConsole = [...consoleOutput, block.output];
      const newBlocks = blocks.map(b =>
        b.id === blockId ? { ...b, location: 'executed' as const } : b
      );
      setConsoleOutput(newConsole);
      saveToHistory(newBlocks, newConsole);
      setBlocks(newBlocks);
    } else {
      // Regular move
      moveBlock(blockId, targetLocation);
    }

    setDraggedBlock(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedBlock(null);
  };

  const calculateScore = () => {
    let pathScore = 0;
    let correctPaths = 0;
    const totalBlocks = 7;

    blocks.forEach(block => {
      const path = block.path || [];

      if (block.type === 'setTimeout') {
        // setTimeout must go: source → callStack → webApi → macrotask → executed
        // Check if it went through webApi before reaching macrotask
        if (path.includes('webApi') && path.includes('macrotask')) {
          const webApiIndex = path.indexOf('webApi');
          const macrotaskIndex = path.indexOf('macrotask');
          if (webApiIndex < macrotaskIndex) {
            correctPaths++;
          }
        } else if (path.includes('executed') && path.includes('webApi')) {
          // If already executed, just check it went through webApi
          correctPaths++;
        }
      } else if (block.type === 'promise' || block.type === 'microtask') {
        // Promise/Microtask must go: source → callStack → microtask → executed
        // Check if it went to microtask queue (not directly to macrotask)
        if (path.includes('microtask') && !path.includes('macrotask')) {
          correctPaths++;
        }
      } else if (block.type === 'sync') {
        // Sync can execute directly: source → callStack → executed
        if (path.includes('executed') || path.includes('callStack')) {
          correctPaths++;
        }
      }
    });

    pathScore = (correctPaths / totalBlocks) * 50;

    // Check output order
    const expectedOutput = ['Start', 'End', 'Promise 1', 'Microtask 2', 'Promise 2', 'Timeout 2', 'Timeout 1'];
    let outputScore = 0;
    consoleOutput.forEach((output, index) => {
      if (output === expectedOutput[index]) outputScore += (50 / expectedOutput.length);
    });

    const totalScore = Math.min(100, Math.round(pathScore + outputScore));

    return totalScore;
  };

  const handleSubmit = async () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsSubmitted(true);

    const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const answer = {
      blocks: blocks.map(b => ({ id: b.id, location: b.location })),
      consoleOutput,
      score: finalScore
    };

    try {
      await onSubmit(JSON.stringify(answer), timeTaken, startTime);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const reset = () => {
    if (!isController || readOnly) return;
    setBlocks(initialCodeBlocks);
    setConsoleOutput([]);
    setScore(null);
    setIsSubmitted(false);
    setSelectedBlock(null);
    setHistory([{ blocks: initialCodeBlocks, console: [] }]);
    setHistoryIndex(0);
  };

  const getBlocksByLocation = (location: string) => {
    return blocks.filter(b => b.location === location);
  };

  // Check if source has any blocks
  const hasSourceBlocks = getBlocksByLocation('source').length > 0;

  // Auto-scroll when dragging near edges
  useEffect(() => {
    if (!draggedBlock) return;

    const handleDragMove = (e: MouseEvent) => {
      const threshold = 100; // pixels from edge
      const scrollSpeed = 10;

      // Scroll down if near bottom
      if (window.innerHeight - e.clientY < threshold) {
        window.scrollBy(0, scrollSpeed);
      }
      // Scroll up if near top
      else if (e.clientY < threshold) {
        window.scrollBy(0, -scrollSpeed);
      }
    };

    window.addEventListener('mousemove', handleDragMove);
    return () => window.removeEventListener('mousemove', handleDragMove);
  }, [draggedBlock]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6 pb-20">
      {/* Header with Navigation */}
      <div className="mb-6 flex items-center justify-between">
        {/* Left: Next Question Button (always visible if next exists) */}
        <div>
          {!readOnly && hasNextQuestion && onNext && (
            <Button
              onClick={onNext}
              size="lg"
              className={nextQuestionIsBidRound
                ? "bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-bold px-8 py-3 text-base animate-pulse"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-3 text-base"
              }
            >
              {nextQuestionIsBidRound ? "🎯 Enter Bid Round →" : "Next Question →"}
            </Button>
          )}
        </div>

        {/* Center: Title */}
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Question {question.questionNumber}: JavaScript Engine Execution Flow
          </h1>
          <p className="text-purple-200 text-lg">Understand how the JavaScript engine executes code!</p>
        </div>

        {/* Right: Previous Button + Controls */}
        <div className="flex items-center gap-2">
          {!readOnly && hasPreviousQuestion && onPrevious && (
            <Button
              onClick={onPrevious}
              size="lg"
              variant="outline"
              className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-8 py-3 text-base border-purple-500"
            >
              ← Previous Question
            </Button>
          )}
          <Button
            onClick={undo}
            disabled={!isController || readOnly || isSubmitted || historyIndex === 0}
            variant="outline"
            className="bg-slate-700 hover:bg-slate-600 text-white border-slate-500"
          >
            <Undo className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button
            onClick={redo}
            disabled={!isController || readOnly || isSubmitted || historyIndex === history.length - 1}
            variant="outline"
            className="bg-slate-700 hover:bg-slate-600 text-white border-slate-500"
          >
            <Redo className="h-4 w-4 mr-2" />
            Redo
          </Button>
          <Button
            onClick={reset}
            disabled={!isController || readOnly}
            variant="outline"
            className="bg-slate-700 hover:bg-slate-600 text-white border-slate-500"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Source Code (always shown) */}
        <div className="col-span-4">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-4">
              <h3 className="text-xl font-bold text-foreground mb-4">📝 Source Code</h3>
              <p className="text-xs text-muted-foreground mb-3">Drag blocks to Call Stack or use button below</p>
              <div className="space-y-2 mb-4 min-h-[400px]">
                {getBlocksByLocation('source').map((block) => (
                  <div
                    key={block.id}
                    draggable={isController && !readOnly && !isSubmitted}
                    onDragStart={(e) => handleDragStart(e, block.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-muted border border-border rounded p-3 transition-all ${isController && !readOnly && !isSubmitted
                      ? 'hover:border-primary/50 cursor-move'
                      : 'cursor-default opacity-60'
                      }`}
                  >
                    <pre className="text-sm text-foreground font-mono whitespace-pre-wrap pointer-events-none">{block.code}</pre>
                  </div>
                ))}
                {getBlocksByLocation('source').length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
                    All blocks moved to Call Stack
                  </div>
                )}
              </div>
              <Button
                onClick={moveAllToCallStack}
                className="w-full"
                variant="default"
                size="lg"
                disabled={!isController || readOnly || isSubmitted || getBlocksByLocation('source').length === 0}
              >
                Move All to Call Stack →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Engine Flow */}
        <div className="col-span-4 space-y-4">
          {/* Call Stack */}
          <Card
            className={`border-2 transition-colors ${draggedBlock ? 'border-chart-1 bg-chart-1/20' : 'border-chart-1/30 bg-chart-1/5'
              }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'callStack')}
          >
            <CardContent className="p-4">
              <h3 className="text-xl font-bold text-foreground mb-4">🔵 Call Stack (LIFO)</h3>
              <p className="text-xs text-muted-foreground mb-3">Drag blocks here - then drag to Web API, Queues, or Console</p>
              <div className="flex flex-col-reverse space-y-reverse space-y-2 min-h-[150px]">
                {getBlocksByLocation('callStack').map((block, index, array) => (
                  <div
                    key={block.id}
                    draggable={isController && !readOnly && !isSubmitted}
                    onDragStart={(e) => handleDragStart(e, block.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-card border-2 border-chart-1/50 rounded p-3 shadow-sm transition-all ${isController && !readOnly && !isSubmitted
                      ? 'cursor-move hover:border-chart-1'
                      : 'cursor-default opacity-60'
                      }`}
                  >
                    <pre className="text-sm text-foreground font-mono whitespace-pre-wrap pointer-events-none">{block.code}</pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Web API */}
          <Card
            className={`border-2 transition-colors ${draggedBlock ? 'border-chart-4 bg-chart-4/20' : 'border-chart-4/30 bg-chart-4/5'
              }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'webApi')}
          >
            <CardContent className="p-4">
              <h3 className="text-xl font-bold text-foreground mb-4">⏱️ Web API</h3>
              <p className="text-xs text-muted-foreground mb-3">Timers countdown here - drag to Macrotask Queue when ready</p>
              <div className="space-y-2 min-h-[120px]">
                {getBlocksByLocation('webApi').map((block) => (
                  <div
                    key={block.id}
                    draggable={isController && !readOnly && !isSubmitted}
                    onDragStart={(e) => handleDragStart(e, block.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-card border-2 border-chart-4/50 rounded p-3 shadow-sm transition-all ${isController && !readOnly && !isSubmitted
                      ? 'cursor-move hover:border-chart-4'
                      : 'cursor-default opacity-60'
                      }`}
                  >
                    <pre className="text-sm text-foreground font-mono whitespace-pre-wrap pointer-events-none mb-1">{block.code}</pre>
                    <span className="text-chart-4 font-bold text-xs">
                      Timer: {block.timerRemaining}ms
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Event Loop Visualization */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">🔄 Event Loop</h3>
              <div className="flex items-center justify-center gap-4">
                <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
                <span className="text-foreground font-medium">Microtasks → Macrotasks</span>
                <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Console Output + Queues */}
        <div className="col-span-4">
          {/* Console Output */}
          <Card
            className={`border-2 transition-colors ${draggedBlock ? 'border-primary bg-primary/10' : 'border-primary/20'
              }`}
          >
            <CardContent className="p-4">
              <h3 className="text-xl font-bold text-foreground mb-4">💻 Console Output</h3>
              <p className="text-xs text-muted-foreground mb-3">Drag blocks here to execute or click from queues</p>
              <div
                className="bg-muted rounded p-4 min-h-[300px] font-mono text-sm border border-border"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'executed')}
              >
                {consoleOutput.map((output, index) => (
                  <div key={index} className="text-primary">
                    &gt; {output}
                  </div>
                ))}
                {consoleOutput.length === 0 && (
                  <div className="text-muted-foreground italic text-xs">
                    Drop blocks here to execute and see output...
                  </div>
                )}
              </div>

              {score !== null && (
                <div className="mt-4 p-4 bg-primary/10 border-2 border-primary rounded">
                  <h4 className="text-2xl font-bold text-primary text-center">
                    Score: {score}/100
                  </h4>
                </div>
              )}

              {isController && !readOnly && (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitted}
                  className="w-full mt-4"
                  variant="default"
                  size="lg"
                >
                  Submit Solution
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Queues Below Console */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Microtask Queue */}
            <Card
              className={`border-2 transition-colors ${draggedBlock ? 'border-chart-2 bg-chart-2/20' : 'border-chart-2/30 bg-chart-2/5'
                }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'microtask')}
            >
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-foreground mb-4">✅ Microtask Queue</h3>
                <p className="text-xs text-muted-foreground mb-2">Drag here or click to execute</p>
                <div className="space-y-2 min-h-[100px]">
                  {getBlocksByLocation('microtask').map((block) => (
                    <div
                      key={block.id}
                      draggable={isController && !readOnly && !isSubmitted}
                      onDragStart={(e) => handleDragStart(e, block.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => executeFromQueue(block.id)}
                      className={`bg-card border-2 border-chart-2/50 rounded p-2 transition-all shadow-sm ${isController && !readOnly && !isSubmitted
                        ? 'cursor-pointer hover:border-chart-2 hover:bg-chart-2/10'
                        : 'cursor-default opacity-60'
                        }`}
                    >
                      <pre className="text-xs text-foreground font-mono whitespace-pre-wrap mb-1 pointer-events-none">{block.code.split('\n')[0]}</pre>
                      {isController && !readOnly && !isSubmitted && (
                        <p className="text-xs text-muted-foreground italic pointer-events-none">Click to execute</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Macrotask Queue */}
            <Card
              className={`border-2 transition-colors ${draggedBlock ? 'border-chart-5 bg-chart-5/20' : 'border-chart-5/30 bg-chart-5/5'
                }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'macrotask')}
            >
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-foreground mb-4">📋 Macrotask Queue</h3>
                <p className="text-xs text-muted-foreground mb-2">Drag here or click to execute</p>
                <div className="space-y-2 min-h-[100px]">
                  {getBlocksByLocation('macrotask').map((block) => (
                    <div
                      key={block.id}
                      draggable={isController && !readOnly && !isSubmitted}
                      onDragStart={(e) => handleDragStart(e, block.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => executeFromQueue(block.id)}
                      className={`bg-card border-2 border-chart-5/50 rounded p-2 transition-all shadow-sm ${isController && !readOnly && !isSubmitted
                        ? 'cursor-pointer hover:border-chart-5 hover:bg-chart-5/10'
                        : 'cursor-default opacity-60'
                        }`}
                    >
                      <pre className="text-xs text-foreground font-mono whitespace-pre-wrap mb-1 pointer-events-none">{block.code.split('\n')[0]}</pre>
                      {isController && !readOnly && !isSubmitted && (
                        <p className="text-xs text-muted-foreground italic pointer-events-none">Click to execute</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
