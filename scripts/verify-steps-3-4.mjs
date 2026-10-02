async function testProfilePage(url, expectFound = true) {
  console.log(`\n======================================================`);
  console.log(`[Profile Test] URL: ${url}`);
  console.log(`======================================================`);
  const res = await fetch(url);
  console.log(`HTTP Status: ${res.status} ${res.statusText}`);
  const html = await res.text();

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  console.log(`Title: ${titleMatch ? titleMatch[1] : 'N/A'}`);

  const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/i);
  const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/i);
  const ogImage = html.match(/<meta property="og:image" content="([^"]*)"/i);
  const ogUrl = html.match(/<meta property="og:url" content="([^"]*)"/i);
  const ogType = html.match(/<meta property="og:type" content="([^"]*)"/i);
  const twCard = html.match(/<meta name="twitter:card" content="([^"]*)"/i);

  console.log(`og:title:       ${ogTitle ? ogTitle[1] : 'N/A'}`);
  console.log(`og:description: ${ogDesc ? ogDesc[1] : 'N/A'}`);
  console.log(`og:image:       ${ogImage ? ogImage[1] : 'N/A'}`);
  console.log(`og:url:         ${ogUrl ? ogUrl[1] : 'N/A'}`);
  console.log(`og:type:        ${ogType ? ogType[1] : 'N/A'}`);
  console.log(`twitter:card:   ${twCard ? twCard[1] : 'N/A'}`);

  if (expectFound) {
    const hasJoinDate = html.includes('参加日:');
    console.log(`UI "参加日:":   ${hasJoinDate ? '✅ FOUND' : '❌ NOT FOUND'}`);
  } else {
    const notFoundText = html.includes('プロフィールが見つかりません。');
    console.log(`UI Not Found:   ${notFoundText ? '✅ FOUND' : '❌ NOT FOUND'}`);
  }
}

async function testTeamPage(url, expectFound = true) {
  console.log(`\n======================================================`);
  console.log(`[Team Test] URL: ${url}`);
  console.log(`======================================================`);
  const res = await fetch(url);
  console.log(`HTTP Status: ${res.status} ${res.statusText}`);
  const html = await res.text();

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  console.log(`Title: ${titleMatch ? titleMatch[1] : 'N/A'}`);

  const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/i);
  const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/i);
  const ogImage = html.match(/<meta property="og:image" content="([^"]*)"/i);
  const ogUrl = html.match(/<meta property="og:url" content="([^"]*)"/i);
  const ogType = html.match(/<meta property="og:type" content="([^"]*)"/i);

  console.log(`og:title:       ${ogTitle ? ogTitle[1] : 'N/A'}`);
  console.log(`og:description: ${ogDesc ? ogDesc[1] : 'N/A'}`);
  console.log(`og:image:       ${ogImage ? ogImage[1] : 'N/A'}`);
  console.log(`og:url:         ${ogUrl ? ogUrl[1] : 'N/A'}`);
  console.log(`og:type:        ${ogType ? ogType[1] : 'N/A'}`);

  if (expectFound) {
    const hasTeamId = html.includes('チームID:');
    console.log(`UI "チームID:": ${hasTeamId ? '✅ FOUND' : '❌ NOT FOUND'}`);
  } else {
    const notFoundText = html.includes('チームが見つかりません。');
    console.log(`UI Not Found:   ${notFoundText ? '✅ FOUND' : '❌ NOT FOUND'}`);
  }
}

async function main() {
  // ステップ3: プロフィール動的取得
  await testProfilePage('http://localhost:3000/profile/12345', true);
  await testProfilePage('http://localhost:3000/profile/testuser', true);
  await testProfilePage('http://localhost:3000/profile/nonexistent', false);

  // ステップ4: チーム動的取得
  await testTeamPage('http://localhost:3000/team/your-team-id', true);
  await testTeamPage('http://localhost:3000/team/2fd033d1-8fb7-4521-838e-4df0a0607c82', true);
  await testTeamPage('http://localhost:3000/team/non-existent-id', false);
}

main().catch(console.error);
