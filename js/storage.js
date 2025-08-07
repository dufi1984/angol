(function(){
  const KEY = 'tt_modules_v1';
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e){ return null; }
  }
  function save(mods){
    localStorage.setItem(KEY, JSON.stringify(mods));
  }
  function seedIfEmpty(){
    let cur = load();
    if (!cur || cur.length === 0) {
      cur = (window.SEED_MODULES || []);
      save(cur);
    }
    return cur;
  }
  function getAll(){ return seedIfEmpty(); }
  function setEnabled(id, enabled){
    const mods = getAll().map(m => m.id === id ? ({...m, disabled: !enabled}) : m);
    save(mods);
  }
  function remove(id){
    const mods = getAll().filter(m => m.id !== id);
    save(mods);
  }
  function add(mod){
    const mods = getAll();
    const idx = mods.findIndex(m => m.id === mod.id);
    if (idx >= 0) mods[idx] = mod; else mods.push(mod);
    save(mods);
  }
  function exportAll(){
    const data = JSON.stringify(getAll(), null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modules_export.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  window.StorageAPI = { getAll, setEnabled, remove, add, exportAll, save, load, seedIfEmpty };
})();