import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

const brokenHtmlQuestion = {
  questionNumber: 4,
  questionType: 'broken_html_challenge' as const,
  title: 'Build a Website Layout Tree',
  description: 'Study the original HTML code on the left and recreate the exact tree structure by dragging the DIV blocks into the empty slots.',
  points: 100,
  isEnabled: true,

  // Original HTML code to display
  story: `&lt;div style="width:300px; padding:10px; background:#222;"&gt;

  &lt;div style="display:flex; justify-content:space-between; background:#444;"&gt;
    &lt;div&gt;Logo&lt;/div&gt;
    &lt;div&gt;Menu&lt;/div&gt;
  &lt;/div&gt;

  &lt;div style="margin:10px 0; padding:10px; background:#666; display:flex;"&gt;

    &lt;div style="flex:1; background:#999; padding:5px;"&gt;
      &lt;div style="background:#ccc;"&gt;Card A&lt;/div&gt;
    &lt;/div&gt;

    &lt;div style="flex:1; background:#777; padding:5px;"&gt;
      &lt;div style="background:#bbb;"&gt;Card B&lt;/div&gt;
    &lt;/div&gt;

  &lt;/div&gt;

  &lt;div style="background:#555; text-align:center;"&gt;
    Footer
  &lt;/div&gt;

&lt;/div&gt;`,

  // Available blocks for dragging (randomized order to make it challenging)
  initialTree: JSON.stringify([
    { id: 'block-card-b', tag: 'div', content: 'Card B', className: 'background:#bbb;', children: [] },
    { id: 'block-header', tag: 'div', content: 'Header (Flex Container)', className: 'display:flex; justify-content:space-between; background:#444;', children: [] },
    { id: 'block-footer', tag: 'div', content: 'Footer', className: 'background:#555; text-align:center;', children: [] },
    { id: 'block-card-a-wrapper', tag: 'div', content: 'Card A Wrapper', className: 'flex:1; background:#999; padding:5px;', children: [] },
    { id: 'block-logo', tag: 'div', content: 'Logo', children: [] },
    { id: 'block-content', tag: 'div', content: 'Content Area (Flex Container)', className: 'margin:10px 0; padding:10px; background:#666; display:flex;', children: [] },
    { id: 'block-menu', tag: 'div', content: 'Menu', children: [] },
    { id: 'block-card-a', tag: 'div', content: 'Card A', className: 'background:#ccc;', children: [] },
    { id: 'block-container', tag: 'div', content: 'Main Container', className: 'width:300px; padding:10px; background:#222;', children: [] },
    { id: 'block-card-b-wrapper', tag: 'div', content: 'Card B Wrapper', className: 'flex:1; background:#777; padding:5px;', children: [] },
  ]),

  // Correct tree structure
  correctTree: JSON.stringify({
    id: 'root-body',
    tag: 'body',
    children: [
      {
        id: 'block-container',
        tag: 'div',
        content: 'Main Container',
        children: [
          {
            id: 'block-header',
            tag: 'div',
            content: 'Header',
            children: [
              { id: 'block-logo', tag: 'div', content: 'Logo', children: [] },
              { id: 'block-menu', tag: 'div', content: 'Menu', children: [] },
            ]
          },
          {
            id: 'block-content',
            tag: 'div',
            content: 'Content Area',
            children: [
              {
                id: 'block-card-a-wrapper',
                tag: 'div',
                content: 'Card A Wrapper',
                children: [
                  { id: 'block-card-a', tag: 'div', content: 'Card A', children: [] }
                ]
              },
              {
                id: 'block-card-b-wrapper',
                tag: 'div',
                content: 'Card B Wrapper',
                children: [
                  { id: 'block-card-b', tag: 'div', content: 'Card B', children: [] }
                ]
              }
            ]
          },
          {
            id: 'block-footer',
            tag: 'div',
            content: 'Footer',
            children: []
          }
        ]
      }
    ]
  }),

  hints: JSON.stringify([
    'Start by placing "Main Container" div directly under <body>',
    'The Main Container should have 3 children: Header, Content Area, and Footer',
    'Header div contains Logo and Menu divs (2 children)',
    'Content Area contains Card A Wrapper and Card B Wrapper (2 children)',
    'Card A Wrapper contains Card A div inside it',
    'Card B Wrapper contains Card B div inside it',
    'Footer is a single div with no children',
    'All elements are DIV tags - focus on the nesting structure!'
  ]),

  // Tree structure with empty slots for user to fill
  treeStructure: JSON.stringify({
    id: 'root-body',
    tag: 'body',
    content: '<body>',
    children: [
      {
        id: 'empty-slot-1',
        tag: 'empty-slot',
        children: [
          {
            id: 'empty-slot-2',
            tag: 'empty-slot',
            children: [
              { id: 'empty-slot-3', tag: 'empty-slot', children: [] },
              { id: 'empty-slot-4', tag: 'empty-slot', children: [] }
            ]
          },
          {
            id: 'empty-slot-5',
            tag: 'empty-slot',
            children: [
              {
                id: 'empty-slot-6',
                tag: 'empty-slot',
                children: [
                  { id: 'empty-slot-7', tag: 'empty-slot', children: [] }
                ]
              },
              {
                id: 'empty-slot-8',
                tag: 'empty-slot',
                children: [
                  { id: 'empty-slot-9', tag: 'empty-slot', children: [] }
                ]
              }
            ]
          },
          { id: 'empty-slot-10', tag: 'empty-slot', children: [] }
        ]
      }
    ]
  })
};

export async function seedBrokenHtmlQuestion() {
  console.log('🌱 Seeding Broken HTML challenge question...');

  // Check if question already exists
  const [existing] = await db
    .select()
    .from(questions)
    .where(eq(questions.questionNumber, brokenHtmlQuestion.questionNumber));

  if (existing) {
    console.log(`   ⚠️  Question ${brokenHtmlQuestion.questionNumber} already exists, updating...`);
    await db
      .update(questions)
      .set(brokenHtmlQuestion)
      .where(eq(questions.id, existing.id));
    console.log(`   ✅ Updated Question ${brokenHtmlQuestion.questionNumber}: "${brokenHtmlQuestion.title}"`);
  } else {
    const [inserted] = await db
      .insert(questions)
      .values(brokenHtmlQuestion)
      .returning();
    console.log(`   ✅ Created Question ${brokenHtmlQuestion.questionNumber}: "${brokenHtmlQuestion.title}"`);
  }

  console.log('✨ Broken HTML question seeding complete!\n');
}

// Run if executed directly
if (require.main === module) {
  seedBrokenHtmlQuestion()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding Broken HTML question:', error);
      process.exit(1);
    });
}
