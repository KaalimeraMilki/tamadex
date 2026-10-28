/* TamaDex V6 image recovery - no Supabase; does not change user data. */
(() => {
  'use strict';
  const API = 'https://tamagotchi.fandom.com/api.php';
  const KEY = 'tamadex-v6-wiki-images-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch {}
  const cache = new Map(Object.entries(saved));
  const pending = new Set();
  const queue = [];
  let busy = false;
  const norm = s => String(s || '').trim().toLocaleLowerCase();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(cache))); } catch {} };
  const escapeAttr = s => String(s || '').replace(/[&"<>]/g, c => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
  const eligible = el => el && el.isConnected && el.matches('.tama') && el.querySelector('h3');
  function apply(card, url) {
    if (!eligible(card) || !url) return;
    const current = card.querySelector('img');
    if (current) return;
    const placeholder = card.querySelector('.placeholder');
    if (!placeholder) return;
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = card.querySelector('h3').textContent.trim();
    img.referrerPolicy = 'no-referrer';
    img.src = url;
    img.onerror = () => { img.replaceWith(placeholder); };
    placeholder.replaceWith(img);
  }
  function updateCards() {
    document.querySelectorAll('.tama').forEach(card => {
      if (!eligible(card) || card.querySelector('img')) return;
      const title = card.querySelector('h3').textContent.trim();
      const key = norm(title);
      const known = cache.get(key);
      if (known) { apply(card, known); return; }
      if (!cache.has(key) && !pending.has(key)) {
        pending.add(key);
        queue.push(title);
      }
    });
    if (queue.length && !busy) void drain();
  }
  async function queryWiki(titles) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', origin: '*',
      prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '320',
      redirects: '1', titles: titles.join('|')
    });
    const response = await fetch(`${API}?${params}`, {mode:'cors'});
    if (!response.ok) throw new Error(`Wiki HTTP ${response.status}`);
    const result = await response.json();
    const mapped = new Map();
    const pages = Object.values(result.query?.pages || {});
    for (const page of pages) {
      if (page.thumbnail?.source) mapped.set(norm(page.title), page.thumbnail.source);
    }
    for (const redirect of result.query?.redirects || []) {
      const url = mapped.get(norm(redirect.to));
      if (url) mapped.set(norm(redirect.from), url);
    }
    for (const normalized of result.query?.normalized || []) {
      const url = mapped.get(norm(normalized.to));
      if (url) mapped.set(norm(normalized.from), url);
    }
    return mapped;
  }
  async function drain() {
    if (busy) return;
    busy = true;
    while (queue.length) {
      const batch = queue.splice(0, 20);
      try {
        const images = await queryWiki(batch);
        for (const title of batch) {
          const key = norm(title);
          cache.set(key, images.get(key) || null);
          pending.delete(key);
        }
        persist();
        document.querySelectorAll('.tama').forEach(card => {
          const title = card.querySelector('h3')?.textContent.trim();
          if (title) apply(card, cache.get(norm(title)));
        });
      } catch (error) {
        console.warn('TamaDex: impossible de récupérer les images du wiki', error);
        for (const title of batch) pending.delete(norm(title));
        // Avoid hammering a wiki when offline, blocked or rate-limited.
        queue.length = 0;
        break;
      }
    }
    busy = false;
  }
  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; updateCards(); });
  }
  const observer = new MutationObserver(schedule);
  const start = () => { observer.observe(document.getElementById('app') || document.body, {childList:true,subtree:true}); schedule(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
