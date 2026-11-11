/* Borrowed History Journal — Dojo Studios. Everything stays in localStorage. */
(function () {
  'use strict';

  // Set this to the Gumroad URL of the printable journal once it is published.
  var PAPER_URL = '';

  var KEY = 'bhj.entries.v1';
  var PREF = 'bhj.window.v1';
  var SOURCES = {
    deduction: 'Deduction',
    direct: 'Direct experience / intuition',
    borrowed: 'Borrowed history'
  };
  var LIST_SHORT = 8;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* storage */
  var memory = [];
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(valid) : [];
    } catch (e) { return memory; }
  }
  function save(list) {
    memory = list;
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { toast('This browser is not keeping entries. Export before closing.'); return false; }
  }
  function valid(e) {
    return e && typeof e.text === 'string' && e.text.trim() && SOURCES[e.source] && !isNaN(Date.parse(e.at));
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* toast */
  var tt;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('on'); }, 2400);
  }

  /* routing */
  function route() {
    var r = location.hash === '#review' ? 'review' : 'write';
    $('#write').hidden = r !== 'write';
    $('#review').hidden = r !== 'review';
    $$('[data-nav]').forEach(function (a) {
      if (a.dataset.nav === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (r === 'review') renderReview();
    window.scrollTo(0, 0);
  }

  /* compose */
  var chosen = null;
  function syncKeep() { $('#keep').disabled = !(chosen && $('#claim').value.trim()); }
  $('#claim').addEventListener('input', function () {
    $('#count').textContent = this.value.length + ' / 400';
    syncKeep();
  });
  $$('.src').forEach(function (b) {
    b.addEventListener('click', function () {
      chosen = b.dataset.k;
      $$('.src').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      syncKeep();
    });
  });
  $('#compose').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var text = $('#claim').value.trim();
    if (!text || !chosen) return;
    var list = load();
    list.push({ id: uid(), text: text, source: chosen, at: new Date().toISOString() });
    save(list);
    $('#claim').value = ''; $('#count').textContent = '0 / 400';
    chosen = null;
    $$('.src').forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
    syncKeep();
    toast('Set down.');
    location.hash = '#review';
  });

  /* review */
  var win = (function () { try { return localStorage.getItem(PREF) || '30'; } catch (e) { return '30'; } })();
  var showAll = false;
  $$('.window button').forEach(function (b) {
    b.addEventListener('click', function () {
      win = b.dataset.w; showAll = false;
      try { localStorage.setItem(PREF, win); } catch (e) {}
      renderReview();
    });
  });
  $('#more').addEventListener('click', function () { showAll = true; renderReview(); });

  function inWindow(list) {
    if (win === 'all') return list;
    var cut = Date.now() - Number(win) * 864e5;
    return list.filter(function (e) { return Date.parse(e.at) >= cut; });
  }
  function fmt(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  // Largest-remainder rounding so the three always sum to 100.
  function percents(counts, total) {
    var keys = Object.keys(counts), out = {}, rem = [], sum = 0;
    keys.forEach(function (k) {
      var exact = total ? counts[k] * 100 / total : 0;
      out[k] = Math.floor(exact); sum += out[k]; rem.push([k, exact - out[k]]);
    });
    if (total) {
      rem.sort(function (a, b) { return b[1] - a[1]; });
      for (var i = 0; i < 100 - sum; i++) out[rem[i % rem.length][0]]++;
    }
    return out;
  }

  function renderReview() {
    $$('.window button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.w === win)); });
    var all = load();
    var list = inWindow(all).sort(function (a, b) { return Date.parse(b.at) - Date.parse(a.at); });
    var has = list.length > 0;
    $('#has').hidden = !has;
    $('#none').hidden = has;
    $('#none-msg').textContent = all.length && !has ? 'Nothing set down in this window.' : 'Nothing set down yet.';
    if (!has) return;

    var counts = { deduction: 0, direct: 0, borrowed: 0 };
    list.forEach(function (e) { counts[e.source]++; });
    var pct = percents(counts, list.length);
    $$('.bar').forEach(function (bar) {
      var k = bar.dataset.k;
      $('b', bar).textContent = pct[k];
      var fill = $('.fill', bar);
      fill.style.width = '0';
      requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = pct[k] + '%'; }); });
    });
    var span = win === 'all' ? 'in all' : 'in the last ' + win + ' days';
    $('#basis').textContent = 'From ' + list.length + (list.length === 1 ? ' entry ' : ' entries ') + span + '.';

    var ul = $('#list'); ul.textContent = '';
    var shown = showAll ? list : list.slice(0, LIST_SHORT);
    shown.forEach(function (e) {
      var li = document.createElement('li');
      var dot = document.createElement('i'); dot.className = 'dot'; dot.dataset.k = e.source;
      var body = document.createElement('div');
      var txt = document.createElement('div'); txt.className = 'txt'; txt.textContent = e.text;
      var meta = document.createElement('span'); meta.className = 'meta'; meta.textContent = SOURCES[e.source] + ' · ' + fmt(e.at);
      body.appendChild(txt); body.appendChild(meta);
      var x = document.createElement('button'); x.className = 'x'; x.type = 'button'; x.textContent = '×';
      x.setAttribute('aria-label', 'Remove this entry');
      x.addEventListener('click', function () {
        if (!confirm('Remove this entry?')) return;
        save(load().filter(function (y) { return y.id !== e.id; }));
        renderReview();
      });
      li.appendChild(dot); li.appendChild(body); li.appendChild(x);
      ul.appendChild(li);
    });
    $('#more').hidden = showAll || list.length <= LIST_SHORT;
  }

  /* export / import */
  function stamp() { return new Date().toISOString().slice(0, 10); }
  function download(name, type, data) {
    var blob = new Blob([data], { type: type });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  $('#exp-json').addEventListener('click', function () {
    var list = load();
    if (!list.length) return toast('Nothing to export yet.');
    download('borrowed-history-' + stamp() + '.json', 'application/json',
      JSON.stringify({ app: 'Borrowed History Journal', version: 1, exported: new Date().toISOString(), entries: list }, null, 2));
  });
  $('#exp-txt').addEventListener('click', function () {
    var list = load().sort(function (a, b) { return Date.parse(a.at) - Date.parse(b.at); });
    if (!list.length) return toast('Nothing to export yet.');
    var c = { deduction: 0, direct: 0, borrowed: 0 };
    list.forEach(function (e) { c[e.source]++; });
    var p = percents(c, list.length);
    var lines = ['BORROWED HISTORY JOURNAL', 'Exported ' + new Date().toLocaleString(), '',
      'Deduction ' + p.deduction + '%  ·  Direct experience ' + p.direct + '%  ·  Borrowed history ' + p.borrowed + '%  (' + list.length + ' entries)', ''];
    list.forEach(function (e) {
      lines.push(new Date(e.at).toLocaleString() + '  [' + SOURCES[e.source] + ']');
      lines.push(e.text); lines.push('');
    });
    download('borrowed-history-' + stamp() + '.txt', 'text/plain;charset=utf-8', lines.join('\n'));
  });
  $('#imp').addEventListener('click', function () { $('#imp-file').click(); });
  $('#imp-file').addEventListener('change', function () {
    var f = this.files && this.files[0]; this.value = '';
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(r.result);
        var incoming = (Array.isArray(data) ? data : data.entries || []).filter(valid);
        if (!incoming.length) return toast('No entries found in that file.');
        var list = load(), seen = {};
        list.forEach(function (e) { seen[e.id || (e.at + e.text)] = 1; });
        var added = 0;
        incoming.forEach(function (e) {
          var k = e.id || (e.at + e.text);
          if (seen[k]) return;
          seen[k] = 1; added++;
          list.push({ id: e.id || uid(), text: String(e.text).slice(0, 400), source: e.source, at: new Date(e.at).toISOString() });
        });
        save(list); renderReview();
        toast(added ? 'Restored ' + added + (added === 1 ? ' entry.' : ' entries.') : 'Those entries are already here.');
      } catch (e) { toast('That file could not be read.'); }
    };
    r.readAsText(f);
  });
  $('#wipe').addEventListener('click', function () {
    if (!load().length) return toast('Already empty.');
    if (!confirm('Clear every entry on this device? Export first if you want a copy. This cannot be undone.')) return;
    save([]); renderReview(); toast('Cleared.');
  });

  /* paper card */
  if (PAPER_URL) { var pc = $('#paper'); pc.href = PAPER_URL; pc.hidden = false; }

  window.addEventListener('hashchange', route);
  route();

  /* offline */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
