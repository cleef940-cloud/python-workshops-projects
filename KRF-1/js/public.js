// ═══════════════════════════════════════════════
// KRF PUBLIC SITE — public.js v2.0
// SPA · Supabase realtime · Live chat · PDF export
// ═══════════════════════════════════════════════

const CONFIG = {
  SUPABASE_URL:      window.ENV_SUPABASE_URL      || 'https://eseffwgiogcbwnatrssz.supabase.co',
  SUPABASE_ANON_KEY: window.ENV_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZWZmd2dpb2djYnduYXRyc3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzU0NzQsImV4cCI6MjA5MTA1MTQ3NH0.Qvf3AJJD2rr_fVasvB2ntE0_-LIfSiawEWTnQBKIXmg',
};

// ── STATE ──────────────────────────────────────
const STATE = {
  currentPage: 'home',
  teams: [], tournaments: [], matches: [], news: [],
  standings: {}, sponsors: [], settings: {},
  liveMatch: null, galleryPhotos: [], galleryVideos: [],
  activeTournament: null, galleryActiveTab: 'photos',
  chatMessages: [], chatOpen: false,
  polls: [], fanName: localStorage.getItem('krf_fan_name') || null,
};

// ── SUPABASE ───────────────────────────────────
let sb = null;
function initSupabase() {
  if (!window.supabase) { console.warn('Supabase SDK not loaded'); return; }
  try {
    sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    initRealtime();
    loadAll();
  } catch(e) {
    console.error('Supabase init failed:', e);
    showToast('Live data unavailable — check connection');
    renderFallback();
  }
}

// ── REALTIME ───────────────────────────────────
function initRealtime() {
  if (!sb) return;
  sb.channel('public-live')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, payload => {
      const u = payload.new;
      STATE.matches = STATE.matches.map(m => m.id === u.id ? { ...m, ...u } : m);
      if (STATE.liveMatch?.id === u.id) STATE.liveMatch = { ...STATE.liveMatch, ...u };
      updateLiveDisplays(u);
      updateTicker();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_events' }, payload => {
      appendEventFeed(payload.new);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
      appendChatMsg(payload.new);
    })
    .subscribe();
}

// ── LOAD ALL ───────────────────────────────────
async function loadAll() {
  try {
    const [teams, tournaments, matches, news, sponsors, settings] = await Promise.all([
      sbFetch('teams', '*,standings(*)'),
      sbFetch('tournaments', '*,tournament_teams(team:teams(id,name,abbr,color))'),
      sb.from('matches').select('*,home_team:teams!home_team_id(id,name,abbr,color),away_team:teams!away_team_id(id,name,abbr,color),tournament:tournaments(id,name)').order('match_date',{ascending:true}).limit(60).then(r=>r.data),
      sb.from('news').select('*').eq('published',true).order('created_at',{ascending:false}).limit(12).then(r=>r.data),
      sb.from('sponsors').select('*').eq('is_active',true).order('tier').then(r=>r.data),
      sb.from('site_settings').select('*').then(r=>r.data),
    ]);

    if (teams)        STATE.teams        = teams;
    if (tournaments)  STATE.tournaments  = tournaments;
    if (matches)      STATE.matches      = matches;
    if (news)         STATE.news         = news;
    if (sponsors)     STATE.sponsors     = sponsors;
    if (settings)     STATE.settings     = Object.fromEntries((settings||[]).map(s=>[s.key,s.value]));

    // Hero stats
    const [{ count: playerCount }, { count: matchCount }] = await Promise.all([
      sb.from('users').select('*',{count:'exact',head:true}).eq('role','player').eq('is_active',true),
      sb.from('matches').select('*',{count:'exact',head:true}),
    ]);
    setEl('heroTeams',   STATE.teams?.length || 0);
    setEl('heroPlayers', playerCount || 0);
    setEl('heroTours',   STATE.tournaments?.length || 0);
    setEl('heroMatches', matchCount || 0);

    // Active tournament standings
    const active = STATE.tournaments.find(t=>t.status==='ongoing'||t.status==='active');
    if (active) {
      const { data: sData } = await sb.from('standings').select('*,team:teams(id,name,abbr,color)').eq('tournament_id',active.id).order('points',{ascending:false});
      STATE.standings[active.id] = sData || [];
    }

    STATE.liveMatch = STATE.matches?.find(m=>m.status==='live') || null;
    applyHeroBackground();
    initTicker();
    initSponsorTakeover();
    renderPage(STATE.currentPage);
    window.dispatchEvent(new Event('krf-loaded'));
  } catch(e) {
    console.error('loadAll failed:', e);
    showToast('Connection error — some data unavailable');
    renderFallback();
  }
}

function renderFallback() {
  setEl('heroTeams','—'); setEl('heroPlayers','—'); setEl('heroTours','—'); setEl('heroMatches','—');
}

async function sbFetch(table, select = '*') {
  if (!sb) return null;
  let q = sb.from(table).select(select);
  if (table === 'teams' || table === 'tournaments') q = q.order('name');
  const { data, error } = await q;
  if (error) console.warn(`sbFetch ${table}:`, error.message);
  return data;
}

// ── HERO BG ────────────────────────────────────
function applyHeroBackground() {
  const vid = document.getElementById('heroBgVideo');
  const heroImgEl = document.getElementById('heroBg');
  if (STATE.settings.hero_video_url && vid) {
    vid.src = STATE.settings.hero_video_url; vid.load();
  } else if (STATE.settings.hero_image_url) {
    if (heroImgEl) heroImgEl.style.backgroundImage = `url('${STATE.settings.hero_image_url}')`;
    if (vid) vid.style.display = 'none';
  }
}

// ── TICKER ─────────────────────────────────────
function initTicker() {
  const items = [];
  if (STATE.settings.ticker_message) items.push(STATE.settings.ticker_message);
  if (STATE.liveMatch) items.push(`● LIVE: ${STATE.liveMatch.home_team?.name} ${STATE.liveMatch.home_score} — ${STATE.liveMatch.away_score} ${STATE.liveMatch.away_team?.name}`);
  STATE.matches?.filter(m=>m.status==='completed').slice(0,3).forEach(m => items.push(`${m.home_team?.name} ${m.home_score} — ${m.away_score} ${m.away_team?.name} · ${m.tournament?.name}`));
  STATE.matches?.filter(m=>m.status==='upcoming').slice(0,3).forEach(m => {
    const d = m.match_date ? new Date(m.match_date).toLocaleDateString('en-KE',{weekday:'short',day:'numeric',month:'short'}) : 'TBC';
    items.push(`Next: ${m.home_team?.name} vs ${m.away_team?.name} · ${d}`);
  });
  const src = items.length ? items : ['Welcome to Kenya Rollball Federation — Official Site'];
  const el = document.getElementById('tickerInner');
  if (!el) return;
  const doubled = [...src, ...src];
  el.innerHTML = doubled.map(t=>`<span class="ticker-item">${t}<span class="ticker-sep"> | </span></span>`).join('');
}
function updateTicker() { initTicker(); }

