async function main() {
  const res = await fetch('http://localhost:3000/test-profile-card');
  console.log('HTTP Status:', res.status);
  const text = await res.text();

  const hasHeader = text.includes('メンバープロフィール');
  const hasDescription = text.includes('ここにメンバーのプロフィール情報（自己紹介、技術、スタンス、スタイル、ステータス、タグなど）が表示されます。');
  const hasTailwindClasses = text.includes('p-6 bg-white shadow-xl rounded-lg max-w-md mx-auto my-8 border border-gray-200');

  console.log('✓ Heading found:', hasHeader);
  console.log('✓ Description found:', hasDescription);
  console.log('✓ Tailwind classes found:', hasTailwindClasses);

  if (hasHeader && hasDescription && hasTailwindClasses) {
    console.log('\nAll checks passed successfully for Step 1!');
  } else {
    console.error('Some checks failed.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
