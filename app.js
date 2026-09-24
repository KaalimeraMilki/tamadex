import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const state = { user:null, profile:null, catalog:[], collection:new Map(), friendships:[], challenges:[], dexFilter:'all', dexGroup:'all' };

function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),2600)}
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function pct(a,b){return b?Math.round(a/b*100):0}
function editionLabel(v){return v==='uni'?'Uni':'Paradise'}
function placeholderEmoji(t){return t.edition==='paradise'?'🌱':'🥚'}

const WIKI_API='https://tamagotchi.fandom.com/api.php';
const WIKI_PAGE='https://tamagotchi.fandom.com/wiki/';
const imageCache=new Map();
let imageObserver=null;
function wikiTitle(t){
  const aliases={'Azaratchi':'Azaratchi (2026)'};
  return aliases[t.name]||t.name;
}
function wikiPageUrl(t){return WIKI_PAGE+encodeURIComponent(wikiTitle(t).replaceAll(' ','_'))}
function imagePlaceholder(t){return `<span class="placeholder-icon">${placeholderEmoji(t)}</span><span class="image-loading">image…</span>`}
async function resolveWikiImage(t){
  if(t.image_url)return t.image_url;
  const key=`${t.edition}:${t.name}`;
  if(imageCache.has(key))return imageCache.get(key);
  const stored=localStorage.getItem(`tamadex-img:${key}`);
  if(stored){const v=stored==='-'?null:stored;imageCache.set(key,v);return v}
  try{
    const params=new URLSearchParams({action:'query',prop:'pageimages',titles:wikiTitle(t),pithumbsize:'500',format:'json',origin:'*'});
    const r=await fetch(`${WIKI_API}?${params}`);
    if(!r.ok)throw new Error(`wiki ${r.status}`);
    const json=await r.json();
    const page=Object.values(json?.query?.pages||{})[0];
    const url=page?.thumbnail?.source||null;
    imageCache.set(key,url);localStorage.setItem(`tamadex-img:${key}`,url||'-');return url;
  }catch(err){console.warn('Image Wiki indisponible',t.name,err);imageCache.set(key,null);return null}
}
function observeWikiImages(root=document){
  imageObserver?.disconnect();
  imageObserver=new IntersectionObserver(entries=>entries.forEach(async entry=>{
    if(!entry.isIntersecting)return;
    imageObserver.unobserve(entry.target);
    const id=entry.target.dataset.imageTama;
    const t=state.catalog.find(x=>x.id===id);if(!t)return;
    const url=await resolveWikiImage(t);
    if(url){entry.target.innerHTML=`<img src="${escapeHtml(url)}" alt="${escapeHtml(t.name)}" loading="lazy" referrerpolicy="no-referrer">`;entry.target.classList.add('has-image')}
    else{entry.target.querySelector('.image-loading')?.remove()}
  }),{rootMargin:'220px'});
  root.querySelectorAll('[data-image-tama]').forEach(el=>imageObserver.observe(el));
}
function tamaImageMarkup(t,extra=''){return `<div class="tama-image ${extra}" data-image-tama="${t.id}">${t.image_url?`<img src="${escapeHtml(t.image_url)}" alt="${escapeHtml(t.name)}">`:imagePlaceholder(t)}</div>`}
function groupLabel(t){return t.dlc||t.world||'Base'}
function groupOptions(){
  let base=state.catalog;
  if(state.dexFilter==='uni'||state.dexFilter==='paradise')base=base.filter(t=>t.edition===state.dexFilter);
  const values=[...new Set(base.map(groupLabel).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
  const select=$('#dex-group');
  select.innerHTML='<option value="all">Toutes les zones / tickets</option>'+values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  if(values.includes(state.dexGroup))select.value=state.dexGroup;else{state.dexGroup='all';select.value='all'}
}

function switchAuth(mode){const login=mode==='login';$('#login-form').classList.toggle('hidden',!login);$('#signup-form').classList.toggle('hidden',login);$('#show-login').classList.toggle('active',login);$('#show-signup').classList.toggle('active',!login)}
$('#show-login').onclick=()=>switchAuth('login');$('#show-signup').onclick=()=>switchAuth('signup');

$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const {error}=await supabase.auth.signInWithPassword({email:$('#login-email').value.trim(),password:$('#login-password').value});if(error)return toast(error.message);toast('Connexion réussie ✨')});
$('#signup-form').addEventListener('submit',async e=>{e.preventDefault();const {data,error}=await supabase.auth.signUp({email:$('#signup-email').value.trim(),password:$('#signup-password').value,options:{data:{display_name:$('#signup-name').value.trim()}}});if(error)return toast(error.message);if(!data.session)toast('Compte créé. Vérifie ton email pour confirmer ton inscription.');else toast('Bienvenue dans TamaDex ✨')});
$('#logout-btn').onclick=()=>supabase.auth.signOut();

