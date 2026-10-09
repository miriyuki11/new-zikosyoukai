async function verifyUrl(url, expectedTexts = []) {
  console.log(`\n======================================================`);
  console.log(`Testing URL: ${url}`);
  console.log(`======================================================`);
  const res = await fetch(url);
  console.log(`HTTP Status: ${res.status} ${res.statusText}`);

  if (url.endsWith('.jpg')) {
    console.log(`Content-Type: ${res.headers.get('content-type')}`);
    console.log(`Content-Length: ${res.headers.get('content-length')} bytes`);
    return;
  }

  const html = await res.text();
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  console.log(`Title: ${titleMatch ? titleMatch[1] : 'N/A'}`);

  const metaTags = html.match(/<meta[^>]*>/gi) || [];
  const relevantTags = metaTags.filter(t => /og:|twitter:|description/i.test(t));
  console.log(`Relevant Meta Tags (${relevantTags.length}):`);
  for (const tag of relevantTags) {
    console.log('  ', tag);
  }

  for (const text of expectedTexts) {
    const found = html.includes(text);
    console.log(`Text check "${text}": ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
  }
}

async function main() {
  await verifyUrl('http://localhost:3000/profile/sample-user-id', [
    'プロフィールページ: sample-user-id',
    'ここにプロフィールカードのUIコンポーネントが表示されます。'
  ]);

  await verifyUrl('http://localhost:3000/images/default-profile-ogp.jpg');
}

main().catch(console.error);
