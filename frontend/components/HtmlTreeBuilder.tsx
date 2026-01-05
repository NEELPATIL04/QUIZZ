'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, AlertCircle, RotateCcw, Lightbulb, Plus } from 'lucide-react';

interface TreeNode {
  id: string;
  tag: string;
  content?: string;
  children: TreeNode[];
  maxChildren?: number; // Maximum allowed children (e.g., ul can have unlimited li)
  position?: number; // Position in parent's children array
}

interface HtmlTreeQuestion {
  id: string;
  questionNumber: number;
  title: string;
  description: string;
  points: number;
  hints: string[];
  availableBlocks: TreeNode[]; // Blocks that users can drag
  treeStructure: TreeNode; // The target tree structure with empty slots
  correctTree: TreeNode; // The correct solution
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

export default function HtmlTreeBuilder({
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
  const [userTree, setUserTree] = useState<TreeNode>(JSON.parse(JSON.stringify(question.treeStructure)));
  const [availableBlocks, setAvailableBlocks] = useState<TreeNode[]>(JSON.parse(JSON.stringify(question.availableBlocks)));
  const [draggedBlock, setDraggedBlock] = useState<TreeNode | null>(null);
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null);
  const [showHints, setShowHints] = useState(false);

  // HTML nesting validation rules
  const HTML_RULES: { [key: string]: { allowedChildren: string[], blockLevel?: boolean } } = {
    'body': { allowedChildren: ['div', 'main', 'header', 'footer', 'section', 'nav', 'ul', 'p', 'h1', 'h2'] },
    'div': { allowedChildren: ['div', 'p', 'span', 'ul', 'ol', 'h1', 'h2', 'h3', 'a', 'button'], blockLevel: true },
    'main': { allowedChildren: ['div', 'section', 'p', 'h1', 'h2', 'ul'], blockLevel: true },
    'section': { allowedChildren: ['div', 'p', 'h1', 'h2', 'h3', 'ul'], blockLevel: true },
    'header': { allowedChildren: ['div', 'h1', 'h2', 'nav'], blockLevel: true },
    'nav': { allowedChildren: ['ul', 'div', 'a'], blockLevel: true },
    'p': { allowedChildren: ['span', 'a', 'strong', 'em'] }, // No block elements
    'ul': { allowedChildren: ['li'], blockLevel: true }, // ONLY li
    'ol': { allowedChildren: ['li'], blockLevel: true },
    'li': { allowedChildren: ['span', 'a', 'p', 'ul', 'ol'] },
    'span': { allowedChildren: ['a', 'strong', 'em'] },
    'a': { allowedChildren: ['span', 'strong', 'em'] },
    'h1': { allowedChildren: ['span', 'a'] },
    'h2': { allowedChildren: ['span', 'a'] },
    'h3': { allowedChildren: ['span', 'a'] },
  };

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
    const rules = HTML_RULES[node.tag];

    if (!rules) {
      errors.push(`Unknown tag: <${node.tag}>`);
      return errors;
    }

    // Check each child
    node.children.forEach((child) => {
      if (child.tag === 'empty-slot') {
        errors.push(`Empty slot found in <${node.tag}> - please fill all slots`);
      } else {
        if (!rules.allowedChildren.includes(child.tag)) {
          errors.push(`<${child.tag}> cannot be a child of <${node.tag}>`);
        }
        // Recursively validate children
        const childErrors = validateTree(child);
        errors.push(...childErrors);
      }
    });

    return errors;
  };

  // Update validation
  useEffect(() => {
    if (!isSubmitted && !readOnly) {
      const errors = validateTree(userTree);
      setValidationErrors(errors);
    }
  }, [userTree, isSubmitted, readOnly]);

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

  // Find and replace a node in the tree
  const replaceNodeInTree = (tree: TreeNode, targetId: string, newNode: TreeNode): TreeNode => {
    if (tree.id === targetId) {
      return newNode;
    }

    return {
      ...tree,
      children: tree.children.map(child => replaceNodeInTree(child, targetId, newNode))
    };
  };