async function loadProfile(){const {data,error}=await supabase.from('profiles').select('*').eq('id',state.user.id).single();if(error){console.error(error);return}state.profile=data;$('#welcome-name').textContent=data.display_name||data.username||'Collectionneuse';$('#profile-display').textContent=data.display_name||data.username||'Mon profil';$('#profile-email').textContent=state.user.email||'';$('#profile-username').value=data.username||'';$('#profile-name').value=data.display_name||'';$('#profile-bio').value=data.bio||'';$('#profile-public').checked=!!data.collection_public}
async function loadCatalog(){const {data,error}=await supabase.from('tamagotchis').select('*').order('edition').order('name');if(error){console.error(error);toast('Impossible de charger le catalogue.');return}state.catalog=data||[]}
async function loadCollection(){const {data,error}=await supabase.from('user_tamagotchis').select('*').eq('user_id',state.user.id);if(error){console.error(error);return}state.collection=new Map((data||[]).map(x=>[x.tamagotchi_id,x]))}
async function loadFriendships(){const {data,error}=await supabase.from('friendships').select('*, requester:profiles!friendships_requester_id_fkey(id,username,display_name), addressee:profiles!friendships_addressee_id_fkey(id,username,display_name)').or(`requester_id.eq.${state.user.id},addressee_id.eq.${state.user.id}`).order('created_at',{ascending:false});if(error){console.error(error);return}state.friendships=data||[]}
async function loadChallenges(){const {data,error}=await supabase.from('challenges').select('*, target:tamagotchis(name,edition), challenge_participants(user_id,status,progress,completed_at)').order('created_at',{ascending:false});if(error){console.error(error);return}state.challenges=data||[]}

