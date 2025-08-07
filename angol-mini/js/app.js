(function(){
  const listEl = document.getElementById('moduleList');
  const lessonArea = document.getElementById('lessonArea');
  const lessonTitle = document.getElementById('lessonTitle');
  const lessonContent = document.getElementById('lessonContent');
  const backBtn = document.getElementById('backBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  let currentModule = null;
  let idx = 0;

  function renderModules(){
    const mods = (window.StorageAPI.getAll() || []).filter(m => !m.disabled);
    listEl.innerHTML = '';
    mods.forEach(m => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = \`
        <div class="title">\${m.title}</div>
        <div class="desc">\${m.description || ''}</div>
        <div class="tags">\${(m.tags||[]).map(t=>'<span class="tag">'+t+'</span>').join('')}</div>
        <div style="margin-top:12px">
          <button class="primary">Indítás</button>
        </div>\`;
      card.querySelector('button').addEventListener('click', () => startModule(m));
      listEl.appendChild(card);
    });
  }

  function startModule(mod){
    currentModule = mod;
    idx = 0;
    document.querySelector('section').classList.add('hidden');
    lessonArea.classList.remove('hidden');
    renderLesson();
  }

  function renderLesson(){
    const step = currentModule.lessons[idx];
    lessonTitle.textContent = step.title || currentModule.title;
    lessonContent.innerHTML = '';

    if (step.type === 'read'){
      const card = document.createElement('div');
      card.className = 'quiz-card';
      card.innerHTML = step.content;
      lessonContent.appendChild(card);
    }

    if (step.type === 'mcq'){
      const card = document.createElement('div');
      card.className = 'quiz-card';
      const prompt = document.createElement('div');
      prompt.textContent = step.prompt;
      const opts = document.createElement('div');
      opts.className = 'options';
      step.options.forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'option';
        btn.textContent = o;
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const correct = (o === step.answer);
          btn.classList.add(correct ? 'correct' : 'wrong');
          if (!correct) {
            Array.from(opts.children).forEach(b => {
              if (b.textContent === step.answer) b.classList.add('correct');
            });
          }
          const explain = document.createElement('div');
          explain.className = 'explain';
          explain.textContent = step.explain || '';
          card.appendChild(explain);
          Array.from(opts.children).forEach(b => b.disabled = true);
        });
        opts.appendChild(btn);
      });
      card.appendChild(prompt);
      card.appendChild(opts);
      lessonContent.appendChild(card);
    }

    if (step.type === 'fill'){
      const card = document.createElement('div');
      card.className = 'quiz-card';
      const prompt = document.createElement('div');
      prompt.textContent = step.prompt;
      const input = document.createElement('input');
      input.className = 'input fill-input';
      input.placeholder = step.placeholder || '';
      const check = document.createElement('button');
      check.textContent = 'Ellenőrzés';
      check.className = 'primary';
      const feedback = document.createElement('div');
      feedback.className = 'feedback';
      check.addEventListener('click', () => {
        const val = (input.value || '').trim();
        if (!val) return;
        if (val.toLowerCase() === String(step.answer).toLowerCase()) {
          feedback.textContent = '✅ Helyes!';
        } else {
          feedback.textContent = '❌ Nem ez. Helyes válasz: ' + step.answer + '. ' + (step.explain || '');
        }
      });
      card.appendChild(prompt);
      card.appendChild(input);
      card.appendChild(check);
      card.appendChild(feedback);
      lessonContent.appendChild(card);
    }

    prevBtn.disabled = (idx === 0);
    nextBtn.textContent = (idx === currentModule.lessons.length - 1) ? 'Befejezés' : 'Tovább';
  }

  backBtn?.addEventListener('click', () => {
    lessonArea.classList.add('hidden');
    document.querySelector('section').classList.remove('hidden');
    renderModules();
  });

  prevBtn?.addEventListener('click', () => {
    if (idx > 0) { idx--; renderLesson(); }
  });
  nextBtn?.addEventListener('click', () => {
    if (!currentModule) return;
    if (idx < currentModule.lessons.length - 1) { idx++; renderLesson(); }
    else {
      // End of module
      alert('Szép munka! Modul befejezve.');
      backBtn.click();
    }
  });

  renderModules();
})();