// ── NAVIGATION ─────────────────────────────────
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p=>{ p.style.display='none'; p.classList.remove('active'); });
  const el = document.getElementById(id);
  if (el) { el.style.display='block'; el.classList.add('active'); }
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else document.querySelector(`.nav-btn[data-page="${id}"]`)?.classList.add('active');
  window.scrollTo(0,0);
  STATE.currentPage = id;
  if (id !== 'tournaments') deactivateTournamentBg();
  renderPage(id);
  // Close mobile menu
  document.querySelector('.nav-links')?.classList.remove('open');
}

function renderPage(id) {
  const map = { home:renderHome, tournaments:renderTournaments, fixtures:renderFixtures, teams:renderTeams, standings:renderStandings, news:renderNews, gallery:renderGallery };
  map[id]?.();
}

// ── HOME ───────────────────────────────────────
function renderHome() {
  // Tournaments
  const tGrid = document.getElementById('homeTournaments');
  if (tGrid) tGrid.innerHTML = STATE.tournaments.filter(t=>t.status==='ongoing'||t.status==='active').map(tournamentCardHTML).join('') || '<div style="color:var(--dim);font-size:.82rem;padding:1rem">No active tournaments</div>';

  // Mini standings
  const active = STATE.tournaments.find(t=>t.status==='ongoing'||t.status==='active');
  if (active && STATE.standings[active.id]) {
    const sb2 = document.getElementById('homeStandingsBody');
    if (sb2) sb2.innerHTML = STATE.standings[active.id].slice(0,5).map((s,i)=>standingRowHTML(s,i,true)).join('');
  }

  // Results
  const results = document.getElementById('homeResults');
  if (results) {
    const recent = STATE.matches?.filter(m=>m.status==='completed').slice(0,3) || [];
    results.innerHTML = recent.map(matchCardHTML).join('') || '<p style="color:var(--dim);padding:1rem;font-size:.82rem">No recent results</p>';
  }

  updateLiveStrip();

  // News
  const newsEl = document.getElementById('homeNews');
  if (newsEl) renderNewsGrid(newsEl, STATE.news);

  // Sponsors
  const sponsEl = document.getElementById('homeSponsors');
  if (sponsEl) sponsEl.innerHTML = STATE.sponsors.map(s=>`<div class="sponsor-logo ${s.tier}" onclick="window.open('${s.website_url||'#'}','_blank')">${s.logo_url?`<img src="${s.logo_url}" alt="${s.name}" style="max-height:36px;max-width:110px;object-fit:contain">`:s.name}</div>`).join('');
}

function updateLiveStrip() {
  const strip = document.getElementById('liveStrip');
  if (!strip) return;
  if (STATE.liveMatch) {
    const m = STATE.liveMatch;
    strip.style.display = 'block';
    const dh = strip.querySelector('[data-home]'); if (dh) dh.textContent = m.home_team?.name || '';
    const da = strip.querySelector('[data-away]'); if (da) da.textContent = m.away_team?.name || '';
    const ds = strip.querySelector('[data-live-score]'); if (ds) ds.textContent = `${m.home_score} — ${m.away_score}`;
  } else { strip.style.display = 'none'; }
}

function updateLiveDisplays(match) {
  document.querySelectorAll('[data-live-score]').forEach(el=>el.textContent=`${match.home_score} — ${match.away_score}`);
  document.querySelectorAll('[data-live-home]').forEach(el=>el.textContent=match.home_score);
  document.querySelectorAll('[data-live-away]').forEach(el=>el.textContent=match.away_score);
  updateLiveStrip();
}

function appendEventFeed(event) {
  const feed = document.getElementById('liveEventFeed');
  if (!feed) return;
  const icons = { goal:'⚽', yellow:'🟨', red_card:'🟥', foul:'🔴', boundary:'🚩' };
  const div = document.createElement('div');
  div.className = 'ev-feed-item';
  div.style.cssText = 'display:flex;gap:.6rem;padding:.4rem .75rem;font-size:.78rem;border-bottom:1px solid rgba(255,255,255,.04)';
  div.innerHTML = `<span style="font-family:var(--font-m);color:var(--gold);font-size:.65rem">${event.minute}'</span><span>${icons[event.event_type]||'◉'}</span><span style="color:var(--soft)">${event.description||event.event_type}</span>`;
  feed.prepend(div);
}

// ── TOURNAMENTS ────────────────────────────────
function tournamentCardHTML(t) {
  return `<div class="t-card" onclick="openTournament('${t.id}')">
    <div class="t-card-bg" style="background:${t.gradient||'linear-gradient(135deg,#1a0008,#0d0d0d)'}"></div>
    ${t.video_trailer_url?`<div class="t-card-video"><video autoplay muted loop playsinline><source src="${t.video_trailer_url}" type="video/mp4"/></video></div>`:''}
    <div class="t-card-overlay"></div>
    <div class="t-play-hint">▶ Hover for trailer</div>
    <div class="t-card-body">
      <span class="t-status ${t.status}">${t.status==='ongoing'||t.status==='active'?'● Live':t.status==='upcoming'?'Upcoming':'Completed'}</span>
      <h3>${t.name}</h3>
      <div class="t-card-meta">
        <span>${t.max_teams||0} Teams</span>
        <span>${t.venue||'TBC'}</span>
        <span>${t.start_date?new Date(t.start_date).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}):''}</span>
      </div>
    </div>
  </div>`;
}

