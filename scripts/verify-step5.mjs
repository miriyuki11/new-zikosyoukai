async function verifyOgpUrl(url, label) {
  console.log(`\n======================================================`);
  console.log(`[${label}] Testing: ${url}`);
  console.log(`======================================================`);

  const res = await fetch(url);
  console.log(`HTTP Status: ${res.status} ${res.statusText}`);
  const html = await res.text();

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  console.log(`HTML Title:     ${titleMatch ? titleMatch[1] : 'N/A'}`);

  const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/i);
  const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/i);
  const ogImage = html.match(/<meta property="og:image" content="([^"]*)"/i);
  const ogUrl = html.match(/<meta property="og:url" content="([^"]*)"/i);
  const ogType = html.match(/<meta property="og:type" content="([^"]*)"/i);
  const ogSiteName = html.match(/<meta property="og:site_name" content="([^"]*)"/i);
  const twCard = html.match(/<meta name="twitter:card" content="([^"]*)"/i);

  console.log(`og:title:       ${ogTitle ? ogTitle[1] : 'N/A'}`);
  console.log(`og:description: ${ogDesc ? ogDesc[1] : 'N/A'}`);
  console.log(`og:image:       ${ogImage ? ogImage[1] : 'N/A'}`);
  console.log(`og:url:         ${ogUrl ? ogUrl[1] : 'N/A'}`);
  console.log(`og:type:        ${ogType ? ogType[1] : 'N/A'}`);
  console.log(`og:site_name:   ${ogSiteName ? ogSiteName[1] : 'N/A'}`);
  console.log(`twitter:card:   ${twCard ? twCard[1] : 'N/A'}`);
}

async function verifyImage(url) {
  const res = await fetch(url);
  console.log(`Image ${url} -> Status: ${res.status} ${res.statusText}, Content-Type: ${res.headers.get('content-type')}`);
}

async function main() {
  // 1. 成功ケース
  await verifyOgpUrl('http://localhost:3000/profile/test-user-id-123', '成功ケース: プロフィール');
  await verifyOgpUrl('http://localhost:3000/teams/test-team-id-456', '成功ケース: チーム (複数形)');
  await verifyOgpUrl('http://localhost:3000/team/test-team-id-456', '成功ケース: チーム (単数形)');

  // 2. フォールバックケース
  await verifyOgpUrl('http://localhost:3000/profile/non-existent-user', 'フォールバック: プロフィール');
  await verifyOgpUrl('http://localhost:3000/teams/non-existent-team', 'フォールバック: チーム (複数形)');
  await verifyOgpUrl('http://localhost:3000/team/non-existent-team', 'フォールバック: チーム (単数形)');

  // 3. 画像確認
  console.log(`\n======================================================`);
  console.log(`[画像アクセステスト]`);
  console.log(`======================================================`);
  await verifyImage('http://localhost:3000/images/default-ogp.png');
  await verifyImage('http://localhost:3000/images/avatars/user-123.png');
  await verifyImage('http://localhost:3000/images/logos/team-456.png');
}

main().catch(console.error);
