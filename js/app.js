(function () {
  // Elems
  var selectEl = document.getElementById('moduleSelect');
  var startBtn = document.getElementById('startBtn');
  var titleMeta = document.getElementById('moduleTitle');
  var descMeta = document.getElementById('moduleDesc');
  var tagsMeta = document.getElementById('moduleTags');

  var chooser = document.getElementById('chooser');
  var lessonArea = document.getElementById('lessonArea');
  var lessonTitle = document.getElementById('lessonTitle');
  var lessonContent = document.getElementById('lessonContent');
  var backBtn = document.getElementById('backBtn');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');

  var currentModule = null;
  var idx = 0;

  function getMods() {
    var all = window.StorageAPI.getAll() || [];
    // csak az engedélyezettek
    var enabled = [];
    for (var i = 0; i < all.length; i++) {
      if (!all[i].disabled) enabled.push(all[i]);
    }
    return enabled;
  }

  function populateSelect() {
    var mods = getMods();
    selectEl.innerHTML = '';
    if (mods.length === 0) {
      var opt0 = document.createElement('option');
      opt0.text = 'Nincs modul – menj a Modulkezelőbe';
      opt0.value = '';
      selectEl.appendChild(opt0);
      updateMeta(null);
      return;
    }
    for (var i = 0; i < mods.length; i++) {
      var opt = document.createElement('option');
      opt.value = mods[i].id;
      opt.text = mods[i].title;
      selectEl.appendChild(opt);
    }
    updateMeta(mods[0]);
  }

  function findModById(id) {
    var mods = getMods();
    for (var i = 0; i < mods.length; i++) if (mods[i].id === id) return mods[i];
    return null;
  }

  function updateMeta(mod) {
    if (!mod) {
      titleMeta.textContent = '–';
      descMeta.textContent = 'Válassz a listából egy modult.';
      tagsMeta.innerHTML = '';
      return;
    }
    titleMeta.textContent = mod.title || 'Ismeretlen modul';
    descMeta.textContent = mod.description || '';
    tagsMeta.innerHTML = '';
    if (mod.tags && mod.tags.length) {
      for (var i = 0; i < mod.tags.length; i++) {
        var span = document.createElement('span');
        span.className = 'tag';
        span.textContent = mod.tags[i];
        tagsMeta.appendChild(span);
      }
    }
  }

  selectEl.addEventListener('change', function () {
    var mod = findModById(selectEl.value);
    updateMeta(mod);
  });

  startBtn.addEventListener('click', function () {
    var mod = findModById(selectEl.value);
    if (!mod) return alert('Előbb válassz modult.');
    startModule(mod);
  });

  function startModule(mod) {
    currentModule = mod;
    idx = 0;
    chooser.classList.add('hidden');
    lessonArea.classList.remove('hidden');
    renderLesson();
  }

  function renderLesson() {
    var step = currentModule.lessons[idx];
    lessonTitle.textContent = step.title || currentModule.title;
    lessonContent.innerHTML = '';

    if (step.type === 'read') {
      var card = document.createElement('div');
      card.className = 'quiz-card';
      card.innerHTML = step.content || '';
      lessonContent.appendChild(card);
    }

    if (step.type === 'mcq') {
      var card2 = document.createElement('div');
      card2.className = 'quiz-card';
      var prompt = document.createElement('div');
      prompt.textContent = step.prompt || '';
      var opts = document.createElement('div');
      opts.className = 'options';
      for (var i = 0; i < step.options.length; i++) {
        (function (o) {
          var btn = document.createElement('button');
          btn.className = 'option';
          btn.textContent = o;
          btn.addEventListener('click', function () {
            if (btn.disabled) return;
            var correct = (o === step.answer);
            btn.classList.add(correct ? 'correct' : 'wrong');
            if (!correct) {
              var children = opts.children;
              for (var j = 0; j < children.length; j++) {
                if (children[j].textContent === step.answer) {
                  children[j].classList.add('correct');
                }
              }
            }
            var explain = document.createElement('div');
            explain.className = 'explain';
            explain.textContent = step.explain || '';
            card2.appendChild(explain);
            var kids = opts.children;
            for (var k = 0; k < kids.length; k++) kids[k].disabled = true;
          });
          opts.appendChild(btn);
        })(step.options[i]);
      }
      card2.appendChild(prompt);
      card2.appendChild(opts);
      lessonContent.appendChild(card2);
    }

    if (step.type === 'fill') {
      var card3 = document.createElement('div');
      card3.className = 'quiz-card';
      var prompt2 = document.createElement('div');
      prompt2.textContent = step.prompt || '';
      var input = document.createElement('input');
      input.className = 'input fill-input';
      input.placeholder = step.placeholder || '';
      var check = document.createElement('button');
      check.textContent = 'Ellenőrzés';
      check.className = 'primary';
      var feedback = document.createElement('div');
      feedback.className = 'feedback';
      check.addEventListener('click', function () {
        var val = (input.value || '').trim().toLowerCase();
        var ans = String(step.answer || '').toLowerCase();
        if (!val) return;
        feedback.textContent = (val === ans) ? '✅ Helyes!' :
          ('❌ Nem ez. Helyes válasz: ' + step.answer + (step.explain ? ('. ' + step.explain) : ''));
      });
      card3.appendChild(prompt2);
      card3.appendChild(input);
      card3.appendChild(check);
      card3.appendChild(feedback);
      lessonContent.appendChild(card3);
    }

    prevBtn.disabled = (idx === 0);
    nextBtn.textContent = (idx === currentModule.lessons.length - 1) ? 'Befejezés' : 'Tovább';
  }

  backBtn.addEventListener('click', function () {
    lessonArea.classList.add('hidden');
    chooser.classList.remove('hidden');
    populateSelect();
  });

  prevBtn.addEventListener('click', function () {
    if (idx > 0) { idx -= 1; renderLesson(); }
  });

  nextBtn.addEventListener('click', function () {
    if (!currentModule) return;
    if (idx < currentModule.lessons.length - 1) { idx += 1; renderLesson(); }
    else { alert('Szép munka! Modul befejezve.'); backBtn.click(); }
  });

  // indulás
  populateSelect();
})();
