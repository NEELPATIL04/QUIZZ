# Broken HTML DOM Tree Challenge

## Overview
The **Broken HTML Challenge** is an interactive quiz component where users must fix invalid HTML DOM tree structures by dragging and dropping elements to create valid, semantically correct HTML.

## Features

### ✨ Key Capabilities
- **Visual DOM Tree**: Interactive tree visualization with expand/collapse functionality
- **Drag & Drop**: Intuitive drag-and-drop interface to reorganize elements
- **Real-time Validation**: Instant feedback on HTML nesting errors
- **Error Highlighting**: Red borders indicate invalid elements, green for valid
- **Comprehensive Rules**: Built-in HTML5 validation rules for proper nesting
- **Hints System**: Progressive hints to help users understand HTML semantics
- **Timer**: Tracks completion time
- **Scoring**: Points awarded based on correctness

### 🎯 Learning Objectives
- Understanding HTML semantic structure
- Block vs. inline elements
- Valid parent-child relationships
- Common HTML nesting mistakes
- Best practices for DOM structure

## Component Structure

### File Locations
```
frontend/
├── components/
│   └── BrokenHtmlChallenge.tsx       # Main component
├── lib/
│   └── sampleBrokenHtmlQuestion.ts   # Example questions
└── app/
    └── test-broken-html/
        └── page.tsx                   # Test page
```

## HTML Validation Rules

The component includes comprehensive validation rules for common HTML elements:

### Block-Level Elements
- **`<div>`**: Can contain almost any element
- **`<p>`**: Can ONLY contain inline elements (no `<div>`, `<ul>`, etc.)
- **`<ul>` / `<ol>`**: Can ONLY contain `<li>` elements
- **`<h1>` - `<h6>`**: Can only contain inline elements

### Inline Elements
- **`<span>`**: Can be inside block or inline elements
- **`<a>`**: Cannot contain block elements like `<div>`
- **`<button>`**: Should contain inline elements only

### Common Violations
1. ❌ `<p>` containing `<div>` (block inside inline)
2. ❌ `<ul>` containing `<span>` (non-li child)
3. ❌ `<a>` containing `<div>` (block inside inline)
4. ❌ `<h1>` containing `<div>` (block inside heading)
5. ❌ Nested `<p>` tags (paragraph inside paragraph)

## Question Format

### Question Structure
```typescript
{
  id: string;                    // Unique identifier
  questionNumber: number;        // Question number in quiz
  title: string;                 // Question title
  description: string;           // Instructions
  points: number;                // Points awarded
  initialTree: DomNode[];        // Broken DOM tree
  correctTree: DomNode[];        // Correct solution
  hints: string[];               // Progressive hints
  validationRules: {};           // Custom rules (optional)
}
```

### DomNode Structure
```typescript
{
  id: string;           // Unique node ID
  tag: string;          // HTML tag name (div, p, ul, etc.)
  content?: string;     // Text content (optional)
  children: DomNode[];  // Child nodes
  parentId?: string;    // Parent reference
}
```

## Example Questions

### 1. Easy - Basic Nesting Error
**Problem**: `<p>` tag containing a `<div>`
```html
<!-- Broken -->
<div>
  <p>Welcome
    <div>Nested div</div>  ❌
  </p>
</div>

<!-- Fixed -->
<div>
  <p>Welcome</p>
  <div>Nested div</div>  ✅
</div>
```

### 2. Medium - List Structure Error
**Problem**: `<ul>` containing non-`<li>` elements
```html
<!-- Broken -->
<ul>
  <li>Item 1</li>
  <span>Invalid</span>  ❌
  <li>Item 2</li>
</ul>

<!-- Fixed -->
<ul>
  <li>Item 1</li>
  <li>
    <span>Invalid</span>  ✅
  </li>
  <li>Item 2</li>
</ul>
```

### 3. Hard - Multiple Nested Errors
**Problem**: Multiple levels with various violations
```html
<!-- Broken -->
<div>
  <ul>
    <span>Nav</span>  ❌
    <li>
      <a>Home
        <div>Icon</div>  ❌
      </a>
    </li>
  </ul>
  <p>Content
    <h2>Title</h2>  ❌
    <p>More text</p>  ❌
  </p>
</div>

<!-- Fixed -->
<div>
  <ul>
    <li>
      <span>Nav</span>  ✅
    </li>
    <li>
      <a>Home
        <span>Icon</span>  ✅
      </a>
    </li>
  </ul>
  <h2>Title</h2>  ✅
  <p>Content</p>  ✅
  <p>More text</p>  ✅
</div>
```

## How to Use

### 1. Test the Component
Navigate to the test page:
```
http://localhost:3000/test-broken-html
```

### 2. Integrate into Quiz Flow

