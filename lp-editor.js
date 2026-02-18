/* ===== LP ビジュアルエディタ v4.0 =====
   使い方: URLに ?edit を付けて開く
   例: https://tokumeik666.github.io/shinso-kantei/?edit
   ・テキストをクリックで直接編集（改行はShift+Enter）
   ・「GitHubに反映」ボタンで直接デプロイ
   ・初回のみGitHubトークンを入力（以降はブラウザに記憶）
*/
(function(){
  if(!location.search.includes('edit'))return;

  // ===== 設定 =====
  const REPO_OWNER='tokumeik666';
  const REPO_NAME='shinso-kantei';
  const FILE_PATH='index.html';
  const TOKEN_KEY='lp-editor-gh-token';

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
  style.id='lp-editor-style';
  style.textContent=`
    .lp-edit-mode [contenteditable="true"]{
      outline:2px dashed #d946ef44 !important;
      outline-offset:4px;cursor:text !important;
      transition:outline-color 0.2s;min-height:1em;
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
      display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;
      font-family:'Noto Sans JP',sans-serif;max-width:90vw;
    }
    .lp-editor-bar button{
      padding:10px 18px;border:none;border-radius:8px;
      font-size:13px;font-weight:700;cursor:pointer;
      transition:transform 0.15s,box-shadow 0.15s;
      box-shadow:0 4px 16px rgba(0,0,0,0.3);white-space:nowrap;
    }
    .lp-editor-bar button:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.4)}
    .lp-editor-bar button:active{transform:translateY(0)}
    .lp-editor-bar .btn-push{background:linear-gradient(135deg,#34d399,#059669);color:#fff}
    .lp-editor-bar .btn-push:disabled{opacity:0.5;cursor:wait}
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
      padding:12px 22px;border-radius:8px;font-size:13px;font-weight:600;
      font-family:'Noto Sans JP',sans-serif;
      box-shadow:0 4px 16px rgba(0,0,0,0.3);
      animation:toastIn 0.3s ease-out;
    }
    .lp-editor-toast.success{background:#1a1a2e;color:#34d399;border:1px solid #34d39944}
    .lp-editor-toast.error{background:#2e1a1a;color:#f34970;border:1px solid #f3497044}
    .lp-editor-toast.info{background:#1a1a2e;color:#c77dff;border:1px solid #c77dff44}
    @keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .lp-editor-modal{
      position:fixed;inset:0;z-index:10002;
      background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
      display:flex;align-items:center;justify-content:center;
    }
    .lp-editor-modal-box{
      background:#1a1030;border:1px solid #c77dff33;border-radius:16px;
      padding:28px;max-width:420px;width:90%;font-family:'Noto Sans JP',sans-serif;
    }
    .lp-editor-modal-box h3{color:#e8e2d6;font-size:16px;margin-bottom:12px}
    .lp-editor-modal-box p{color:#a09888;font-size:12px;line-height:1.7;margin-bottom:16px}
    .lp-editor-modal-box input{
      width:100%;padding:10px 14px;border:1px solid #c77dff33;border-radius:8px;
      background:#0d0620;color:#e8e2d6;font-size:14px;font-family:monospace;
      outline:none;
    }
    .lp-editor-modal-box input:focus{border-color:#d946ef}
    .lp-editor-modal-box .modal-btns{display:flex;gap:8px;margin-top:16px;justify-content:flex-end}
    .lp-editor-modal-box .modal-btns button{
      padding:8px 20px;border:none;border-radius:8px;font-size:13px;
      font-weight:700;cursor:pointer;
    }
    .lp-editor-modal-box .modal-ok{background:linear-gradient(135deg,#34d399,#059669);color:#fff}
    .lp-editor-modal-box .modal-cancel{background:#333;color:#ccc}
  `;
  document.head.appendChild(style);

  // ===== 編集モード起動 =====
  document.body.classList.add('lp-edit-mode');
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
    if(el.querySelector('[contenteditable]'))return;
    if(el.children.length===1&&el.children[0].tagName==='IMG')return;
    if(el.tagName==='IMG')return;
    el.setAttribute('contenteditable','true');
  });

  // ===== クリーンHTML生成 =====
  function getCleanHTML(){
    const clone=document.documentElement.cloneNode(true);
    // contenteditable除去
    clone.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
    // エディタUI除去
    clone.querySelectorAll('.lp-editor-bar,.lp-editor-badge,.lp-editor-toast,.lp-editor-modal').forEach(el=>el.remove());
    clone.querySelector('body')?.classList.remove('lp-edit-mode');
    // エディタ用style除去
    const edStyle=clone.querySelector('#lp-editor-style');
    if(edStyle)edStyle.remove();
    // ブラウザ拡張のゴミ除去
    clone.querySelectorAll('style[data-rc-order],style[data-css-hash],style[data-comment-style]').forEach(s=>s.remove());
    clone.querySelectorAll('style').forEach(s=>{
      const t=s.textContent;
      if(t.includes('.anticon')||t.includes('.mc-palette')||t.includes('glasp'))s.remove();
    });
    clone.querySelectorAll('.glasp-extension,[class*="glasp"]').forEach(el=>el.remove());
    // inline style cleanup（fiの強制表示を元に戻す）
    clone.querySelectorAll('.fi').forEach(el=>{el.style.removeProperty('opacity');el.style.removeProperty('transform');if(!el.getAttribute('style'))el.removeAttribute('style')});
    clone.querySelectorAll('.review-card').forEach(el=>{el.style.removeProperty('opacity');el.style.removeProperty('transform');if(!el.getAttribute('style'))el.removeAttribute('style')});
    // &amp; → & 修復（Google Fonts URL）
    let html='<!DOCTYPE html>\n'+clone.outerHTML;
    html=html.replace(/&amp;family=/g,'&family=').replace(/&amp;display=/g,'&display=');
    return html;
  }

  // ===== GitHub API =====
  async function getFileSHA(token){
    const res=await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,{
      headers:{'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json'}
    });
    if(!res.ok)throw new Error('ファイル取得失敗: '+res.status);
    const data=await res.json();
    return data.sha;
  }

  async function pushToGitHub(token,content){
    const sha=await getFileSHA(token);
    const encoded=btoa(unescape(encodeURIComponent(content)));
    const res=await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,{
      method:'PUT',
      headers:{'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json','Content-Type':'application/json'},
      body:JSON.stringify({
        message:'エディタから更新',
        content:encoded,
        sha:sha
      })
    });
    if(!res.ok){
      const err=await res.json().catch(()=>({}));
      throw new Error(err.message||'プッシュ失敗: '+res.status);
    }
    return await res.json();
  }

  // ===== トークン入力モーダル =====
  function askToken(){
    return new Promise((resolve,reject)=>{
      const modal=document.createElement('div');
      modal.className='lp-editor-modal';
      modal.innerHTML=`
        <div class="lp-editor-modal-box">
          <h3>GitHubトークンを入力</h3>
          <p>初回のみ必要です。以降はブラウザに記憶されます。<br>
          GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens<br>
          で「Contents: Read and write」権限付きのトークンを作成してください。</p>
          <input type="password" id="gh-token-input" placeholder="github_pat_xxxx...">
          <div class="modal-btns">
            <button class="modal-cancel" id="gh-modal-cancel">キャンセル</button>
            <button class="modal-ok" id="gh-modal-ok">保存して反映</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const input=document.getElementById('gh-token-input');
      input.focus();
      document.getElementById('gh-modal-ok').addEventListener('click',()=>{
        const v=input.value.trim();
        if(!v){input.style.borderColor='#f34970';return;}
        localStorage.setItem(TOKEN_KEY,v);
        modal.remove();
        resolve(v);
      });
      document.getElementById('gh-modal-cancel').addEventListener('click',()=>{
        modal.remove();
        reject(new Error('cancelled'));
      });
      input.addEventListener('keydown',e=>{
        if(e.key==='Enter')document.getElementById('gh-modal-ok').click();
      });
    });
  }

  // ===== ツールバー =====
  const bar=document.createElement('div');
  bar.className='lp-editor-bar';

  // 改行挿入
  const btnBr=document.createElement('button');
  btnBr.className='btn-add-br';
  btnBr.textContent='改行挿入';
  btnBr.addEventListener('click',()=>document.execCommand('insertHTML',false,'<br>'));

  // GitHubに反映ボタン
  const btnPush=document.createElement('button');
  btnPush.className='btn-push';
  btnPush.textContent='GitHubに反映';
  btnPush.addEventListener('click',async()=>{
    btnPush.disabled=true;
    btnPush.textContent='反映中...';
    try{
      let token=localStorage.getItem(TOKEN_KEY);
      if(!token)token=await askToken();
      const html=getCleanHTML();
      await pushToGitHub(token,html);
      showToast('GitHubに反映しました！数分でサイトに反映されます','success');
    }catch(e){
      if(e.message==='cancelled'){/* ユーザーキャンセル */}
      else if(e.message.includes('401')||e.message.includes('Bad credentials')){
        localStorage.removeItem(TOKEN_KEY);
        showToast('トークンが無効です。再入力してください','error');
      }else{
        showToast('エラー: '+e.message,'error');
      }
    }finally{
      btnPush.disabled=false;
      btnPush.textContent='GitHubに反映';
    }
  });

  // HTMLダウンロード（バックアップ用）
  const btnSave=document.createElement('button');
  btnSave.className='btn-save';
  btnSave.textContent='DL保存';
  btnSave.addEventListener('click',()=>{
    const html=getCleanHTML();
    const blob=new Blob([html],{type:'text/html;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='index.html';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('index.html をダウンロードしました','success');
  });

  // 編集終了
  const btnCancel=document.createElement('button');
  btnCancel.className='btn-cancel';
  btnCancel.textContent='編集終了';
  btnCancel.addEventListener('click',()=>location.href=location.pathname);

  bar.appendChild(btnBr);
  bar.appendChild(btnCancel);
  bar.appendChild(btnSave);
  bar.appendChild(btnPush);
  document.body.appendChild(bar);

  function showToast(msg,type='info'){
    const t=document.createElement('div');
    t.className='lp-editor-toast '+type;
    t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),4000);
  }

  // fiアニメーション無効化（編集中は全表示）
  document.querySelectorAll('.fi').forEach(el=>{el.classList.add('visible');el.style.opacity='1';el.style.transform='none'});
  document.querySelectorAll('.review-card').forEach(el=>{el.classList.add('visible');el.style.opacity='1';el.style.transform='none'});
  document.querySelectorAll('.tw-line').forEach(el=>el.classList.add('show'));

  console.log('LP Editor v4.0 active — '+editables.length+' editable elements');
})();
