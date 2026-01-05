// Sample Broken HTML Challenge Questions

export const sampleBrokenHtmlQuestion1 = {
  id: 'broken-html-1',
  questionNumber: 5,
  title: 'Fix the Broken HTML Tree',
  description: 'The DOM tree below has invalid HTML nesting. Drag and drop elements to create a valid HTML structure. Common mistakes include: <p> tags containing <div> elements, <ul> tags containing non-<li> elements, and inline elements containing block elements.',
  points: 100,

  // Initial broken tree
  initialTree: [
    {
      id: 'root-1',
      tag: 'div',
      children: [
        {
          id: 'node-1',
          tag: 'p',
          content: 'Welcome to our website',
          children: [
            // INVALID: p cannot contain div
            {
              id: 'node-2',
              tag: 'div',
              content: 'This is a nested div',
              children: []
            }
          ]
        },
        {
          id: 'node-3',
          tag: 'ul',
          children: [
            {
              id: 'node-4',
              tag: 'li',
              content: 'Item 1',
              children: []
            },
            // INVALID: ul can only contain li
            {
              id: 'node-5',
              tag: 'span',
              content: 'Invalid span',
              children: []
            },
            {
              id: 'node-6',
              tag: 'li',
              content: 'Item 2',
              children: []
            }
          ]
        }
      ]
    }
  ],

  // Correct tree structure
  correctTree: [
    {
      id: 'root-1',
      tag: 'div',
      children: [
        {
          id: 'node-1',
          tag: 'p',
          content: 'Welcome to our website',
          children: []
        },
        {
          id: 'node-2',
          tag: 'div',
          content: 'This is a nested div',
          children: []
        },
        {
          id: 'node-3',
          tag: 'ul',
          children: [
            {
              id: 'node-4',
              tag: 'li',
              content: 'Item 1',
              children: []
            },
            {
              id: 'node-6',
              tag: 'li',
              content: 'Item 2',
              children: [
                {
                  id: 'node-5',
                  tag: 'span',
                  content: 'Invalid span',
                  children: []
                }
              ]
            }
          ]
        }
      ]
    }
  ],

  hints: [
    '<p> tags can only contain inline elements like <span>, <a>, <strong>, not block elements like <div>',
    '<ul> and <ol> tags can ONLY contain <li> elements as direct children',
    'Inline elements like <span> should be inside block elements or other inline elements',
    'Try moving the <div> to be a sibling of the <p> tag instead of a child',
    'Try moving the <span> inside one of the <li> elements'
  ],

  validationRules: {} // Uses default HTML_RULES from component
};

export const sampleBrokenHtmlQuestion2 = {
  id: 'broken-html-2',
  questionNumber: 6,
  title: 'Advanced HTML Structure Fix',
  description: 'This DOM tree has multiple nesting violations. Fix all the structural issues to create valid HTML. Pay attention to block vs inline elements and parent-child relationships.',
  points: 150,

  initialTree: [
    {
      id: 'container',
      tag: 'div',
      children: [
        {
          id: 'header',
          tag: 'h1',
          content: 'Page Title',
          children: [
            // INVALID: h1 can contain inline elements, but this div is block-level
            {
              id: 'subtitle-div',
              tag: 'div',
              content: 'Subtitle',
              children: []
            }
          ]
        },
        {
          id: 'content',
          tag: 'p',
          content: 'Main content',
          children: [
            // INVALID: p cannot contain ul
            {
              id: 'list',
              tag: 'ul',
              children: [
                {
                  id: 'item1',
                  tag: 'li',
                  content: 'First item',
                  children: []
                },
                // INVALID: button cannot be direct child of ul
                {
                  id: 'btn',
                  tag: 'button',
                  content: 'Click me',
                  children: []
                },
                {
                  id: 'item2',
                  tag: 'li',
                  content: 'Second item',
                  children: []
                }
              ]
            }
          ]
        }
      ]
    }
  ],

  correctTree: [
    {
      id: 'container',
      tag: 'div',
      children: [
        {
          id: 'header',
          tag: 'h1',
          content: 'Page Title',
          children: [
            {
              id: 'subtitle-div',
              tag: 'span', // Changed to span
              content: 'Subtitle',
              children: []
            }
          ]
        },
        {
          id: 'content',
          tag: 'p',
          content: 'Main content',
          children: []
        },
        {
          id: 'list',
          tag: 'ul',
          children: [
            {
              id: 'item1',
              tag: 'li',
              content: 'First item',
              children: []
            },
            {
              id: 'item2',
              tag: 'li',
              content: 'Second item',
              children: [
                {
                  id: 'btn',
                  tag: 'button',
                  content: 'Click me',
                  children: []
                }
              ]
            }
          ]
        }
      ]
    }
  ],

  hints: [
    'Headings (<h1>, <h2>, etc.) should only contain inline elements',
    '<p> tags cannot contain block elements like <ul>',
    '<ul> can only have <li> as direct children',
    'Buttons can be placed inside <li> elements',
    'Consider moving block-level elements to be siblings rather than children'
  ],

  validationRules: {}
};

