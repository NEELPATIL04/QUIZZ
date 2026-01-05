// Sample HTML Tree Builder Question

export const sampleTreeQuestion = {
  id: 'tree-builder-1',
  questionNumber: 4,
  title: 'Build a Valid HTML Document Structure',
  description: 'Drag and drop the HTML blocks to build a proper document structure. Start with the body tag and build the tree following HTML nesting rules.',
  points: 100,

  // Blocks available for dragging
  availableBlocks: [
    { id: 'block-header', tag: 'header', children: [] },
    { id: 'block-h1', tag: 'h1', content: 'Welcome', children: [] },
    { id: 'block-nav', tag: 'nav', children: [] },
    { id: 'block-ul', tag: 'ul', children: [] },
    { id: 'block-li-1', tag: 'li', content: 'Home', children: [] },
    { id: 'block-li-2', tag: 'li', content: 'About', children: [] },
    { id: 'block-li-3', tag: 'li', content: 'Contact', children: [] },
    { id: 'block-main', tag: 'main', children: [] },
    { id: 'block-section', tag: 'section', children: [] },
    { id: 'block-h2', tag: 'h2', content: 'Content', children: [] },
    { id: 'block-p', tag: 'p', content: 'This is a paragraph', children: [] },
  ],

  // Initial tree structure with empty slots
  treeStructure: {
    id: 'root-body',
    tag: 'body',
    children: [
      {
        id: 'slot-1',
        tag: 'empty-slot',
        children: [
          {
            id: 'slot-1-1',
            tag: 'empty-slot',
            children: []
          },
          {
            id: 'slot-1-2',
            tag: 'empty-slot',
            children: [
              {
                id: 'slot-1-2-1',
                tag: 'empty-slot',
                children: []
              },
              {
                id: 'slot-1-2-2',
                tag: 'empty-slot',
                children: []
              },
              {
                id: 'slot-1-2-3',
                tag: 'empty-slot',
                children: []
              },
            ]
          }
        ]
      },
      {
        id: 'slot-2',
        tag: 'empty-slot',
        children: [
          {
            id: 'slot-2-1',
            tag: 'empty-slot',
            children: [
              {
                id: 'slot-2-1-1',
                tag: 'empty-slot',
                children: []
              },
              {
                id: 'slot-2-1-2',
                tag: 'empty-slot',
                children: []
              }
            ]
          }
        ]
      }
    ]
  },

  // Correct solution
  correctTree: {
    id: 'root-body',
    tag: 'body',
    children: [
      {
        id: 'block-header',
        tag: 'header',
        children: [
          {
            id: 'block-h1',
            tag: 'h1',
            content: 'Welcome',
            children: []
          },
          {
            id: 'block-nav',
            tag: 'nav',
            children: [
              {
                id: 'block-ul',
                tag: 'ul',
                children: [
                  { id: 'block-li-1', tag: 'li', content: 'Home', children: [] },
                  { id: 'block-li-2', tag: 'li', content: 'About', children: [] },
                  { id: 'block-li-3', tag: 'li', content: 'Contact', children: [] },
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'block-main',
        tag: 'main',
        children: [
          {
            id: 'block-section',
            tag: 'section',
            children: [
              {
                id: 'block-h2',
                tag: 'h2',
                content: 'Content',
                children: []
              },
              {
                id: 'block-p',
                tag: 'p',
                content: 'This is a paragraph',
                children: []
              }
            ]
          }
        ]
      }
    ]
  },

  hints: [
    'Start by placing the <header> and <main> blocks directly under <body>',
    'The <header> should contain the <h1> heading and <nav> navigation',
    'Inside <nav>, place the <ul> list element',
    'The <ul> can ONLY contain <li> elements as direct children',
    'The <main> should contain the <section> which then holds the <h2> and <p>',
    'Remember: <header> and <main> are block-level elements that go directly under <body>'
  ]
};