Add to `quiz/team/page.tsx`:
```typescript
import BrokenHtmlChallenge from '@/components/BrokenHtmlChallenge';

// In your question rendering logic:
if (q.questionType === 'broken_html_challenge') {
  const htmlQuestion = {
    id: q.id,
    questionNumber: q.questionNumber,
    title: q.title,
    description: q.description || '',
    initialTree: q.initialTree ? JSON.parse(q.initialTree) : [],
    correctTree: q.correctTree ? JSON.parse(q.correctTree) : [],
    hints: q.hints ? JSON.parse(q.hints) : [],
    points: q.points,
    validationRules: {},
  };

  return (
    <BrokenHtmlChallenge
      question={htmlQuestion}
      teamNumber={teamNumber!}
      isController={memberRole === 'controller'}
      onSubmit={async (tree, timeTaken, startTime) => {
        const result = await api.submitAnswer(
          teamNumber!,
          q.id,
          JSON.stringify(tree),
          timeTaken,
          startTime
        );
        return {
          isCorrect: result.isCorrect,
          pointsAwarded: result.pointsAwarded,
        };
      }}
      onNext={/* ... */}
      onPrevious={/* ... */}
      hasNextQuestion={/* ... */}
      hasPreviousQuestion={/* ... */}
      nextQuestionIsBidRound={/* ... */}
    />
  );
}
```

### 3. Database Schema

Add to your questions table:
```sql
ALTER TABLE questions ADD COLUMN initialTree TEXT;
ALTER TABLE questions ADD COLUMN correctTree TEXT;
ALTER TABLE questions ADD COLUMN hints TEXT;
```

### 4. Create Questions

Use the sample questions as templates:
```typescript
import { sampleBrokenHtmlQuestion1 } from '@/lib/sampleBrokenHtmlQuestion';

// Store in database
const question = {
  questionType: 'broken_html_challenge',
  title: 'Fix the Broken HTML Tree',
  description: '...',
  initialTree: JSON.stringify(sampleBrokenHtmlQuestion1.initialTree),
  correctTree: JSON.stringify(sampleBrokenHtmlQuestion1.correctTree),
  hints: JSON.stringify(sampleBrokenHtmlQuestion1.hints),
  points: 100,
};
```

## User Interface

### Visual Elements

1. **Header**
   - Question title and points
   - Timer (for active challenges)
   - Navigation buttons (Previous/Next)

2. **Instructions Card**
   - Challenge description
   - How-to guide
   - Hint toggle button
   - Reset button

3. **Validation Status Card**
   - Real-time error count
   - List of validation errors
   - Success message when valid

4. **DOM Tree Visualization**
   - Hierarchical tree structure
   - Expand/collapse nodes
   - Color-coded validity (red = invalid, green = valid)
   - Drag handles on elements

5. **Submit Button**
   - Disabled until tree is valid
   - Shows validation status

### Color Scheme
- **Background**: Emerald/Teal/Cyan gradient
- **Valid Elements**: Green borders
- **Invalid Elements**: Red borders with error icons
- **Drag Hover**: Blue ring effect
- **Success**: Green cards
- **Errors**: Red cards

## Interaction Flow

1. **Initial State**
   - User sees broken DOM tree with red error indicators
   - Validation status shows error count and messages

2. **Fixing Errors**
   - User drags an invalid element
   - Drops it onto a valid parent
   - Tree updates and re-validates automatically

3. **Validation Feedback**
   - Errors decrease as structure improves
   - Elements turn green when valid
   - Hints available if needed

4. **Completion**
   - All errors resolved
   - Submit button becomes enabled
   - User submits solution
   - Results displayed with points and time

## Advanced Features

### Custom Validation Rules
You can override default rules per question:
```typescript
validationRules: {
  'custom-tag': {
    allowedParents: ['div'],
    allowedChildren: ['span'],
  }
}
```

### Progressive Hints
Hints are revealed one at a time to guide learning:
```typescript
hints: [
  'General hint about HTML structure',
  'Specific hint about block vs inline',
  'Direct hint about the error location',
  'Nearly the answer'
]
```

## Best Practices

### Creating Good Questions

1. **Start Simple**: Begin with 1-2 errors for beginners
2. **Build Complexity**: Add more levels and errors gradually
3. **Teach Concepts**: Each question should teach a specific HTML rule
4. **Provide Context**: Use realistic HTML structures
5. **Clear Hints**: Guide without giving away the answer

### Error Types to Include

- **Nesting Errors**: Block inside inline elements
- **List Errors**: Non-li children of ul/ol
- **Semantic Errors**: Improper heading nesting
- **Structural Errors**: Multiple levels of incorrect nesting

## Troubleshooting

### Common Issues

**Drag not working?**
- Ensure `isController={true}`
- Check that `readOnly={false}`
- Verify `isSubmitted={false}`

**Validation not updating?**
- Tree is validated on every change
- Check browser console for errors
- Verify validation rules are correct

**Elements not dropping?**
- Cannot drop element on itself
- Cannot drop element on its children
- Parent must allow child type

## Future Enhancements

Potential improvements:
- [ ] Visual diff between current and correct tree
- [ ] Undo/redo functionality
- [ ] Multi-select and batch operations
- [ ] Keyboard navigation
- [ ] Accessibility improvements
- [ ] Export/import tree as JSON
- [ ] Code view alongside tree view
- [ ] Animation on successful drop

## Credits

Built with:
- React 18+ (Hooks)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- HTML5 Drag & Drop API

---

**Happy HTML Learning! 🌳**
