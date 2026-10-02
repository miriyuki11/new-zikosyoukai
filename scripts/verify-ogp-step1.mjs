async function testUrl(url) {
  console.log(`\n======================================================`);
  console.log(`Testing URL: ${url}`);
  console.log(`======================================================`);
  const res = await fetch(url);
  console.log(`HTTP Status: ${res.status} ${res.statusText}`);
  const html = await res.text();

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  console.log(`HTML Title: ${titleMatch ? titleMatch[1] : 'N/A'}`);

  const metaTags = html.match(/<meta[^>]*>/gi) || [];
  const relevantTags = metaTags.filter(t => /og:|twitter:|description/i.test(t));
  console.log(`Meta tags (${relevantTags.length}):`);
  for (const tag of relevantTags) {
    console.log('  ', tag);
  }

  // 画面表示テキストの検証
  const hasProfileText = html.includes('プロフィールOGPページ - ID:');
  const hasTeamText = html.includes('チームOGPページ - ID:');
  console.log(`Page text "プロフィールOGPページ - ID:": ${hasProfileText ? '✅ FOUND' : 'N/A'}`);
  console.log(`Page text "チームOGPページ - ID:": ${hasTeamText ? '✅ FOUND' : 'N/A'}`);
}

async function main() {
  await testUrl('http://localhost:3000/profile/123');
  await testUrl('http://localhost:3000/team/456');
}

main().catch(console.error);