function renderStats(){for(const ed of ['uni','paradise']){const all=state.catalog.filter(t=>t.edition===ed);const owned=all.filter(t=>state.collection.get(t.id)?.obtained);$(`#${ed}-count`).textContent=`${owned.length} / ${all.length}`;$(`#${ed}-percent`).textContent=`${pct(owned.length,all.length)} %`}}
function renderTargets(){const list=state.catalog.filter(t=>state.collection.get(t.id)?.target).slice(0,4);const el=$('#targets-list');if(!list.length){el.className='card-list empty-state';el.textContent='Aucun objectif pour le moment.';return}el.className='card-list';el.innerHTML=list.map(t=>`<button class="list-card" data-tama="${t.id}">${tamaImageMarkup(t,'mini-tama-image')}<div class="grow"><h3>${escapeHtml(t.name)}</h3><p>${editionLabel(t.edition)} · ${escapeHtml(groupLabel(t))}</p></div><span>🎯</span></button>`).join('');observeWikiImages(el)}
function renderDex(){
  const q=$('#dex-search').value.trim().toLowerCase();
  let rows=state.catalog.filter(t=>!q||[t.name,t.family,t.world,t.dlc].filter(Boolean).join(' ').toLowerCase().includes(q));
  if(state.dexFilter==='uni'||state.dexFilter==='paradise')rows=rows.filter(t=>t.edition===state.dexFilter);
  if(state.dexFilter==='owned')rows=rows.filter(t=>state.collection.get(t.id)?.obtained);
  if(state.dexFilter==='target')rows=rows.filter(t=>state.collection.get(t.id)?.target);
  if(state.dexGroup!=='all')rows=rows.filter(t=>groupLabel(t)===state.dexGroup);
  $('#dex-result-count').textContent=`${rows.length} personnage${rows.length>1?'s':''}`;
  const el=$('#dex-grid');
  if(!rows.length){el.innerHTML=`<div class="panel" style="grid-column:1/-1;text-align:center"><div style="font-size:42px">🥚</div><h2>Aucun résultat</h2><p class="muted">Essaie un autre filtre.</p></div>`;return}
  el.innerHTML=rows.map(t=>{const c=state.collection.get(t.id);return `<button class="tama-card ${c?.obtained?'owned':''} ${c?.target?'target':''}" data-tama="${t.id}"><span class="status-dot">${c?.obtained?'✅':c?.target?'🎯':'○'}</span>${tamaImageMarkup(t)}<div class="card-copy"><h3>${escapeHtml(t.name)}</h3><span class="badge">${editionLabel(t.edition)}</span><span class="group-name">${escapeHtml(groupLabel(t))}</span></div></button>`}).join('');
  observeWikiImages(el)
}
function renderFriends(){const incoming=state.friendships.filter(f=>f.status==='pending'&&f.addressee_id===state.user.id);const accepted=state.friendships.filter(f=>f.status==='accepted');const req=$('#friend-requests'),friends=$('#friends-list');if(!incoming.length){req.className='card-list empty-state';req.textContent='Aucune demande.'}else{req.className='card-list';req.innerHTML=incoming.map(f=>`<div class="list-card"><div class="grow"><h3>${escapeHtml(f.requester.display_name||f.requester.username||'Collectionneuse')}</h3><p>@${escapeHtml(f.requester.username||'sans-pseudo')}</p></div><div class="mini-actions"><button class="icon-btn" data-friend-accept="${f.id}">✓</button><button class="icon-btn" data-friend-decline="${f.id}">×</button></div></div>`).join('')}if(!accepted.length){friends.className='card-list empty-state';friends.textContent='Ajoute une amie pour commencer.'}else{friends.className='card-list';friends.innerHTML=accepted.map(f=>{const p=f.requester_id===state.user.id?f.addressee:f.requester;return `<div class="list-card"><div style="font-size:30px">👤</div><div class="grow"><h3>${escapeHtml(p.display_name||p.username||'Collectionneuse')}</h3><p>@${escapeHtml(p.username||'sans-pseudo')}</p></div><span>💜</span></div>`}).join('')}}
function challengeCard(c){const progress=(c.challenge_participants||[]).reduce((s,p)=>s+(p.progress||0),0);return `<div class="list-card"><div style="font-size:30px">🏆</div><div class="grow"><h3>${escapeHtml(c.title)}</h3><p>${c.target?.name?`Objectif : ${escapeHtml(c.target.name)}`:c.target_count?`${progress} / ${c.target_count}`:escapeHtml(c.description||'Défi personnalisé')}</p></div><span class="badge">${escapeHtml(c.status)}</span></div>`}
function renderChallenges(){const el=$('#challenges-list');if(!state.challenges.length){el.className='card-list empty-state';el.textContent='Aucun défi pour le moment.'}else{el.className='card-list';el.innerHTML=state.challenges.map(challengeCard).join('')}const active=state.challenges.filter(c=>c.status==='active').slice(0,3),home=$('#home-challenges');if(!active.length){home.className='card-list empty-state';home.textContent='Pas encore de défi actif.'}else{home.className='card-list';home.innerHTML=active.map(challengeCard).join('')}}
function renderAll(){renderStats();renderTargets();groupOptions();renderDex();renderFriends();renderChallenges();fillChallengeTamas()}