  // Find parent of a node
  const findParentNode = (tree: TreeNode, targetId: string): TreeNode | null => {
    for (const child of tree.children) {
      if (child.id === targetId) return tree;
      const found = findParentNode(child, targetId);
      if (found) return found;
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isController || readOnly || isSubmitted || !draggedBlock) return;

    const fromAvailable = (draggedBlock as any).fromAvailable;

    // If dropping on an empty slot, replace it
    if (targetNode.tag === 'empty-slot') {
      const newNode = { ...draggedBlock, children: [] };
      delete (newNode as any).fromAvailable;

      const newTree = replaceNodeInTree(userTree, targetNode.id, newNode);
      setUserTree(newTree);

      // Remove from available blocks if it came from there
      if (fromAvailable) {
        setAvailableBlocks(availableBlocks.filter(b => b.id !== draggedBlock.id));
      }
    }
    // If dropping on a node that can accept children, add as child
    else {
      const rules = HTML_RULES[targetNode.tag];
      if (rules && rules.allowedChildren.includes(draggedBlock.tag)) {
        // Create empty slot for the child
        const newChild = {
          ...draggedBlock,
          children: draggedBlock.children || []
        };
        delete (newChild as any).fromAvailable;

        const updatedTarget = {
          ...targetNode,
          children: [...targetNode.children, newChild]
        };

        const newTree = replaceNodeInTree(userTree, targetNode.id, updatedTarget);
        setUserTree(newTree);

        if (fromAvailable) {
          setAvailableBlocks(availableBlocks.filter(b => b.id !== draggedBlock.id));
        }
      }
    }

    setDraggedBlock(null);
    setDragOverNode(null);
  };

