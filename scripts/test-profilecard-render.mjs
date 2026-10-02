import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000',
});
global.window = dom.window;
global.document = dom.window.document;

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key';

let logCaptured = false;
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Supabase client initialized in ProfileCard:')) {
    logCaptured = true;
  }
};

async function testRender() {
  const React = await import('react');
  const ReactDOMServer = await import('react-dom/server');
  const { ProfileCard } = await import('../src/components/ProfileCard.tsx');

  const html = ReactDOMServer.renderToString(React.createElement(ProfileCard));
  console.log('\nRendered HTML snippet:\n', html);

  if (logCaptured) {
    console.log('✓ Successfully confirmed console.log: "Supabase client initialized in ProfileCard:"');
  } else {
    console.error('Console log was not captured');
    process.exit(1);
  }
}

testRender().catch(err => {
  console.error(err);
  process.exit(1);
});
