// ====== ÁLLAPOT ======
let ALL = [];          // betöltött modul-objektumok
let current = null;    // éppen futó modul
let stepIndex = 0;     // lecke index (EDU: -1)

// ====== ELEMEK ======
const sel    = document.getElementById('moduleSelect');
const start  = document.getElementById('startBtn');
const meta   = document.getElementById('moduleMeta');
const mTitle = document.getElementById('mTitle');
const mDesc  = document.getElementById('mDesc');
const mTags  = document.getElementById('mTags');

const player = document.getElementById('player');
const backBtn= document.getElementById('backBtn');
const prevBtn= document.getElementById('prevBtn');
const nextBtn= document.getElementById('nextBtn');
const lTitle = document.getElementById('lessonTitle');
const lCont  = document.getElementById('lessonContent');

const errBox = document.getElementById('errorBox');

// ====== SEGÉDEK ======
function showError(msg){
  errBox.textContent = msg;
  errBox.classList.remove('hidden');
}
function clearError(){
  errBox.classList.add('hidden');
  errBox.textContent = '';
}
function setMeta(mod){
  if(!mod){ meta.classList.add('hidden'); return; }
  meta.classList.remove('hidden');
  mTitle.textContent = mod.title || mod.id || '(névtelen modul)';
  mDesc.textContent  = mod.description || '';
  mTags.innerHTML    = '';
  (mod.tags || []).forEach(t=>{
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    mTags.appendChild(span);
  });
}
function populate(){
  sel.innerHTML = '';
  if(!ALL.length){
    const o = document.createElement('option');
    o.value=''; o.textContent='Nincs elérhető modul';
    sel.appendChild(o);
    start.disabled = true;
    setMeta(null);
    return;
  }
  start.disabled = false;
  ALL.forEach(m=>{
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = m.title || m.id;
    sel.appendChild(o);
  });
  setMeta(ALL[0]);
}
function findById(id){ return ALL.find(m=>m.id===id) || null; }

// ====== MANIFEST BETÖLTÉS ======
// Várt formátum: { "modules": ["file1.json", "file2.json"] }
async function loadManifestAndModules(){
  clearError();
  try{
    const res = await fetch('modules/manifest.json?cb=' + Date.now());
    if(!res.ok) throw new Error('manifest.json nem tölthető (HTTP ' + res.status + ')');
    const man = await res.json();

    // Formátum ellenőrzés
    let files = [];
    if (man && Array.isArray(man.modules)) {
      files = man.modules.slice();
    } else {
      throw new Error('manifest formátum: { "modules": ["file.json", ...] } szükséges');
    }

    const loaded = [];
    for (const f of files){
      try{
        const r = await fetch('modules/' + f + '?cb=' + Date.now());
        if(!r.ok) { console.warn('Nem tölthető:', f); continue; }
        const mod = await r.json();
        // csak akkor vesszük fel, ha a szerkezet helyes
        if (mod && mod.id && Array.isArray(mod.lessons)) {
          loaded.push(mod);
        } else {
          console.warn('Hibás modul szerkezet (id/lessons hiányzik):', f);
        }
      }catch(e){
        console.warn('Betöltési hiba:', f, e);
      }
    }
    ALL = loaded;
  }catch(e){
    showError('Hiba a modulok betöltésekor: ' + e.message);
    ALL = [];
  }
}

