async function checkUrl(url) {
  console.log(`\n================ ${url} ================`);
  const res = await fetch(url);
  console.log(`Status: ${res.status} ${res.statusText}`);
  const html = await res.text();
  
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  console.log(`TITLE: ${titleMatch ? titleMatch[1] : 'N/A'}`);
  
  const metaTags = html.match(/<meta[^>]*>/gi) || [];
  const relevantTags = metaTags.filter(t => /og:|twitter:|description/i.test(t));
  console.log(`Relevant Meta Tags (${relevantTags.length}):`);
  for (const tag of relevantTags) {
    console.log('  ', tag);
  }

  // ページのボディテキストのスニペット
  const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  if (h1Match) {
    console.log(`Page H1: ${h1Match[1]}`);
  }
}

async function main() {
  await checkUrl('http://localhost:3000/profile/a7339194-137c-4a00-9921-5efbddedd2fa');
  await checkUrl('http://localhost:3000/profile/testuser');
  await checkUrl('http://localhost:3000/profile/non-existent-user');
}

main().catch(console.error);
