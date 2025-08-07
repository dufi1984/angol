(function(){
  const listEl = document.getElementById('adminList');
  const fileInput = document.getElementById('fileInput');
  const exportBtn = document.getElementById('exportBtn');
  const resetBtn = document.getElementById('resetBtn');

  function render(){
    const mods = window.StorageAPI.getAll();
    listEl.innerHTML = '';
    mods.forEach(m => {
      const row = document.createElement('div');
      row.className = 'card admin-item';
      row.innerHTML = \'
        <div>
          <div class="title">\${m.title}</div>
          <div class="desc">\${m.description || ''}</div>
          <div class="tags">\${(m.tags||[]).map(t=>'<span class="tag">'+t+'</span>').join('')}</div>
        </div>
        <div class="admin-actions">
          <button class="btn \${m.disabled ? 'secondary' : 'ghost'} toggle">\${m.disabled ? 'Engedélyezés' : 'Letiltás'}</button>
          <button class="btn danger del">Törlés</button>
          <button class="btn ghost dump">Export</button>
        </div>\`;
      row.querySelector('.toggle').addEventListener('click', () => {
        window.StorageAPI.setEnabled(m.id, m.disabled === true);
        render();
      });
      row.querySelector('.del').addEventListener('click', () => {
        if (confirm('Biztos törlöd?')) { window.StorageAPI.remove(m.id); render(); }
      });
      row.querySelector('.dump').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(m, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = m.id + '.json'; a.click();
        URL.revokeObjectURL(url);
      });
      listEl.appendChild(row);
    });
  }

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const mod = JSON.parse(text);
      // minimal schema check
      if (!mod.id || !mod.title || !Array.isArray(mod.lessons)) throw new Error('Hiányzó mezők (id, title, lessons).');
      window.StorageAPI.add(mod);
      alert('Modul hozzáadva: ' + mod.title);
      render();
    } catch(err){
      alert('Hibás modul fájl: ' + err.message);
    } finally {
      e.target.value = '';
    }
  });

  exportBtn?.addEventListener('click', () => window.StorageAPI.exportAll());
  resetBtn?.addEventListener('click', () => {
    localStorage.removeItem('tt_modules_v1');
    window.StorageAPI.seedIfEmpty();
    render();
  });

  render();
})();
