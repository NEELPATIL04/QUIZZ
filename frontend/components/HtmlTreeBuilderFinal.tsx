'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, AlertCircle, RotateCcw, Lightbulb, Undo } from 'lucide-react';

interface TreeNode {
  id: string;
  tag: string;
  content?: string;
  className?: string;
  children: TreeNode[];
}

interface HtmlTreeQuestion {
  id: string;
  questionNumber: number;
  title: string;
  description: string;
  points: number;
  hints: string[];
  originalHtml: string; // The original HTML code to display
  treeStructure: TreeNode; // Tree with empty slots
  correctTree: TreeNode; // Correct solution
  availableBlocks: TreeNode[]; // Blocks to drag
}

interface HtmlTreeBuilderProps {
  question: HtmlTreeQuestion;
  teamNumber: number;
  isController: boolean;
  onSubmit: (tree: TreeNode, timeTaken: number, startTime: Date) => Promise<{ isCorrect: boolean; pointsAwarded: number }>;
  readOnly?: boolean;
  showAnswer?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNextQuestion?: boolean;
  hasPreviousQuestion?: boolean;
  isSubmitted?: boolean;
  nextQuestionIsBidRound?: boolean;
}

export default function HtmlTreeBuilderFinal({
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
  isSubmitted: isSubmittedProp = false,
  nextQuestionIsBidRound = false,
}: HtmlTreeBuilderProps) {
  const [userTree, setUserTree] = useState<TreeNode>(
    question.treeStructure ? JSON.parse(JSON.stringify(question.treeStructure)) : { id: 'root', tag: 'html', children: [] }
  );
  const [availableBlocks, setAvailableBlocks] = useState<TreeNode[]>(
    question.availableBlocks && Array.isArray(question.availableBlocks) ? JSON.parse(JSON.stringify(question.availableBlocks)) : []
  );
  const [draggedBlock, setDraggedBlock] = useState<TreeNode | null>(null);
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null);
  const [showHints, setShowHints] = useState(false);

  // Undo functionality
  const [history, setHistory] = useState<Array<{ tree: TreeNode; blocks: TreeNode[] }>>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Update canUndo when history changes
  useEffect(() => {
    setCanUndo(history.length > 0);
  }, [history]);

  // Timer
  useEffect(() => {
    if (readOnly || isSubmitted) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, readOnly, isSubmitted]);

  // Validate tree
  const validateTree = (node: TreeNode): string[] => {
    const errors: string[] = [];

    const checkNode = (n: TreeNode) => {
      if (n.tag === 'empty-slot') {
        errors.push(`Empty slot found - please fill all slots`);
      }
      n.children.forEach(checkNode);
    };

    checkNode(node);
    return errors;
  };

  useEffect(() => {
    if (!isSubmitted && !readOnly) {
      const errors = validateTree(userTree);
      setValidationErrors(errors);
    }
  }, [userTree, isSubmitted, readOnly]);

  const findNodeById = (nodes: TreeNode, id: string): TreeNode | null => {
    if (nodes.id === id) return nodes;
    for (const child of nodes.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
    return null;
  };

  const replaceNodeInTree = (tree: TreeNode, targetId: string, newNode: TreeNode): TreeNode => {
    if (tree.id === targetId) return newNode;
    return {
      ...tree,
      children: tree.children.map(child => replaceNodeInTree(child, targetId, newNode))
    };
  };

  const handleDragStart = (e: React.DragEvent, block: TreeNode, fromAvailable: boolean) => {
    if (!isController || readOnly || isSubmitted) {
      e.preventDefault();
      return;
    }
    setDraggedBlock({ ...block, fromAvailable: fromAvailable } as any);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isController || readOnly || isSubmitted) return;
    setDragOverNode(nodeId);
  };

  const handleDragLeave = () => {
    setDragOverNode(null);
  };

  const handleDrop = (e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isController || readOnly || isSubmitted || !draggedBlock) return;

    const fromAvailable = (draggedBlock as any).fromAvailable;

    if (targetNode.tag === 'empty-slot') {
      // Save current state to history before making changes
      setHistory([...history, {
        tree: JSON.parse(JSON.stringify(userTree)),
        blocks: JSON.parse(JSON.stringify(availableBlocks))
      }]);

      const newNode = { ...draggedBlock, children: targetNode.children };
      delete (newNode as any).fromAvailable;

      const newTree = replaceNodeInTree(userTree, targetNode.id, newNode);
      setUserTree(newTree);

      if (fromAvailable) {
        setAvailableBlocks(availableBlocks.filter(b => b.id !== draggedBlock.id));
      }
    }

    setDraggedBlock(null);
    setDragOverNode(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    setUserTree(previousState.tree);
    setAvailableBlocks(previousState.blocks);
    setHistory(history.slice(0, -1));
  };

  const handleReset = () => {
    setUserTree(JSON.parse(JSON.stringify(question.treeStructure)));
    setAvailableBlocks(JSON.parse(JSON.stringify(question.availableBlocks)));
    setValidationErrors([]);
    setHistory([]);
  };

  const handleSubmit = async () => {
    const timeTaken = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const result = await onSubmit(userTree, timeTaken, startTime);
    setResult(result);
    setIsSubmitted(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render tree node
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isEmptySlot = node.tag === 'empty-slot';
    const isDragOver = dragOverNode === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isDragging = draggedBlock !== null;

    if (isEmptySlot) {
      return (
        <div
          key={node.id}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
          className={`
            relative px-8 py-6 rounded-lg border-2 border-dashed transition-all
            ${isDragOver
              ? 'border-blue-500 bg-blue-500/20 ring-4 ring-blue-400 scale-105'
              : 'border-gray-500/40 bg-gray-800/10'}
          `}
        >
          <div className="text-center text-gray-400">
            <div className="text-sm font-mono mb-1">{isDragOver ? '↓ Drop Here' : 'Empty Slot'}</div>
            <div className="text-xs opacity-60">Drag a block here</div>
          </div>
        </div>
      );
    }

    // Connection line color
    const lineColor = isDragging ? 'bg-gray-400/50' : 'bg-gray-500';

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Opening Tag */}
        <div
          draggable={isController && !readOnly && !isSubmitted}
          onDragStart={(e) => handleDragStart(e, node, false)}
          onMouseEnter={() => setHoveredCode(node.id)}
          onMouseLeave={() => setHoveredCode(null)}
          className={`
            px-6 py-2 rounded-t-lg border-2 border-b-0 min-w-[200px] text-left transition-all
            ${hoveredCode === node.id ? 'bg-yellow-100 border-yellow-500' : 'bg-white/90 border-gray-400'}
            ${isController && !readOnly && !isSubmitted ? 'cursor-move hover:shadow-lg' : ''}
          `}
        >
          <code className="font-mono text-sm font-bold text-gray-800">
            &lt;div
            {node.className && (
              <span className="text-blue-600"> class="{node.className}"</span>
            )}
            &gt;
          </code>
        </div>

        {/* Children Area */}
        {hasChildren && (
          <div className="border-2 border-t-0 border-b-0 border-gray-400 bg-slate-900/10 px-6 py-4 min-w-[200px]">
            {/* Connection Lines */}
            <div className={`w-0.5 h-6 ${lineColor} mx-auto mb-2`}></div>

            {node.children.length > 1 ? (
              <>
                <div className={`relative h-0.5 ${lineColor} mb-2`}>
                  <div className="absolute inset-0 flex justify-around">
                    {node.children.map((_, idx) => (
                      <div key={idx} className={`w-0.5 h-4 ${lineColor}`}></div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-6 justify-center">
                  {node.children.map((child) => renderTreeNode(child, level + 1))}
                </div>
              </>
            ) : (
              <div className="flex justify-center">
                {node.children.map((child) => renderTreeNode(child, level + 1))}
              </div>
            )}
          </div>
        )}

        {/* Closing Tag */}
        <div
          className={`
            px-6 py-2 rounded-b-lg border-2 border-t-0 min-w-[200px] text-left
            ${hoveredCode === node.id ? 'bg-yellow-100 border-yellow-500' : 'bg-white/90 border-gray-400'}
          `}
        >
          <code className="font-mono text-sm font-bold text-gray-800">&lt;/div&gt;</code>
        </div>
      </div>
    );
  };

  const isTreeValid = validationErrors.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-900 to-blue-900 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        {/* Left: Previous Button (Swapped from Right) - Fixed Width */}
        <div className="w-64 flex justify-start">
          {!readOnly && hasPreviousQuestion && onPrevious && (
            <Button onClick={onPrevious} size="lg" variant="outline" className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold px-8 py-3 border-cyan-500">
              ← Previous Question
            </Button>
          )}
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Question {question.questionNumber}: {question.title}</h1>
          <p className="text-cyan-200 text-lg">{question.points} points</p>
        </div>

        {/* Right: Next Button + Timer (Next Swapped from Left) - Fixed Width */}
        <div className="w-64 flex justify-end items-center gap-4">
          {!readOnly && hasNextQuestion && onNext && (
            <Button onClick={onNext} size="lg" className={nextQuestionIsBidRound ? "bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-bold px-8 py-3 animate-pulse" : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-3"}>
              {nextQuestionIsBidRound ? "🎯 Enter Bid Round →" : "Next Question →"}
            </Button>
          )}
          {!readOnly && !isSubmitted && (
            <div className="flex items-center gap-3 bg-cyan-800 px-6 py-3 rounded-xl border-2 border-cyan-600 shadow-lg">
              <Clock className="w-6 h-6 text-cyan-200" />
              <span className="text-2xl font-mono font-bold text-white">{formatTime(elapsedTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-gradient-to-br from-cyan-800 to-blue-800 border-2 border-cyan-600 shadow-2xl mb-6">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-cyan-200 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-4">Build the HTML Tree</h2>
              <p className="text-cyan-100 text-lg mb-4">{question.description}</p>
              <div className="flex gap-3 mt-4">
                <Button onClick={() => setShowHints(!showHints)} variant="outline" className="bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-500">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showHints ? 'Hide Hints' : 'Show Hints'}
                </Button>
                {isController && !isSubmitted && (
                  <>
                    <Button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      variant="outline"
                      className="bg-orange-700 hover:bg-orange-600 text-white border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Undo className="w-4 h-4 mr-2" />
                      Undo
                    </Button>
                    <Button onClick={handleReset} variant="outline" className="bg-red-700 hover:bg-red-600 text-white border-red-500">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset All
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hints */}
      {showHints && (
        <Card className="bg-yellow-900/50 border-2 border-yellow-500 shadow-2xl mb-6">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-yellow-200 mb-3">💡 Hints:</h3>
            <ul className="list-disc list-inside space-y-2 text-yellow-100">
              {question.hints.map((hint, idx) => (
                <li key={idx}>{hint}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 50/50 Layout: Code + Tree */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Original HTML Code - 50% */}
        <Card className="bg-slate-900 border-2 border-slate-700 shadow-2xl">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-900">
            <h3 className="text-lg font-semibold text-white">📄 Original HTML Code</h3>
            <p className="text-xs text-slate-300 mt-1">Study this structure</p>
          </div>
          <CardContent className="p-6 bg-slate-950">
            <pre className="text-sm font-mono text-green-400 overflow-x-auto">
              <code dangerouslySetInnerHTML={{ __html: question.originalHtml }} />
            </pre>
          </CardContent>
        </Card>

        {/* Tree Builder - 50% */}
        <Card className="bg-slate-900 border-4 border-slate-700 shadow-2xl">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-900">
            <h3 className="text-lg font-semibold text-white">🌳 Build Your HTML Tree</h3>
            <p className="text-xs text-slate-300 mt-1">Drag blocks from below and drop into empty slots</p>
          </div>
          <CardContent className="p-8 bg-slate-950 overflow-x-auto">
            <div className="min-w-max flex justify-center">
              {renderTreeNode(userTree)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drag Blocks - Simple Horizontal Row at Bottom */}
      {!isSubmitted && (
        <Card className="bg-slate-900 border-4 border-blue-500 shadow-2xl mb-6">
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-3 border-b-2 border-blue-900">
            <h3 className="text-xl font-bold text-white">🧩 Drag These Blocks ↑</h3>
            <p className="text-sm text-blue-200 mt-1">Grab any block and drag up to the tree</p>
          </div>
          <CardContent className="p-4 bg-slate-950">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {availableBlocks.map((block) => (
                <div
                  key={block.id}
                  draggable={isController && !readOnly}
                  onDragStart={(e) => handleDragStart(e, block, true)}
                  onMouseEnter={() => setHoveredCode(block.id)}
                  onMouseLeave={() => setHoveredCode(null)}
                  className="bg-blue-900/40 border-2 border-blue-500 rounded-lg cursor-move hover:bg-blue-800/70 hover:scale-105 hover:border-blue-400 transition-all shadow-lg flex-shrink-0 w-72"
                >
                  <div className="px-4 py-3 bg-blue-800/50 rounded-t-lg">
                    <code className="font-mono text-sm text-blue-200">
                      &lt;div{block.className && <span className="text-blue-300"> class="{block.className}"</span>}&gt;
                    </code>
                  </div>
                  <div className="px-4 py-3 text-center bg-blue-900/30">
                    <span className="text-base font-bold text-white">{block.content}</span>
                  </div>
                  <div className="px-4 py-3 bg-blue-800/50 rounded-b-lg">
                    <code className="font-mono text-sm text-blue-200">&lt;/div&gt;</code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {isController && !readOnly && !isSubmitted && (
        <Card className="bg-slate-800 border-2 border-slate-600 mb-6">
          <CardContent className="p-6">
            <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg shadow-lg">
              Submit Solution
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isSubmitted && result && (
        <Card className={`border-2 mb-6 ${result.isCorrect ? 'bg-green-900/50 border-green-500' : 'bg-red-900/50 border-red-500'}`}>
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              {result.isCorrect ? (
                <>
                  <CheckCircle className="w-12 h-12 text-green-400" />
                  <div>
                    <h3 className="text-3xl font-bold text-white">Perfect! 🎉</h3>
                    <p className="text-green-200 text-lg mt-1">You built the tree correctly!</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 text-red-400" />
                  <div>
                    <h3 className="text-3xl font-bold text-white">Good Try!</h3>
                    <p className="text-red-200 text-lg mt-1">Score: {result.pointsAwarded}/{question.points} points</p>
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
    </div>
  );
}
