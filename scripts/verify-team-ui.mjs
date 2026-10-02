async function verifyTeamPage(url) {
  console.log(`\n======================================================`);
  console.log(`Testing URL: ${url}`);
  console.log(`======================================================`);

  const res = await fetch(url);
  console.log(`HTTP Status: ${res.status} ${res.statusText}`);

  const html = await res.text();

  // 1. チーム名の検証
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  console.log(`Page Title: ${titleMatch ? titleMatch[1] : 'N/A'}`);

  const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  console.log(`Team Name (H1): ${h1Match ? h1Match[1].trim() : 'N/A'}`);

  // 2. チーム説明の検証
  const hasDescription = html.includes('新機能開発を担当するチームです');
  console.log(`Team Description Found: ${hasDescription ? '✅ YES ("新機能開発を担当するチームです")' : '❌ NO'}`);

  // 3. メンバーリストの検証
  const hasMemberList = html.includes('メンバーリスト');
  console.log(`Member List Header Found: ${hasMemberList ? '✅ YES' : '❌ NO'}`);

  const hasLeader = html.includes('リーダー');
  console.log(`Leader Role Found: ${hasLeader ? '✅ YES ("リーダー")' : '❌ NO'}`);

  const hasMember = html.includes('メンバー');
  console.log(`Member Role Found: ${hasMember ? '✅ YES ("メンバー")' : '❌ NO'}`);

  // 4. OGPメタタグの検証
  const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/i);
  const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/i);
  const ogImage = html.match(/<meta property="og:image" content="([^"]*)"/i);
  console.log(`OG Title: ${ogTitle ? ogTitle[1] : 'N/A'}`);
  console.log(`OG Description: ${ogDesc ? ogDesc[1] : 'N/A'}`);
  console.log(`OG Image: ${ogImage ? ogImage[1] : 'N/A'}`);
}

async function main() {
  // ① ユーザー例のURL: /teams/team-123
  await verifyTeamPage('http://localhost:3000/teams/team-123');

  // ② 実際のSupabase DB上のチームID: /teams/2fd033d1-8fb7-4521-838e-4df0a0607c82
  await verifyTeamPage('http://localhost:3000/teams/2fd033d1-8fb7-4521-838e-4df0a0607c82');

  // ③ /team/team-123 (単数形URL対応)
  await verifyTeamPage('http://localhost:3000/team/team-123');
}

main().catch(console.error);
