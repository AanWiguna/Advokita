document.addEventListener('DOMContentLoaded', () => {
  /* --- Small helper to navigate (used by auth pages) --- */
  function goto(path) {
    window.location.href = path;
  }

  /* Auth pages: wire up login / sign buttons if present */
  const loginButtons = document.querySelectorAll("button[data-action='login']");
  const signupButtons = document.querySelectorAll("button[data-action='signup']");
  const oauthButtons = document.querySelectorAll("button[data-action='oauth']");

  loginButtons.forEach(btn => btn.addEventListener('click', () => goto('advokita_home.html')));
  signupButtons.forEach(btn => btn.addEventListener('click', () => goto('advokita_home.html')));
  oauthButtons.forEach(btn => btn.addEventListener('click', () => goto('advokita_home.html')));

  /* --- Password toggle (eye) --- */
  document.querySelectorAll('button[data-action="togglePassword"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const container = e.target.closest('.relative');
      if(!container) return;
      const input = container.querySelector('input[type="password"], input[data-type]') || container.querySelector('input');
      if(!input) return;
      const current = input.getAttribute('type') || 'text';
      if(current === 'password'){
        input.setAttribute('type', 'text');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        input.setAttribute('type', 'password');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  });

  /* Home page chat logic */
  const chatInput = document.querySelector('#chat-input');
  const sendBtn = document.querySelector('#chat-send');
  const messagesWrap = document.querySelector('#messages-wrap');

  function appendMessage(text, who='user'){
    if(!messagesWrap) return;
    const el = document.createElement('div');
    el.className = 'message ' + (who==='user' ? 'user' : 'bot');
    el.innerText = text;
    const wrapper = document.createElement('div');
    wrapper.className = 'flex '+ (who==='user' ? 'justify-end' : 'justify-start');
    wrapper.appendChild(el);
    messagesWrap.appendChild(wrapper);
    messagesWrap.scrollTop = messagesWrap.scrollHeight;
    // if bot message, add an inline save button so users can easily save a pasal/answer
    if(who === 'bot'){
      const saveBtn = document.createElement('button');
      saveBtn.className = 'ml-3 text-xs text-gray-400 hover:text-blue-300';
      saveBtn.innerText = 'Simpan';
      saveBtn.title = 'Simpan jawaban ini ke tersimpan';
      saveBtn.addEventListener('click', ()=>{
        const item = { id: generateId(), title: text.split('\n')[0].slice(0,80) || 'Pasal', content: text, createdAt: Date.now() };
        addSaved(item);
        if(typeof renderSavedList === 'function') renderSavedList();
        saveBtn.innerText = 'Tersimpan';
        saveBtn.disabled = true;
      });
      el.appendChild(saveBtn);
    }

    // add to history (both user & bot)
    addToHistory({ who, text, ts: Date.now() });
    return el;
  }

  function showTypingIndicator(){
    if(!messagesWrap) return null;
    const dotWrap = document.createElement('div');
    dotWrap.className = 'typing-dots card-enter';
    dotWrap.innerHTML = '<span></span><span></span><span></span>';
    const wrapper = document.createElement('div');
    wrapper.className = 'flex justify-start';
    wrapper.appendChild(dotWrap);
    messagesWrap.appendChild(wrapper);
    messagesWrap.scrollTop = messagesWrap.scrollHeight;
    return wrapper;
  }

  function removeTypingIndicator(el){ if(el && el.parentNode) el.parentNode.removeChild(el); }

  function handleSend(){
    const text = chatInput?.value.trim();
    if(!text) return;
    appendMessage(text, 'user');
    chatInput.value = '';

    // show typing
    const typing = showTypingIndicator();

    // dummy server processing
    setTimeout(()=>{
      // remove typing and show bot reply
      removeTypingIndicator(typing);
      const reply = generateDummyReply(text);
      appendMessage(reply, 'bot');
    }, 900 + Math.random()*900);
  }

  if(sendBtn){
    sendBtn.addEventListener('click', handleSend);
  }

  if(chatInput){
    chatInput.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        handleSend();
      }
    });
  }

  /* Dummy reply generator for a bit of fun */
  function generateDummyReply(userText){
    // simple keywords or fallback
    const l = userText.toLowerCase();
    if(l.includes('aturan') || l.includes('hukum') || l.includes('peraturan')){
      return 'Baik. Saya menemukan beberapa referensi hukum terkait — (contoh) Pasal 1 ayat 2 UU X.';
    }
    if(l.includes('halo') || l.includes('hai') || l.includes('halo advokita')){
      return 'Halo! Senang membantu. Silakan jelaskan pertanyaan Anda.';
    }
    if(l.length < 10) return 'Bisa beri sedikit lebih banyak konteks agar saya bisa membantu?';
    return 'Terima kasih, saya sedang memproses. Berikut jawaban contoh: silakan cek ringkasan di hasil pencarian.';
  }

  /* small enhancement: animate elements marked with .card-enter already in CSS */
  document.querySelectorAll('.card-enter').forEach((el,i)=>{ el.style.animationDelay = (i*30)+'ms'; });

  /* small keyboard shortcut: press / to focus chat input (like many chat apps) */
  window.addEventListener('keydown', (e)=>{ if(e.key === '/') { const c = document.querySelector('#chat-input'); if(c){ c.focus(); e.preventDefault(); } } });

  /* --- Saved page helpers: view details and remove saved items --- */
  document.querySelectorAll('.view-detail').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const card = e.target.closest('div.bg-gray-800');
      if(!card) alert('Detail: belum tersedia');
      else {
        const title = card.querySelector('h2')?.innerText || 'Detail Pasal';
        const text = card.querySelector('p')?.innerText || 'Konten tidak tersedia.';
        alert(title + '\n\n' + text);
      }
    });
  });

  document.querySelectorAll('.remove-saved').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const card = e.target.closest('div.bg-gray-800');
      if(!card) return;
      if(confirm('Yakin ingin menghapus item ini dari tersimpan?')){
        card.parentNode && card.parentNode.removeChild(card);
      }
    });
  });

  /* --- Global simple localStorage helpers & Saved page renderer --- */
  function readSaved(){
    try { return JSON.parse(localStorage.getItem('advokita_saved') || '[]'); } catch(e){ return []; }
  }
  function writeSaved(data){ localStorage.setItem('advokita_saved', JSON.stringify(data)); }

  function addSaved(item){ const list = readSaved(); list.unshift(item); writeSaved(list); return list; }
  function removeSavedById(id){ const list = readSaved().filter(s => s.id !== id); writeSaved(list); return list; }

  function renderSavedList(){
    const container = document.getElementById('saved-list');
    if(!container) return;
    const list = readSaved();
    container.innerHTML = '';
    if(list.length === 0){
      container.innerHTML = '<div class="empty-state text-center text-gray-300">Belum ada pasal tersimpan.</div>';
      return;
    }
    list.forEach(item => {
      const el = document.createElement('div');
      el.className = 'bg-gray-800 p-4 rounded-xl shadow-lg card-enter saved-card';
      el.dataset.id = item.id;
      el.innerHTML = `
        <h2 class="text-xl font-bold mb-3">${escapeHtml(item.title)}</h2>
        <p class="text-gray-300 text-sm mb-4">${escapeHtml(item.content)}</p>
        <div class="flex space-x-3">
          <button class="flex-1 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition duration-200 view-detail button-animated">Lihat Detail</button>
          <button class="flex-1 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition duration-200 remove-saved button-animated">Hapus</button>
        </div>
      `;
      container.appendChild(el);
    });

    // re-hook the buttons inside rendered list
    container.querySelectorAll('.view-detail').forEach(btn => {
      btn.addEventListener('click', (e)=>{
        const id = e.target.closest('.saved-card')?.dataset?.id;
        const list = readSaved(); const item = list.find(i => i.id === id);
        if(!item) return alert('Detail: tidak ditemukan');
        alert(item.title + '\n\n' + item.content);
      });
    });
    container.querySelectorAll('.remove-saved').forEach(btn => {
      btn.addEventListener('click', (e)=>{
        const id = e.target.closest('.saved-card')?.dataset?.id; if(!id) return;
        if(confirm('Yakin ingin menghapus item ini dari tersimpan?')){
          removeSavedById(id); renderSavedList();
        }
      });
    });
  }

  // small utility
  function escapeHtml(s){ return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* --- HISTORY storage & rendering --- */
  function readHistory(){ try { return JSON.parse(localStorage.getItem('advokita_history') || '[]'); } catch(e){ return []; } }
  function writeHistory(data){ localStorage.setItem('advokita_history', JSON.stringify(data)); }
  function addToHistory(entry){ const list = readHistory(); list.unshift(entry); writeHistory(list.slice(0,200)); renderHistoryList(); }

  function renderHistoryList(){
    const listEl = document.getElementById('history-list');
    if(!listEl) return;
    const items = readHistory();
    listEl.innerHTML = '';
    if(!items.length){
      listEl.innerHTML = '<li class="text-gray-400">Belum ada riwayat</li>';
      return;
    }
    items.forEach(it => {
      const li = document.createElement('li');
      li.className = 'text-white hover:text-blue-400 cursor-pointer truncate';
      try{
        const dt = new Date(it.ts);
        li.innerText = (it.who==='user' ? 'Anda: ' : '') + (it.text || '').slice(0,60) + (it.text.length>60 ? '...' : '') + ' ('+dt.toLocaleString()+')';
      } catch(e){ li.innerText = (it.text||'') }
      li.addEventListener('click', ()=>{
        // when clicked, show in chat area as full message
        if(messagesWrap){ messagesWrap.innerHTML = ''; appendMessage('Menampilkan riwayat:\n'+it.text, 'bot'); }
      });
      listEl.appendChild(li);
    });
  }

  // wire history rendering on home page if present
  if(document.getElementById('history-list')){
    renderHistoryList();
  }

  /* --- General dropdown (Umum / Presisi) --- */
  const generalBtn = document.getElementById('general-dropdown-btn');
  const generalMenu = document.getElementById('general-dropdown');
  if(generalBtn && generalMenu){
    generalBtn.addEventListener('click', ()=>{
      const isOpen = !generalMenu.classList.contains('hidden');
      generalMenu.classList.toggle('hidden', isOpen);
      generalBtn.setAttribute('aria-expanded', String(!isOpen));
    });
    generalMenu.addEventListener('click', (e)=>{
      const li = e.target.closest('li[data-value]');
      if(!li) return; const v = li.dataset.value; const display = li.innerText || v; document.getElementById('general-selected').innerText = display; localStorage.setItem('advokita_mode', v); generalMenu.classList.add('hidden'); generalBtn.setAttribute('aria-expanded','false');
    });
    document.addEventListener('click', (e)=>{ if(!generalBtn.contains(e.target) && !generalMenu.contains(e.target)){ generalMenu.classList.add('hidden'); generalBtn.setAttribute('aria-expanded','false'); } });
    // initialize
    const selected = localStorage.getItem('advokita_mode') || 'umum';
    const selEl = document.querySelector('#general-dropdown li[data-value="'+selected+'"]');
    if(selEl){ document.getElementById('general-selected').innerText = selEl.innerText; }
  }

  // small helper to generate short ids
  function generateId(){ return String(Date.now()) + '-' + Math.random().toString(36).slice(2,9); }

  /* --- Profile (local) --- */
  function readProfile(){ try { return JSON.parse(localStorage.getItem('advokita_profile') || '{}'); } catch(e){ return {}; } }
  function writeProfile(data){ localStorage.setItem('advokita_profile', JSON.stringify(data)); }

  if(document.getElementById('profile-form')){
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const dobEl = document.getElementById('profile-dob');
    const data = readProfile();
    if(data.name) nameEl.value = data.name;
    if(data.email) emailEl.value = data.email;
    if(data.dob) dobEl.value = data.dob;
    document.getElementById('save-profile').addEventListener('click', ()=>{
      const profile = { name: nameEl.value.trim(), email: emailEl.value.trim(), dob: dobEl.value };
      writeProfile(profile);
      alert('Profil disimpan secara lokal.');
    });
  }

  // If we're on saved page render saved list
  if(document.getElementById('saved-list')){
    renderSavedList();
    // wire simple search on this page
    const savedSearch = document.getElementById('saved-search');
    if(savedSearch){ savedSearch.addEventListener('input', (e)=>{
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#saved-list .saved-card').forEach(card=>{
        const t = (card.innerText || '').toLowerCase(); card.style.display = t.includes(q) ? '' : 'none';
      });
    }); }
  }

  // Sidebar search for history
  const sidebarSearch = document.querySelector('#sidebar input[placeholder*="Telusuri Riwayat"]');
  if(sidebarSearch){
    sidebarSearch.addEventListener('input', (e)=>{
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#sidebar ul li').forEach(li=>{
        li.style.display = (li.innerText || '').toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* --- Home: new conversation action (clear and add starter message) --- */
  const newConv = document.querySelector('.new-convo');
  if(newConv){
    newConv.addEventListener('click', (e)=>{
      e.preventDefault();
      if(messagesWrap){
        messagesWrap.innerHTML = '';
        appendMessage('Halo! Saya Advokita — asisten hukum digital. Coba tanya tentang peraturan, pasal, atau ajukan kasus singkat.', 'bot');
      }
    });
  }

});