let tournamentFilter = 'all';
function renderTournaments() {
  const list = tournamentFilter==='all' ? STATE.tournaments : STATE.tournaments.filter(t=>t.status===tournamentFilter);
  const grid = document.getElementById('allTournaments');
  if (grid) grid.innerHTML = list.map(tournamentCardHTML).join('') || '<div style="color:var(--dim);padding:1rem">No tournaments found</div>';
  // Hide detail
  const detail = document.getElementById('tournamentDetail');
  if (detail) detail.style.display = 'none';
}

function filterTournaments(f, btn) {
  tournamentFilter = f;
  document.querySelectorAll('#tournaments .tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTournaments();
}

function openTournament(id) {
  const t = STATE.tournaments.find(x=>x.id===id);
  if (!t) return;
  STATE.activeTournament = t;
  activateTournamentBg(t);
  if (!STATE.standings[t.id] && sb) {
    sb.from('standings').select('*,team:teams(id,name,abbr,color)').eq('tournament_id',t.id).order('points',{ascending:false}).then(({data})=>{ STATE.standings[t.id]=data||[]; renderTournamentDetail(t); });
  } else renderTournamentDetail(t);
  const detail = document.getElementById('tournamentDetail');
  if (detail) { detail.style.display='block'; setTimeout(()=>detail.scrollIntoView({behavior:'smooth',block:'start'}),100); }
}

function renderTournamentDetail(t) {
  const body = document.getElementById('tournamentDetailBody');
  if (!body) return;
  const teams = t.tournament_teams?.map(tt=>tt.team)||[];
  const standings = STATE.standings[t.id]||[];
  body.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
      <div>
        <span class="t-status ${t.status}" style="margin-bottom:.5rem;display:inline-block">${t.status}</span>
        <h2 style="font-family:var(--font-d);font-size:2rem;letter-spacing:2px">${t.name}</h2>
        <p style="color:var(--dim);font-size:.85rem;margin-top:.4rem;max-width:500px;line-height:1.7">${t.description||''}</p>
      </div>
      <div style="display:flex;gap:1.5rem;flex-wrap:wrap">
        ${[['Teams',t.max_teams],['Venue',t.venue],['Season',t.season]].map(([l,v])=>`
          <div style="text-align:center"><div style="font-family:var(--font-d);font-size:1.6rem;color:var(--gold)">${v||'—'}</div><div style="font-size:.6rem;color:var(--dim);text-transform:uppercase;letter-spacing:1px">${l}</div></div>`).join('')}
      </div>
    </div>
    ${standings.length?`
    <h3 style="font-family:var(--font-d);font-size:1rem;letter-spacing:1.5px;margin-bottom:.75rem">STANDINGS</h3>
    <div style="background:var(--bg1);border:1px solid var(--border);border-radius:6px;overflow:hidden;margin-bottom:1.25rem">
      <table class="standings-table"><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
      <tbody>${standings.map((s,i)=>standingRowHTML(s,i,true)).join('')}</tbody></table>
    </div>`:''}
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.5rem">
      <button class="btn-primary" style="font-size:.72rem;padding:.45rem 1rem" onclick="downloadFixturesPDF('${t.id}')">⬇ Download Fixtures PDF</button>
    </div>
    <h3 style="font-family:var(--font-d);font-size:1rem;letter-spacing:1.5px;margin-bottom:.75rem">PARTICIPATING TEAMS</h3>
    <div style="display:flex;flex-wrap:wrap;gap:.4rem">
      ${teams.map(tm=>`<span style="background:${tm.color}22;border:1px solid ${tm.color}44;color:${tm.color};font-size:.7rem;padding:3px 10px;border-radius:2px;cursor:pointer" onclick="openTeamModal('${tm.id}')">${tm.name}</span>`).join('')}
    </div>`;
}

function activateTournamentBg(t) {
  const bg = document.getElementById('tournamentBg');
  const vid = document.getElementById('tBgVideo');
  if (!bg) return;
  if (t.video_trailer_url && vid) { vid.src=t.video_trailer_url; vid.load(); }
  bg.classList.add('active');
}
function deactivateTournamentBg() { document.getElementById('tournamentBg')?.classList.remove('active'); }

// ── FIXTURES ───────────────────────────────────
let fixtureFilter = 'all', fixtureSlideIndex = 0, fixtureSlideTimer = null;

async function renderFixtures() {
  // Slideshow header
  if (sb) {
    const { data: photos } = await sb.from('media').select('*').eq('approved',true).eq('media_type','photo').limit(12);
    const slides = document.getElementById('fhSlides');
    const dots = document.getElementById('fhDots');
    if (slides && photos?.length) {
      slides.innerHTML = photos.map((p,i)=>`<div class="fh-slide" style="position:absolute;inset:0;background:url('${p.file_url}') center/cover no-repeat;opacity:${i===0?1:0};transition:opacity .8s ease"></div>`).join('');
      if (dots) dots.innerHTML = photos.map((_,i)=>`<div class="fh-dot" onclick="goToSlide(${i})" style="width:6px;height:6px;border-radius:50%;background:${i===0?'var(--gold)':'rgba(255,255,255,.35)'};cursor:pointer;transition:background .3s"></div>`).join('');
      clearInterval(fixtureSlideTimer);
      fixtureSlideTimer = setInterval(()=>{ fixtureSlideIndex=(fixtureSlideIndex+1)%photos.length; goToSlide(fixtureSlideIndex); }, 4500);
    }
  }
  const list = fixtureFilter==='all' ? STATE.matches : STATE.matches?.filter(m=>m.status===fixtureFilter);
  const el = document.getElementById('fixturesList');
  if (el) el.innerHTML = (list||[]).map(matchCardHTML).join('') || '<p style="color:var(--dim);padding:1rem">No matches found</p>';
}

function goToSlide(index) {
  document.querySelectorAll('.fh-slide').forEach((s,i)=>{ s.style.opacity=i===index?'1':'0'; });
  document.querySelectorAll('.fh-dot').forEach((d,i)=>{ d.style.background=i===index?'var(--gold)':'rgba(255,255,255,.35)'; });
  fixtureSlideIndex = index;
}
function filterFixtures(f, btn) {
  fixtureFilter = f;
  document.querySelectorAll('#fixtures .tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderFixtures();
}

function matchCardHTML(m) {
  const isLive=m.status==='live', isUp=m.status==='upcoming';
  const date = m.match_date ? new Date(m.match_date).toLocaleDateString('en-KE',{weekday:'short',day:'numeric',month:'short'}) : 'TBC';
  const time = m.match_date ? new Date(m.match_date).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'}) : '';
  return `<div class="fixture-card">
    <div class="fc-top"><span class="fc-tour">${m.tournament?.name||''} · ${m.venue||''}</span><span class="fc-date">${date} ${time}</span></div>
    <div class="fc-main">
      <div class="fc-team home"><div class="fc-team-name" style="color:${m.home_team?.color||'var(--white)'}">${m.home_team?.name||'TBC'}</div></div>
      <div class="fc-score-wrap">
        <div class="fc-score ${isLive?'live':isUp?'vs':''}" ${isLive?'data-live-score':''}>${isUp?'VS':`${m.home_score} — ${m.away_score}`}</div>
        <div class="fc-badge ${m.status}">${isLive?'● LIVE':isUp?time:m.status}</div>
      </div>
      <div class="fc-team away"><div class="fc-team-name" style="color:${m.away_team?.color||'var(--white)'}">${m.away_team?.name||'TBC'}</div></div>
    </div>
  </div>`;
}

// ── PDF EXPORT ─────────────────────────────────
async function downloadFixturesPDF(tournamentId) {
  const tourney = STATE.tournaments.find(t=>t.id===tournamentId);
  const matches = tournamentId
    ? STATE.matches.filter(m=>m.tournament_id===tournamentId||m.tournament?.id===tournamentId)
    : STATE.matches;

  // Build HTML for print
  const html = `
    <html><head><title>KRF Fixtures — ${tourney?.name||'All'}</title>
    <style>
      body{font-family:Arial,sans-serif;color:#111;padding:30px}
      h1{font-size:24px;font-weight:900;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
      .sub{font-size:11px;color:#666;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{text-align:left;padding:8px 10px;background:#111;color:#fff;font-size:10px;letter-spacing:1.5px;text-transform:uppercase}
      td{padding:8px 10px;border-bottom:1px solid #e0e0e0}
      tr:nth-child(even){background:#f8f8f8}
      .live{color:#C8102E;font-weight:700}
      .completed{color:#1a7a3e;font-weight:700}
      .upcoming{color:#888}
      .footer{margin-top:30px;font-size:10px;color:#999;text-align:center}
    </style></head><body>
    <h1>Kenya Rollball Federation</h1>
    <div class="sub">${tourney?.name||'All Fixtures'} · Generated ${new Date().toLocaleDateString('en-KE',{day:'numeric',month:'long',year:'numeric'})}</div>
    <table>
      <thead><tr><th>#</th><th>Date</th><th>Home</th><th>Score</th><th>Away</th><th>Venue</th><th>Tournament</th><th>Status</th></tr></thead>
      <tbody>${matches.map((m,i)=>{
        const d=m.match_date?new Date(m.match_date).toLocaleDateString('en-KE',{weekday:'short',day:'numeric',month:'short',year:'numeric'}):'TBC';
        const score=(m.status==='completed'||m.status==='live')?`${m.home_score} — ${m.away_score}`:'vs';
        return `<tr>
          <td>${i+1}</td><td>${d}</td>
          <td><b>${m.home_team?.name||'TBC'}</b></td>
          <td style="text-align:center;font-weight:700">${score}</td>
          <td><b>${m.away_team?.name||'TBC'}</b></td>
          <td>${m.venue||'TBC'}</td>
          <td>${m.tournament?.name||''}</td>
          <td class="${m.status}">${m.status||'upcoming'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>
    <div class="footer">Kenya Rollball Federation · krfkenya.co.ke · info@krfkenya.co.ke</div>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.print(); };
  showToast('Opening print dialog...');
}

// ── TEAMS ──────────────────────────────────────
function renderTeams() {
  const grid = document.getElementById('teamsGrid');
  if (!grid) return;
  grid.innerHTML = STATE.teams.map(t=>{
    const s=t.standings?.[0]||{};
    return `<div class="team-card" onclick="openTeamModal('${t.id}')">
      <div class="team-card-banner" style="background:${t.bg_color||'#111'}">
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:.12;font-family:var(--font-d);font-size:5rem;color:${t.color}">${t.abbr}</div>
        ${t.logo_url?`<img src="${t.logo_url}" alt="${t.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:1rem;opacity:.65">`:''}
        <div class="team-card-badge" style="background:${t.color}22;color:${t.color};border-color:${t.color}44">${t.abbr}</div>
      </div>
      <div class="team-card-body">
        <h3>${t.name}</h3>
        <div class="team-card-city">📍 ${t.city||'Kenya'}</div>
        <div class="team-card-stats">
          <div class="tcs"><span class="v">${s.played||0}</span><span class="l">Played</span></div>
          <div class="tcs"><span class="v">${s.won||0}</span><span class="l">Wins</span></div>
          <div class="tcs"><span class="v" style="color:var(--white)">${s.points||0}</span><span class="l">Points</span></div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openTeamModal(id) {
  const t=STATE.teams.find(x=>x.id===id); if (!t) return;
  const s=t.standings?.[0]||{};
  const gd=(s.goals_for||0)-(s.goals_against||0);
  // Load players
  const playersHTML = `<div id="teamModalPlayers" style="margin-top:1.25rem"><div style="color:var(--dim);font-size:.78rem">Loading squad...</div></div>`;
  document.getElementById('teamModalBody').innerHTML = `
    <div class="tm-banner" style="background:${t.bg_color||'#111'}">
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:.1;font-family:var(--font-d);font-size:8rem;color:${t.color}">${t.abbr}</div>
      ${t.logo_url?`<img src="${t.logo_url}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:2rem;opacity:.5">`:''} 
      <div class="tm-overlay"></div>
    </div>
    <button class="pm-close" onclick="closeModals()">✕</button>
    <div class="tm-head">
      <div class="tm-badge-lg" style="background:${t.color}22;color:${t.color};border-color:${t.color}55">${t.abbr}</div>
      <div><div class="tm-name">${t.name}</div><div class="tm-city">📍 ${t.city||'Kenya'}${t.home_ground?' · '+t.home_ground:''}</div></div>
    </div>
    <div class="tm-stats-bar">
      ${[['P',s.played||0],['W',s.won||0],['D',s.drawn||0],['L',s.lost||0],['GF',s.goals_for||0],['GA',s.goals_against||0],['GD',(gd>0?'+':'')+gd],['Pts',s.points||0]].map(([l,v])=>`
        <div class="tm-stat"><span class="v" ${l==='GD'?`style="color:${gd>=0?'var(--gold)':'var(--red)'}"`:''}>${v}</span><span class="l">${l}</span></div>`).join('')}
    </div>
    <div class="tm-body">
      ${t.bio?`<p style="font-size:.82rem;color:var(--dim);line-height:1.7;margin-bottom:1rem">${t.bio}</p>`:''}
      ${playersHTML}
    </div>`;
  document.getElementById('teamModal').classList.add('open');
  // Load squad
  if (sb) {
    sb.from('users').select('id,name,jersey_number,position,passport_photo_url').eq('team_id',t.id).eq('is_active',true).eq('role','player').order('jersey_number').then(({data:players})=>{
      const el = document.getElementById('teamModalPlayers');
      if (!el) return;
      if (!players?.length) { el.innerHTML='<div style="color:var(--dim);font-size:.78rem">Squad not yet registered</div>'; return; }
      el.innerHTML = `
        <div style="font-family:var(--font-d);font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:.75rem">SQUAD</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.5rem">
          ${players.map(p=>`
            <div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:.65rem;text-align:center;cursor:pointer" onclick="openPlayerProfile('${p.id}')">
              <div style="width:36px;height:36px;border-radius:50%;background:${t.color}22;color:${t.color};border:1px solid ${t.color}44;display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-weight:800;font-size:.9rem;margin:0 auto .35rem">${p.jersey_number||'?'}</div>
              <div style="font-size:.72rem;font-weight:600;color:var(--soft);line-height:1.2">${p.name?.split(' ')[0]||'Player'}</div>
              <div style="font-size:.6rem;color:var(--muted);margin-top:.1rem">${p.position||'—'}</div>
            </div>`).join('')}
        </div>`;
    });
  }
}

// ── PLAYER PROFILE ─────────────────────────────
function openPlayerProfile(id) {
  if (!sb) return;
  sb.from('users').select('*,team:teams(id,name,color)').eq('id',id).single().then(({data:p})=>{
    if (!p) return;
    sb.from('player_stats').select('*').eq('user_id',id).order('season',{ascending:false}).limit(3).then(({data:stats})=>{
      document.getElementById('playerModalBody').innerHTML = `
        <button class="pm-close" onclick="closeModals()" style="top:.75rem;right:.75rem">✕</button>
        <div style="display:flex;align-items:center;gap:1.25rem;padding:1.5rem;border-bottom:1px solid var(--border)">
          <div style="width:64px;height:64px;border-radius:50%;background:${p.team?.color||'var(--red)'}22;color:${p.team?.color||'var(--red)'};border:2px solid ${p.team?.color||'var(--red)'}44;display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:1.6rem;font-weight:800;flex-shrink:0">
            ${p.jersey_number||'?'}
          </div>
          <div>
            <div style="font-family:var(--font-d);font-size:1.5rem;font-weight:800;letter-spacing:1.5px">${p.name||'Player'}</div>
            <div style="font-size:.75rem;color:var(--dim)">${p.position||'—'} · ${p.team?.name||'—'}</div>
            <div style="font-size:.7rem;color:var(--muted);margin-top:.2rem">${p.county||''} ${p.county&&p.age_category?'·':''} ${p.age_category||''}</div>
          </div>
        </div>
        <div style="padding:1.25rem">
          <div style="font-family:var(--font-d);font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:.85rem">CAREER STATS</div>
          ${stats?.length?stats.map(s=>`
            <div style="margin-bottom:.85rem">
              <div style="font-size:.65rem;color:var(--gold);font-family:var(--font-d);letter-spacing:1px;margin-bottom:.45rem">SEASON ${s.season||'—'}</div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem">
                ${[['Goals',s.goals||0],['Assists',s.assists||0],['Played',s.games_played||0],['YC',s.yellow_cards||0]].map(([l,v])=>`
                  <div style="background:var(--bg3);border:1px solid var(--border);border-radius:5px;padding:.5rem;text-align:center">
                    <div style="font-family:var(--font-d);font-size:1.4rem;font-weight:800;color:var(--white)">${v}</div>
                    <div style="font-size:.58rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;font-family:var(--font-d)">${l}</div>
                  </div>`).join('')}
              </div>
            </div>`).join(''):'<div style="color:var(--dim);font-size:.78rem">No stats recorded yet</div>'}
        </div>`;
      document.getElementById('playerModal').classList.add('open');
    });
  });
}

// ── STANDINGS ──────────────────────────────────
function standingRowHTML(s, i, compact=false) {
  const t=s.team||{}, gd=(s.goals_for||0)-(s.goals_against||0);
  const rankCls = i===0?'g':i===1?'s':i===2?'b':'';
  const form = (s.form||[]).slice(-5).map(f=>`<span class="fb ${f.toLowerCase()}">${f}</span>`).join('');
  if (compact) return `<tr>
    <td><span class="st-rank ${rankCls}">${i+1}</span></td>
    <td><div class="st-team"><div class="st-dot" style="background:${t.color||'#888'}"></div>${t.name||'—'}</div></td>
    <td>${s.played||0}</td><td>${s.won||0}</td><td>${s.drawn||0}</td><td>${s.lost||0}</td>
    <td style="color:${gd>0?'#27ae60':gd<0?'var(--red)':'var(--dim)'}">${gd>0?'+':''}${gd}</td>
    <td style="font-weight:700;color:${i===0?'var(--gold)':'inherit'}">${s.points||0}</td>
  </tr>`;
  return `<tr>
    <td><span class="st-rank ${rankCls}">${i+1}</span></td>
    <td><div class="st-team"><div class="st-dot" style="background:${t.color||'#888'}"></div>${t.name||'—'}</div></td>
    <td>${s.played||0}</td><td>${s.won||0}</td><td>${s.drawn||0}</td><td>${s.lost||0}</td>
    <td>${s.goals_for||0}</td><td>${s.goals_against||0}</td>
    <td style="color:${gd>0?'#27ae60':gd<0?'var(--red)':'var(--dim)'}">${gd>0?'+':''}${gd}</td>
    <td style="font-weight:700;color:${i===0?'var(--gold)':'inherit'}">${s.points||0}</td>
    <td>${form}</td>
  </tr>`;
}

let standingsFilter = null;
function renderStandings() {
  const active = STATE.tournaments.find(t=>t.status==='ongoing'||t.status==='active');
  const tourId = standingsFilter || active?.id;
  const body = document.getElementById('standingsBody');
  if (!body || !tourId) return;
  if (STATE.standings[tourId]) {
    body.innerHTML = STATE.standings[tourId].map((s,i)=>standingRowHTML(s,i)).join('');
  } else if (sb) {
    sb.from('standings').select('*,team:teams(id,name,abbr,color)').eq('tournament_id',tourId).order('points',{ascending:false}).then(({data})=>{
      STATE.standings[tourId]=data||[];
      body.innerHTML=(data||[]).map((s,i)=>standingRowHTML(s,i)).join('');
    });
  }
}

function filterStandings(id, btn) {
  standingsFilter = id;
  document.querySelectorAll('#standings .tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderStandings();
}

// ── NEWS ───────────────────────────────────────
function renderNews() {
  const el = document.getElementById('newsGrid');
  if (el) renderNewsGrid(el, STATE.news);
}

function renderNewsGrid(el, news) {
  if (!news?.length) { el.innerHTML='<p style="color:var(--dim);padding:1rem">No news yet</p>'; return; }
  const feat=news[0], rest=news.slice(1,5);
  el.innerHTML = `
    <div class="news-grid">
      <div class="news-featured" onclick="openArticle('${feat.id}')">
        <div class="news-featured-img" style="${feat.cover_image_url?`background:url('${feat.cover_image_url}') center/cover no-repeat`:`background:linear-gradient(135deg,${feat.hero_color||'#C8102E22'},#0d0d0d)`}"></div>
        <div class="news-featured-overlay"></div>
        <div class="news-featured-body">
          <span class="nf-tag">${feat.tag||'News'}</span>
          <div class="nf-title">${feat.title}</div>
          <div class="nf-meta">${feat.published_at?new Date(feat.published_at).toLocaleDateString('en-KE',{day:'numeric',month:'long',year:'numeric'}):''}</div>
        </div>
      </div>
      <div class="news-list">${rest.map(n=>`
        <div class="news-item" onclick="openArticle('${n.id}')">
          <div class="ni-tag">${n.tag||'News'}</div>
          <div class="ni-title">${n.title}</div>
          <div class="ni-meta">${n.published_at?new Date(n.published_at).toLocaleDateString('en-KE'):''}</div>
        </div>`).join('')}
      </div>
    </div>`;
}

function openArticle(id) {
  const article = STATE.news.find(n=>n.id===id);
  if (!article) return;
  let modal = document.getElementById('articleModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'articleModal'; modal.className = 'overlay-bg';
    modal.onclick = e=>{ if(e.target===modal) modal.classList.remove('open'); };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;max-width:720px;width:100%;margin:auto;overflow:hidden;max-height:90vh;overflow-y:auto">
      ${article.cover_image_url?`<div style="aspect-ratio:16/9;background:url('${article.cover_image_url}') center/cover no-repeat"></div>`:`<div style="aspect-ratio:16/9;background:linear-gradient(135deg,${article.hero_color||'#C8102E22'},#0d0d0d)"></div>`}
      <div style="padding:2rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <span style="background:rgba(200,16,46,.15);color:var(--red);border:1px solid rgba(200,16,46,.3);font-size:.62rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:2px">${article.tag||'News'}</span>
          <button onclick="document.getElementById('articleModal').classList.remove('open')" style="background:none;border:none;color:var(--muted);font-size:1.2rem;cursor:pointer">✕</button>
        </div>
        <h2 style="font-family:var(--font-d);font-size:1.8rem;letter-spacing:2px;margin-bottom:.5rem;text-transform:uppercase">${article.title}</h2>
        <div style="font-size:.72rem;color:var(--muted);margin-bottom:1.5rem">${article.published_at?new Date(article.published_at).toLocaleDateString('en-KE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):''}</div>
        ${article.video_url?`<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:6px;margin-bottom:1.5rem"><iframe src="${article.video_url.includes('youtube')?article.video_url.replace('watch?v=','embed/'):article.video_url}" style="position:absolute;inset:0;width:100%;height:100%;border:none" allowfullscreen></iframe></div>`:''}
        <div style="font-size:.88rem;color:var(--soft);line-height:1.9;white-space:pre-wrap">${article.content||''}</div>
      </div>
    </div>`;
  modal.classList.add('open');
}

// ── GALLERY ────────────────────────────────────
async function renderGallery() {
  const tab = STATE.galleryActiveTab || 'photos';
  if (tab==='photos') await loadPhotos();
  else if (tab==='highlights') await loadVideosByCategory('Match Highlights','highlightsGrid','highlights');
  else if (tab==='goalrush') await loadVideosByCategory('Goal Rush','goalrushGrid','goalrush');
  else if (tab==='live') renderLiveStream();
}

async function loadPhotos() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = '<div style="color:var(--dim);padding:1rem;font-size:.82rem">Loading photos...</div>';
  const heights = [140,200,160,180,220,150,190,170,210,155,185,175,230,145,195];
  if (!sb) { grid.innerHTML='<p style="color:var(--dim);padding:1rem">Connect Supabase to load gallery</p>'; return; }
  const { data: photos } = await sb.from('media').select('*').eq('approved',true).eq('media_type','photo').limit(40);
  if (!photos?.length) { grid.innerHTML='<p style="color:var(--dim);padding:1rem;font-size:.85rem">No photos yet</p>'; return; }
  grid.innerHTML = photos.map((p,i)=>`
    <div class="gallery-tile" onclick="openLightbox('${p.file_url}','${(p.title||'').replace(/'/g,"\\'")}')">
      <div class="gallery-tile-inner" style="height:${heights[i%heights.length]}px;background:url('${p.file_url}') center/cover no-repeat;position:relative">
        ${p.title?`<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.7));padding:.5rem .6rem;font-size:.7rem;color:var(--white)">${p.title}</div>`:''}
      </div>
      <div class="gallery-tile-overlay"></div>
    </div>`).join('');
}

function openLightbox(url, caption) {
  const lb=document.getElementById('photoLightbox');
  const img=document.getElementById('lightboxImg');
  const cap=document.getElementById('lightboxCaption');
  if (!lb||!img) return;
  img.src=url; if(cap) cap.textContent=caption||'';
  lb.classList.add('open'); lb.style.display='flex';
}

async function loadVideosByCategory(cat, gridId, badge) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '<div style="color:var(--dim);padding:1rem;font-size:.82rem">Loading...</div>';
  if (!sb) { grid.innerHTML='<p style="color:var(--dim);padding:1rem">Connect Supabase</p>'; return; }
  const { data: videos } = await sb.from('media').select('*').eq('approved',true).eq('media_type','video').ilike('category',`%${cat}%`).order('created_at',{ascending:false}).limit(20);
  if (!videos?.length) { grid.innerHTML=`<p style="color:var(--dim);padding:1rem;font-size:.85rem">No ${cat} videos yet</p>`; return; }
  grid.innerHTML = videos.map(v=>buildVideoCard(v,badge)).join('');
}

function buildVideoCard(v, badge) {
  let embed=null;
  if (v.file_url?.includes('youtube.com/watch')) { const vid=new URL(v.file_url).searchParams.get('v'); embed=`https://www.youtube.com/embed/${vid}?autoplay=1`; }
  else if (v.file_url?.includes('youtu.be/')) { const vid=v.file_url.split('youtu.be/')[1].split('?')[0]; embed=`https://www.youtube.com/embed/${vid}?autoplay=1`; }
  const thumb = v.thumbnail_url || (embed ? embed.replace('embed/','vi/').replace('?autoplay=1','')+'/hqdefault.jpg' : null);
  const colors = { highlights:'background:rgba(26,111,196,.2);color:#4d9fe8', goalrush:'background:rgba(200,16,46,.2);color:#e84d4d', live:'background:rgba(0,201,106,.2);color:#4cd97b' };
  return `<div class="video-tile">
    <div class="video-thumb" id="vthumb-${v.id}" onclick="playVideoCard('${v.id}')" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:6px 6px 0 0;background:var(--bg3);cursor:pointer">
      ${thumb?`<img src="${thumb}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.5rem">🎬</div>`}
      <div class="play-icon">▶</div>
    </div>
    <div class="video-info">
      <span style="display:inline-block;font-size:.55rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:2px 7px;border-radius:2px;margin-bottom:.35rem;${colors[badge]||''}">${v.category||badge}</span>
      <h4>${v.title||'Match Video'}</h4>
      <small>${v.created_at?new Date(v.created_at).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}):''}</small>
    </div>
    <div class="video-player" id="vplayer-${v.id}" style="display:none;position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:6px">
      ${embed?`<iframe src="${embed}" style="position:absolute;inset:0;width:100%;height:100%;border:none" allowfullscreen allow="autoplay"></iframe>`:`<video controls autoplay style="position:absolute;inset:0;width:100%;height:100%" src="${v.file_url}"></video>`}
    </div>
  </div>`;
}

function playVideoCard(id) {
  const thumb=document.getElementById('vthumb-'+id);
  const player=document.getElementById('vplayer-'+id);
  if (!player) return;
  const isOpen = player.style.display!=='none';
  document.querySelectorAll('[id^="vplayer-"]').forEach(p=>p.style.display='none');
  document.querySelectorAll('[id^="vthumb-"]').forEach(t=>t.style.display='block');
  if (!isOpen) { player.style.display='block'; if(thumb) thumb.style.display='none'; }
}

function setGalleryTab(tab, btn) {
  STATE.galleryActiveTab = tab;
  document.querySelectorAll('#gallery .tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['photosPanel','highlightsPanel','goalrushPanel','livePanel'].forEach(p=>{ const el=document.getElementById(p); if(el) el.style.display='none'; });
  const panelMap = { photos:'photosPanel', highlights:'highlightsPanel', goalrush:'goalrushPanel', live:'livePanel' };
  const active = document.getElementById(panelMap[tab]);
  if (active) active.style.display='block';
  renderGallery();
}

function renderLiveStream() {
  const wrap=document.getElementById('liveStreamWrap');
  if (!wrap) return;
  const streamUrl=STATE.settings.live_stream_url||null;
  const rtmpUrl=STATE.settings.live_rtmp_url||'rtmp://stream.krfkenya.co.ke/live';
  wrap.innerHTML=`
    <div style="background:linear-gradient(135deg,rgba(39,174,96,.08),transparent);border:1px solid rgba(39,174,96,.2);border-radius:8px;padding:1.25rem;margin-bottom:1.25rem">
      <div style="font-size:.62rem;letter-spacing:2px;text-transform:uppercase;color:#4cd97b;margin-bottom:.3rem">📡 Live Stream</div>
      <div style="font-size:.82rem;color:var(--dim)">${STATE.liveMatch?`● LIVE NOW: ${STATE.liveMatch.home_team?.name} vs ${STATE.liveMatch.away_team?.name}`:'No match live right now'}</div>
    </div>
    ${streamUrl?`<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin-bottom:1.25rem;border:1px solid var(--border)">
      ${streamUrl.includes('youtube')||streamUrl.includes('youtu.be')?`<iframe src="${streamUrl.replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/')}?autoplay=1" style="position:absolute;inset:0;width:100%;height:100%;border:none" allowfullscreen allow="autoplay"></iframe>`:
      `<video controls autoplay style="position:absolute;inset:0;width:100%;height:100%" src="${streamUrl}"></video>`}
    </div>`:
    `<div style="position:relative;padding-bottom:56.25%;height:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;margin-bottom:1.25rem;overflow:hidden">
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem"><div style="font-size:3rem;opacity:.2">📡</div><div style="font-size:.85rem;color:var(--dim)">Stream offline</div></div>
    </div>`}
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:.85rem 1.1rem">
      <div style="font-size:.6rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:.5rem">RTMP INGEST</div>
      <div style="font-size:.75rem;color:var(--dim);font-family:var(--font-m)">${rtmpUrl}</div>
    </div>`;
}

// ── LIVE CHAT ──────────────────────────────────
function toggleChat() {
  STATE.chatOpen = !STATE.chatOpen;
  const panel = document.querySelector('.chat-panel');
  if (panel) panel.classList.toggle('open', STATE.chatOpen);
  if (STATE.chatOpen && sb) loadRecentChats();
}

async function loadRecentChats() {
  const { data: msgs } = await sb.from('chat_messages').select('*').order('created_at',{ascending:false}).limit(30);
  STATE.chatMessages = (msgs||[]).reverse();
  const el = document.querySelector('.chat-messages');
  if (el) { el.innerHTML = STATE.chatMessages.map(m=>chatMsgHTML(m)).join(''); el.scrollTop=el.scrollHeight; }
}

function chatMsgHTML(m) {
  return `<div class="chat-msg"><span class="who">${m.display_name||'Fan'}</span><span style="color:var(--soft)">${m.message}</span><span style="color:var(--muted);font-size:.58rem;margin-left:.4rem">${timeSince(m.created_at)}</span></div>`;
}

function appendChatMsg(m) {
  const el = document.querySelector('.chat-messages');
  if (!el) return;
  const div = document.createElement('div');
  div.className='chat-msg';
  div.innerHTML=chatMsgHTML(m);
  el.appendChild(div);
  el.scrollTop=el.scrollHeight;
}

async function sendChatMsg() {
  const input = document.querySelector('.chat-input-row input');
  const msg = input?.value?.trim();
  if (!msg || !sb) return;
  if (!STATE.fanName) {
    const name = prompt('Enter your display name:');
    if (!name) return;
    STATE.fanName = name.trim().slice(0,20);
    localStorage.setItem('krf_fan_name', STATE.fanName);
  }
  await sb.from('chat_messages').insert({ message: msg, display_name: STATE.fanName, match_id: STATE.liveMatch?.id });
  if (input) input.value='';
}

// ── SPONSOR TAKEOVER ───────────────────────────
function initSponsorTakeover() {
  const titleSponsor = STATE.sponsors.find(s=>s.tier==='title');
  if (!titleSponsor || !titleSponsor.takeover_enabled) return;
  const shown = sessionStorage.getItem('krf_takeover_shown');
  if (shown) return;
  setTimeout(()=>{
    const el = document.getElementById('sponsorTakeover');
    if (!el) return;
    el.innerHTML=`
      <button class="sto-close" onclick="closeTakeover()">✕</button>
      <div class="sto-inner">
        <div style="font-size:.62rem;letter-spacing:3px;color:var(--gold);text-transform:uppercase;margin-bottom:1rem">Official Title Sponsor</div>
        ${titleSponsor.logo_url?`<img src="${titleSponsor.logo_url}" style="max-height:80px;max-width:240px;object-fit:contain;margin:0 auto 1.25rem">`:
        `<div style="font-family:var(--font-d);font-size:2rem;font-weight:900;color:var(--white);margin-bottom:1.25rem">${titleSponsor.name}</div>`}
        ${titleSponsor.tagline?`<div style="font-size:.88rem;color:var(--soft);line-height:1.6;margin-bottom:1.5rem">${titleSponsor.tagline}</div>`:''}
        <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">
          ${titleSponsor.website_url?`<button class="btn-primary" onclick="window.open('${titleSponsor.website_url}','_blank');closeTakeover()">Visit ${titleSponsor.name}</button>`:''}
          <button class="btn-outline" onclick="closeTakeover()">Continue to KRF</button>
        </div>
      </div>`;
    el.classList.add('show');
    sessionStorage.setItem('krf_takeover_shown','1');
  }, 2500);
}
function closeTakeover() { document.getElementById('sponsorTakeover')?.classList.remove('show'); }

// ── MODALS ─────────────────────────────────────
function closeModals() {
  document.querySelectorAll('.overlay-bg').forEach(m=>m.classList.remove('open'));
}

// ── THEME TOGGLE ───────────────────────────────
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('krf_theme', isDark ? 'light' : 'dark');
}
function initTheme() {
  const saved = localStorage.getItem('krf_theme');
  if (saved === 'light') { document.documentElement.setAttribute('data-theme','light'); const btn=document.querySelector('.theme-toggle'); if(btn) btn.textContent='🌙'; }
}

// ── SOCIAL ─────────────────────────────────────
function openSocial(platform) {
  const urls = { facebook:STATE.settings.facebook_url||'https://facebook.com', twitter:STATE.settings.twitter_url||'https://x.com', instagram:STATE.settings.instagram_url||'https://instagram.com', youtube:STATE.settings.youtube_url||'https://youtube.com', tiktok:STATE.settings.tiktok_url||'https://tiktok.com' };
  window.open(urls[platform], '_blank');
}

// ── HELPERS ────────────────────────────────────
function setEl(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function showToast(msg) {
  const t=document.getElementById('toast');
  if (!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'), 3200);
}
function timeSince(ts) {
  const diff = (Date.now()-new Date(ts))/1000;
  if (diff<60) return `${Math.floor(diff)}s`;
  if (diff<3600) return `${Math.floor(diff/60)}m`;
  return `${Math.floor(diff/3600)}h`;
}

// ── PARTICLES ──────────────────────────────────
function initParticles() {
  const canvas=document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx=canvas.getContext('2d');
  let W,H,particles=[];
  function resize() { W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
  resize(); window.addEventListener('resize',resize);
  for(let i=0;i<60;i++) particles.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+.3,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,o:Math.random()*.25+.04,c:Math.random()>.65?'200,16,46':'244,169,0'});
  function draw() {
    ctx.clearRect(0,0,W,H);
    particles.forEach(p=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.c},${p.o})`; ctx.fill();
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>W) p.vx*=-1;
      if(p.y<0||p.y>H) p.vy*=-1;
    });
    for(let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++) {
      const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<90) { ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.strokeStyle=`rgba(200,16,46,${.03*(1-d/90)})`; ctx.lineWidth=.5; ctx.stroke(); }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ── MOBILE MENU ────────────────────────────────
function toggleMobileMenu() {
  document.querySelector('.nav-links')?.classList.toggle('open');
}

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=>{
  initTheme();
  initParticles();
  initSupabase();
  window.addEventListener('scroll',()=>{ document.getElementById('mainNav').classList.toggle('scrolled',window.scrollY>20); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModals(); });
  document.querySelectorAll('.overlay-bg').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) closeModals(); }));
  // Standings tabs after data loads
  window.addEventListener('krf-loaded',()=>{
    const tabs=document.getElementById('standingsTabs');
    if (tabs && STATE.tournaments?.length) {
      tabs.innerHTML = STATE.tournaments.map((t,i)=>`<button class="tab ${i===0?'active':''}" onclick="filterStandings('${t.id}',this)">${t.name}</button>`).join('');
    }
    // Live indicator in nav
    if (STATE.liveMatch) {
      const navLive=document.getElementById('navLive');
      if (navLive) navLive.style.display='flex';
    }
  });
});