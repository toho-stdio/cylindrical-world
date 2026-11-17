const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let fatalRoot;
export function showFatal(error) {
  if (!fatalRoot) {
    fatalRoot = document.querySelector('[data-fatal]');
    if (!fatalRoot) {
      fatalRoot = document.createElement('section');
      fatalRoot.className = 'fatal-screen';
      fatalRoot.dataset.fatal = '';
      fatalRoot.setAttribute('role', 'alert');
      fatalRoot.setAttribute('aria-live', 'assertive');
      (document.body || document.documentElement).append(fatalRoot);
    }
  }
  const message = error?.message || String(error || 'The world could not be started.');
  fatalRoot.innerHTML = `<div class="fatal-card"><span class="eyebrow">STILLWATER · WORLD INITIALIZATION</span><h1>We couldn’t open the habitat.</h1><p>${esc(message)}</p><p class="fatal-hint">This experience requires a browser with WebGPU enabled. Try a current version of Chrome or Edge on a device with compatible graphics support.</p><button type="button" class="button button-quiet" data-reload>Try again</button></div>`;
  fatalRoot.querySelector('[data-reload]').addEventListener('click', () => location.reload());
  fatalRoot.hidden = false;
}

export function mountUI(api) {
  let root = document.getElementById('stillwater-ui');
  if (!root) {
    root = document.createElement('main');
    root.id = 'stillwater-ui';
    document.body.append(root);
  }
  root.innerHTML = `
    <div class="grain" aria-hidden="true"></div>
    <header class="masthead" aria-label="STILLWATER world information">
      <a class="wordmark" href="#home" aria-label="Stillwater home">STILL<span>WATER</span></a>
      <div class="place-block"><span class="eyebrow">CYLINDRICAL HABITAT · 07</span><span class="place-name" data-region>THE INNER WILDS</span></div>
      <div class="coordinates" data-coordinates>34° 12′ N&nbsp; · &nbsp;RING 03</div>
    </header>
    <section class="intro" data-intro aria-labelledby="intro-title">
      <div class="intro-copy"><span class="eyebrow">A WORLD WITHIN</span><h1 id="intro-title">Somewhere, the<br><em>horizon turns.</em></h1><p>A quiet habitat beneath an endless curve. Wander the riverlands, follow the light, and find your own stillness.</p>
        <div class="intro-actions"><button class="button button-primary" type="button" data-enter>Enter world <span aria-hidden="true">↗</span></button><button class="text-button" type="button" data-guided>Take a guided tour <span aria-hidden="true">→</span></button></div>
      </div><div class="intro-note"><span class="note-rule"></span><span>AN OPEN WORLD<br>AT YOUR OWN PACE</span></div>
    </section>
    <nav class="hud" aria-label="World controls" hidden>
      <div class="hud-top">
        <div class="explore-actions"><button type="button" class="hud-link is-active" data-explore aria-pressed="true">Explore</button><span class="nav-divider"></span><button type="button" class="hud-link" data-tour aria-pressed="false">Guided tour <span class="tour-indicator"></span></button></div>
        <div class="hud-tools"><button type="button" class="icon-button" data-views aria-expanded="false" aria-controls="viewpoints-panel"><span aria-hidden="true">⌖</span> Views</button><button type="button" class="icon-button" data-sound aria-label="Turn sound off" aria-pressed="true"><span class="sound-icon" aria-hidden="true">♫</span><span data-sound-label>Sound on</span></button><button type="button" class="icon-button" data-settings aria-expanded="false" aria-controls="settings-panel"><span aria-hidden="true">☼</span> Settings</button><button type="button" class="icon-button interface-toggle" data-hide-ui aria-label="Hide interface (H)">Hide UI <kbd>H</kbd></button></div>
      </div>
      <div class="viewpoints" id="viewpoints-panel" aria-label="Scenic viewpoints" hidden><span class="eyebrow view-label">PAUSE AT</span>
        <button type="button" class="viewpoint is-selected" data-view="0" aria-pressed="true"><span>01</span> Riverbend</button><button type="button" class="viewpoint" data-view="1" aria-pressed="false"><span>02</span> Orchard</button><button type="button" class="viewpoint" data-view="2" aria-pressed="false"><span>03</span> Old aqueduct</button><button type="button" class="viewpoint" data-view="3" aria-pressed="false"><span>04</span> High meadow</button><button type="button" class="viewpoint" data-view="4" aria-pressed="false"><span>05</span> Hearthside</button><button type="button" class="viewpoint" data-view="5" aria-pressed="false"><span>06</span> The far light</button>
      </div>
      <div class="hud-bottom"><div class="time-readout"><span class="eyebrow">DAYLIGHT</span><div class="day-track" role="progressbar" aria-label="Position from day to night" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-progress></span></div><span data-time-label>DAY</span></div><div class="mode-toggle" role="group" aria-label="Movement mode"><button type="button" data-mode="walk" aria-pressed="false">Walk</button><button type="button" data-mode="fly" aria-pressed="true">Fly</button></div><button type="button" class="keys-button" data-keys aria-expanded="false" aria-controls="keys-panel"><span aria-hidden="true">⌘</span> Controls</button></div>
      <aside class="settings-panel" id="settings-panel" hidden aria-label="World settings"><div class="panel-heading"><div><span class="eyebrow">MAKE IT YOURS</span><h2>World settings</h2></div><button type="button" class="close-button" data-close-settings aria-label="Close settings">×</button></div><label class="select-label" for="preset-select">ATMOSPHERE</label><select id="preset-select" data-presets aria-label="Choose an atmosphere preset"></select><div class="setting-list" data-defs></div><button type="button" class="reset-button" data-reset>Reset to defaults</button></aside>
      <aside class="keys-panel" id="keys-panel" hidden><span class="eyebrow">A FEW WAYS TO WANDER</span><button type="button" class="close-button" data-close-keys aria-label="Close controls">×</button><div class="key-row"><span class="keycap">W</span><span class="keycap">A</span><span class="keycap">S</span><span class="keycap">D</span><span>Move</span></div><div class="key-row"><span class="keycap wide">Mouse</span><span>Look around</span></div><div class="key-row"><span class="keycap">Q</span><span class="keycap">E</span><span>Descend / rise</span></div><div class="key-row"><span class="keycap wide">Shift</span><span>Move a little faster</span></div><p>Click the landscape to capture the pointer for mouse look. Press <span class="keycap">G</span> to switch between walking and flight. <span class="keycap">Esc</span> releases the view and restores the HUD pointer.</p></aside>
      <div class="caption" data-caption aria-live="polite"></div>
    </nav>
    <button class="ui-reveal" type="button" data-show-ui aria-label="Show interface (H)" hidden>Show interface <kbd>H</kbd></button>
    <div class="tour-toast" data-tour-toast hidden><span class="eyebrow">A QUIETER WAY THROUGH</span><span data-tour-caption>Follow the curve of the river.</span><button type="button" data-tour-stop>End tour</button></div>
    <div class="sr-only" data-live aria-live="polite"></div>`;

  const $ = (sel) => root.querySelector(sel);
  const intro = $('[data-intro]'), hud = $('.hud'), settings = $('[data-settings]'), settingsPanel = $('.settings-panel');
  const viewsButton = $('[data-views]'), viewsPanel = $('.viewpoints'), hideUiButton = $('[data-hide-ui]'), showUiButton = $('[data-show-ui]');
  function toggleViews(force) {
    const open = force ?? viewsPanel.hidden;
    viewsPanel.hidden = !open;
    viewsButton.setAttribute('aria-expanded', String(open));
    if (!open && viewsPanel.contains(document.activeElement)) viewsButton.focus();
  }
  function setCaptureMode(hidden) {
    if (hidden) {
      settingsPanel.hidden = true;
      settings.setAttribute('aria-expanded', 'false');
      viewsPanel.hidden = true;
      viewsButton.setAttribute('aria-expanded', 'false');
      const controls = $('.keys-panel'), controlsButton = $('[data-keys]');
      if (controls) controls.hidden = true;
      controlsButton?.setAttribute('aria-expanded', 'false');
      if (root.contains(document.activeElement)) document.activeElement.blur();
    }
    root.classList.toggle('capture-mode', hidden);
    showUiButton.hidden = !hidden;
    if (!hidden) hideUiButton.focus();
  }
  viewsButton.addEventListener('click', () => toggleViews());
  hideUiButton.addEventListener('click', () => setCaptureMode(true));
  showUiButton.addEventListener('click', () => setCaptureMode(false));
  const setValue = (key, value) => { try { api.set(key, value); } catch (e) { console.warn(`Could not set ${key}`, e); } };
  const enter = () => { intro.hidden = true; hud.hidden = false; try { api.enter(); } catch (e) { showFatal(e); } };
  $('[data-enter]').addEventListener('click', enter);
  $('[data-guided]').addEventListener('click', () => { enter(); api.tour(true); });
  $('[data-explore]').addEventListener('click', () => api.tour(false));
  $('[data-tour]').addEventListener('click', () => api.tour());
  $('[data-tour-stop]').addEventListener('click', () => api.tour(false));
  root.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => api.viewpoint(Number(button.dataset.view))));

  const soundButton = $('[data-sound]');
  soundButton.addEventListener('click', () => {
    api.tour(false);
    const enabled = !(api.get?.('audio') ?? api.params?.audio ?? true);
    if (typeof api.setAudioEnabled === 'function') api.setAudioEnabled(enabled);
    else setValue('audio', enabled);
  });
  settings.addEventListener('click', () => { api.tour(false); toggleSettings(); });
  $('[data-close-settings]').addEventListener('click', () => toggleSettings(false));
  function toggleSettings(force) {
    const open = force ?? settingsPanel.hidden;
    settingsPanel.hidden = !open;
    settings.setAttribute('aria-expanded', String(open));
    if (open) settingsPanel.querySelector('select, input, button')?.focus(); else settings.focus();
  }
  const presets = $('[data-presets]');
  presets.innerHTML = `<option value="">Choose a preset…</option>${(api.presets || []).map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join('')}`;
  presets.addEventListener('change', () => { if (presets.value) { api.tour(false); api.preset(presets.value); } });
  $('[data-reset]').addEventListener('click', () => { api.reset(); presets.value = ''; });
  root.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { api.tour(false); api.setMode(button.dataset.mode); }));
  const keysButton = $('[data-keys]'), keysPanel = $('.keys-panel');
  function toggleKeys(force) {
    const open = force ?? keysPanel.hidden;
    keysPanel.hidden = !open;
    keysButton.setAttribute('aria-expanded', String(open));
    if (open) $('[data-close-keys]').focus(); else keysButton.focus();
  }
  keysButton.addEventListener('click', () => { api.tour(false); toggleKeys(); });
  $('[data-close-keys]').addEventListener('click', () => toggleKeys(false));

  const defsHost = $('[data-defs]');
  function buildSettings() {
    defsHost.innerHTML = (api.defs || []).map((def) => {
      const key = esc(def.key), id = `setting-${key}`, label = esc(def.label || def.key);
      if (def.type === 'checkbox') return `<label class="setting-row checkbox-row" for="${id}"><span>${label}</span><input id="${id}" type="checkbox" data-param="${key}"></label>`;
      if (def.type === 'select') return `<label class="setting-row select-row"><span>${label}</span><select id="${id}" data-param="${key}">${(def.options || []).map((o) => `<option value="${esc(typeof o === 'object' ? o.value : o)}">${esc(typeof o === 'object' ? o.label : o)}</option>`).join('')}</select></label>`;
      const min = Number(def.min), max = Number(def.max), step = Number(def.step) || 'any';
      return `<label class="setting-row range-row" for="${id}"><span>${label}</span><output data-output="${key}"></output><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" data-param="${key}"></label>`;
    }).join('');
    defsHost.querySelectorAll('[data-param]').forEach((input) => {
      const apply = () => {
        const def = api.defs.find((d) => d.key === input.dataset.param);
        const value = def?.type === 'checkbox' ? input.checked : def?.type === 'range' ? Number(input.value) : input.value;
        api.tour(false);
        if (input.dataset.param === 'audio' && typeof api.setAudioEnabled === 'function') api.setAudioEnabled(value);
        else setValue(input.dataset.param, value);
      };
      input.addEventListener('input', apply);
      if (input.tagName === 'SELECT') input.addEventListener('change', apply);
    });
    syncSettings();
  }
  function syncSettings() {
    defsHost.querySelectorAll('[data-param]').forEach((input) => {
      const val = api.get?.(input.dataset.param) ?? api.params?.[input.dataset.param];
      if (val === undefined) return;
      if (input.type === 'checkbox') input.checked = Boolean(val); else input.value = String(val);
      const output = defsHost.querySelector(`[data-output="${CSS.escape(input.dataset.param)}"]`);
      if (output) output.value = String(val);
    });
  }
  buildSettings();

  function update(state = {}) {
    if (state.region) $('[data-region]').textContent = state.region;
    if (state.position) $('[data-coordinates]').textContent = `${Number(state.position[0]).toFixed(1)} · ${Number(state.position[2]).toFixed(1)}  /  HABITAT 07`;
    const progress = Math.max(0, Math.min(1, Number(state.progress) || 0));
    $('[data-progress]').style.width = `${progress * 100}%`;
    $('.day-track').setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    $('[data-time-label]').textContent = progress > .72 ? 'DAY' : progress > .32 ? 'DUSK' : 'NIGHT';
    if (state.caption) { $('[data-caption]').textContent = state.caption; $('[data-tour-caption]').textContent = state.caption; }
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    $('[data-tour]').classList.toggle('is-active', !!state.touring);
    $('[data-tour]').setAttribute('aria-pressed', String(!!state.touring));
    $('[data-tour-toast]').hidden = !state.touring;
    if (Number.isInteger(state.viewpoint)) root.querySelectorAll('[data-view]').forEach((b) => {
      const selected = Number(b.dataset.view) === state.viewpoint;
      b.classList.toggle('is-selected', selected); b.setAttribute('aria-pressed', String(selected));
    });
    const audio = api.get?.('audio') ?? api.params?.audio ?? true;
    soundButton.setAttribute('aria-pressed', String(!!audio));
    soundButton.setAttribute('aria-label', api.audioError ? `Sound unavailable: ${api.audioError}` : audio ? 'Turn sound off' : 'Turn sound on');
    $('[data-sound-label]').textContent = api.audioError ? 'Sound unavailable' : audio ? 'Sound on' : 'Sound off';
    soundButton.title = api.audioError || '';
    syncSettings();
    if (state.error) showFatal(state.error);
  }
  const unsubscribe = api.subscribe?.(update);
  update(api.getState?.() || {});
  const onKey = (event) => {
    if (event.key.toLowerCase() === 'h' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest?.('input,select,textarea,[contenteditable="true"]')) {
      setCaptureMode(!root.classList.contains('capture-mode'));
    }
    if (event.key === 'Escape') {
      if (!settingsPanel.hidden) toggleSettings(false);
      else if (!keysPanel.hidden) toggleKeys(false);
      else if (!viewsPanel.hidden) toggleViews(false);
      else if (root.classList.contains('capture-mode')) setCaptureMode(false);
    }
  };
  document.addEventListener('keydown', onKey);
  return () => { unsubscribe?.(); document.removeEventListener('keydown', onKey); root.remove(); };
}
