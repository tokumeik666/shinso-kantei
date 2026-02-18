/* ===== LP ビジュアルエディタ v3.1 =====
   使い方: URLに ?edit を付けて開く
   例: index.html?edit
   ・テキストをクリックで直接編集（改行はShift+Enter）
   ・編集後は右下の「HTMLを保存」で変更をダウンロード
*/
(function(){
  if(!location.search.includes('edit'))return;

  // ===== 編集対象 =====
  const SELECTORS=[
    '.typewriter .tw-line','.typewriter .tw-bold',
    'p','strong','.em','.glow-word',
    '.ocean-keyword','.map-text','.plan-desc','.plan-name',
    '.plan-sub','.plan-note','.plan-badge',
    '.review-cat-title','.closing-name',
    '.hero-title','h1','h2','h3',
    '.cta-btn','.cta-note',
    '.story-text p','.theme-card p'
  ].join(',');

  // ===== スタイル注入 =====
  const style=document.createElement('style');
  style.textContent=`
    .lp-edit-mode [contenteditable="true"]{
      outline:2px dashed #d946ef44 !important;
      outline-offset:4px;
      cursor:text !important;
      transition:outline-color 0.2s;
      min-height:1em;
    }
    .lp-edit-mode [contenteditable="true"]:focus{
      outline-color:#d946ef !important;
      background:rgba(217,70,239,0.05) !important;
    }
    .lp-edit-mode [contenteditable="true"]:hover{
      outline-color:#d946ef88 !important;
    }
    .lp-editor-bar{
      position:fixed;bottom:20px;right:20px;z-index:10000;
      display:flex;gap:8px;align-items:center;
      font-family:'Noto Sans JP',sans-serif;
    }
    .lp-editor-bar button{
      padding:10px 20px;border:none;border-radius:8px;
      font-size:14px;font-weight:700;cursor:pointer;
      transition:transform 0.15s,box-shadow 0.15s;
      box-shadow:0 4px 16px rgba(0,0,0,0.3);
    }
    .lp-editor-bar button:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.4)}
    .lp-editor-bar button:active{transform:translateY(0)}
    .lp-editor-bar .btn-save{background:linear-gradient(135deg,#d946ef,#9333ea);color:#fff}
    .lp-editor-bar .btn-cancel{background:#333;color:#ccc}
    .lp-editor-bar .btn-add-br{background:#1a1a2e;color:#c77dff;border:1px solid #c77dff44}
    .lp-editor-badge{
      position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:10000;
      background:linear-gradient(135deg,#d946ef,#9333ea);color:#fff;
      padding:6px 18px;border-radius:20px;font-size:12px;font-weight:700;
      font-family:'Noto Sans JP',sans-serif;letter-spacing:0.05em;
      box-shadow:0 4px 16px rgba(217,70,239,0.3);
      animation:edBadgeIn 0.5s ease-out;
    }
    @keyframes edBadgeIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
    .lp-editor-toast{
      position:fixed;bottom:80px;right:20px;z-index:10001;
      background:#1a1a2e;color:#34d399;border:1px solid #34d39944;
      padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;
      font-family:'Noto Sans JP',sans-serif;
      box-shadow:0 4px 16px rgba(0,0,0,0.3);
      animation:toastIn 0.3s ease-out;
    }
    @keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  `;
  document.head.appendChild(style);

  // ===== 編集モード起動 =====
  document.body.classList.add('lp-edit-mode');

  // ローディングを即スキップ
  const loader=document.getElementById('loader');
  if(loader)loader.classList.add('hide');

  // バッジ
  const badge=document.createElement('div');
  badge.className='lp-editor-badge';
  badge.textContent='編集モード ON';
  document.body.appendChild(badge);

  // 対象要素をcontenteditable化
  const editables=document.querySelectorAll(SELECTORS);
  editables.forEach(el=>{
    // 子要素にcontenteditable付きがあればスキップ（二重防止）
    if(el.querySelector('[contenteditable]'))return;
    // 画像のみの要素はスキップ
    if(el.children.length===1&&el.children[0].tagName==='IMG')return;
    if(el.tagName==='IMG')return;
    el.setAttribute('contenteditable','true');
  });

  // ===== ツールバー =====
  const bar=document.createElement('div');
  bar.className='lp-editor-bar';

  // 改行挿入ボタン
  const btnBr=document.createElement('button');
  btnBr.className='btn-add-br';
  btnBr.textContent='改行挿入';
  btnBr.title='カーソル位置に<br>を挿入';
  btnBr.addEventListener('click',()=>{
    document.execCommand('insertHTML',false,'<br>');
  });

  // 保存ボタン
  const btnSave=document.createElement('button');
  btnSave.className='btn-save';
  btnSave.textContent='HTMLを保存';
  btnSave.addEventListener('click',()=>{
    // contenteditable属性を一時除去してクリーンなHTMLを生成
    const clone=document.documentElement.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
    clone.querySelectorAll('.lp-editor-bar,.lp-editor-badge,.lp-editor-toast,.lp-edit-mode').forEach(el=>el.remove());
    clone.querySelector('body')?.classList.remove('lp-edit-mode');
    // スタイルタグ除去（エディタ用）
    clone.querySelectorAll('style').forEach(s=>{if(s.textContent.includes('lp-edit-mode'))s.remove()});

    const html='<!DOCTYPE html>\n'+clone.outerHTML;
    const blob=new Blob([html],{type:'text/html;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='index.html';
    a.click();
    URL.revokeObjectURL(a.href);

    showToast('index.html をダウンロードしました');
  });

  // キャンセル
  const btnCancel=document.createElement('button');
  btnCancel.className='btn-cancel';
  btnCancel.textContent='編集終了';
  btnCancel.addEventListener('click',()=>{
    location.href=location.pathname;
  });

  bar.appendChild(btnBr);
  bar.appendChild(btnCancel);
  bar.appendChild(btnSave);
  document.body.appendChild(bar);

  function showToast(msg){
    const t=document.createElement('div');
    t.className='lp-editor-toast';
    t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),3000);
  }

  // fiアニメーション無効化（編集中は全表示）
  document.querySelectorAll('.fi').forEach(el=>{el.classList.add('visible');el.style.opacity='1';el.style.transform='none'});
  document.querySelectorAll('.review-card').forEach(el=>{el.classList.add('visible');el.style.opacity='1';el.style.transform='none'});
  document.querySelectorAll('.tw-line').forEach(el=>el.classList.add('show'));

  console.log('LP Editor v3.1 active — '+editables.length+' editable elements');
})();