// ====== LEJÁTSZÓ ======
function startModule(mod) {
  current = mod;
  stepIndex = -1; // -1 = EDU (ha van)
  document.querySelector('.module-bar').classList.add('hidden');
  meta.classList.add('hidden');
  player.classList.remove('hidden');
  renderStep();
  player.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderStep() {
  lCont.innerHTML = '';

  // Gombok állapota / felirat
  prevBtn.disabled = (stepIndex <= -1);
  nextBtn.textContent = (stepIndex >= (current.lessons.length - 1)) ? 'Befejezés' : 'Tovább';

  // EDU blokk (ha van és most -1-en állunk)
  if (stepIndex === -1 && current.edu) {
    lTitle.textContent = (current.title || '') + ' – Elméleti rész';
    const eduDiv = document.createElement('div');
    eduDiv.className = 'content';
    // sortöréseket HTML <br>-ré alakítjuk
    eduDiv.innerHTML = String(current.edu).replace(/\n/g, '<br>');
    lCont.appendChild(eduDiv);
    return;
  }

  // Tényleges lépés
  const step = current.lessons[stepIndex];
  lTitle.textContent = step.title || current.title || '';

  if (step.type === 'read'){
    const div = document.createElement('div');
    div.className = 'content';
    div.innerHTML = step.content || '';
    lCont.appendChild(div);
  }

  if (step.type === 'mcq'){
    const wrap = document.createElement('div'); wrap.className='quiz';
    const p = document.createElement('div'); p.className='prompt'; p.textContent = step.prompt || '';
    const optBox = document.createElement('div'); optBox.className='options';
    (step.options || []).forEach(opt=>{
      const b = document.createElement('button'); b.className='btn option'; b.textContent = opt;
      b.onclick = ()=>{
        const ok = (opt === step.answer);
        b.classList.add(ok ? 'ok' : 'wrong');
        // minden opció tiltása katt után
        Array.prototype.forEach.call(optBox.children, x => x.disabled = true);
        if (step.explain) {
          const ex = document.createElement('div'); ex.className='explain'; ex.textContent = step.explain;
          wrap.appendChild(ex);
        }
      };
      optBox.appendChild(b);
    });
    wrap.appendChild(p); wrap.appendChild(optBox); lCont.appendChild(wrap);
  }

  if (step.type === 'fill'){
    const wrap = document.createElement('div'); wrap.className='quiz';
    const p = document.createElement('div'); p.className='prompt'; p.textContent = step.prompt || '';
    const input = document.createElement('input'); input.className='input'; input.placeholder = step.placeholder || '';
    const check = document.createElement('button'); check.className='btn primary'; check.textContent='Ellenőrzés';
    const fb = document.createElement('div'); fb.className='explain';
    check.onclick = ()=>{
      const v = (input.value || '').trim().toLowerCase();
      const a = String(step.answer || '').toLowerCase();
      fb.textContent = (v === a) ? '✅ Helyes!' : ('❌ Helyes válasz: ' + step.answer + (step.explain ? (' — ' + step.explain) : ''));
    };
    wrap.appendChild(p); wrap.appendChild(input); wrap.appendChild(check); wrap.appendChild(fb);
    lCont.appendChild(wrap);
  }
}

// ====== ESEMÉNYKEZELÉS ======
sel.onchange = ()=> setMeta(findById(sel.value));
start.onclick = ()=>{
  const m = findById(sel.value);
  if(!m) return;
  startModule(m);
};
backBtn.onclick = ()=>{
  player.classList.add('hidden');
  document.querySelector('.module-bar').classList.remove('hidden');
  setMeta(findById(sel.value));
  window.scrollTo({top:0, behavior:'smooth'});
};
prevBtn.onclick = ()=>{
  if (stepIndex > -1) { stepIndex--; renderStep(); }
};
nextBtn.onclick = ()=>{
  if (stepIndex < current.lessons.length - 1) {
    stepIndex++; renderStep();
  } else {
    alert('Szép munka! Modul befejezve.');
    backBtn.click();
  }
};

// ====== BOOT ======
(async function(){
  await loadManifestAndModules();
  populate();

  // Opcionális: ?mod=ID automatikus indítás
  const m = /[?&]mod=([^&]+)/.exec(location.search);
  if (m){
    const id = decodeURIComponent(m[1]);
    const mod = findById(id);
    if (mod) { sel.value = id; setMeta(mod); startModule(mod); }
  }
})();
