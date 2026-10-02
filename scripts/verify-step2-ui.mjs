async function main() {
  const url = 'http://localhost:3000';
  console.log(`Testing ${url}...`);
  const res = await fetch(url);
  console.log('HTTP Status:', res.status);
  const text = await res.text();

  const checks = [
    { name: 'Page Title', passed: text.includes('プロフィールカード表示テスト') },
    { name: 'Profile Name', passed: text.includes('山田 太郎') },
    { name: 'Bio Heading', passed: text.includes('自己紹介') },
    { name: 'Bio Content', passed: text.includes('こんにちは、山田太郎です') },
    { name: 'Skills Heading', passed: text.includes('得意な技術') },
    { name: 'Skill: TypeScript', passed: text.includes('TypeScript') },
    { name: 'Skill: Python', passed: text.includes('Python') },
    { name: 'Skill: Docker', passed: text.includes('Docker') },
    { name: 'Communication Style Heading', passed: text.includes('コミュニケーションスタンス') },
    { name: 'Communication Style Content', passed: text.includes('テキストでの非同期コミュニケーションを基本としていますが') },
    { name: 'Consultation Style Heading', passed: text.includes('相談スタイル') },
    { name: 'Consultation Style Content', passed: text.includes('ご相談の際は、まず現状と解決したい課題を具体的に教えていただけるとスムーズです') },
    { name: 'Realtime Status Heading', passed: text.includes('リアルタイムステータス') },
    { name: 'Realtime Status Content', passed: text.includes('オンライン (集中モード)') },
    { name: 'Tailwind Badge Style', passed: text.includes('bg-blue-100 text-blue-800') },
    { name: 'Realtime Pulse Indicator', passed: text.includes('bg-green-500 animate-pulse') },
    { name: 'Card Container Style', passed: text.includes('bg-white shadow-lg rounded-xl') },
  ];

  let allPassed = true;
  for (const check of checks) {
    console.log(`${check.passed ? '✓' : '✗'} ${check.name}: ${check.passed}`);
    if (!check.passed) {
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\nAll checks for Step 2 passed successfully!');
  } else {
    console.error('\nSome checks failed!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
