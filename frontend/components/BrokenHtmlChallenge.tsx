'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, AlertCircle, RotateCcw, Lightbulb } from 'lucide-react';

interface DomNode {
  id: string;
  tag: string;
  content?: string;
  children: DomNode[];
  parentId?: string;
  isValid?: boolean;
}

interface BrokenHtmlQuestion {
  id: string;
  questionNumber: number;
  title: string;
  description: string;
  initialTree: DomNode[];
  correctTree: DomNode[];
  points: number;
  hints: string[];
  validationRules: {
    [key: string]: {
      allowedParents: string[];
      allowedChildren: string[];
      blockLevelOnly?: boolean;
      inlineLevelOnly?: boolean;
    };
  };
}

interface BrokenHtmlChallengeProps {
  question: BrokenHtmlQuestion;
  teamNumber: number;
  isController: boolean;
  onSubmit: (tree: DomNode[], timeTaken: number, startTime: Date) => Promise<{ isCorrect: boolean; pointsAwarded: number }>;
  readOnly?: boolean;
  showAnswer?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNextQuestion?: boolean;
  hasPreviousQuestion?: boolean;
  isSubmitted?: boolean;
  nextQuestionIsBidRound?: boolean;
}

// HTML nesting validation rules
const HTML_RULES = {
  'div': {
    allowedParents: ['div', 'body', 'main', 'section', 'article', 'header', 'footer', 'nav', 'aside'],
    allowedChildren: ['div', 'p', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a', 'button', 'img'],
    blockLevelOnly: false,
  },
  'p': {
    allowedParents: ['div', 'body', 'main', 'section', 'article', 'li'],
    allowedChildren: ['span', 'a', 'strong', 'em', 'img', 'button'],
    blockLevelOnly: false,
    inlineLevelOnly: true, // p can only contain inline elements
  },
  'span': {
    allowedParents: ['div', 'p', 'a', 'li', 'button', 'h1', 'h2', 'h3'],
    allowedChildren: ['span', 'a', 'strong', 'em'],
    inlineLevelOnly: true,
  },
  'ul': {
    allowedParents: ['div', 'body', 'main', 'section', 'article', 'nav', 'aside'],
    allowedChildren: ['li'], // ul can ONLY contain li
    blockLevelOnly: true,
  },
  'ol': {
    allowedParents: ['div', 'body', 'main', 'section', 'article', 'nav', 'aside'],
    allowedChildren: ['li'],
    blockLevelOnly: true,
  },
  'li': {
    allowedParents: ['ul', 'ol'],
    allowedChildren: ['div', 'p', 'span', 'a', 'strong', 'em', 'ul', 'ol'],
  },
  'a': {
    allowedParents: ['div', 'p', 'span', 'li', 'button'],
    allowedChildren: ['span', 'strong', 'em', 'img'],
    inlineLevelOnly: true,
  },
  'button': {
    allowedParents: ['div', 'p', 'li'],
    allowedChildren: ['span', 'strong', 'em'],
  },
  'h1': {
    allowedParents: ['div', 'body', 'header', 'section', 'article'],
    allowedChildren: ['span', 'a', 'strong', 'em'],
    inlineLevelOnly: true,
  },
  'h2': {
    allowedParents: ['div', 'body', 'header', 'section', 'article'],
    allowedChildren: ['span', 'a', 'strong', 'em'],
    inlineLevelOnly: true,
  },
  'h3': {
    allowedParents: ['div', 'body', 'header', 'section', 'article'],
    allowedChildren: ['span', 'a', 'strong', 'em'],
    inlineLevelOnly: true,
  },
};

export default function BrokenHtmlChallenge({
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
}: BrokenHtmlChallengeProps) {
  const [domTree, setDomTree] = useState<DomNode[]>(JSON.parse(JSON.stringify(question.initialTree)));
  const [draggedNode, setDraggedNode] = useState<DomNode | null>(null);
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Timer
  useEffect(() => {
    if (readOnly || isSubmitted) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, readOnly, isSubmitted]);

  // Auto-expand all nodes on mount
  useEffect(() => {
    const allNodeIds = new Set<string>();
    const collectIds = (nodes: DomNode[]) => {
      nodes.forEach(node => {
        allNodeIds.add(node.id);
        if (node.children) {
          collectIds(node.children);
        }
      });
    };
    collectIds(domTree);
    setExpandedNodes(allNodeIds);
  }, []);

  // Validate the entire tree
  const validateTree = (tree: DomNode[], parentTag: string = 'body'): string[] => {
    const errors: string[] = [];

    tree.forEach(node => {
      const rules = HTML_RULES[node.tag as keyof typeof HTML_RULES];

      if (!rules) {
        errors.push(`Unknown tag: <${node.tag}>`);
        return;
      }

      // Check if parent is allowed
      if (!rules.allowedParents.includes(parentTag)) {
        errors.push(`<${node.tag}> cannot be a child of <${parentTag}>`);
      }

      // Check if children are allowed
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          if (!rules.allowedChildren.includes(child.tag)) {
            errors.push(`<${child.tag}> cannot be a child of <${node.tag}>`);
          }
        });

        // Recursively validate children
        const childErrors = validateTree(node.children, node.tag);
        errors.push(...childErrors);
      }
    });

    return errors;
  };

  // Update validation on tree change
  useEffect(() => {
    if (!isSubmitted && !readOnly) {
      const errors = validateTree(domTree);
      setValidationErrors(errors);
    }
  }, [domTree, isSubmitted, readOnly]);

  // Find node by ID in tree
  const findNodeById = (nodes: DomNode[], id: string): DomNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Remove node from tree
  const removeNode = (nodes: DomNode[], id: string): DomNode[] => {
    return nodes
      .filter(node => node.id !== id)
      .map(node => ({
        ...node,
        children: node.children ? removeNode(node.children, id) : [],
      }));
  };

  // Add node to parent
  const addNodeToParent = (nodes: DomNode[], parentId: string, newNode: DomNode): DomNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), newNode],
        };
      }
      if (node.children) {
        return {
          ...node,
          children: addNodeToParent(node.children, parentId, newNode),
        };
      }
      return node;
    });
  };

  const handleDragStart = (e: React.DragEvent, node: DomNode) => {
    if (!isController || readOnly || isSubmitted) {
      e.preventDefault();
      return;
    }
    setDraggedNode(node);
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

  const handleDrop = (e: React.DragEvent, targetNode: DomNode) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isController || readOnly || isSubmitted || !draggedNode) return;

    // Don't allow dropping on self or children
    if (draggedNode.id === targetNode.id) {
      setDragOverNode(null);
      return;
    }

    // Remove dragged node from tree
    let newTree = removeNode(domTree, draggedNode.id);

    // Add node to new parent
    newTree = addNodeToParent(newTree, targetNode.id, { ...draggedNode });

    setDomTree(newTree);
    setDraggedNode(null);
    setDragOverNode(null);
  };

  const handleReset = () => {
    setDomTree(JSON.parse(JSON.stringify(question.initialTree)));
    setValidationErrors([]);
  };

  const handleSubmit = async () => {
    const timeTaken = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const result = await onSubmit(domTree, timeTaken, startTime);
    setResult(result);
    setIsSubmitted(true);
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderNode = (node: DomNode, level: number = 0, parentTag: string = 'body'): JSX.Element => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isDragging = draggedNode?.id === node.id;
    const isDragOver = dragOverNode === node.id;

    // Check if this specific node has errors
    const rules = HTML_RULES[node.tag as keyof typeof HTML_RULES];
    const hasParentError = rules && !rules.allowedParents.includes(parentTag);
    const hasChildError = hasChildren && node.children.some(child =>
      rules && !rules.allowedChildren.includes(child.tag)
    );
    const hasError = hasParentError || hasChildError;

    return (
      <div key={node.id} className="select-none">
        <div
          draggable={isController && !readOnly && !isSubmitted}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
          className={`
            flex items-center gap-2 py-2 px-3 mb-1 rounded-lg transition-all duration-200
            ${isDragging ? 'opacity-40 scale-95' : ''}
            ${isDragOver ? 'ring-2 ring-blue-400 bg-blue-500/20' : ''}
            ${hasError ? 'bg-red-900/30 border-2 border-red-500' : 'bg-slate-800/50 border-2 border-slate-600'}
            ${isController && !readOnly && !isSubmitted ? 'cursor-move hover:bg-slate-700/50 hover:border-blue-400' : 'cursor-default'}
          `}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="text-slate-400 hover:text-white transition-colors w-5 h-5 flex items-center justify-center"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          {/* Node Tag */}
          <div className="flex-1 flex items-center gap-2">
            <code className={`font-mono text-base font-bold ${hasError ? 'text-red-400' : 'text-green-400'}`}>
              &lt;{node.tag}&gt;
            </code>
            {node.content && (
              <span className="text-slate-300 text-sm italic">"{node.content}"</span>
            )}
            {hasError && (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
          </div>

          {/* Closing Tag */}
          <code className={`font-mono text-base font-bold ${hasError ? 'text-red-400' : 'text-green-400'}`}>
            &lt;/{node.tag}&gt;
          </code>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, level + 1, node.tag))}
          </div>
        )}
      </div>
    );
  };

  const isTreeValid = validationErrors.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 p-6">
      {/* Header with Navigation and Timer */}
      <div className="mb-6 flex items-center justify-between">
        {/* Left: Next Question Button */}
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
            Question {question.questionNumber}: {question.title}
          </h1>
          <p className="text-emerald-200 text-lg">{question.points} points</p>
        </div>

        {/* Right: Previous Button + Timer */}
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

      {/* Instructions Card */}
      <Card className="bg-gradient-to-br from-emerald-800 to-teal-800 border-2 border-emerald-600 shadow-2xl mb-6">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-emerald-200 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-4">Challenge Instructions</h2>
              <div className="text-emerald-100 text-lg leading-relaxed space-y-3">
                <p>{question.description}</p>
                <div className="bg-emerald-900/50 border border-emerald-500 rounded-lg p-4 mt-4">
                  <p className="font-semibold text-emerald-200 mb-2">How to Fix:</p>
                  <ul className="list-disc list-inside space-y-1 text-emerald-100">
                    <li>Drag and drop elements to reorganize the DOM tree</li>
                    <li>Drop an element onto another to make it a child of that element</li>
                    <li>Red borders indicate invalid HTML nesting</li>
                    <li>Green borders indicate valid elements</li>
                    <li>All errors must be fixed before submitting</li>
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
      <Card className={`border-2 shadow-2xl mb-6 ${
        isTreeValid
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
                  <p className="text-green-200">All elements are properly nested. You can submit your answer!</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-8 h-8 text-red-400" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white">
                    {validationErrors.length} Validation Error{validationErrors.length > 1 ? 's' : ''} ❌
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

      {/* DOM Tree Visualization */}
      <Card className="bg-slate-900 border-4 border-slate-700 shadow-2xl mb-6">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <span className="text-lg font-semibold text-white">HTML DOM Tree</span>
            {isController && !readOnly && !isSubmitted && (
              <span className="ml-4 text-sm text-emerald-300">
                Drag elements to reorganize the tree
              </span>
            )}
          </div>
        </div>
        <CardContent className="p-6 bg-slate-950 min-h-[400px]">
          <div className="font-mono">
            {domTree.map(node => renderNode(node))}
          </div>
        </CardContent>
      </Card>

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
        <Card className={`border-2 mb-6 ${
          result.isCorrect
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
                    <p className="text-green-200 text-lg mt-1">You fixed the HTML structure correctly!</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 text-red-400" />
                  <div>
                    <h3 className="text-3xl font-bold text-white">Not Quite Right</h3>
                    <p className="text-red-200 text-lg mt-1">The structure still has some issues.</p>
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

      {/* Show Correct Answer */}
      {showAnswer && (
        <Card className="bg-gradient-to-r from-emerald-900 to-green-900 border-2 border-green-500 mb-6">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-white mb-4">✅ Correct HTML Structure</h3>
            <div className="bg-slate-950 p-6 rounded-lg border border-green-500 font-mono">
              {question.correctTree.map(node => renderNode(node))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
