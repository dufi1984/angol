(function () {
  var listEl = document.getElementById('adminList');
  var fileInput = document.getElementById('fileInput');
  var exportBtn = document.getElementById('exportBtn');
  var resetBtn = document.getElementById('resetBtn');

  function getMods() {
    try {
      return (window.StorageAPI && window.StorageAPI.getAll) ? window.StorageAPI.getAll() : [];
    } catch (e) {
      return [];
    }
  }

  function render() {
    var mods = getMods();
    listEl.innerHTML = '';
    for (var i = 0; i < mods.length; i++) {
      (function (m) {
        var row = document.createElement('div');
        row.className = 'card admin-item';
        var tagsHtml = (m.tags || []).map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('');
        row.innerHTML =
          '<div>' +
            '<div class="title">' + (m.title || '') + '</div>' +
            '<div class="desc">' + (m.description || '') + '</div>' +
            '<div class="tags">' + tagsHtml + '</div>' +
          '</div>' +
          '<div class="admin-actions">' +
            '<button class="btn ' + (m.disabled ? 'secondary' : 'ghost') + ' toggle">' + (m.disabled ? 'Engedélyezés' : 'Letiltás') + '</button>' +
            '<button class="btn danger del">Törlés</button>' +
            '<button class="btn ghost dump">Export</button>' +
          '</div>';

        row.querySelector('.toggle').addEventListener('click', function () {
          window.StorageAPI.setEnabled(m.id, m.disabled === true);
          render();
        });

        row.querySelector('.del').addEventListener('click', function () {
          if (confirm('Biztos törlöd?')) {
            window.StorageAPI.remove(m.id);
            render();
          }
        });

        row.querySelector('.dump').addEventListener('click', function () {
          var blob = new Blob([JSON.stringify(m, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = (m.id || 'module') + '.json';
          a.click();
          URL.revokeObjectURL(url);
        });

        listEl.appendChild(row);
      })(mods[i]);
    }
  }

  fileInput && fileInput.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var mod = JSON.parse(reader.result);
        if (!mod.id || !mod.title || !mod.lessons || !mod.lessons.length) throw new Error('Hiányzó mezők (id, title, lessons).');
        window.StorageAPI.add(mod);
        alert('Modul hozzáadva: ' + mod.title);
        render();
      } catch (err) {
        alert('Hibás modul fájl: ' + err.message);
      } finally {
        fileInput.value = '';
      }
    };
    reader.readAsText(file, 'utf-8');
  });

  exportBtn && exportBtn.addEventListener('click', function () {
    window.StorageAPI.exportAll();
  });

  resetBtn && resetBtn.addEventListener('click', function () {
    localStorage.removeItem('tt_modules_v1');
    window.StorageAPI.seedIfEmpty();
    render();
  });

  render();
})();
