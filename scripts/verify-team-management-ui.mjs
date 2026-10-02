// scripts/verify-team-management-ui.mjs

async function runVerification() {
  console.log('=== チーム作成・管理画面UI 動作確認開始 ===\n');

  let allPassed = true;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      allPassed = false;
    }
  }

  // 1. チーム作成画面の確認 (http://localhost:3000/dashboard/teams/create & /teams/create)
  console.log('1. チーム作成画面の確認 (http://localhost:3000/dashboard/teams/create & /teams/create)');
  try {
    const resCreate = await fetch('http://localhost:3000/dashboard/teams/create');
    assert(resCreate.status === 200, 'GET /dashboard/teams/create が 200 OK を返す');

    const htmlCreate = await resCreate.text();
    assert(htmlCreate.includes('新しいチームを作成'), '見出し「新しいチームを作成」が表示されている');
    assert(htmlCreate.includes('チーム名'), '「チーム名」入力フィールドのラベルが存在する');
    assert(htmlCreate.includes('チーム説明'), '「チーム説明」入力フィールドのラベルが存在する');
    assert(htmlCreate.includes('チームを作成'), '「チームを作成」ボタンが存在する');
    assert(htmlCreate.includes('キャンセル'), '「キャンセル」ボタン/リンクが存在する');

    const resCreateAlias = await fetch('http://localhost:3000/teams/create');
    assert(resCreateAlias.status === 200, 'GET /teams/create (エイリアス) が 200 OK を返す');
  } catch (err) {
    console.error('チーム作成画面へのアクセスでエラー:', err);
    allPassed = false;
  }

  console.log('');

  // 2. 既存チーム情報表示・編集画面の確認 (http://localhost:3000/teams/123/edit)
  console.log('2. 既存チーム情報編集画面の確認 (http://localhost:3000/teams/123/edit)');
  try {
    const resEdit = await fetch('http://localhost:3000/teams/123/edit');
    assert(resEdit.status === 200, 'GET /teams/123/edit が 200 OK を返す');

    const htmlEdit = await resEdit.text();
    assert(htmlEdit.includes('チーム編集:') && htmlEdit.includes('開発チームA'), '既存チーム名を含む見出しが表示されている');
    assert(htmlEdit.includes('チーム情報'), '「チーム情報」セクション見出しが表示されている');
    assert(htmlEdit.includes('チーム名'), 'チーム名編集フィールドが存在する');
    assert(htmlEdit.includes('説明'), '説明編集フィールドが存在する');
    assert(htmlEdit.includes('チーム情報を更新'), '「チーム情報を更新」保存ボタンが存在する');
    assert(htmlEdit.includes('キャンセル'), '「キャンセル」ボタンが存在する');

    // 3. メンバー管理セクションの確認
    console.log('\n3. メンバー管理セクションの確認 (http://localhost:3000/teams/123/edit)');
    assert(htmlEdit.includes('メンバー管理'), '「メンバー管理」セクション見出しが表示されている');
    assert(htmlEdit.includes('メンバーをユーザー名またはメールアドレスで検索...'), 'メンバー検索用プレースホルダー入力欄が存在する');
    assert(htmlEdit.includes('メンバー追加'), '「メンバー追加」ボタンが存在する');
    assert(htmlEdit.includes('現在のメンバー'), '「現在のメンバー」サブ見出しが存在する');
    assert(htmlEdit.includes('John Doe'), 'ダミーメンバー「John Doe」が表示されている');
    assert(htmlEdit.includes('john.doe@example.com'), '「john.doe@example.com」が表示されている');
    assert(htmlEdit.includes('Jane Smith'), 'ダミーメンバー「Jane Smith」が表示されている');
    assert(htmlEdit.includes('メンバーを削除'), '「メンバーを削除」ボタン（ゴミ箱アイコン）が存在する');
  } catch (err) {
    console.error('チーム編集画面へのアクセスでエラー:', err);
    allPassed = false;
  }

  console.log('');

  // 4. チーム管理一覧画面の確認 (http://localhost:3000/teams)
  console.log('4. チーム管理一覧画面の確認 (http://localhost:3000/teams)');
  try {
    const resTeams = await fetch('http://localhost:3000/teams');
    assert(resTeams.status === 200, 'GET /teams が 200 OK を返す');

    const htmlTeams = await resTeams.text();
    assert(htmlTeams.includes('チーム管理'), '「チーム管理」タイトルが表示されている');
    assert(htmlTeams.includes('ここではチームの作成、編集、メンバー管理を行います。'), '説明文が表示されている');
    assert(htmlTeams.includes('新しいチームを作成'), 'Headless UI Button「新しいチームを作成」が表示されている');
  } catch (err) {
    console.error('チーム一覧画面へのアクセスでエラー:', err);
    allPassed = false;
  }

  console.log('\n==========================================');
  if (allPassed) {
    console.log('🎉 すべての動作確認項目が正常に合格しました！');
  } else {
    console.error('⚠️ 一部の動作確認項目でエラーが発生しました。');
    process.exit(1);
  }
}

runVerification();