  const handleReset = () => {
    setUserTree(JSON.parse(JSON.stringify(question.treeStructure)));
    setAvailableBlocks(JSON.parse(JSON.stringify(question.availableBlocks)));
    setValidationErrors([]);
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

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isEmptySlot = node.tag === 'empty-slot';
    const isDragOver = dragOverNode === node.id;
    const hasError = validationErrors.some(err => err.includes(`<${node.tag}>`));
    const hasChildren = node.children && node.children.length > 0;
    const isDraggingOver = draggedBlock !== null;

    // Connection line color - off-white when dragging
    const lineColor = isDraggingOver ? 'bg-gray-300/60' : 'bg-gray-400';

    return (
      <div key={node.id} className="flex flex-col items-center">
        {!isEmptySlot && (
          <>
            {/* Opening Tag */}
            <div
              draggable={isController && !readOnly && !isSubmitted}
              onDragStart={(e) => handleDragStart(e, node, false)}
              className={`
                relative px-6 py-2 rounded-t-lg border-2 border-b-0 min-w-[160px] text-left transition-all
                ${hasError
                  ? 'border-red-500 bg-red-50/80 text-red-700'
                  : 'border-emerald-500 bg-emerald-50/80 text-emerald-900'}
                ${isController && !readOnly && !isSubmitted ? 'cursor-move hover:bg-emerald-100 hover:shadow-lg' : ''}
              `}
            >
              <code className="font-mono font-bold text-base">
                &lt;{node.tag}
                {node.content && (
                  <span className="text-gray-600 font-normal"> class="{node.content}"</span>
                )}
                &gt;
              </code>
            </div>

            {/* Content/Children Area */}
            {hasChildren && (
              <div className="relative border-2 border-emerald-500/50 bg-slate-950/30 px-4 py-2 min-w-[160px]">
                {/* Vertical line down */}
                <div className={`w-0.5 h-8 ${lineColor} mx-auto`}></div>

                {/* Horizontal line across children */}
                {node.children.length > 1 && (
                  <div className={`relative w-full h-0.5 ${lineColor}`}>
                    {/* Vertical lines up to each child */}
                    <div className="absolute inset-0 flex justify-around">
                      {node.children.map((_, idx) => (
                        <div key={idx} className={`w-0.5 h-4 ${lineColor}`}></div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Children Nodes */}
                <div className={`flex gap-8 mt-4 ${node.children.length > 1 ? 'justify-center' : ''}`}>
                  {node.children.map((child) => renderTreeNode(child, level + 1))}
                </div>
              </div>
            )}

            {/* Closing Tag */}
            <div
              className={`
                relative px-6 py-2 rounded-b-lg border-2 border-t-0 min-w-[160px] text-left
                ${hasError
                  ? 'border-red-500 bg-red-50/80 text-red-700'
                  : 'border-emerald-500 bg-emerald-50/80 text-emerald-900'}
              `}
            >
              <code className="font-mono font-bold text-base">&lt;/{node.tag}&gt;</code>
            </div>
          </>
        )}

        {/* Empty Slot - Drop Zone */}
        {isEmptySlot && (
          <div
            onDragOver={(e) => handleDragOver(e, node.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node)}
            className={`
              relative px-8 py-6 rounded-lg border-2 border-dashed min-w-[180px] text-center transition-all
              ${isDragOver
                ? 'border-blue-500 bg-blue-500/20 ring-4 ring-blue-400 scale-105'
                : 'border-gray-400/60 bg-gray-800/20 text-gray-400'}
            `}
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="w-6 h-6" />
              <code className="font-mono text-sm font-medium">
                {isDragOver ? '↓ Drop Here ↓' : '+ Drop Block Here +'}
              </code>
              <div className="text-xs opacity-60">Drag a &lt;div&gt; block here</div>
            </div>

            {/* Show code structure hint when dragging */}
            {isDraggingOver && (
              <div className="mt-3 pt-3 border-t border-gray-500/30">
                <code className="text-xs text-gray-400/80 font-mono">
                  &lt;div&gt;<br />
                  <span className="ml-4">...</span><br />
                  &lt;/div&gt;
                </code>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const isTreeValid = validationErrors.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
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

        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Question {question.questionNumber}: {question.title}
          </h1>
          <p className="text-emerald-200 text-lg">{question.points} points</p>
        </div>

        <div className="flex items-center gap-4">
          {!readOnly && hasPreviousQuestion && onPrevious && (
            <Button
              onClick={onPrevious}
              size="lg"
              variant="outline"
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-8 py-3 text-base border-emerald-500"
            >
              ← Previous Question
            </Button>
          )}
          {!readOnly && !isSubmitted && (
            <div className="flex items-center gap-3 bg-emerald-800 px-6 py-3 rounded-xl border-2 border-emerald-600 shadow-lg">
              <Clock className="w-6 h-6 text-emerald-200" />
              <span className="text-2xl font-mono font-bold text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-gradient-to-br from-emerald-800 to-teal-800 border-2 border-emerald-600 shadow-2xl mb-6">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-emerald-200 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-4">Build the HTML Tree</h2>
              <p className="text-emerald-100 text-lg mb-4">{question.description}</p>
              <div className="bg-emerald-900/50 border border-emerald-500 rounded-lg p-4">
                <p className="font-semibold text-emerald-200 mb-2">How to Build:</p>
                <ul className="list-disc list-inside space-y-1 text-emerald-100">
                  <li>Drag HTML blocks from the "Available Blocks" section below</li>
                  <li>Drop them into the empty slots (dashed boxes) in the tree</li>
                  <li>Build a valid HTML structure following nesting rules</li>
                  <li>Red blocks indicate validation errors</li>
                  <li>Green blocks are correctly placed</li>
                </ul>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => setShowHints(!showHints)}
                  variant="outline"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showHints ? 'Hide Hints' : 'Show Hints'}
                </Button>
                {isController && !isSubmitted && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Tree
                  </Button>
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

      {/* Validation Status */}
      <Card className={`border-2 shadow-2xl mb-6 ${isTreeValid
          ? 'bg-green-900/50 border-green-500'
          : 'bg-red-900/50 border-red-500'
        }`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            {isTreeValid ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <h3 className="text-2xl font-bold text-white">Valid HTML Structure! ✅</h3>
                  <p className="text-green-200">All blocks are properly placed. You can submit!</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-8 h-8 text-red-400" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white">
                    {validationErrors.length} Error{validationErrors.length > 1 ? 's' : ''} ❌
                  </h3>
                  <div className="mt-2 space-y-1">
                    {validationErrors.slice(0, 5).map((error, idx) => (
                      <p key={idx} className="text-red-200 text-sm">• {error}</p>
                    ))}
                    {validationErrors.length > 5 && (
                      <p className="text-red-300 text-sm italic">
                        ... and {validationErrors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Available Blocks */}
        <div className="col-span-3">
          <Card className="bg-slate-900 border-2 border-slate-700 shadow-2xl h-full">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-900">
              <h3 className="text-lg font-semibold text-white">📦 Available Blocks</h3>
              <p className="text-xs text-slate-300 mt-1">Drag these to build the tree</p>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                {availableBlocks.map((block) => (
                  <div
                    key={block.id}
                    draggable={isController && !readOnly && !isSubmitted}
                    onDragStart={(e) => handleDragStart(e, block, true)}
                    className={`
                      rounded-lg border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 cursor-move
                      hover:shadow-xl hover:scale-105 hover:border-blue-600 transition-all
                      ${isController && !readOnly && !isSubmitted ? '' : 'opacity-50 cursor-not-allowed'}
                    `}
                  >
                    {/* Opening Tag */}
                    <div className="px-4 py-2 bg-blue-100 rounded-t-lg border-b-2 border-blue-300">
                      <code className="font-mono font-bold text-blue-900 text-sm">
                        &lt;{block.tag}
                        {block.content && (
                          <span className="text-blue-700 font-normal"> class="{block.content}"</span>
                        )}
                        &gt;
                      </code>
                    </div>

                    {/* Content Indicator */}
                    <div className="px-4 py-1 text-center">
                      <code className="text-xs text-gray-500 font-mono">
                        {block.content ? `"${block.content}"` : '...'}
                      </code>
                    </div>

                    {/* Closing Tag */}
                    <div className="px-4 py-2 bg-blue-100 rounded-b-lg border-t-2 border-blue-300">
                      <code className="font-mono font-bold text-blue-900 text-sm">
                        &lt;/{block.tag}&gt;
                      </code>
                    </div>

                    {/* Drag Indicator */}
                    {isController && !readOnly && !isSubmitted && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                {availableBlocks.length === 0 && (
                  <p className="text-center text-gray-400 italic text-sm py-8">
                    All blocks used!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tree Visualization */}
        <div className="col-span-9">
          <Card className="bg-slate-900 border-4 border-slate-700 shadow-2xl">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-900">
              <h3 className="text-lg font-semibold text-white">🌳 HTML Tree Structure</h3>
              <p className="text-xs text-slate-300 mt-1">Drop blocks into empty slots to build the tree</p>
            </div>
            <CardContent className="p-8 bg-slate-950 overflow-x-auto">
              <div className="min-w-max flex justify-center">
                {renderTreeNode(userTree)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Button */}
      {isController && !readOnly && !isSubmitted && (
        <Card className="bg-slate-800 border-2 border-slate-600 mb-6">
          <CardContent className="p-6">
            <Button
              onClick={handleSubmit}
              disabled={!isTreeValid}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTreeValid ? 'Submit Solution' : 'Fix All Errors to Submit'}
            </Button>
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
                    <h3 className="text-3xl font-bold text-white">Perfect! 🎉</h3>
                    <p className="text-green-200 text-lg mt-1">You built the HTML tree correctly!</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 text-red-400" />
                  <div>
                    <h3 className="text-3xl font-bold text-white">Not Quite Right</h3>
                    <p className="text-red-200 text-lg mt-1">The tree structure has some issues.</p>
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