export const sampleBrokenHtmlQuestion3 = {
  id: 'broken-html-3',
  questionNumber: 7,
  title: 'Complex Nested Structure',
  description: 'This is a more complex DOM tree with multiple levels of nesting errors. Carefully reorganize the elements to follow proper HTML semantics.',
  points: 200,

  initialTree: [
    {
      id: 'main',
      tag: 'div',
      children: [
        {
          id: 'nav',
          tag: 'ul',
          children: [
            // INVALID: span cannot be direct child of ul
            {
              id: 'nav-title',
              tag: 'span',
              content: 'Navigation',
              children: []
            },
            {
              id: 'nav-item-1',
              tag: 'li',
              children: [
                {
                  id: 'link-1',
                  tag: 'a',
                  content: 'Home',
                  children: [
                    // INVALID: a cannot contain div
                    {
                      id: 'icon-div',
                      tag: 'div',
                      content: '🏠',
                      children: []
                    }
                  ]
                }
              ]
            },
            {
              id: 'nav-item-2',
              tag: 'li',
              children: [
                {
                  id: 'link-2',
                  tag: 'a',
                  content: 'About',
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: 'article',
          tag: 'p',
          content: 'Article content',
          children: [
            // INVALID: p cannot contain h2
            {
              id: 'article-title',
              tag: 'h2',
              content: 'Article Title',
              children: []
            },
            // INVALID: p cannot contain another p
            {
              id: 'article-text',
              tag: 'p',
              content: 'More text',
              children: []
            }
          ]
        }
      ]
    }
  ],

  correctTree: [
    {
      id: 'main',
      tag: 'div',
      children: [
        {
          id: 'nav',
          tag: 'ul',
          children: [
            {
              id: 'nav-item-1',
              tag: 'li',
              children: [
                {
                  id: 'nav-title',
                  tag: 'span',
                  content: 'Navigation',
                  children: []
                }
              ]
            },
            {
              id: 'nav-item-2',
              tag: 'li',
              children: [
                {
                  id: 'link-1',
                  tag: 'a',
                  content: 'Home',
                  children: [
                    {
                      id: 'icon-div',
                      tag: 'span', // Changed to span
                      content: '🏠',
                      children: []
                    }
                  ]
                }
              ]
            },
            {
              id: 'nav-item-3',
              tag: 'li',
              children: [
                {
                  id: 'link-2',
                  tag: 'a',
                  content: 'About',
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: 'article-title',
          tag: 'h2',
          content: 'Article Title',
          children: []
        },
        {
          id: 'article',
          tag: 'p',
          content: 'Article content',
          children: []
        },
        {
          id: 'article-text',
          tag: 'p',
          content: 'More text',
          children: []
        }
      ]
    }
  ],

  hints: [
    '<ul> elements can only contain <li> as direct children',
    'Move non-<li> elements inside an <li> element',
    'Links (<a>) can only contain inline elements like <span>, not <div>',
    '<p> tags cannot contain block elements like <h2> or other <p> tags',
    'Separate nested <p> tags into siblings at the same level'
  ],

  validationRules: {}
};