async function bootstrap(){await Promise.all([loadProfile(),loadCatalog(),loadCollection(),loadFriendships()]);await loadChallenges();renderAll()}

function nav(page){$$('.page').forEach(x=>x.classList.remove('active'));$(`#page-${page}`).classList.add('active');$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.nav===page));$('#page-title').textContent=({home:'Accueil',dex:'TamaDex',friends:'Amies',challenges:'Défis',profile:'Profil'})[page];window.scrollTo({top:0,behavior:'smooth'})}
document.addEventListener('click',e=>{const n=e.target.closest('[data-nav]');if(n)nav(n.dataset.nav);const t=e.target.closest('[data-tama]');if(t)openTama(t.dataset.tama);const close=e.target.closest('[data-close-dialog]');if(close)document.getElementById(close.dataset.closeDialog).close()});
$('#avatar-button').onclick=()=>nav('profile');
$('#dex-search').oninput=renderDex;$('#dex-group').onchange=()=>{state.dexGroup=$('#dex-group').value;renderDex()};$$('[data-filter]').forEach(b=>b.onclick=()=>{$$('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.dexFilter=b.dataset.filter;state.dexGroup='all';groupOptions();renderDex()});

async function upsertCollection(tamaId,patch){const current=state.collection.get(tamaId)||{user_id:state.user.id,tamagotchi_id:tamaId,obtained:false,favorite:false,target:false};const row={...current,...patch,user_id:state.user.id,tamagotchi_id:tamaId};delete row.id;delete row.created_at;delete row.updated_at;const {data,error}=await supabase.from('user_tamagotchis').upsert(row,{onConflict:'user_id,tamagotchi_id'}).select().single();if(error)return toast(error.message);state.collection.set(tamaId,data);renderAll();openTama(tamaId)}
function openTama(id){
  const t=state.catalog.find(x=>x.id===id);if(!t)return;const c=state.collection.get(id);
  $('#tama-dialog-content').innerHTML=`<div class="tama-detail-head">${tamaImageMarkup(t,'detail-image')}<p class="eyebrow" style="margin-top:14px">${editionLabel(t.edition)} · ${escapeHtml(groupLabel(t))}</p><h2>${escapeHtml(t.name)}</h2><div class="detail-tags">${t.stage?`<span class="badge">${escapeHtml(t.stage)}</span>`:''}${t.family?`<span class="badge soft">${escapeHtml(t.family)}</span>`:''}</div></div><div class="detail-actions"><button id="toggle-owned" class="secondary ${c?.obtained?'active':''}">${c?.obtained?'✅ Obtenu':'○ Je l’ai obtenu'}</button><button id="toggle-target" class="secondary ${c?.target?'active':''}">${c?.target?'🎯 Objectif':'☆ Ajouter aux objectifs'}</button></div>${t.evolution_conditions?`<div class="detail-block obtain"><h3>🧭 Comment l’obtenir</h3><p>${escapeHtml(t.evolution_conditions)}</p></div>`:''}${t.description?`<div class="detail-block"><h3>À propos</h3><p>${escapeHtml(t.description)}</p></div>`:''}<a class="wiki-source" href="${wikiPageUrl(t)}" target="_blank" rel="noopener noreferrer">Voir la fiche source sur Tamagotchi Wiki ↗</a>`;
  $('#tama-dialog').showModal();observeWikiImages($('#tama-dialog-content'));
  $('#toggle-owned').onclick=()=>upsertCollection(id,{obtained:!c?.obtained,first_obtained_at:!c?.obtained?new Date().toISOString().slice(0,10):c?.first_obtained_at||null});
  $('#toggle-target').onclick=()=>upsertCollection(id,{target:!c?.target})
}

$('#profile-form').addEventListener('submit',async e=>{e.preventDefault();const username=$('#profile-username').value.trim()||null;const {data,error}=await supabase.from('profiles').update({username,display_name:$('#profile-name').value.trim(),bio:$('#profile-bio').value.trim(),collection_public:$('#profile-public').checked}).eq('id',state.user.id).select().single();if(error)return toast(error.code==='23505'?'Ce pseudo est déjà utilisé.':error.message);state.profile=data;toast('Profil enregistré ✨');await loadProfile()});

$('#friend-search-btn').onclick=async()=>{const q=$('#friend-search').value.trim();if(!q)return;const {data,error}=await supabase.from('profiles').select('id,username,display_name').neq('id',state.user.id).or(`username.eq.${q},display_name.ilike.%${q}%`).limit(10);if(error)return toast(error.message);$('#friend-results').innerHTML=(data||[]).length?(data||[]).map(p=>`<div class="list-card"><div class="grow"><h3>${escapeHtml(p.display_name||p.username||'Collectionneuse')}</h3><p>@${escapeHtml(p.username||'sans-pseudo')}</p></div><button class="icon-btn" data-add-friend="${p.id}">＋</button></div>`).join(''):'<p class="muted">Aucun profil trouvé.</p>'};
document.addEventListener('click',async e=>{const add=e.target.closest('[data-add-friend]');if(add){const {error}=await supabase.from('friendships').insert({requester_id:state.user.id,addressee_id:add.dataset.addFriend});if(error)return toast(error.code==='23505'?'Demande déjà envoyée.':error.message);toast('Demande envoyée 💜');await loadFriendships();renderFriends()}const accept=e.target.closest('[data-friend-accept]');if(accept){await supabase.from('friendships').update({status:'accepted'}).eq('id',accept.dataset.friendAccept);await loadFriendships();renderFriends()}const decline=e.target.closest('[data-friend-decline]');if(decline){await supabase.from('friendships').update({status:'declined'}).eq('id',decline.dataset.friendDecline);await loadFriendships();renderFriends()}});

function fillChallengeTamas(){const select=$('#challenge-tama');select.innerHTML=state.catalog.map(t=>`<option value="${t.id}">${escapeHtml(t.name)} — ${editionLabel(t.edition)}</option>`).join('')}
$('#new-challenge-btn').onclick=()=>$('#challenge-dialog').showModal();$('#challenge-type').onchange=()=>{const type=$('#challenge-type').value;$('#challenge-tama-wrap').classList.toggle('hidden',type!=='specific_tama');$('#challenge-count-wrap').classList.toggle('hidden',!['collect_count','cooperative_count'].includes(type))};
$('#challenge-form').addEventListener('submit',async e=>{e.preventDefault();const type=$('#challenge-type').value,end=$('#challenge-end').value;const payload={creator_id:state.user.id,title:$('#challenge-title').value.trim(),description:$('#challenge-description').value.trim()||null,challenge_type:type,target_tamagotchi_id:type==='specific_tama'?$('#challenge-tama').value:null,target_count:['collect_count','cooperative_count'].includes(type)?Number($('#challenge-count').value):null,ends_at:end?new Date(`${end}T23:59:59`).toISOString():null};const {data,error}=await supabase.from('challenges').insert(payload).select().single();if(error)return toast(error.message);await supabase.from('challenge_participants').insert({challenge_id:data.id,user_id:state.user.id,status:'accepted'});$('#challenge-dialog').close();e.target.reset();toast('Défi créé 🏆');await loadChallenges();renderChallenges()});

supabase.auth.onAuthStateChange(async(_event,session)=>{state.user=session?.user||null;if(state.user){$('#auth-view').classList.add('hidden');$('#app-view').classList.remove('hidden');await bootstrap()}else{$('#app-view').classList.add('hidden');$('#auth-view').classList.remove('hidden')}});

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error))}
