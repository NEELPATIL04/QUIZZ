interface TreeNode {
  id: string;
  tag: string;
  content?: string;
  children: TreeNode[];
}

export function validateHtmlTree(
  userTree: TreeNode,
  correctTree: TreeNode,
  maxPoints: number
): { isCorrect: boolean; pointsAwarded: number; score: number } {

  // Calculate different aspects of correctness
  const structureScore = calculateStructureScore(userTree, correctTree);
  const nestingScore = calculateNestingScore(userTree, correctTree);
  const orderScore = calculateOrderScore(userTree, correctTree);

  // Weighted scoring
  // 40% structure (right elements in right places)
  // 40% nesting (correct parent-child relationships)
  // 20% order (children in correct order)
  const totalScore = (structureScore * 0.4) + (nestingScore * 0.4) + (orderScore * 0.2);

  // Award points based on score
  const pointsAwarded = Math.round(totalScore * maxPoints);

  // Consider correct if > 90%
  const isCorrect = totalScore >= 0.9;

  return {
    isCorrect,
    pointsAwarded,
    score: Math.round(totalScore * 100) // Percentage
  };
}

// Check if the overall structure matches (right nodes in right positions)
function calculateStructureScore(userTree: TreeNode, correctTree: TreeNode): number {
  const userNodes = flattenTree(userTree);
  const correctNodes = flattenTree(correctTree);

  let correctCount = 0;
  const totalNodes = correctNodes.length;

  for (const correctNode of correctNodes) {
    const matchingNode = userNodes.find(n => n.id === correctNode.id);
    if (matchingNode) {
      // Check if it has the same parent
      const userParent = findParent(userTree, matchingNode.id);
      const correctParent = findParent(correctTree, correctNode.id);

      if (userParent?.id === correctParent?.id) {
        correctCount++;
      } else if (!userParent && !correctParent) {
        // Both are root nodes
        correctCount++;
      }
    }
  }

  return totalNodes > 0 ? correctCount / totalNodes : 0;
}

// Check if parent-child nesting relationships are correct
function calculateNestingScore(userTree: TreeNode, correctTree: TreeNode): number {
  const relationships = getParentChildRelationships(correctTree);
  let correctRelationships = 0;

  for (const { parentId, childId } of relationships) {
    const userParent = findNodeById(userTree, parentId);
    const userChild = findNodeById(userTree, childId);

    if (userParent && userChild) {
      // Check if child is actually a child of parent in user tree
      if (userParent.children.some(c => c.id === childId)) {
        correctRelationships++;
      }
    }
  }

  return relationships.length > 0 ? correctRelationships / relationships.length : 0;
}

// Check if children are in the correct order
function calculateOrderScore(userTree: TreeNode, correctTree: TreeNode): number {
  return checkChildrenOrder(userTree, correctTree).score;
}

function checkChildrenOrder(userNode: TreeNode, correctNode: TreeNode): { score: number; total: number; correct: number } {
  let totalComparisons = 0;
  let correctOrderCount = 0;

  // If this node has children, check their order
  if (correctNode.children.length > 0 && userNode.children.length > 0) {
    const correctIds = correctNode.children.map(c => c.id);
    const userIds = userNode.children.map(c => c.id);

    // Check relative order of children that exist in both
    const commonIds = correctIds.filter(id => userIds.includes(id));

    for (let i = 0; i < commonIds.length - 1; i++) {
      const id1 = commonIds[i];
      const id2 = commonIds[i + 1];

      const correctOrder = correctIds.indexOf(id1) < correctIds.indexOf(id2);
      const userOrder = userIds.indexOf(id1) < userIds.indexOf(id2);

      totalComparisons++;
      if (correctOrder === userOrder) {
        correctOrderCount++;
      }
    }
  }

  // Recursively check children
  for (const correctChild of correctNode.children) {
    const userChild = userNode.children.find(c => c.id === correctChild.id);
    if (userChild) {
      const childResult = checkChildrenOrder(userChild, correctChild);
      totalComparisons += childResult.total;
      correctOrderCount += childResult.correct;
    }
  }

  return {
    score: totalComparisons > 0 ? correctOrderCount / totalComparisons : 1,
    total: totalComparisons,
    correct: correctOrderCount
  };
}

// Helper functions
function flattenTree(node: TreeNode): TreeNode[] {
  const result: TreeNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenTree(child));
  }
  return result;
}

function findParent(tree: TreeNode, targetId: string, parent: TreeNode | null = null): TreeNode | null {
  if (tree.id === targetId) {
    return parent;
  }

  for (const child of tree.children) {
    const found = findParent(child, targetId, tree);
    if (found !== null) {
      return found;
    }
  }

  return null;
}

function findNodeById(tree: TreeNode, id: string): TreeNode | null {
  if (tree.id === id) {
    return tree;
  }

  for (const child of tree.children) {
    const found = findNodeById(child, id);
    if (found) {
      return found;
    }
  }

  return null;
}

function getParentChildRelationships(tree: TreeNode): Array<{ parentId: string; childId: string }> {
  const relationships: Array<{ parentId: string; childId: string }> = [];

  for (const child of tree.children) {
    relationships.push({ parentId: tree.id, childId: child.id });
    relationships.push(...getParentChildRelationships(child));
  }

  return relationships;
}
