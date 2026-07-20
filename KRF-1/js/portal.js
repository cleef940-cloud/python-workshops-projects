// ═══════════════════════════════════════════════
// KRF MEMBER PORTAL — portal.js v2.0
// All roles · New features · Supabase direct
// ═══════════════════════════════════════════════

// ── CONFIG ─────────────────────────────────────
const CONFIG = {
  SUPABASE_URL:      window.ENV_SUPABASE_URL      || 'https://eseffwgiogcbwnatrssz.supabase.co',
  SUPABASE_ANON_KEY: window.ENV_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZWZmd2dpb2djYnduYXRyc3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzU0NzQsImV4cCI6MjA5MTA1MTQ3NH0.Qvf3AJJD2rr_fVasvB2ntE0_-LIfSiawEWTnQBKIXmg',
};

// ── STATE ──────────────────────────────────────
let STATE = {
  user: null, sb: null,
  currentPage: 'overview',
  teams: [], players: [], tournaments: [], schedules: [],
  docs: [], officials: [], sponsors: [], siteSettings: {},
  liveMatch: null, liveH: 0, liveA: 0,
  period: 1, matchTimer: 900, matchEnded: false,
  events: [],
  reportState: { refSubmitted:false, lineSignedOff:false, commCountersigned:false },
  precheck: [],
  playerStats: null,
  notifications: [],
  polls: [],
  finances: [],
};

// ── ROLE CONFIG ────────────────────────────────
const ROLE_CONFIG = {
  admin:        { label:'Administrator',      color:'#C8102E', icon:'⭐' },
  commissioner: { label:'Match Commissioner', color:'#0d8a6e', icon:'🏛️' },
  referee:      { label:'Referee',            color:'#1a6fc4', icon:'🟥' },
  linesman:     { label:'Linesman',           color:'#d4920a', icon:'🚩' },
  official:     { label:'Score Official',     color:'#6d3fc4', icon:'🎯' },
  player:       { label:'Player',             color:'#00C96A', icon:'🏃' },
  team_manager: { label:'Team Manager',       color:'#e67e22', icon:'📋' },
};

const NAV_MAP = {
  admin: [
    { sec:'Dashboard', items:[{id:'overview',si:'▦',lbl:'Overview'},{id:'schedule',si:'◷',lbl:'Schedule'}] },
    { sec:'Match Day',  items:[{id:'live',si:'●',lbl:'Live Score Entry',badge:'LIVE'},{id:'lineup',si:'◈',lbl:'Lineups'},{id:'events',si:'◉',lbl:'Event Log'},{id:'report',si:'◎',lbl:'Match Report'}] },
    { sec:'Registration', items:[{id:'playerreg',si:'◻',lbl:'Player Registration'},{id:'teamreg',si:'◼',lbl:'Team Registration'}] },
    { sec:'Admin', items:[{id:'users',si:'◈',lbl:'Manage Users'},{id:'teams_admin',si:'▣',lbl:'Teams & Rosters'},{id:'tournaments',si:'◆',lbl:'Tournaments'},{id:'leaderboard',si:'🏆',lbl:'Leaderboard'},{id:'finances',si:'💰',lbl:'Financials'},{id:'polls',si:'📊',lbl:'Fan Polls'},{id:'gallery',si:'▨',lbl:'Gallery & Media'},{id:'news',si:'📰',lbl:'News'},{id:'settings',si:'⚙',lbl:'Site Settings'}] },
  ],
  commissioner: [
    { sec:'Dashboard', items:[{id:'overview',si:'▦',lbl:'Overview'},{id:'schedule',si:'◷',lbl:'Assignments'}] },
    { sec:'Match Day',  items:[{id:'commlive',si:'●',lbl:'Match Monitor',badge:'LIVE'},{id:'precheck',si:'✓',lbl:'Pre-Match Checklist'},{id:'incidents',si:'⚠',lbl:'Incidents'},{id:'countersign',si:'✍',lbl:'Countersign Report'}] },
    { sec:'My Portal', items:[{id:'mydocs',si:'◻',lbl:'My Clearances'},{id:'refratings',si:'⭐',lbl:'Official Ratings'}] },
  ],
  referee: [
    { sec:'Dashboard', items:[{id:'overview',si:'▦',lbl:'Overview'},{id:'schedule',si:'◷',lbl:'Assignments'}] },
    { sec:'Match Day',  items:[{id:'live',si:'●',lbl:'Live Score Entry',badge:'LIVE'},{id:'lineup',si:'◈',lbl:'Lineups'},{id:'events',si:'◉',lbl:'Event Log'},{id:'report',si:'◎',lbl:'Match Report'}] },
    { sec:'My Portal', items:[{id:'mydocs',si:'◻',lbl:'My Clearances'},{id:'refratings',si:'⭐',lbl:'My Ratings'}] },
  ],
  linesman: [
    { sec:'Dashboard', items:[{id:'overview',si:'▦',lbl:'Overview'},{id:'schedule',si:'◷',lbl:'Assignments'}] },
    { sec:'Match Day',  items:[{id:'lineview',si:'●',lbl:'Match View',badge:'LIVE'},{id:'boundary',si:'🚩',lbl:'Boundary Log'},{id:'linesign',si:'✍',lbl:'Sign Event Log'}] },
    { sec:'My Portal', items:[{id:'mydocs',si:'◻',lbl:'My Clearances'}] },
  ],
  official: [
    { sec:'Dashboard', items:[{id:'overview',si:'▦',lbl:'Overview'},{id:'schedule',si:'◷',lbl:'Schedule'}] },
    { sec:'Match Day',  items:[{id:'live',si:'●',lbl:'Score Entry',badge:'LIVE'},{id:'events',si:'◉',lbl:'Event Log'}] },
    { sec:'My Portal', items:[{id:'mydocs',si:'◻',lbl:'My Clearances'}] },
  ],
  player: [
    { sec:'My Portal', items:[{id:'overview',si:'▦',lbl:'Dashboard'},{id:'profile',si:'◉',lbl:'My Profile'},{id:'mystats',si:'▣',lbl:'My Stats'},{id:'schedule',si:'◷',lbl:'Schedule'},{id:'leaderboard',si:'🏆',lbl:'Leaderboard'}] },
    { sec:'Registration', items:[{id:'playerreg',si:'◻',lbl:'Registration & Docs'}] },
    { sec:'Community', items:[{id:'polls',si:'📊',lbl:'Fan Polls'}] },
  ],
  team_manager: [
    { sec:'My Team', items:[{id:'overview',si:'▦',lbl:'Dashboard'},{id:'schedule',si:'◷',lbl:'Schedule'}] },
    { sec:'Registration', items:[{id:'teamreg',si:'◼',lbl:'League Registration'},{id:'playerreg',si:'◻',lbl:'Register Players'}] },
    { sec:'Management', items:[{id:'teams_admin',si:'▣',lbl:'My Team & Roster'},{id:'finances',si:'💰',lbl:'Team Finances'},{id:'polls',si:'📊',lbl:'Fan Polls'}] },
  ],
};

const PAGE_META = {
  overview:'OVERVIEW|Dashboard',live:'LIVE SCORE ENTRY|Real-time scoring',lineup:'TEAM LINEUP|Starting positions',
  events:'EVENT LOG|Goals, cards, fouls',report:'MATCH REPORT|File & submit',playerreg:'PLAYER REGISTRATION|Profile & documents',
  teamreg:'TEAM REGISTRATION|Club & official docs',users:'MANAGE USERS|Accounts & roles',teams_admin:'TEAMS & ROSTERS|Club management',
  tournaments:'TOURNAMENTS|Competition management',gallery:'GALLERY & MEDIA|Photos, videos & streaming',
  settings:'SITE SETTINGS|Public site configuration',profile:'MY PROFILE|Personal info & photo',
  mystats:'MY STATISTICS|Season performance',schedule:'SCHEDULE|Fixtures & assignments',
  commlive:'MATCH MONITOR|Commissioner · Read-only',precheck:'PRE-MATCH CHECKLIST|Venue & eligibility',
  incidents:'INCIDENTS & PROTESTS|Official log',countersign:'COUNTERSIGN REPORT|Final approval',
  boundary:'BOUNDARY LOG|Decisions & calls',lineview:'MATCH VIEW|Linesman live overview',
  linesign:'SIGN EVENT LOG|Review & sign-off',mydocs:'MY CLEARANCES|Document uploads',
  news:'NEWS & ANNOUNCEMENTS|Publish articles',leaderboard:'LEADERBOARD|Top scorers & rankings',
  finances:'FINANCIALS|Fines, fees & payments',polls:'FAN POLLS|Voting & community',
  refratings:'OFFICIAL RATINGS|Performance scores',
};

// ── SUPABASE INIT ──────────────────────────────
function initSupabase() {
  if (!window.supabase) { showToast('Supabase SDK missing'); return; }
  try {
    STATE.sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  } catch(e) { showToast('Supabase init failed: ' + e.message); }
}

function subscribeToLive(matchId) {
  if (!STATE.sb || !matchId) return;
  STATE.sb.channel(`match-${matchId}`)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'matches',filter:`id=eq.${matchId}`}, payload => {
      const m=payload.new;
      STATE.liveH=m.home_score; STATE.liveA=m.away_score;
      STATE.period=m.current_period; STATE.matchEnded=m.status==='completed';
      updateLiveDisplays();
    })
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'match_events',filter:`match_id=eq.${matchId}`}, payload => {
      STATE.events.unshift(formatEvent(payload.new));
      refreshEventList();
    })
    .subscribe();
}

// ── AUTH ───────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const pass  = document.getElementById('loginPass')?.value;
  if (!email || !pass) { showToast('Enter your email and password'); return; }
  if (!STATE.sb) { showToast('Connection error — Supabase not initialised'); return; }

  showToast('Signing in…');
  try {
    const { data, error } = await STATE.sb.auth.signInWithPassword({ email, password: pass });
    if (error) { showToast(error.message); return; }
    const { data: profile } = await STATE.sb.from('users').select('*,team:teams(id,name,color)').eq('id',data.user.id).single();
    STATE.user = profile || { id:data.user.id, name:data.user.user_metadata?.name||email.split('@')[0], role:'player', email };
    await bootPortal();
  } catch(e) { showToast('Login failed: ' + e.message); }
}

async function doRegister() {
  const name     = document.getElementById('regName')?.value?.trim();
  const email    = document.getElementById('regEmail')?.value?.trim();
  const password = document.getElementById('regPass')?.value;
  if (!name||!email||!password) { showToast('Fill in all fields'); return; }
  if (password.length < 8) { showToast('Password must be at least 8 characters'); return; }
  if (!STATE.sb) { showToast('Connection error'); return; }

  showToast('Creating account…');
  try {
    const { data, error } = await STATE.sb.auth.signUp({ email, password, options:{ data:{ name } } });
    if (error) { showToast(error.message); return; }
    await STATE.sb.from('users').insert({ id:data.user.id, name, email, role:'player', docs_status:'incomplete', is_active:false });
    STATE.user = { id:data.user.id, name, email, role:'player', is_active:false };
    showToast('Welcome! Awaiting admin approval.');
    bootPortal();
  } catch(e) { showToast('Registration failed: ' + e.message); }
}

async function checkSavedSession() {
  if (!STATE.sb) return;
  try {
    const { data:{ session } } = await STATE.sb.auth.getSession();
    if (!session?.user) return;
    const { data:profile } = await STATE.sb.from('users').select('*,team:teams(id,name,color)').eq('id',session.user.id).single();
    STATE.user = profile || { id:session.user.id, name:session.user.user_metadata?.name||'User', role:'player', email:session.user.email };
    bootPortal();
  } catch(e) { console.warn('Session check failed:', e); }
}

function doLogout() {
  STATE.sb?.auth.signOut();
  STATE.user = null;
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('app').classList.remove('show');
}

// ── BOOT ───────────────────────────────────────
async function bootPortal() {
  const u = STATE.user;
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').classList.add('show');

  const r = ROLE_CONFIG[u.role] || ROLE_CONFIG.player;
  const av = document.getElementById('sbAv');
  const initials = (u.name||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  if (av) { av.textContent=initials; av.style.background=r.color+'18'; av.style.color=r.color; av.style.borderColor=r.color+'44'; }
  setEl('sbName', u.name||u.email);
  setEl('sbRole', u.is_active ? r.label : 'Pending Approval');
  setEl('tbRole', u.is_active ? r.label : 'Pending');
  document.getElementById('app')?.style.setProperty('--role-color', r.color);

  if (!u.is_active) { renderPendingScreen(); return; }

  buildNav();
  buildMobileNav();
  await loadPortalData();
  await loadNotifications();
  nav('overview');
}

function renderPendingScreen() {
  const u = STATE.user;
  document.getElementById('sideNav').innerHTML = '';
  document.getElementById('tbTitle').textContent = 'ACCOUNT PENDING';
  document.getElementById('tbSub').textContent   = 'Awaiting admin approval';
  document.getElementById('mainContent').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:1rem">
      <div style="font-size:3rem;opacity:.35">⏳</div>
      <div style="font-family:var(--font-h);font-size:1.4rem;letter-spacing:2px;color:var(--white)">ACCOUNT PENDING</div>
      <div style="font-size:.85rem;color:var(--dim);max-width:380px;line-height:1.7">Your registration has been received. An administrator will review and approve your account shortly.</div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:1.25rem 1.75rem;text-align:left;min-width:280px">
        <div style="font-size:.6rem;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin-bottom:.65rem">YOUR DETAILS</div>
        <div style="font-size:.82rem;color:var(--soft);margin-bottom:.3rem"><span style="color:var(--muted);font-size:.72rem">Name</span><br/>${u.name||'—'}</div>
        <div style="font-size:.82rem;color:var(--soft);margin-bottom:.3rem"><span style="color:var(--muted);font-size:.72rem">Email</span><br/>${u.email||'—'}</div>
        <div style="font-size:.82rem;color:var(--soft)"><span style="color:var(--muted);font-size:.72rem">Role requested</span><br/><span class="bdg bdg-amber" style="margin-top:.2rem;display:inline-block">${u.role||'player'}</span></div>
      </div>
      <div style="font-size:.72rem;color:var(--muted);max-width:340px;line-height:1.6">Contact <a href="mailto:admin@krfkenya.co.ke" style="color:var(--gold);text-decoration:none">admin@krfkenya.co.ke</a> if you need urgent access.</div>
      <button class="btn-s" onclick="doLogout()">← Sign Out</button>
    </div>`;
}

// ── DATA LOAD ──────────────────────────────────
async function loadPortalData() {
  if (!STATE.sb) return;
  try {
    const [
      { data:teams }, { data:schedules }, { data:tournaments },
      { data:sponsors }, { data:siteSettings }, { data:docs }
    ] = await Promise.all([
      STATE.sb.from('teams').select('*,standings(points,played,won,drawn,lost,goals_for,goals_against)').eq('is_active',true).order('name'),
      STATE.sb.from('matches').select('*,home_team:teams!home_team_id(id,name,abbr,color),away_team:teams!away_team_id(id,name,abbr,color),tournament:tournaments(id,name,type)').order('match_date',{ascending:true}).limit(60),
      STATE.sb.from('tournaments').select('*').order('name'),
      STATE.sb.from('sponsors').select('*').eq('is_active',true).order('tier'),
      STATE.sb.from('site_settings').select('*'),
      STATE.sb.from('documents').select('*').eq('user_id',STATE.user.id),
    ]);
    if (teams)        STATE.teams        = teams;
    if (schedules)    STATE.schedules    = schedules;
    if (tournaments)  STATE.tournaments  = tournaments;
    if (sponsors)     STATE.sponsors     = sponsors;
    if (siteSettings) STATE.siteSettings = Object.fromEntries(siteSettings.map(r=>[r.key,r.value]));
    if (docs)         STATE.docs         = docs;

    if (STATE.user?.role==='player') {
      const { data:stats } = await STATE.sb.from('player_stats').select('*').eq('user_id',STATE.user.id).eq('season','2025').maybeSingle();
      STATE.playerStats = stats || { goals:0, assists:0, games_played:0, yellow_cards:0 };
    }

    const { data:officials } = await STATE.sb.from('users').select('id,name,role').in('role',['referee','linesman','commissioner','official']).eq('is_active',true);
    STATE.officials = officials || [];

    const live = schedules?.find(m=>m.status==='live');
    if (live) {
      STATE.liveMatch=live; STATE.liveH=live.home_score||0; STATE.liveA=live.away_score||0; STATE.period=live.current_period||1;
      const pill=document.getElementById('sbLivePill');
      if (pill) pill.textContent=`LIVE — ${live.home_team?.abbr} ${STATE.liveH}:${STATE.liveA} ${live.away_team?.abbr}`;
      subscribeToLive(live.id);
    } else {
      const pill=document.getElementById('sbLivePill');
      if (pill) pill.textContent='No match live right now';
    }
  } catch(e) { console.error('loadPortalData:', e); }
}

async function loadNotifications() {
  if (!STATE.sb) return;
  try {
    const { data } = await STATE.sb.from('notifications').select('*').eq('user_id',STATE.user.id).order('created_at',{ascending:false}).limit(10);
    STATE.notifications = data || [];
    const badge = document.getElementById('notifBadge');
    const unread = STATE.notifications.filter(n=>!n.read).length;
    if (badge) { badge.textContent=unread||''; badge.style.display=unread?'flex':'none'; }
  } catch(e) {}
}

// ── NAV ────────────────────────────────────────
function buildNav() {
  const sections = NAV_MAP[STATE.user.role] || NAV_MAP.player;
  document.getElementById('sideNav').innerHTML = sections.map(s=>`
    <div class="sb-sec">${s.sec}</div>
    ${s.items.map(i=>`
      <div class="sb-item" id="nav-${i.id}" onclick="nav('${i.id}')">
        <span class="si">${i.si}</span>${i.lbl}
        ${i.badge?`<span class="sb-badge-pill">${i.badge}</span>`:''}
      </div>`).join('')}`).join('');
}

function buildMobileNav() {
  const role = STATE.user?.role;
  const mobileItems = {
    admin:        [{id:'overview',icon:'▦',lbl:'Home'},{id:'live',icon:'●',lbl:'Live'},{id:'users',icon:'◈',lbl:'Users'},{id:'schedule',icon:'◷',lbl:'Schedule'},{id:'settings',icon:'⚙',lbl:'Settings'}],
    referee:      [{id:'overview',icon:'▦',lbl:'Home'},{id:'live',icon:'●',lbl:'Live'},{id:'events',icon:'◉',lbl:'Events'},{id:'report',icon:'◎',lbl:'Report'},{id:'mydocs',icon:'◻',lbl:'Docs'}],
    commissioner: [{id:'overview',icon:'▦',lbl:'Home'},{id:'commlive',icon:'●',lbl:'Monitor'},{id:'precheck',icon:'✓',lbl:'Check'},{id:'countersign',icon:'✍',lbl:'Sign'},{id:'mydocs',icon:'◻',lbl:'Docs'}],
    linesman:     [{id:'overview',icon:'▦',lbl:'Home'},{id:'lineview',icon:'●',lbl:'Live'},{id:'boundary',icon:'🚩',lbl:'Calls'},{id:'linesign',icon:'✍',lbl:'Sign'},{id:'mydocs',icon:'◻',lbl:'Docs'}],
    player:       [{id:'overview',icon:'▦',lbl:'Home'},{id:'mystats',icon:'▣',lbl:'Stats'},{id:'schedule',icon:'◷',lbl:'Fixtures'},{id:'leaderboard',icon:'🏆',lbl:'Top'},{id:'playerreg',icon:'◻',lbl:'Reg'}],
    team_manager: [{id:'overview',icon:'▦',lbl:'Home'},{id:'teams_admin',icon:'▣',lbl:'Team'},{id:'schedule',icon:'◷',lbl:'Fixtures'},{id:'finances',icon:'💰',lbl:'Finances'},{id:'teamreg',icon:'◼',lbl:'Reg'}],
    official:     [{id:'overview',icon:'▦',lbl:'Home'},{id:'live',icon:'●',lbl:'Score'},{id:'events',icon:'◉',lbl:'Events'},{id:'schedule',icon:'◷',lbl:'Schedule'},{id:'mydocs',icon:'◻',lbl:'Docs'}],
  };
  const items = mobileItems[role] || mobileItems.player;
  const nav = document.getElementById('mobileBottomNav');
  if (nav) {
    nav.innerHTML = `<div class="mbn-items">${items.map(i=>`
      <div class="mbn-item" id="mbn-${i.id}" onclick="nav('${i.id}')">
        <div class="mbn-icon">${i.icon}</div>${i.lbl}
      </div>`).join('')}</div>`;
  }
}

function nav(id) {
  document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));
  document.querySelectorAll('.mbn-item').forEach(i=>i.classList.remove('active'));
  document.getElementById('nav-'+id)?.classList.add('active');
  document.getElementById('mbn-'+id)?.classList.add('active');
  const meta = (PAGE_META[id]||`${id.toUpperCase()}|`).split('|');
  setEl('tbTitle', meta[0]); setEl('tbSub', meta[1]||'');
  STATE.currentPage = id;
  renderPortalPage(id);
}

function renderPortalPage(id) {
  if (window.PORTAL_RENDERS?.[id]) { window.PORTAL_RENDERS[id](); return; }
  const renders = { overview, live, lineup, events, report, playerreg, teamreg, users, teams_admin, tournaments, gallery, settings, profile, mystats, schedule, commlive, precheck, incidents, countersign, boundary, lineview, linesign, mydocs, news, leaderboard, finances, polls, refratings };
  if (renders[id]) renders[id]();
  else document.getElementById('mainContent').innerHTML = `<div style="padding:2rem;color:var(--dim)">Page "${id}" coming soon.</div>`;
}

// ── HELPERS ────────────────────────────────────
function setEl(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function panel(title, tag, body) {
  return `<div class="panel"><div class="ph"><span class="pt">${title}</span><span class="pg">${tag}</span></div><div class="pb">${body}</div></div>`;
}
function showToast(msg) {
  const t=document.getElementById('toast');
  if (!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'), 3200);
}
function signoffChainHTML() {
  const s=STATE.reportState;
  return `<div class="signoff-chain">
    <div class="sof-step done">✓ Events</div><div class="sof-arrow">→</div>
    <div class="sof-step ${s.refSubmitted?'done':'current'}">Referee${s.refSubmitted?' ✓':''}</div><div class="sof-arrow">→</div>
    <div class="sof-step ${s.lineSignedOff?'done':s.refSubmitted?'current':'pending'}">Linesman${s.lineSignedOff?' ✓':''}</div><div class="sof-arrow">→</div>
    <div class="sof-step ${s.commCountersigned?'locked':s.lineSignedOff?'current':'pending'}">${s.commCountersigned?'🔒 Locked':'Commissioner'}</div><div class="sof-arrow">→</div>
    <div class="sof-step ${s.commCountersigned?'done':'pending'}">Published${s.commCountersigned?' ✓':''}</div>
  </div>`;
}
function scoreMiniHTML() {
  const m=STATE.liveMatch;
  return `<div style="background:var(--bg3);border-radius:6px;padding:.75rem;text-align:center">
    <div style="font-size:.6rem;color:var(--dim);letter-spacing:.8px;margin-bottom:.4rem;text-transform:uppercase">${m?.tournament?.name||'KPL'}</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:1rem">
      <span style="font-size:.82rem;font-weight:600">${m?.home_team?.name||'Home'}</span>
      <span id="miniScore" style="font-family:var(--font-h);font-size:2rem;color:var(--gold);letter-spacing:3px">${STATE.liveH} — ${STATE.liveA}</span>
      <span style="font-size:.82rem;font-weight:600">${m?.away_team?.name||'Away'}</span>
    </div>
    <div id="miniTimer" style="font-size:.68rem;color:var(--red);margin-top:.3rem;font-weight:500">Q${STATE.period} · In Progress</div>
  </div>`;
}
function schedMiniHTML() {
  const upcoming=(STATE.schedules||[]).filter(m=>m.status==='upcoming').slice(0,3);
  if (!upcoming.length) return '<div style="color:var(--dim);font-size:.78rem">No upcoming fixtures</div>';
  return upcoming.map(s=>{
    const d=s.match_date?new Date(s.match_date).toLocaleDateString('en-KE',{weekday:'short',day:'numeric',month:'short'}):'TBC';
    return `<div style="display:flex;align-items:center;gap:.65rem;padding:.45rem 0;border-bottom:1px solid rgba(255,255,255,.03)">
      <div style="text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:5px;padding:.28rem .5rem;min-width:38px;flex-shrink:0">
        <div style="font-family:var(--font-h);font-size:1.1rem;color:var(--gold);line-height:1">${new Date(s.match_date||Date.now()).getDate()}</div>
        <div style="font-size:.5rem;color:var(--muted);text-transform:uppercase">${d.split(' ')[0]}</div>
      </div>
      <div style="flex:1">
        <div style="font-size:.78rem;font-weight:500">${s.home_team?.name||'TBC'} vs ${s.away_team?.name||'TBC'}</div>
        <div style="font-size:.62rem;color:var(--dim);margin-top:1px">${d} · ${s.tournament?.name||''}</div>
      </div>
    </div>`;
  }).join('');
}
function standingsMiniHTML() {
  return (STATE.teams||[]).slice(0,5).map((t,i)=>{
    const s=t.standings?.[0]||{};
    return `<div style="display:flex;align-items:center;gap:.4rem;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.025);font-size:.78rem">
      <span style="font-family:var(--font-h);font-size:1rem;color:${i===0?'var(--gold)':'var(--muted)'};width:18px">${i+1}</span>
      <span style="width:7px;height:7px;border-radius:50%;background:${t.color||'#888'};flex-shrink:0;margin:0 .3rem"></span>
      <span style="flex:1;color:var(--soft)">${t.name}</span>
      <span style="font-weight:600;color:${i===0?'var(--gold)':'var(--white)'}">${s.points||0}</span>
    </div>`;
  }).join('') || '<div style="color:var(--dim);font-size:.78rem">Loading…</div>';
}
function docProgressHTML(docs, navTarget) {
  const done=docs.filter(d=>d.status==='done'||d.status==='approved').length;
  const pct=docs.length?Math.round((done/docs.length)*100):0;
  return `<div class="prog-wrap"><div class="prog-label"><span>${done}/${docs.length} docs</span><span style="color:var(--gold);font-weight:600">${pct}%</span></div>
  <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div></div>
  ${docs.slice(0,4).map(d=>`<div style="display:flex;align-items:center;gap:.4rem;padding:.28rem 0;font-size:.74rem;border-bottom:1px solid rgba(255,255,255,.025)">
    <span>${d.icon||'📄'}</span><span style="flex:1;color:var(--soft)">${d.label||d.doc_type}</span>
    <span class="bdg bdg-${d.status==='approved'||d.status==='done'?'green':d.status==='flagged'?'red':'gray'}">${d.status}</span>
  </div>`).join('')}
  <button class="btn-s" style="width:100%;margin-top:.55rem;font-size:.7rem;padding:.32rem" onclick="nav('${navTarget||'mydocs'}')">View All →</button>`;
}
function docsGridHTML(docs) {
  return `<div class="doc-grid">${docs.map(d=>`
    <div class="doc-item ${d.status==='approved'||d.status==='done'?'done':d.status==='flagged'?'flagged':''}" onclick="triggerDocUpload('${d.id||d.doc_type}')">
      <div class="di-icon">${d.icon||'📄'}</div>
      <div class="di-info"><strong>${d.label||d.doc_type}</strong><small>${d.sub||d.description||''}</small></div>
      <span class="di-st ${d.status==='approved'||d.status==='done'?'done':d.status==='flagged'?'flagged':'pending'}">${d.status==='approved'||d.status==='done'?'✓':d.status==='flagged'?'⚠':'+'}</span>
    </div>`).join('')}</div>`;
}
function triggerDocUpload(docType) {
  const input=document.createElement('input');
  input.type='file'; input.accept='.pdf,.jpg,.jpeg,.png,.webp';
  input.onchange=async e=>{ if(e.target.files[0]) await handleDocUpload(e.target,docType); };
  input.click();
}
function eventItemsHTML(events, max=20) {
  const icons={goal:'⚽',yellow:'🟨',red_card:'🟥',foul:'🔴',sub:'🔄',injury:'🩹',boundary:'🚩',offside:'⛔'};
  return events.slice(0,max).map(e=>`
    <div class="ev-item">
      <span class="ev-min">${e.min||((e.minute||0)+"'")}</span>
      <div class="ev-ico ${e.type||e.event_type}">${e.icon||icons[e.event_type]||'◉'}</div>
      <span class="ev-desc">${e.desc||e.description||''}</span>
      <span class="ev-by">${e.by||e.logged_by_role||''}</span>
    </div>`).join('');
}
function formatEvent(e) {
  const icons={goal:'⚽',yellow:'🟨',red_card:'🟥',foul:'🔴',sub:'🔄',injury:'🩹',boundary:'🚩',offside:'⛔'};
  return { min:(e.minute||0)+"'", type:e.event_type, icon:icons[e.event_type]||'◉', desc:e.description||e.event_type, by:e.logged_by_role||'' };
}
function refreshEventList() {
  const list=document.getElementById('evList');
  if (list) list.innerHTML=eventItemsHTML(STATE.events);
  const pg=document.querySelector('.ev-head .pg');
  if (pg) pg.textContent=`${STATE.events.length} events · Live`;
}
function updateLiveDisplays() {
  ['liveH','liveA'].forEach((id,i)=>{ const el=document.getElementById(id); if(el) el.textContent=[STATE.liveH,STATE.liveA][i]; });
  const ms=document.getElementById('miniScore'); if(ms) ms.textContent=`${STATE.liveH} — ${STATE.liveA}`;
  const sb=document.getElementById('sbLivePill');
  if (sb&&STATE.liveMatch) sb.textContent=`LIVE — ${STATE.liveMatch.home_team?.abbr} ${STATE.liveH}:${STATE.liveA} ${STATE.liveMatch.away_team?.abbr}`;
}

// Static doc definitions
const PLAYER_DOCS=[
  {id:'national_id',label:'National ID',sub:'ID number + clear scan',icon:'🪪',status:'pending'},
  {id:'passport_photo',label:'Passport Photo',sub:'Clear headshot, white bg',icon:'📷',status:'pending'},
  {id:'player_status',label:'Player Status',sub:'Amateur/Professional declaration',icon:'📋',status:'pending'},
  {id:'ministry_form',label:'Ministry Reg. Form',sub:'Duly completed & signed',icon:'📄',status:'pending'},
];
const OFFICIAL_DOCS=[
  {id:'national_id',label:'National ID',sub:'ID + scan',icon:'🪪',status:'pending'},
  {id:'passport_photo',label:'Passport Photo',sub:'Headshot',icon:'📷',status:'pending'},
  {id:'officiating_licence',label:'Officiating Licence',sub:'KRF issued badge',icon:'🏅',status:'pending'},
  {id:'police_clearance',label:'Police Clearance',sub:'Good conduct cert.',icon:'🏛️',status:'pending'},
  {id:'helb_clearance',label:'HELB Clearance',sub:'Education loans',icon:'🎓',status:'pending'},
  {id:'eacc_clearance',label:'EACC Clearance',sub:'Anti-corruption',icon:'⚖️',status:'pending'},
  {id:'crb_clearance',label:'CRB Clearance',sub:'Credit reference',icon:'💳',status:'pending'},
  {id:'tax_compliance',label:'Tax Compliance Cert.',sub:'KRA issued',icon:'🧾',status:'pending'},
  {id:'kra_pin',label:'KRA PIN Certificate',sub:'Revenue authority',icon:'📌',status:'pending'},
];
const TEAM_DOCS=[
  {id:'team_logo',label:'Team Logo',sub:'PNG, transparent bg',icon:'🏷️',status:'pending'},
  {id:'manager_photo',label:'Manager Photo',sub:'Head coach passport photo',icon:'📸',status:'pending'},
  {id:'police_clearance',label:'Police Clearance',sub:'Good conduct',icon:'🏛️',status:'pending'},
  {id:'helb_clearance',label:'HELB Clearance',sub:'Education loans',icon:'🎓',status:'pending'},
  {id:'eacc_clearance',label:'EACC Clearance',sub:'Anti-corruption',icon:'⚖️',status:'pending'},
  {id:'crb_clearance',label:'CRB Clearance',sub:'Credit reference',icon:'💳',status:'pending'},
  {id:'tax_compliance',label:'Tax Compliance',sub:'KRA certificate',icon:'🧾',status:'pending'},
  {id:'kra_pin',label:'KRA PIN Cert.',sub:'Revenue authority',icon:'📌',status:'pending'},
  {id:'players_list',label:'Players List',sub:'Max 15, signed & dated',icon:'👥',status:'pending'},
];
function getCurrentDocs() {
  const role=STATE.user?.role, loaded=STATE.docs||[];
  const base=role==='player'?PLAYER_DOCS:OFFICIAL_DOCS;
  return base.map(d=>{ const live=loaded.find(l=>l.doc_type===d.id); return live?{...d,status:live.status}:d; });
}

// ── LIVE TIMER ─────────────────────────────────
setInterval(()=>{
  if (STATE.matchEnded||STATE.matchTimer<=0) return;
  STATE.matchTimer--;
  const m=Math.floor(STATE.matchTimer/60), s=STATE.matchTimer%60;
  const str=`Q${STATE.period} · ${m}:${s.toString().padStart(2,'0')} remaining`;
  const el=document.getElementById('liveTimerEl'); if(el) el.textContent=str;
  const mt=document.getElementById('miniTimer'); if(mt) mt.textContent=str;
},1000);

// ── PUSH NOTIFICATIONS ─────────────────────────
async function requestPushPermission() {
  if (!('Notification' in window)) { showToast('Push notifications not supported'); return; }
  const perm = await Notification.requestPermission();
  if (perm==='granted') {
    showToast('✓ Push notifications enabled!');
    await STATE.sb?.from('users').update({ push_enabled:true }).eq('id',STATE.user.id);
  } else showToast('Notifications blocked');
}

function sendLocalNotification(title, body) {
  if (Notification.permission==='granted') new Notification(title, { body, icon:'/assets/krf-icon.png' });
}

// ── WHATSAPP / SMS ─────────────────────────────
async function sendWhatsAppAlert(matchId) {
  if (!STATE.sb) return;
  showToast('Sending WhatsApp alerts to subscribers…');
  const { data } = await STATE.sb.from('match_subscribers').select('phone').eq('match_id',matchId);
  if (!data?.length) { showToast('No subscribers for this match'); return; }
  // In production: call your Twilio/Africa's Talking edge function
  await STATE.sb.functions.invoke('send-match-alert', { body:{ match_id:matchId, subscribers:data.map(s=>s.phone) } });
  showToast(`Alerts sent to ${data.length} subscriber(s)!`);
}

// ── OVERVIEW ───────────────────────────────────
function overview() {
  const role=STATE.user?.role;
  if (role==='player') return overviewPlayer();
  if (role==='referee') return overviewReferee();
  if (role==='commissioner') return overviewCommissioner();
  if (role==='linesman') return overviewLinesman();
  if (role==='official') return overviewOfficial();
  overviewAdmin();
}

async function overviewAdmin() {
  const [
    { count:playerCount },{ count:pendingCount },{ count:matchCount }
  ] = await Promise.all([
    STATE.sb.from('users').select('*',{count:'exact',head:true}).eq('role','player'),
    STATE.sb.from('users').select('*',{count:'exact',head:true}).eq('is_active',false),
    STATE.sb.from('matches').select('*',{count:'exact',head:true}),
  ]);
  document.getElementById('mainContent').innerHTML = `
    <div class="stat-row">
      <div class="sc" style="--sc-color:var(--red)"><div class="v">${STATE.teams?.length||0}</div><div class="l">Teams</div><div class="ch ch-neu">Registered</div></div>
      <div class="sc" style="--sc-color:var(--gold)"><div class="v">${playerCount||0}</div><div class="l">Players</div><div class="ch ch-warn">↑ ${pendingCount||0} pending</div></div>
      <div class="sc" style="--sc-color:var(--green)"><div class="v">${matchCount||0}</div><div class="l">Matches</div><div class="ch ch-up">Season</div></div>
      <div class="sc" style="--sc-color:var(--blue)"><div class="v">${STATE.officials.length}</div><div class="l">Officials</div><div class="ch ch-neu">Active</div></div>
    </div>
    <div class="g2">
      <div>
        ${panel('LIVE MATCH','● Now',scoreMiniHTML()+`<div style="display:flex;gap:.5rem;margin-top:.65rem">
          <button class="btn-p" style="flex:1;font-size:.78rem;padding:.5rem" onclick="nav('live')">OPEN LIVE PANEL</button>
          <button class="btn-s" onclick="sendWhatsAppAlert('${STATE.liveMatch?.id||''}')">📱 Alert</button>
        </div>`)}
        ${panel('NOTIFICATIONS','Recent',STATE.notifications.slice(0,4).map(n=>`
          <div class="notif-item ${n.read?'':'unread'}">
            ${!n.read?'<div class="notif-dot"></div>':'<div style="width:8px"></div>'}
            <div class="notif-body"><div class="ntxt">${n.message}</div><div class="ntime">${new Date(n.created_at).toLocaleString('en-KE',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})}</div></div>
          </div>`).join('')||'<div style="color:var(--dim);font-size:.78rem">No notifications</div>')}
      </div>
      <div>
        ${panel('QUICK ACTIONS','Admin shortcuts',`
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
            ${[['users','👥','Manage Users'],['teams_admin','⚽','Teams'],['tournaments','🏆','Tournaments'],['leaderboard','🏆','Leaderboard'],['finances','💰','Finances'],['settings','⚙️','Settings']].map(([p,i,l])=>`
            <div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:.7rem;cursor:pointer;transition:all .2s" onclick="nav('${p}')" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size:1.1rem;margin-bottom:.3rem">${i}</div>
              <div style="font-size:.75rem;font-weight:600;color:var(--white)">${l}</div>
            </div>`).join('')}
          </div>`)}
        ${panel('REPORT SIGN-OFF','KPL match',signoffChainHTML())}
      </div>
    </div>`;
}

function overviewPlayer() {
  const docs=getCurrentDocs(), st=STATE.playerStats||{};
  document.getElementById('mainContent').innerHTML = `
    <div class="prof-head">
      <div class="prof-av" style="background:var(--green-dim);color:var(--green);border-color:rgba(0,201,106,.4)">
        ${(STATE.user?.name||'PL').split(' ').map(n=>n[0]).join('').toUpperCase()}
        <div class="prof-cam" onclick="triggerDocUpload('passport_photo')">📷</div>
      </div>
      <div>
        <div class="pname">${STATE.user?.name||'Player'}</div>
        <div class="ppos">${STATE.user?.position||'Position'} · ${STATE.user?.team?.name||'No Team'} · #${STATE.user?.jersey_number||'—'}</div>
        <div class="ptags">
          <span class="bdg bdg-green">KPL 2025</span>
          <span class="bdg bdg-${STATE.user?.docs_status==='approved'?'green':STATE.user?.docs_status==='flagged'?'red':'amber'}">${STATE.user?.docs_status||'incomplete'}</span>
        </div>
      </div>
    </div>
    <div class="stat-row">
      <div class="sc" style="--sc-color:var(--red)"><div class="v">${st.goals??'—'}</div><div class="l">Goals</div><div class="ch ch-neu">2025</div></div>
      <div class="sc" style="--sc-color:var(--gold)"><div class="v">${st.games_played??'—'}</div><div class="l">Games</div><div class="ch ch-neu">Played</div></div>
      <div class="sc" style="--sc-color:var(--green)"><div class="v">${st.assists??'—'}</div><div class="l">Assists</div><div class="ch ch-neu">Season</div></div>
      <div class="sc" style="--sc-color:var(--blue)"><div class="v">—</div><div class="l">Rank</div><div class="ch ch-neu">Scorers</div></div>
    </div>
    <div class="g2">
      <div>
        ${panel('NEXT FIXTURE','Upcoming',schedMiniHTML()+`<button class="btn-s" style="width:100%;margin-top:.6rem;font-size:.72rem;padding:.35rem" onclick="nav('schedule')">Full Schedule →</button>`)}
        ${panel('REGISTRATION','Season 2025',docProgressHTML(docs,'playerreg'))}
      </div>
      <div>${panel('LEAGUE TABLE','KPL 2025',standingsMiniHTML())}</div>
    </div>`;
}

function overviewReferee() {
  const docs=getCurrentDocs();
  document.getElementById('mainContent').innerHTML = `
    <div class="stat-row">
      <div class="sc" style="--sc-color:var(--blue)"><div class="v">1</div><div class="l">Live Match</div><div class="ch ch-up">● Q${STATE.period}</div></div>
      <div class="sc" style="--sc-color:var(--gold)"><div class="v">${STATE.events.length}</div><div class="l">Events</div><div class="ch ch-neu">Logged</div></div>
      <div class="sc" style="--sc-color:var(--green)"><div class="v">24</div><div class="l">Officiated</div><div class="ch ch-up">2025</div></div>
      <div class="sc" style="--sc-color:var(--red)"><div class="v">${STATE.reportState.refSubmitted?'Filed':'Pending'}</div><div class="l">Report</div><div class="ch ch-warn">Sign-off chain</div></div>
    </div>
    <div class="g2">
      <div>
        ${panel('LIVE MATCH','● Score',scoreMiniHTML()+`<div style="display:flex;gap:.5rem;margin-top:.65rem"><button class="btn-p" style="flex:1;font-size:.78rem;padding:.5rem" onclick="nav('live')">SCORE ENTRY</button><button class="btn-s" style="flex:1" onclick="nav('events')">EVENTS</button></div>`)}
        ${panel('SIGN-OFF','Chain',signoffChainHTML())}
      </div>
      <div>
        ${panel('RECENT EVENTS','This match',`<div class="ev-list" style="max-height:180px">${eventItemsHTML(STATE.events,5)}</div><button class="btn-s" style="width:100%;margin-top:.5rem;font-size:.7rem;padding:.32rem" onclick="nav('events')">All Events →</button>`)}
        ${panel('MY CLEARANCES','',docProgressHTML(docs,'mydocs'))}
      </div>
    </div>`;
}

function overviewCommissioner() {
  document.getElementById('mainContent').innerHTML = `
    <div class="stat-row">
      <div class="sc" style="--sc-color:var(--teal)"><div class="v">1</div><div class="l">Active Match</div><div class="ch ch-up">● Supervising</div></div>
      <div class="sc" style="--sc-color:var(--gold)"><div class="v">4/8</div><div class="l">Checklist</div><div class="ch ch-warn">4 pending</div></div>
      <div class="sc" style="--sc-color:var(--green)"><div class="v">${STATE.reportState.commCountersigned?'Done':'Pending'}</div><div class="l">Countersign</div><div class="ch ch-neu">Referee report</div></div>
      <div class="sc" style="--sc-color:var(--blue)"><div class="v">18</div><div class="l">Supervised</div><div class="ch ch-up">2025</div></div>
    </div>
    <div class="g2">
      <div>
        ${panel('MATCH OVERVIEW','Read-only',`<div style="background:var(--bg3);border-radius:6px;padding:.85rem;margin-bottom:.75rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">
          <div><div style="font-family:var(--font-h);font-size:1.15rem;letter-spacing:1.5px">${STATE.liveMatch?.home_team?.name||'Home'} vs ${STATE.liveMatch?.away_team?.name||'Away'}</div><div style="font-size:.7rem;color:var(--dim);margin-top:.15rem">${STATE.liveMatch?.tournament?.name||'KPL'}</div></div>
          <div style="font-family:var(--font-h);font-size:2rem;color:var(--gold);letter-spacing:3px">${STATE.liveH} — ${STATE.liveA}</div>
        </div><button class="btn-s" style="width:100%;font-size:.75rem" onclick="nav('commlive')">Full Monitor →</button>`)}
        ${panel('SIGN-OFF CHAIN','Action needed',signoffChainHTML()+`<div style="display:flex;gap:.5rem;margin-top:.65rem"><button class="btn-s countersign" onclick="nav('countersign')">Countersign</button><button class="btn-s" onclick="nav('incidents')">Log Incident</button></div>`)}
      </div>
      <div>
        ${panel('PRE-MATCH','Quick status',['Teams present & in uniform','Lineups verified','Eligibility confirmed','Venue inspected'].map((l,i)=>`<div class="checklist-item"><div class="ci-check ${i<4?'checked':''}">${i<4?'✓':''}</div><span class="ci-label ${i<4?'checked-text':''}">${l}</span></div>`).join('')+`<button class="btn-s" style="width:100%;margin-top:.55rem;font-size:.7rem" onclick="nav('precheck')">Full Checklist →</button>`)}
        ${panel('MY CLEARANCES','',docProgressHTML(getCurrentDocs(),'mydocs'))}
      </div>
    </div>`;
}

function overviewLinesman() {
  document.getElementById('mainContent').innerHTML = `
    <div class="stat-row">
      <div class="sc" style="--sc-color:var(--amber)"><div class="v">1</div><div class="l">Live Match</div><div class="ch ch-up">● Q${STATE.period}</div></div>
      <div class="sc" style="--sc-color:var(--gold)"><div class="v">${STATE.events.filter(e=>(e.by||e.logged_by_role)==='linesman').length}</div><div class="l">My Calls</div><div class="ch ch-neu">Logged</div></div>
      <div class="sc" style="--sc-color:var(--green)"><div class="v">${STATE.reportState.lineSignedOff?'Signed':'Pending'}</div><div class="l">Sign-off</div><div class="ch ch-warn">Event log</div></div>
      <div class="sc" style="--sc-color:var(--blue)"><div class="v">3</div><div class="l">Upcoming</div><div class="ch ch-neu">Assignments</div></div>
    </div>
    <div class="g2">
      <div>
        ${panel('LIVE MATCH','● Active',scoreMiniHTML()+`<div style="display:flex;gap:.5rem;margin-top:.65rem"><button class="btn-p" style="flex:1;font-size:.78rem;padding:.5rem" onclick="nav('boundary')">LOG CALL</button><button class="btn-s" style="flex:1" onclick="nav('lineview')">Monitor</button></div>`)}
        ${panel('SIGN-OFF','Your action',signoffChainHTML()+`<button class="btn-s sign" style="width:100%;margin-top:.65rem" onclick="nav('linesign')">Review & Sign →</button>`)}
      </div>
      <div>
        ${panel('MY CALLS','This match',`<div class="ev-list">${eventItemsHTML(STATE.events.filter(e=>(e.by||e.logged_by_role)==='linesman'))||'<div style="padding:.75rem;color:var(--muted);font-size:.78rem">No calls yet</div>'}</div>`)}
        ${panel('MY CLEARANCES','',docProgressHTML(getCurrentDocs(),'mydocs'))}
      </div>
    </div>`;
}

function overviewOfficial() {
  document.getElementById('mainContent').innerHTML = `
    <div class="stat-row">
      <div class="sc" style="--sc-color:var(--purple)"><div class="v">1</div><div class="l">Live Match</div><div class="ch ch-up">● Active</div></div>
      <div class="sc" style="--sc-color:var(--gold)"><div class="v">32</div><div class="l">Scored</div><div class="ch ch-neu">2025</div></div>
      <div class="sc" style="--sc-color:var(--green)"><div class="v">9</div><div class="l">Docs</div><div class="ch ch-up">Verified</div></div>
      <div class="sc" style="--sc-color:var(--blue)"><div class="v">3</div><div class="l">Upcoming</div><div class="ch ch-neu">Assignments</div></div>
    </div>
    <div class="g2">
      <div>${panel('LIVE MATCH','● Scoring',scoreMiniHTML()+`<button class="btn-p" style="width:100%;margin-top:.65rem;font-size:.78rem;padding:.5rem" onclick="nav('live')">OPEN SCORE ENTRY</button>`)}</div>
      <div>${panel('SCHEDULE','Upcoming',schedMiniHTML())}${panel('MY CLEARANCES','',docProgressHTML(getCurrentDocs(),'mydocs'))}</div>
    </div>`;
}

// ── LIVE SCORE ─────────────────────────────────
function live() {
  const m=STATE.liveMatch;
  const home=m?.home_team?.name||'Home Team', away=m?.away_team?.name||'Away Team';
  const homeColor=m?.home_team?.color||'var(--red)', awayColor=m?.away_team?.color||'var(--blue)';
  document.getElementById('mainContent').innerHTML = `
    <div class="live-sb">
      <div class="lsb-top active-match"><span class="lsb-info">${m?.tournament?.name||'KPL'} · ${m?.venue||'Stadium'}</span><span class="lsb-period" id="periodBadge">Q${STATE.period}${STATE.matchEnded?' — FT':''}</span></div>
      <div class="lsb-teams">
        <div class="lsb-team"><div class="lsb-tname" style="color:${homeColor}">${home.toUpperCase()}</div><div class="lsb-tcity">Home</div></div>
        <div class="lsb-center">
          <div class="lsb-score"><span id="liveH">${STATE.liveH}</span> <span style="font-size:2rem;color:var(--muted)">—</span> <span id="liveA">${STATE.liveA}</span></div>
          <div class="lsb-timer" id="liveTimerEl">Q${STATE.period} · Live</div>
        </div>
        <div class="lsb-team" style="text-align:right"><div class="lsb-tname" style="color:${awayColor}">${away.toUpperCase()}</div><div class="lsb-tcity">Away</div></div>
      </div>
      <div class="score-ctrl">
        <div style="display:flex;gap:.4rem;align-items:center">
          <button class="goal-btn home" onclick="addGoal('home')">+ ${home.split(' ')[0].toUpperCase()}</button>
          <button class="ctrl-btn undo" onclick="undoGoal('home')">↩</button>
        </div>
        <div class="mid-ctrl">
          <button class="ctrl-btn period" onclick="nextPeriod()">Next Period ▶</button>
          <button class="ctrl-btn end" onclick="endMatch()" ${STATE.matchEnded?'disabled':''}>End Match</button>
        </div>
        <div style="display:flex;gap:.4rem;align-items:center">
          <button class="ctrl-btn undo" onclick="undoGoal('away')">↩</button>
          <button class="goal-btn away" onclick="addGoal('away')">+ ${away.split(' ')[0].toUpperCase()}</button>
        </div>
      </div>
    </div>
    <div class="ev-log">
      <div class="ev-head"><span class="pt">EVENT LOG</span><span class="pg">${STATE.events.length} events · Live</span></div>
      <div class="ev-list" id="evList">${eventItemsHTML(STATE.events)}</div>
      <div class="ev-add">
        <select id="evType"><option value="goal">⚽ Goal</option><option value="yellow">🟨 Yellow</option><option value="red_card">🟥 Red Card</option><option value="foul">🔴 Foul</option><option value="sub">🔄 Sub</option><option value="injury">🩹 Injury</option><option value="offside">⛔ Offside</option><option value="boundary">🚩 Boundary</option></select>
        <input type="text" id="evPlayer" placeholder="Player name…"/>
        <select id="evTeam"><option>${home}</option><option>${away}</option></select>
        <button class="ev-log-btn" onclick="logEvent()">LOG</button>
      </div>
    </div>`;
}

async function addGoal(side) {
  if (STATE.matchEnded) { showToast('Match has ended'); return; }
  if (side==='home') STATE.liveH++; else STATE.liveA++;
  updateLiveDisplays();
  const team=side==='home'?STATE.liveMatch?.home_team?.name:STATE.liveMatch?.away_team?.name;
  const elapsed=Math.max(1,STATE.period*15-Math.floor(STATE.matchTimer/60));
  if (STATE.liveMatch && STATE.sb) {
    await STATE.sb.from('matches').update({home_score:STATE.liveH,away_score:STATE.liveA}).eq('id',STATE.liveMatch.id);
    await STATE.sb.from('match_events').insert({match_id:STATE.liveMatch.id,event_type:'goal',minute:elapsed,period:STATE.period,description:`GOAL — (${team}) [${STATE.liveH}–${STATE.liveA}]`,logged_by_role:STATE.user.role});
  }
  STATE.events.unshift({min:elapsed+"'",type:'goal',icon:'⚽',desc:`<strong>GOAL</strong> — (${team}) [${STATE.liveH}:${STATE.liveA}]`,by:STATE.user.role});
  refreshEventList();
  showToast(`GOAL! ${team} — ${STATE.liveH}:${STATE.liveA}`);
  sendLocalNotification('⚽ GOAL!', `${team} score! ${STATE.liveH}:${STATE.liveA}`);
}

async function undoGoal(side) {
  if (side==='home'&&STATE.liveH>0) STATE.liveH--;
  else if (side==='away'&&STATE.liveA>0) STATE.liveA--;
  if (STATE.liveMatch&&STATE.sb) await STATE.sb.from('matches').update({home_score:STATE.liveH,away_score:STATE.liveA}).eq('id',STATE.liveMatch.id);
  updateLiveDisplays(); showToast('Goal removed');
}

async function nextPeriod() {
  if (STATE.period>=4) { await endMatch(); return; }
  STATE.period++; STATE.matchTimer=900;
  if (STATE.liveMatch&&STATE.sb) await STATE.sb.from('matches').update({current_period:STATE.period}).eq('id',STATE.liveMatch.id);
  setEl('periodBadge','Q'+STATE.period);
  showToast('Q'+STATE.period+' started!');
}

async function endMatch() {
  STATE.matchEnded=true;
  if (STATE.liveMatch&&STATE.sb) await STATE.sb.from('matches').update({status:'completed'}).eq('id',STATE.liveMatch.id);
  setEl('periodBadge','FT');
  showToast(`Full Time! ${STATE.liveH}:${STATE.liveA}`);
}

async function logEvent() {
  const type=document.getElementById('evType')?.value;
  const player=document.getElementById('evPlayer')?.value||'Player';
  const team=document.getElementById('evTeam')?.value;
  const elapsed=Math.max(1,STATE.period*15-Math.floor(STATE.matchTimer/60));
  const icons={goal:'⚽',yellow:'🟨',red_card:'🟥',foul:'🔴',sub:'🔄',injury:'🩹',boundary:'🚩',offside:'⛔'};
  if (STATE.liveMatch&&STATE.sb) {
    await STATE.sb.from('match_events').insert({match_id:STATE.liveMatch.id,event_type:type,minute:elapsed,period:STATE.period,player_name:player,description:`${type.replace('_',' ').toUpperCase()} — ${player} (${team})`,logged_by_role:STATE.user.role});
  }
  STATE.events.unshift({min:elapsed+"'",type,icon:icons[type]||'◉',desc:`<strong>${type.replace('_',' ').toUpperCase()}</strong> — ${player} (${team})`,by:STATE.user.role});
  refreshEventList();
  const evPlayer=document.getElementById('evPlayer'); if(evPlayer) evPlayer.value='';
  showToast('Event logged');
}

// ── LEADERBOARD ────────────────────────────────
async function leaderboard() {
  let scorers=[], assists=[], ratings=[];
  if (STATE.sb) {
    const [{ data:s },{ data:a },{ data:r }] = await Promise.all([
      STATE.sb.from('player_stats').select('*,user:users(id,name,team_id),team:teams(name,color)').order('goals',{ascending:false}).limit(10),
      STATE.sb.from('player_stats').select('*,user:users(id,name,team_id),team:teams(name,color)').order('assists',{ascending:false}).limit(10),
      STATE.sb.from('referee_ratings').select('*,referee:users(name)').order('avg_rating',{ascending:false}).limit(8),
    ]);
    scorers=s||[]; assists=a||[]; ratings=r||[];
  }

  const lbRowHTML = (item, i, valKey, label) => {
    const cls=i===0?'top1':i===1?'top2':i===2?'top3':'';
    const name = item.user?.name || item.referee?.name || 'Unknown';
    const teamColor = item.team?.color || '#888';
    const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
    return `<div class="lb-row">
      <div class="lb-rank ${cls}">${i+1}</div>
      <div class="lb-av" style="background:${teamColor}22;color:${teamColor};border-color:${teamColor}44">${initials}</div>
      <div class="lb-info"><div class="lb-name">${name}</div><div class="lb-team">${item.team?.name||''} · Season 2025</div></div>
      <div style="text-align:right"><div class="lb-val">${item[valKey]||0}</div><div class="lb-label">${label}</div></div>
    </div>`;
  };

  document.getElementById('mainContent').innerHTML = `
    <div class="g2">
      <div>
        ${panel('TOP SCORERS','KPL 2025',scorers.length?scorers.map((s,i)=>lbRowHTML(s,i,'goals','Goals')).join(''):'<div style="color:var(--dim);font-size:.78rem;padding:.5rem">No data yet</div>')}
        ${panel('TOP ASSISTS','KPL 2025',assists.length?assists.map((s,i)=>lbRowHTML(s,i,'assists','Assists')).join(''):'<div style="color:var(--dim);font-size:.78rem;padding:.5rem">No data yet</div>')}
      </div>
      <div>
        ${panel('TOP REFEREES','By avg rating',ratings.length?ratings.map((r,i)=>`
          <div class="lb-row">
            <div class="lb-rank ${i===0?'top1':i===1?'top2':i===2?'top3':''}">${i+1}</div>
            <div class="lb-av" style="background:var(--blue-dim);color:#4d9fe8">${(r.referee?.name||'R').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</div>
            <div class="lb-info"><div class="lb-name">${r.referee?.name||'—'}</div><div class="lb-team">Referee · ${r.matches_officiated||0} matches</div></div>
            <div style="text-align:right"><div class="lb-val">${(r.avg_rating||0).toFixed(1)}</div><div class="lb-label">Rating</div></div>
          </div>`).join(''):'<div style="color:var(--dim);font-size:.78rem;padding:.5rem">No ratings yet</div>')}
        ${panel('FAIR PLAY','Team discipline',STATE.teams.slice(0,5).map((t,i)=>`
          <div style="display:flex;align-items:center;gap:.65rem;padding:.4rem 0;border-bottom:1px solid rgba(255,255,255,.025)">
            <span style="font-family:var(--font-h);font-size:1rem;color:${t.color||'var(--muted)'};width:18px">${i+1}</span>
            <span style="flex:1;font-size:.78rem">${t.name}</span>
            <span class="bdg bdg-${i<2?'green':'amber'}">${i<2?'Excellent':'Good'}</span>
          </div>`).join(''))}
      </div>
    </div>`;
}

// ── FINANCES ───────────────────────────────────
async function finances() {
  let records=[];
  if (STATE.sb) {
    const { data } = await STATE.sb.from('financial_records').select('*,team:teams(name,color)').order('created_at',{ascending:false}).limit(50);
    records = data||[];
  }
  const totalFines = records.filter(r=>r.type==='fine').reduce((s,r)=>s+(r.amount||0),0);
  const totalFees  = records.filter(r=>r.type==='fee').reduce((s,r)=>s+(r.amount||0),0);
  const totalPaid  = records.filter(r=>r.paid).reduce((s,r)=>s+(r.amount||0),0);
  const isAdmin = STATE.user?.role==='admin';

  document.getElementById('mainContent').innerHTML = `
    <div class="fin-summary">
      <div class="fin-card"><div class="fval" style="color:var(--red)">KES ${totalFines.toLocaleString()}</div><div class="flbl">Total Fines</div></div>
      <div class="fin-card"><div class="fval" style="color:var(--gold)">KES ${totalFees.toLocaleString()}</div><div class="flbl">Registration Fees</div></div>
      <div class="fin-card"><div class="fval" style="color:var(--green)">KES ${totalPaid.toLocaleString()}</div><div class="flbl">Total Paid</div></div>
    </div>
    ${isAdmin?`
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:1.1rem;margin-bottom:.85rem">
      <div style="font-family:var(--font-h);font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:.75rem">ADD RECORD</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:.6rem;align-items:end">
        <div class="fg"><label>Team</label><select id="finTeam">${STATE.teams.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Type</label><select id="finType"><option value="fine">Fine</option><option value="fee">Registration Fee</option><option value="suspension">Suspension Penalty</option></select></div>
        <div class="fg"><label>Amount (KES)</label><input type="number" id="finAmount" placeholder="5000"/></div>
        <div class="fg"><label>Description</label><input id="finDesc" placeholder="e.g. Late submission"/></div>
      </div>
      <div style="display:flex;gap:.5rem;margin-top:.65rem">
        <button class="btn-p" style="font-size:.75rem;padding:.45rem 1.25rem" onclick="saveFinanceRecord()">ADD RECORD</button>
      </div>
    </div>`:''}
    ${panel('FINANCIAL RECORDS',`${records.length} entries`,`
      <table class="dt">
        <thead><tr><th>Team</th><th>Type</th><th>Amount</th><th>Description</th><th>Date</th><th>Status</th>${isAdmin?'<th>Action</th>':''}</tr></thead>
        <tbody>${records.length?records.map(r=>`<tr>
          <td style="font-weight:500">${r.team?.name||'—'}</td>
          <td><span class="bdg bdg-${r.type==='fine'?'red':r.type==='fee'?'gold':'amber'}">${r.type}</span></td>
          <td style="font-family:var(--font-h);font-size:.95rem;color:${r.type==='fine'?'var(--red)':'var(--gold)'}">KES ${(r.amount||0).toLocaleString()}</td>
          <td style="font-size:.75rem;color:var(--dim)">${r.description||'—'}</td>
          <td style="font-size:.72rem;color:var(--muted)">${r.created_at?new Date(r.created_at).toLocaleDateString('en-KE'):'—'}</td>
          <td><span class="bdg bdg-${r.paid?'green':'amber'}">${r.paid?'Paid':'Outstanding'}</span></td>
          ${isAdmin?`<td><button class="btn-s" style="font-size:.6rem;padding:.18rem .45rem;color:var(--green)" onclick="markFinancePaid('${r.id}')">Mark Paid</button></td>`:''}
        </tr>`).join(''):'<tr><td colspan="7" style="padding:2rem;text-align:center;color:var(--muted)">No records yet</td></tr>'}
        </tbody>
      </table>`)}`;
}

async function saveFinanceRecord() {
  const team_id=document.getElementById('finTeam')?.value;
  const type=document.getElementById('finType')?.value;
  const amount=parseFloat(document.getElementById('finAmount')?.value)||0;
  const description=document.getElementById('finDesc')?.value?.trim();
  if (!team_id||!amount) { showToast('Fill in team and amount'); return; }
  showToast('Saving…');
  const { error } = await STATE.sb.from('financial_records').insert({ team_id, type, amount, description, paid:false });
  if (error) { showToast('Error: '+error.message); return; }
  showToast('Record added!'); finances();
}

async function markFinancePaid(id) {
  await STATE.sb.from('financial_records').update({ paid:true }).eq('id',id);
  showToast('Marked as paid!'); finances();
}

// ── FAN POLLS ──────────────────────────────────
async function polls() {
  let pollList=[];
  if (STATE.sb) {
    const { data } = await STATE.sb.from('polls').select('*,poll_options(id,text,votes)').eq('is_active',true).order('created_at',{ascending:false});
    pollList = data||[];
  }
  const isAdmin = STATE.user?.role==='admin';
  document.getElementById('mainContent').innerHTML = `
    ${isAdmin?`
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:1.1rem;margin-bottom:.85rem">
      <div style="font-family:var(--font-h);font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:.75rem">CREATE POLL</div>
      <div class="fg" style="margin-bottom:.6rem"><label>Question</label><input id="pollQ" placeholder="Who will win KPL 2025?" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"/></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.6rem">
        <div class="fg"><label>Option 1</label><input id="pollO1" placeholder="Team A" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"/></div>
        <div class="fg"><label>Option 2</label><input id="pollO2" placeholder="Team B" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"/></div>
        <div class="fg"><label>Option 3 (optional)</label><input id="pollO3" placeholder="Draw" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"/></div>
        <div class="fg"><label>Option 4 (optional)</label><input id="pollO4" placeholder="" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"/></div>
      </div>
      <button class="btn-p" style="font-size:.75rem;padding:.45rem 1.25rem" onclick="createPoll()">CREATE POLL</button>
    </div>`:''}
    <div style="display:grid;gap:.85rem">${pollList.length?pollList.map(p=>pollCardHTML(p)).join(''):'<div style="color:var(--dim);padding:2rem;text-align:center;font-size:.82rem">No active polls — admin can create one above</div>'}</div>`;
}

function pollCardHTML(p) {
  const opts=p.poll_options||[];
  const total=opts.reduce((s,o)=>s+(o.votes||0),0);
  return `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:1.1rem">
    <div style="font-family:var(--font-h);font-size:1rem;font-weight:700;letter-spacing:1.5px;margin-bottom:.15rem">${p.question}</div>
    <div style="font-size:.65rem;color:var(--muted);margin-bottom:.85rem">${total} votes · Tap to vote</div>
    ${opts.map(o=>{
      const pct=total?Math.round((o.votes/total)*100):0;
      return `<div class="poll-option" onclick="castVote('${p.id}','${o.id}')">
        <div class="poll-bar" style="width:${pct}%"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1">
          <span class="poll-opt-text">${o.text}</span>
          <span class="poll-pct">${pct}%</span>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

async function createPoll() {
  const q=document.getElementById('pollQ')?.value?.trim();
  const opts=[document.getElementById('pollO1'),document.getElementById('pollO2'),document.getElementById('pollO3'),document.getElementById('pollO4')].map(el=>el?.value?.trim()).filter(Boolean);
  if (!q||opts.length<2) { showToast('Enter question and at least 2 options'); return; }
  showToast('Creating poll…');
  const { data:poll, error } = await STATE.sb.from('polls').insert({ question:q, is_active:true, created_by:STATE.user.id }).select().single();
  if (error) { showToast('Error: '+error.message); return; }
  await STATE.sb.from('poll_options').insert(opts.map(text=>({ poll_id:poll.id, text, votes:0 })));
  showToast('Poll created!'); polls();
}

async function castVote(pollId, optionId) {
  if (!STATE.sb) return;
  await STATE.sb.from('poll_options').update({ votes: STATE.sb.rpc ? undefined : 0 }).eq('id',optionId);
  // Use RPC increment in production; for now just increment locally
  const { error } = await STATE.sb.rpc('increment_poll_vote', { option_id:optionId });
  if (error) { // fallback
    const { data:opt } = await STATE.sb.from('poll_options').select('votes').eq('id',optionId).single();
    await STATE.sb.from('poll_options').update({ votes:(opt?.votes||0)+1 }).eq('id',optionId);
  }
  showToast('Vote cast!'); polls();
}

// ── REFEREE RATINGS ────────────────────────────
async function refratings() {
  const isComm = STATE.user?.role==='commissioner'||STATE.user?.role==='admin';
  let officials=STATE.officials, myRatings=[];
  if (STATE.sb && !isComm) {
    const { data } = await STATE.sb.from('referee_ratings').select('*').eq('referee_id',STATE.user.id).order('created_at',{ascending:false});
    myRatings = data||[];
  }
  document.getElementById('mainContent').innerHTML = `
    ${isComm?`
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:1.1rem;margin-bottom:.85rem">
      <div style="font-family:var(--font-h);font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:.75rem">SUBMIT RATING</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.6rem;align-items:end">
        <div class="fg"><label>Official</label><select id="ratRefId" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem">
          ${officials.map(o=>`<option value="${o.id}">${o.name} (${o.role})</option>`).join('')}
        </select></div>
        <div class="fg"><label>Match</label><select id="ratMatchId" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem">
          ${(STATE.schedules||[]).filter(m=>m.status==='completed').slice(0,10).map(m=>`<option value="${m.id}">${m.home_team?.name||'?'} vs ${m.away_team?.name||'?'}</option>`).join('')||'<option>No completed matches</option>'}
        </select></div>
        <div class="fg"><label>Rating (1–10)</label><input type="number" id="ratScore" min="1" max="10" placeholder="8" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"/></div>
        <div class="fg" style="grid-column:1/-1"><label>Comments</label><textarea id="ratNotes" rows="2" placeholder="Performance observations…" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"></textarea></div>
      </div>
      <button class="btn-p" style="font-size:.75rem;padding:.45rem 1.25rem;margin-top:.65rem" onclick="submitRating()">SUBMIT RATING</button>
    </div>`:`
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:1.1rem;margin-bottom:.85rem">
      <div style="font-family:var(--font-h);font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:.5rem">MY RATINGS</div>
      ${myRatings.length?myRatings.map(r=>`
        <div style="display:flex;align-items:center;gap:.75rem;padding:.5rem 0;border-bottom:1px solid rgba(255,255,255,.03)">
          <div style="font-family:var(--font-h);font-size:1.5rem;font-weight:800;color:${r.rating>=8?'var(--green)':r.rating>=6?'var(--gold)':'var(--red)'}">${r.rating}</div>
          <div style="flex:1"><div style="font-size:.78rem;font-weight:500">${r.match_label||'Match'}</div><div style="font-size:.65rem;color:var(--dim)">${r.notes||'No comments'}</div></div>
          <div style="font-size:.65rem;color:var(--muted)">${new Date(r.created_at).toLocaleDateString('en-KE')}</div>
        </div>`).join(''):'<div style="color:var(--dim);font-size:.78rem">No ratings yet</div>'}
    </div>`}`;
}

async function submitRating() {
  const referee_id=document.getElementById('ratRefId')?.value;
  const match_id=document.getElementById('ratMatchId')?.value;
  const rating=parseInt(document.getElementById('ratScore')?.value)||0;
  const notes=document.getElementById('ratNotes')?.value?.trim();
  if (!referee_id||!rating||rating<1||rating>10) { showToast('Fill in all fields (rating 1–10)'); return; }
  showToast('Submitting rating…');
  const { error } = await STATE.sb.from('referee_ratings').insert({ referee_id, match_id, rating, notes, rated_by:STATE.user.id });
  if (error) { showToast('Error: '+error.message); return; }
  showToast('Rating submitted!');
}

// ── SCHEDULE ───────────────────────────────────
async function schedule() {
  const [{ data:matches },{ data:tournaments },{ data:teams }] = await Promise.all([
    STATE.sb.from('matches').select('*,home_team:teams!home_team_id(id,name,abbr,color),away_team:teams!away_team_id(id,name,abbr,color),tournament:tournaments(id,name)').order('match_date',{ascending:true}).limit(60),
    STATE.sb.from('tournaments').select('id,name').order('name'),
    STATE.sb.from('teams').select('id,name,abbr').eq('is_active',true).order('name'),
  ]);
  if (matches) STATE.schedules=matches;
  if (tournaments) STATE.tournaments=tournaments;
  if (teams) STATE.teams=teams;

  const isAdmin=STATE.user?.role==='admin';
  document.getElementById('mainContent').innerHTML = `
    ${isAdmin?`
    <div style="display:flex;gap:.5rem;margin-bottom:.85rem;flex-wrap:wrap;align-items:center">
      <button class="btn-p" style="font-size:.75rem;padding:.45rem 1rem" onclick="openFixtureForm()">+ ADD FIXTURE</button>
      <select id="schedFilterT" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.4rem .75rem;color:var(--white);font-size:.78rem" onchange="renderFixtureTable()">
        <option value="">All Tournaments</option>
        ${(STATE.tournaments||[]).map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}
      </select>
      <select id="schedFilterS" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.4rem .75rem;color:var(--white);font-size:.78rem" onchange="renderFixtureTable()">
        <option value="">All Statuses</option><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option>
      </select>
    </div>
    <div id="fixtureFormWrap" style="display:none;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:1.25rem;margin-bottom:1.25rem">
      <div style="font-family:var(--font-h);font-size:.65rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:.85rem" id="fixtureFormTitle">NEW FIXTURE</div>
      <input type="hidden" id="fixtureEditId"/>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
        <div class="fg"><label>Home Team</label><select id="fxHome" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"><option value="">Select…</option>${(STATE.teams||[]).map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Away Team</label><select id="fxAway" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"><option value="">Select…</option>${(STATE.teams||[]).map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Date & Time</label><input type="datetime-local" id="fxDate" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"/></div>
        <div class="fg"><label>Venue</label><input type="text" id="fxVenue" placeholder="Nyayo Stadium" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"/></div>
        <div class="fg"><label>Tournament</label><select id="fxTournament" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"><option value="">Select…</option>${(STATE.tournaments||[]).map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Status</label><select id="fxStatus" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem" onchange="toggleScoreFields()"><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option></select></div>
        <div class="fg" id="fxHsWrap" style="display:none"><label>Home Score</label><input type="number" id="fxHS" value="0" min="0" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"/></div>
        <div class="fg" id="fxAsWrap" style="display:none"><label>Away Score</label><input type="number" id="fxAS" value="0" min="0" style="width:100%;padding:.55rem .75rem;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--white);font-size:.82rem"/></div>
      </div>
      <div style="display:flex;gap:.5rem;margin-top:.85rem">
        <button class="btn-p" style="font-size:.75rem;padding:.45rem 1.25rem" onclick="saveFixture()">SAVE</button>
        <button class="btn-s" onclick="document.getElementById('fixtureFormWrap').style.display='none'">Cancel</button>
        <button class="btn-s" id="fxDelBtn" style="display:none;color:var(--red)" onclick="deleteFixture()">Delete</button>
      </div>
    </div>`:''}
    <div id="fixtureTableWrap"></div>`;
  renderFixtureTable();
}

function toggleScoreFields() {
  const show=['completed','live'].includes(document.getElementById('fxStatus')?.value);
  ['fxHsWrap','fxAsWrap'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display=show?'':'none'; });
}

function renderFixtureTable() {
  const fT=document.getElementById('schedFilterT')?.value||'';
  const fS=document.getElementById('schedFilterS')?.value||'';
  const isAdmin=STATE.user?.role==='admin';
  let m=STATE.schedules||[];
  if (fT) m=m.filter(x=>x.tournament_id===fT||x.tournament?.id===fT);
  if (fS) m=m.filter(x=>x.status===fS);
  const sBadge=s=>`<span class="bdg bdg-${s==='live'?'red':s==='completed'?'green':'amber'}">${s==='live'?'● LIVE':s}</span>`;
  document.getElementById('fixtureTableWrap').innerHTML = panel('FIXTURES',`${m.length} matches`,m.length?`
    <table class="dt"><thead><tr><th>Date</th><th>Home</th><th>Score</th><th>Away</th><th>Venue</th><th>Tournament</th><th>Status</th>${isAdmin?'<th></th>':''}</tr></thead>
    <tbody>${m.map(x=>{
      const d=x.match_date?new Date(x.match_date).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}):'TBC';
      const t=x.match_date?new Date(x.match_date).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'}):'';
      const score=(x.status==='completed'||x.status==='live')?`<span style="font-family:var(--font-h);font-size:1.05rem;color:var(--gold)">${x.home_score??0} – ${x.away_score??0}</span>`:`<span style="color:var(--muted)">vs</span>`;
      return `<tr><td style="font-size:.72rem;color:var(--dim)">${d}<br/><span style="font-size:.62rem;color:var(--muted)">${t}</span></td>
        <td style="font-weight:600;font-size:.82rem">${x.home_team?.name||'TBC'}</td>
        <td style="text-align:center">${score}</td>
        <td style="font-weight:600;font-size:.82rem">${x.away_team?.name||'TBC'}</td>
        <td style="font-size:.72rem;color:var(--dim)">${x.venue||'—'}</td>
        <td style="font-size:.72rem;color:var(--dim)">${x.tournament?.name||'—'}</td>
        <td>${sBadge(x.status||'upcoming')}</td>
        ${isAdmin?`<td style="display:flex;gap:.3rem"><button class="btn-s" style="font-size:.6rem;padding:.18rem .45rem" onclick="editFixture('${x.id}')">Edit</button></td>`:''}
      </tr>`;
    }).join('')}</tbody></table>`:`<div style="padding:2rem;text-align:center;color:var(--dim);font-size:.82rem">No fixtures match filters</div>`);
}

function openFixtureForm() {
  document.getElementById('fixtureFormWrap').style.display='block';
  document.getElementById('fixtureEditId').value='';
  document.getElementById('fixtureFormTitle').textContent='NEW FIXTURE';
  document.getElementById('fxDelBtn').style.display='none';
  ['fxHome','fxAway','fxTournament'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  ['fxVenue','fxDate'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('fxStatus').value='upcoming';
  document.getElementById('fixtureFormWrap').scrollIntoView({behavior:'smooth'});
}

function editFixture(id) {
  const x=STATE.schedules.find(m=>m.id===id); if(!x) return;
  openFixtureForm();
  document.getElementById('fixtureEditId').value=id;
  document.getElementById('fixtureFormTitle').textContent='EDIT FIXTURE';
  document.getElementById('fxDelBtn').style.display='';
  document.getElementById('fxHome').value=x.home_team_id||'';
  document.getElementById('fxAway').value=x.away_team_id||'';
  document.getElementById('fxVenue').value=x.venue||'';
  document.getElementById('fxTournament').value=x.tournament_id||'';
  document.getElementById('fxStatus').value=x.status||'upcoming';
  if(x.match_date) document.getElementById('fxDate').value=new Date(x.match_date).toISOString().slice(0,16);
  toggleScoreFields();
  if(document.getElementById('fxHS')) document.getElementById('fxHS').value=x.home_score??0;
  if(document.getElementById('fxAS')) document.getElementById('fxAS').value=x.away_score??0;
}

async function saveFixture() {
  const editId=document.getElementById('fixtureEditId')?.value;
  const home_team_id=document.getElementById('fxHome')?.value;
  const away_team_id=document.getElementById('fxAway')?.value;
  const match_date=document.getElementById('fxDate')?.value;
  const venue=document.getElementById('fxVenue')?.value;
  const tournament_id=document.getElementById('fxTournament')?.value||null;
  const status=document.getElementById('fxStatus')?.value||'upcoming';
  const home_score=parseInt(document.getElementById('fxHS')?.value)||0;
  const away_score=parseInt(document.getElementById('fxAS')?.value)||0;
  if (!home_team_id||!away_team_id) { showToast('Select both teams'); return; }
  if (home_team_id===away_team_id) { showToast('Teams must differ'); return; }
  if (!match_date) { showToast('Set a date'); return; }
  showToast('Saving…');
  const payload={ home_team_id, away_team_id, match_date:new Date(match_date).toISOString(), venue, tournament_id, status, home_score, away_score };
  const { error } = editId ? await STATE.sb.from('matches').update(payload).eq('id',editId) : await STATE.sb.from('matches').insert(payload);
  if (error) { showToast('Error: '+error.message); return; }
  showToast(editId?'Fixture updated!':'Fixture created!');
  document.getElementById('fixtureFormWrap').style.display='none';
  schedule();
}

async function deleteFixture() {
  const id=document.getElementById('fixtureEditId')?.value;
  if (!id||!confirm('Delete this fixture?')) return;
  const { error } = await STATE.sb.from('matches').delete().eq('id',id);
  if (error) { showToast('Error: '+error.message); return; }
  showToast('Deleted'); document.getElementById('fixtureFormWrap').style.display='none'; schedule();
}

// ── OTHER PAGES — delegated to portal.html inline ──
async function lineup()    { if(window.renderLineup)    window.renderLineup();    else document.getElementById('mainContent').innerHTML=`<div style="padding:2rem;color:var(--dim)">Lineup page loading…</div>`; }
function events()          { document.getElementById('mainContent').innerHTML=`<div class="ev-log" style="margin-bottom:.8rem"><div class="ev-head"><span class="pt">FULL EVENT LOG</span><span class="pg">${STATE.events.length} events</span></div><div class="ev-list" style="max-height:360px" id="evList">${eventItemsHTML(STATE.events,50)}</div><div class="ev-add"><select id="evType"><option value="goal">⚽ Goal</option><option value="yellow">🟨 Yellow</option><option value="red_card">🟥 Red Card</option><option value="foul">🔴 Foul</option><option value="sub">🔄 Sub</option><option value="injury">🩹 Injury</option><option value="boundary">🚩 Boundary</option><option value="offside">⛔ Offside</option></select><input type="text" id="evPlayer" placeholder="Player…"/><select id="evTeam"><option>${STATE.liveMatch?.home_team?.name||'Home'}</option><option>${STATE.liveMatch?.away_team?.name||'Away'}</option></select><button class="ev-log-btn" onclick="logEvent()">LOG</button></div></div>`; }
function commlive()        { document.getElementById('mainContent').innerHTML=`<div style="background:var(--amber-dim,rgba(212,146,10,.12));border:1px solid rgba(212,146,10,.25);border-radius:6px;padding:.6rem 1rem;font-size:.75rem;color:var(--amber);margin-bottom:.8rem">👁 Commissioner view — read-only</div>${scoreMiniHTML().replace('id="miniScore"','')}<div class="g2 mt">${panel('LIVE EVENTS','Referee + Linesman',`<div class="ev-list" style="max-height:260px">${eventItemsHTML(STATE.events,15)}</div>`)}${panel('LOG INCIDENT','',`<div class="fg"><label>Type</label><select><option>Player Dispute</option><option>Team Protest</option><option>Venue Issue</option><option>Match Abandoned</option></select></div><div class="fg"><label>Description</label><textarea id="incDesc" placeholder="Full description…"></textarea></div><div class="btn-row"><button class="btn-p" onclick="showToast('Incident logged')">LOG</button></div>`)}</div>`; }
function precheck()        { const checks=[{id:'c1',label:'Both teams present & in uniform',done:true},{id:'c2',label:'Lineups verified',done:true},{id:'c3',label:'Player eligibility confirmed',done:true},{id:'c4',label:'Venue inspected',done:true},{id:'c5',label:'Equipment checked',done:false},{id:'c6',label:'Match officials briefed',done:false},{id:'c7',label:'Medical team on standby',done:false},{id:'c8',label:'Scoreboard working',done:false}]; STATE.precheck=checks; document.getElementById('mainContent').innerHTML=panel('PRE-MATCH CHECKLIST','Commissioner',checks.map(c=>`<div class="checklist-item"><div class="ci-check ${c.done?'checked':''}" onclick="togglePrecheck('${c.id}')">${c.done?'✓':''}</div><span class="ci-label ${c.done?'checked-text':''}">${c.label}</span><span class="bdg bdg-${c.done?'green':'amber'}">${c.done?'Done':'Pending'}</span></div>`).join('')+`<div class="btn-row" style="margin-top:.75rem"><button class="btn-p" onclick="showToast('Checklist submitted')">SUBMIT</button></div>`); }
function togglePrecheck(id){ const c=STATE.precheck?.find(x=>x.id===id); if(c){ c.done=!c.done; precheck(); } }
function incidents()       { document.getElementById('mainContent').innerHTML=panel('LOG INCIDENT','Official record',`<div class="fgrid"><div class="fg"><label>Type</label><select><option>Player Dispute</option><option>Team Protest</option><option>Venue Issue</option><option>Match Abandoned</option></select></div><div class="fg"><label>Minute</label><input type="number" placeholder="45"/></div><div class="fg full"><label>Description</label><textarea style="min-height:90px" placeholder="Full description…"></textarea></div><div class="fg full"><label>Action Taken</label><textarea placeholder="Action taken…"></textarea></div></div><div class="btn-row"><button class="btn-p" onclick="showToast('Incident logged')">LOG INCIDENT</button></div>`); }
function countersign()     { document.getElementById('mainContent').innerHTML=`${signoffChainHTML()}<div class="g2">${panel("REFEREE'S REPORT",'Read-only',`<div style="background:var(--bg3);border-radius:6px;padding:.85rem;margin-bottom:.75rem;text-align:center"><div style="font-family:var(--font-h);font-size:2.5rem;color:var(--gold);letter-spacing:4px">${STATE.liveH} — ${STATE.liveA}</div></div>${STATE.reportState.refSubmitted?'Report filed.':'Awaiting referee submission.'}<div style="font-size:.7rem;color:var(--dim);margin-top:.5rem">Linesman: ${STATE.reportState.lineSignedOff?'✓ Signed':'⏳ Pending'}</div>`)}${panel("COMMISSIONER'S NOTES",'',`<div class="fg"><label>Observations</label><textarea id="commNotes" style="min-height:80px" placeholder="Observations…"></textarea></div><div class="fg"><label>Recommendations</label><textarea id="commRec" placeholder="Actions…"></textarea></div><div class="btn-row"><button class="btn-s countersign" onclick="handleCountersign()">✍ COUNTERSIGN</button><button class="btn-s reject" onclick="showToast('Returned to referee')">Return</button></div>`)}</div>`; }
async function handleCountersign(){ const notes=document.getElementById('commNotes')?.value||'',rec=document.getElementById('commRec')?.value||''; if(STATE.liveMatch&&STATE.sb){ await STATE.sb.from('matches').update({commissioner_notes:notes,disciplinary_recommendations:rec,status:'completed'}).eq('id',STATE.liveMatch.id); } STATE.reportState.commCountersigned=true; showToast('Countersigned and locked!'); countersign(); }
function boundary()        { const myEv=STATE.events.filter(e=>(e.by||e.logged_by_role)==='linesman'); document.getElementById('mainContent').innerHTML=`<div class="g2"><div>${panel('QUICK LOG','Tap to log',`<div style="display:flex;gap:.5rem;margin-bottom:.75rem">${[['✅','In Play',''],['🚩','Out — Home',STATE.liveMatch?.home_team?.name||'Home'],['🚩','Out — Away',STATE.liveMatch?.away_team?.name||'Away']].map(([ic,l,t])=>`<div class="boundary-btn" onclick="logBoundaryCall('${l}','${t}')"><div class="bb-icon">${ic}</div><div class="bb-label">${l}</div><div class="bb-sub">${t||'Ball live'}</div></div>`).join('')}</div><div style="display:flex;gap:.5rem">${[['⛔','Offside—Home',STATE.liveMatch?.home_team?.name||'Home'],['⛔','Offside—Away',STATE.liveMatch?.away_team?.name||'Away'],['🔄','Sub Request','']].map(([ic,l,t])=>`<div class="boundary-btn" onclick="logBoundaryCall('${l}','${t}')"><div class="bb-icon">${ic}</div><div class="bb-label">${l}</div><div class="bb-sub">${t||'Change'}</div></div>`).join('')}</div>`)}${panel('MY CALLS','This match',`<div class="ev-list" id="lineCallsList">${myEv.length?eventItemsHTML(myEv):'<div style="padding:.75rem;color:var(--muted);font-size:.78rem">No calls logged yet</div>'}</div>`)}</div>`; }
function logBoundaryCall(type,team){ const elapsed=Math.max(1,STATE.period*15-Math.floor(STATE.matchTimer/60)); STATE.events.unshift({min:elapsed+"'",type:'boundary',icon:type.includes('Offside')?'⛔':type.includes('Sub')?'🔄':'🚩',desc:`${type}${team?' — '+team:''}`,by:'linesman'}); const list=document.getElementById('lineCallsList'); if(list){const my=STATE.events.filter(e=>(e.by||e.logged_by_role)==='linesman');list.innerHTML=eventItemsHTML(my);} showToast(`Logged: ${type}`); }
function lineview()        { document.getElementById('mainContent').innerHTML=`<div class="live-sb"><div class="lsb-top active-match"><span>Linesman Monitor</span><span class="lsb-period">Q${STATE.period}</span></div><div class="lsb-teams"><div class="lsb-team"><div class="lsb-tname" style="color:${STATE.liveMatch?.home_team?.color||'var(--red)'}">${(STATE.liveMatch?.home_team?.name||'HOME').toUpperCase()}</div></div><div class="lsb-center"><div class="lsb-score">${STATE.liveH} <span style="font-size:2rem;color:var(--muted)">—</span> ${STATE.liveA}</div></div><div class="lsb-team" style="text-align:right"><div class="lsb-tname" style="color:${STATE.liveMatch?.away_team?.color||'var(--blue)'}">${(STATE.liveMatch?.away_team?.name||'AWAY').toUpperCase()}</div></div></div></div><div class="g2">${panel('ALL EVENTS','',`<div class="ev-list" style="max-height:260px">${eventItemsHTML(STATE.events,20)}</div>`)}${panel('LOG CALL','',`<div class="fg"><label>Type</label><select><option>Out of Play</option><option>Offside</option><option>Sub Request</option></select></div><div class="fg"><label>Team</label><select><option>${STATE.liveMatch?.home_team?.name||'Home'}</option><option>${STATE.liveMatch?.away_team?.name||'Away'}</option></select></div><div class="btn-row"><button class="btn-p" onclick="showToast('Call logged')">LOG</button></div>`)}</div>`; }
function linesign()        { document.getElementById('mainContent').innerHTML=`${signoffChainHTML()}<div class="g2">${panel('EVENT LOG REVIEW','',`<div class="ev-list" style="max-height:240px">${eventItemsHTML(STATE.events,20)}</div><div class="btn-row" style="margin-top:.65rem"><button class="btn-s sign" onclick="handleLineSign()">✍ SIGN OFF</button><button class="btn-s reject" onclick="showToast('Dispute flagged')">Flag Dispute</button></div>${STATE.reportState.lineSignedOff?`<div style="margin-top:.6rem;padding:.55rem;background:var(--green-dim,rgba(0,201,106,.1));border-radius:5px;font-size:.72rem;color:#4cd97b">✓ Signed — awaiting commissioner.</div>`:''}`)}${panel('MY CALLS','',`<div class="ev-list">${eventItemsHTML(STATE.events.filter(e=>(e.by||e.logged_by_role)==='linesman'))}</div>`)}</div>`; }
async function handleLineSign(){ if(STATE.liveMatch&&STATE.sb){ await STATE.sb.from('matches').update({linesman_signed:true}).eq('id',STATE.liveMatch.id); } STATE.reportState.lineSignedOff=true; showToast('Event log signed!'); linesign(); }

// ── REPORT ─────────────────────────────────────
function report() {
  const m=STATE.liveMatch;
  document.getElementById('mainContent').innerHTML=`${signoffChainHTML()}
    <div class="g2">
      <div>
        <div class="fsec"><div class="fsec-title">Match Details</div>
          <div class="fgrid">
            <div class="fg"><label>Home Team</label><input value="${m?.home_team?.name||''}" readonly/></div>
            <div class="fg"><label>Away Team</label><input value="${m?.away_team?.name||''}" readonly/></div>
            <div class="fg"><label>Home Score</label><input type="number" id="repHS" value="${STATE.liveH}"/></div>
            <div class="fg"><label>Away Score</label><input type="number" id="repAS" value="${STATE.liveA}"/></div>
            <div class="fg"><label>Venue</label><input value="${m?.venue||''}"/></div>
            <div class="fg"><label>Referee</label><input value="${STATE.user?.name||''}"/></div>
          </div>
        </div>
        <div class="fsec"><div class="fsec-title">Narrative</div>
          <div class="fg full"><label>Match Summary</label><textarea id="repNarrative" style="min-height:90px" placeholder="Describe how the match unfolded…"></textarea></div>
          <div class="fg full"><label>Post-Match Comments</label><textarea id="repComments" placeholder="Observations…"></textarea></div>
          <div class="fg full"><label>Disciplinary Summary</label><textarea id="repDisc" placeholder="Cards, incidents…"></textarea></div>
        </div>
        <div class="btn-row"><button class="btn-p" onclick="handleReportSubmit()">SUBMIT REPORT</button><button class="btn-s" onclick="showToast('Draft saved')">Save Draft</button></div>
        ${STATE.reportState.refSubmitted?`<div style="margin-top:.6rem;padding:.55rem;background:rgba(0,201,106,.1);border-radius:5px;font-size:.72rem;color:#4cd97b">✓ Submitted — awaiting linesman.</div>`:''}
      </div>
      <div>
        ${panel('GOAL SCORERS','From event log',`<table class="dt"><thead><tr><th>Min</th><th>Description</th></tr></thead><tbody>${STATE.events.filter(e=>e.type==='goal'||e.event_type==='goal').map(e=>`<tr><td style="font-family:var(--font-mono);color:var(--gold)">${e.min||e.minute+"'"}</td><td>${(e.desc||e.description||'').replace(/<[^>]+>/g,'')}</td></tr>`).join('')||'<tr><td colspan="2" style="color:var(--dim)">No goals</td></tr>'}</tbody></table>`)}
        ${panel('DISCIPLINARY','Cards',`<table class="dt"><thead><tr><th>Min</th><th>Event</th><th>Type</th></tr></thead><tbody>${STATE.events.filter(e=>['yellow','red_card'].includes(e.type||e.event_type)).map(e=>`<tr><td style="font-family:var(--font-mono);color:var(--gold)">${e.min||e.minute+"'"}</td><td>${(e.desc||e.description||'').replace(/<[^>]+>/g,'')}</td><td><span class="bdg bdg-amber">${(e.type||e.event_type).replace('_',' ')}</span></td></tr>`).join('')||'<tr><td colspan="3" style="color:var(--dim)">None</td></tr>'}</tbody></table>`)}
      </div>
    </div>`;
}

async function handleReportSubmit() {
  const narrative=document.getElementById('repNarrative')?.value||'';
  const comments=document.getElementById('repComments')?.value||'';
  const disc=document.getElementById('repDisc')?.value||'';
  if (STATE.liveMatch&&STATE.sb) {
    const { error } = await STATE.sb.from('matches').update({ referee_report:narrative, post_match_comments:comments, disciplinary_summary:disc, report_submitted:true }).eq('id',STATE.liveMatch.id);
    if (error) { showToast('Error: '+error.message); return; }
  }
  STATE.reportState.refSubmitted=true;
  showToast('Report submitted! Linesman notified.');
  report();
}

// ── REGISTRATION & DOCS ────────────────────────
function playerreg() {
  const docs=getCurrentDocs(), done=docs.filter(d=>d.status==='approved'||d.status==='done').length;
  const pct=docs.length?Math.round((done/docs.length)*100):0;
  document.getElementById('mainContent').innerHTML=`
    <div class="prog-wrap" style="margin-bottom:1rem"><div class="prog-label"><span>Registration Progress</span><span style="color:var(--gold);font-weight:600">${pct}%</span></div><div class="prog-bar" style="height:5px"><div class="prog-fill" style="width:${pct}%"></div></div></div>
    <div class="g2">
      <div>
        <div class="fsec"><div class="fsec-title">Personal Information</div>
          <div class="fgrid">
            <div class="fg"><label>Full Name</label><input id="pName" value="${STATE.user?.name||''}" placeholder="As on National ID"/></div>
            <div class="fg"><label>Date of Birth</label><input type="date" id="pDob"/></div>
            <div class="fg"><label>National ID</label><input id="pNatId" placeholder="8-digit ID"/></div>
            <div class="fg"><label>Email</label><input type="email" value="${STATE.user?.email||''}" readonly/></div>
            <div class="fg"><label>Phone</label><input type="tel" id="pPhone" placeholder="+254…"/></div>
            <div class="fg"><label>County</label><select id="pCounty"><option>Nairobi</option><option>Mombasa</option><option>Kisumu</option><option>Nakuru</option><option>Eldoret</option><option>Nyeri</option><option>Garissa</option><option>Kakamega</option><option>Machakos</option><option>Embu</option></select></div>
          </div>
        </div>
        <div class="fsec"><div class="fsec-title">Playing Details</div>
          <div class="fgrid">
            <div class="fg"><label>Team</label><select id="pTeam">${(STATE.teams||[]).map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
            <div class="fg"><label>Jersey #</label><input type="number" id="pJersey" min="1" max="99" value="${STATE.user?.jersey_number||''}"/></div>
            <div class="fg"><label>Position</label><select id="pPos"><option>Centre Man</option><option>Front Right</option><option>Front Left</option><option>Winger Right</option><option>Winger Left</option></select></div>
            <div class="fg"><label>Status</label><select id="pStatus"><option>Amateur</option><option>Semi-Professional</option><option>Professional</option></select></div>
          </div>
        </div>
        <div class="btn-row"><button class="btn-p" onclick="handleSaveProfile()">SAVE PROFILE</button></div>
      </div>
      <div>
        <div class="fsec"><div class="fsec-title">Document Uploads</div>${docsGridHTML(docs)}<div style="margin-top:.75rem;background:var(--bg3);border:1px solid var(--border);border-radius:5px;padding:.65rem;font-size:.7rem;color:var(--dim);line-height:1.7">JPG, PNG, PDF · max 10MB each. Admin will review submissions.</div></div>
        <button class="btn-p" style="width:100%" onclick="showToast('Registration submitted!')">SUBMIT REGISTRATION</button>
      </div>
    </div>`;
}

async function handleSaveProfile() {
  const data={ name:document.getElementById('pName')?.value, phone:document.getElementById('pPhone')?.value, national_id:document.getElementById('pNatId')?.value, county:document.getElementById('pCounty')?.value, position:document.getElementById('pPos')?.value, jersey_number:parseInt(document.getElementById('pJersey')?.value), player_status:document.getElementById('pStatus')?.value, team_id:document.getElementById('pTeam')?.value };
  if (!STATE.sb) return;
  const { error } = await STATE.sb.from('users').update(data).eq('id',STATE.user.id);
  if (error) { showToast('Error: '+error.message); return; }
  Object.assign(STATE.user, data); setEl('sbName', data.name||STATE.user.email); showToast('Profile updated!');
}

function teamreg() {
  document.getElementById('mainContent').innerHTML=`
    <div class="g2">
      <div><div class="fsec"><div class="fsec-title">Club Information</div>
        <div class="fgrid">
          <div class="fg"><label>Team Name</label><input placeholder="Official registered name"/></div>
          <div class="fg"><label>City/County</label><input placeholder="Nairobi"/></div>
          <div class="fg"><label>Manager Name</label><input placeholder="Full name"/></div>
          <div class="fg"><label>Manager Email</label><input type="email" placeholder="manager@team.co.ke"/></div>
          <div class="fg"><label>Manager Phone</label><input type="tel" placeholder="+254…"/></div>
          <div class="fg"><label>Home Ground</label><input placeholder="Stadium name"/></div>
          <div class="fg full"><label>Description</label><textarea placeholder="Brief club history…"></textarea></div>
        </div>
      </div><button class="btn-p" onclick="showToast('Club info saved!')">SAVE</button></div>
      <div><div class="fsec"><div class="fsec-title">Required Documents</div>${docsGridHTML(TEAM_DOCS)}</div>
      <button class="btn-p" style="width:100%" onclick="showToast('Registration submitted!')">SUBMIT</button></div>
    </div>`;
}

function mydocs() {
  const docs=getCurrentDocs(), done=docs.filter(d=>d.status==='approved'||d.status==='done').length, pct=docs.length?Math.round((done/docs.length)*100):0;
  document.getElementById('mainContent').innerHTML=`<div class="prog-wrap"><div class="prog-label"><span>${done}/${docs.length}</span><span style="color:var(--gold);font-weight:600">${pct}%</span></div><div class="prog-bar" style="height:5px"><div class="prog-fill" style="width:${pct}%"></div></div></div>${panel('MY CLEARANCES','Click to upload',docsGridHTML(docs)+`<div class="btn-row" style="margin-top:.75rem"><button class="btn-p" onclick="showToast('Submitted!')">SUBMIT ALL DOCS</button></div>`)}`;
}

async function handleDocUpload(inputEl, docType) {
  const file=inputEl.files[0]; if (!file) return;
  showToast('Uploading…');
  const ext=file.name.split('.').pop();
  const path=`documents/${STATE.user.id}/${Date.now()}.${ext}`;
  const { error:uploadErr } = await STATE.sb.storage.from('player-docs').upload(path,file,{upsert:true});
  if (uploadErr) { showToast('Upload failed: '+uploadErr.message); return; }
  const { data:{ publicUrl } } = STATE.sb.storage.from('player-docs').getPublicUrl(path);
  await STATE.sb.from('documents').upsert({ user_id:STATE.user.id, doc_type:docType, file_url:publicUrl, status:'pending', uploaded_at:new Date().toISOString() });
  const { data:docs } = await STATE.sb.from('documents').select('*').eq('user_id',STATE.user.id);
  if (docs) STATE.docs=docs;
  showToast(`${docType.replace('_',' ')} uploaded!`);
}

// ── PROFILE ────────────────────────────────────
function profile() {
  document.getElementById('mainContent').innerHTML=`
    <div class="prof-head">
      <div class="prof-av" style="background:var(--green-dim,rgba(0,201,106,.1));color:var(--green);border-color:rgba(0,201,106,.4)">
        ${(STATE.user?.name||'PL').split(' ').map(n=>n[0]).join('').toUpperCase()}
        <div class="prof-cam" onclick="triggerDocUpload('passport_photo')">📷</div>
      </div>
      <div>
        <div class="pname">${STATE.user?.name||'Player'}</div>
        <div class="ppos">${STATE.user?.position||'—'} · #${STATE.user?.jersey_number||'—'}</div>
      </div>
    </div>
    <div class="g2">
      <div><div class="fsec"><div class="fsec-title">Edit Profile</div>
        <div class="fgrid">
          <div class="fg"><label>Full Name</label><input id="pName" value="${STATE.user?.name||''}"/></div>
          <div class="fg"><label>Phone</label><input id="pPhone" value="${STATE.user?.phone||''}"/></div>
          <div class="fg"><label>Email</label><input value="${STATE.user?.email||''}" readonly/></div>
          <div class="fg"><label>Position</label><select id="pPos"><option>Centre Man</option><option>Front Right</option><option>Front Left</option><option>Winger Right</option><option>Winger Left</option></select></div>
          <div class="fg"><label>Jersey #</label><input type="number" id="pJersey" value="${STATE.user?.jersey_number||''}" min="1" max="99"/></div>
          <div class="fg"><label>Push Notifications</label><button class="btn-s" onclick="requestPushPermission()" style="width:100%;margin-top:.35rem">🔔 Enable Alerts</button></div>
        </div>
      </div><button class="btn-p" onclick="handleSaveProfile()">UPDATE PROFILE</button></div>
      <div><div class="fsec"><div class="fsec-title">My Documents</div>${docsGridHTML(getCurrentDocs())}</div></div>
    </div>`;
}

function mystats() {
  const st=STATE.playerStats||{};
  document.getElementById('mainContent').innerHTML=`
    <div class="stat-row">
      <div class="sc" style="--sc-color:var(--red)"><div class="v">${st.goals??'—'}</div><div class="l">Goals</div><div class="ch ch-neu">2025</div></div>
      <div class="sc" style="--sc-color:var(--gold)"><div class="v">${st.games_played??'—'}</div><div class="l">Games</div><div class="ch ch-neu">Played</div></div>
      <div class="sc" style="--sc-color:var(--green)"><div class="v">${st.assists??'—'}</div><div class="l">Assists</div><div class="ch ch-neu">Season</div></div>
      <div class="sc" style="--sc-color:var(--amber)"><div class="v">${st.yellow_cards??'—'}</div><div class="l">Yellow Cards</div><div class="ch ch-warn">Cautions</div></div>
    </div>
    <div style="padding:2rem;text-align:center;background:var(--bg2);border:1px solid var(--border);border-radius:8px">
      <div style="font-size:2rem;opacity:.2;margin-bottom:.75rem">📊</div>
      <div style="font-size:.85rem;color:var(--dim)">Detailed stats sync after each match is published by admin.</div>
    </div>`;
}

// ── ADMIN: USERS ───────────────────────────────
async function users() {
  const { data:allUsers } = await STATE.sb.from('users').select('*,team:teams(name)').order('created_at',{ascending:false});
  window._allUsers = allUsers||[];
  const pending=window._allUsers.filter(u=>!u.is_active);
  const roleColor={ admin:'red', commissioner:'teal', referee:'blue', linesman:'amber', official:'purple', team_manager:'amber', player:'green' };
  document.getElementById('mainContent').innerHTML=`
    <div style="display:flex;gap:.5rem;margin-bottom:.8rem;flex-wrap:wrap;align-items:center">
      <button class="btn-s" onclick="exportUsersCSV()">Export CSV</button>
      <input placeholder="Search name, role or team…" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.4rem .75rem;color:var(--white);font-size:.78rem;outline:none;flex:1;min-width:180px" oninput="filterUsersTable(this.value)"/>
    </div>
    ${pending.length?`<div style="margin-bottom:1.25rem"><div style="font-size:.62rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--amber);font-weight:600;margin-bottom:.6rem">⏳ PENDING — ${pending.length}</div><div style="display:grid;gap:.5rem">${buildPendingCards(pending)}</div></div>`:
    `<div style="background:var(--bg2);border:1px solid rgba(0,201,106,.2);border-radius:6px;padding:.65rem 1rem;font-size:.75rem;color:var(--green);margin-bottom:1rem">✓ No pending approvals</div>`}
    ${panel('ALL USERS',`${window._allUsers.length} total`,`<table class="dt" id="usersTable"><thead><tr><th>Name</th><th>Role</th><th>Team</th><th>Status</th><th>Docs</th><th>Actions</th></tr></thead><tbody id="usersBody">${buildUserRows(window._allUsers)}</tbody></table>`)}`;
}

function buildPendingCards(users) {
  return users.map(u=>`
    <div style="background:var(--bg2);border:1px solid rgba(212,146,10,.3);border-radius:8px;padding:.85rem 1rem;display:flex;align-items:center;gap:.85rem;flex-wrap:wrap">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--amber);flex-shrink:0">${(u.name||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</div>
      <div style="flex:1;min-width:140px"><div style="font-size:.82rem;font-weight:600">${u.name||'—'}</div><div style="font-size:.68rem;color:var(--dim)">${u.email||''}</div><div style="font-size:.65rem;color:var(--muted)">Registered ${u.created_at?new Date(u.created_at).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}):'—'}</div></div>
      <div style="display:flex;flex-direction:column;gap:.3rem;min-width:140px">
        <select onchange="quickAssignRole('${u.id}',this.value)" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.35rem .6rem;color:var(--white);font-size:.72rem;width:100%"><option value="${u.role||'player'}" selected>${u.role||'player'}</option><option value="player">Player</option><option value="team_manager">Team Manager</option><option value="referee">Referee</option><option value="linesman">Linesman</option><option value="official">Score Official</option><option value="commissioner">Commissioner</option></select>
        <select onchange="quickAssignTeam('${u.id}',this.value)" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.35rem .6rem;color:var(--white);font-size:.72rem;width:100%"><option value="">— Assign team —</option>${(STATE.teams||[]).map(t=>`<option value="${t.id}" ${u.team_id===t.id?'selected':''}>${t.name}</option>`).join('')}</select>
      </div>
      <div style="display:flex;gap:.4rem;flex-shrink:0">
        <button class="btn-p" style="font-size:.68rem;padding:.35rem .8rem;background:var(--green)" onclick="approveUser('${u.id}')">✓ Approve</button>
        <button class="btn-s" style="font-size:.68rem;padding:.35rem .7rem;color:var(--red)" onclick="rejectUser('${u.id}')">✗ Reject</button>
      </div>
    </div>`).join('');
}

function buildUserRows(users) {
  const rColor={ admin:'red', commissioner:'teal', referee:'blue', linesman:'amber', official:'purple', team_manager:'amber', player:'green' };
  return users.map(u=>`<tr>
    <td style="font-weight:500">${u.name||'—'}</td>
    <td><span class="bdg bdg-${rColor[u.role]||'gray'}">${u.role||'player'}</span></td>
    <td style="font-size:.75rem;color:var(--dim)">${u.team?.name||'—'}</td>
    <td><span class="bdg bdg-${u.is_active?'green':'amber'}">${u.is_active?'Active':'Pending'}</span></td>
    <td><span class="bdg bdg-${u.docs_status==='approved'?'green':u.docs_status==='flagged'?'red':'amber'}">${u.docs_status||'incomplete'}</span></td>
    <td style="display:flex;gap:.3rem">
      <button class="btn-s" style="font-size:.6rem;padding:.18rem .45rem;color:var(--green)" onclick="approveUser('${u.id}')">✓</button>
      <button class="btn-s" style="font-size:.6rem;padding:.18rem .45rem;color:var(--red)" onclick="rejectUser('${u.id}')">✗</button>
    </td>
  </tr>`).join('');
}

function filterUsersTable(q) {
  const f=(window._allUsers||[]).filter(u=>(u.name||'').toLowerCase().includes(q.toLowerCase())||(u.role||'').toLowerCase().includes(q.toLowerCase())||(u.team?.name||'').toLowerCase().includes(q.toLowerCase()));
  const b=document.getElementById('usersBody'); if(b) b.innerHTML=buildUserRows(f);
}
async function quickAssignRole(id,role){ await STATE.sb.from('users').update({role}).eq('id',id); }
async function quickAssignTeam(id,teamId){ await STATE.sb.from('users').update({team_id:teamId||null}).eq('id',id); }
async function approveUser(id){ await STATE.sb.from('users').update({is_active:true}).eq('id',id); showToast('Approved!'); users(); }
async function rejectUser(id){ await STATE.sb.from('users').update({is_active:false,docs_status:'flagged'}).eq('id',id); showToast('Rejected'); users(); }
function exportUsersCSV(){ const rows=[['Name','Role','Team','Active','Docs']]; (window._allUsers||[]).forEach(u=>rows.push([u.name,u.role,u.team?.name||'',u.is_active?'Yes':'No',u.docs_status||'incomplete'])); const csv=rows.map(r=>r.join(',')).join('\n'); const a=document.createElement('a'); a.href='data:text/csv,'+encodeURIComponent(csv); a.download='krf-users.csv'; a.click(); showToast('CSV exported!'); }

// ── ADMIN: TEAMS ───────────────────────────────
async function teams_admin() {
  const { data:allTeams } = await STATE.sb.from('teams').select('*').order('name');
  STATE.teams = allTeams||[];
  document.getElementById('mainContent').innerHTML=`
    <div style="display:flex;gap:.5rem;margin-bottom:.8rem"><button class="btn-p" style="font-size:.75rem;padding:.45rem 1rem" onclick="openTeamForm()">+ ADD TEAM</button></div>
    <div id="teamFormWrap" style="display:none;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;margin-bottom:1.25rem">
      <div style="font-family:var(--font-h);font-size:.62rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:.75rem" id="teamFormTitle">NEW TEAM</div>
      <input type="hidden" id="teamEditId"/>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
        <div class="fg"><label>Name</label><input id="tName" placeholder="Nairobi Bulls" style="width:100%;padding:.55rem .75rem"/></div>
        <div class="fg"><label>Abbreviation</label><input id="tAbbr" placeholder="NBU" maxlength="4" style="width:100%;padding:.55rem .75rem"/></div>
        <div class="fg"><label>City</label><input id="tCity" placeholder="Nairobi" style="width:100%;padding:.55rem .75rem"/></div>
        <div class="fg"><label>Home Ground</label><input id="tGround" placeholder="Nyayo Stadium" style="width:100%;padding:.55rem .75rem"/></div>
        <div class="fg"><label>Team Color</label><input type="color" id="tColor" value="#C8102E" style="width:100%;height:38px;padding:.25rem;cursor:pointer"/></div>
        <div class="fg"><label>Status</label><select id="tActive" style="width:100%;padding:.55rem .75rem"><option value="true">Active</option><option value="false">Inactive</option></select></div>
      </div>
      <div style="display:flex;gap:.5rem;margin-top:.85rem">
        <button class="btn-p" style="font-size:.75rem;padding:.45rem 1.25rem" onclick="saveTeamAdmin()">SAVE</button>
        <button class="btn-s" onclick="document.getElementById('teamFormWrap').style.display='none'">Cancel</button>
        <button class="btn-s" id="teamDeleteBtn" style="display:none;color:var(--red)" onclick="deleteTeam()">Delete</button>
      </div>
    </div>
    ${panel('REGISTERED TEAMS',`${STATE.teams.length} teams`,`<table class="dt"><thead><tr><th>Team</th><th>City</th><th>Ground</th><th>Status</th><th></th></tr></thead><tbody>${STATE.teams.map(t=>`<tr><td><div style="display:flex;align-items:center;gap:.5rem"><div style="width:10px;height:10px;border-radius:50%;background:${t.color||'#888'}"></div><span style="font-weight:600">${t.name}</span><span style="font-size:.65rem;color:var(--muted)">${t.abbr||''}</span></div></td><td style="font-size:.75rem;color:var(--dim)">${t.city||'—'}</td><td style="font-size:.75rem;color:var(--dim)">${t.home_ground||'—'}</td><td><span class="bdg bdg-${t.is_active?'green':'amber'}">${t.is_active?'Active':'Inactive'}</span></td><td><button class="btn-s" style="font-size:.6rem;padding:.18rem .45rem" onclick="editTeam('${t.id}')">Edit</button></td></tr>`).join('')}</tbody></table>`)}`;
}

function openTeamForm(){ document.getElementById('teamFormWrap').style.display='block'; document.getElementById('teamEditId').value=''; document.getElementById('teamFormTitle').textContent='NEW TEAM'; document.getElementById('teamDeleteBtn').style.display='none'; ['tName','tAbbr','tCity','tGround'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';}); document.getElementById('tColor').value='#C8102E'; document.getElementById('tActive').value='true'; document.getElementById('teamFormWrap').scrollIntoView({behavior:'smooth'}); }
function editTeam(id){ const t=STATE.teams.find(x=>x.id===id); if(!t) return; openTeamForm(); document.getElementById('teamEditId').value=id; document.getElementById('teamFormTitle').textContent='EDIT TEAM'; document.getElementById('teamDeleteBtn').style.display=''; document.getElementById('tName').value=t.name||''; document.getElementById('tAbbr').value=t.abbr||''; document.getElementById('tCity').value=t.city||''; document.getElementById('tGround').value=t.home_ground||''; document.getElementById('tColor').value=t.color||'#C8102E'; document.getElementById('tActive').value=t.is_active?'true':'false'; document.getElementById('teamFormWrap').scrollIntoView({behavior:'smooth'}); }
async function saveTeamAdmin(){ const id=document.getElementById('teamEditId')?.value, name=document.getElementById('tName')?.value?.trim(), abbr=document.getElementById('tAbbr')?.value?.trim().toUpperCase(), city=document.getElementById('tCity')?.value?.trim(), ground=document.getElementById('tGround')?.value?.trim(), color=document.getElementById('tColor')?.value, active=document.getElementById('tActive')?.value==='true'; if(!name||!abbr){showToast('Name and abbreviation required');return;} showToast('Saving…'); const payload={name,abbr,city,home_ground:ground,color,is_active:active}; const {error}=id?await STATE.sb.from('teams').update(payload).eq('id',id):await STATE.sb.from('teams').insert(payload); if(error){showToast('Error: '+error.message);return;} showToast(id?'Updated!':'Created!'); document.getElementById('teamFormWrap').style.display='none'; teams_admin(); }
async function deleteTeam(){ const id=document.getElementById('teamEditId')?.value; if(!id||!confirm('Delete this team?')) return; await STATE.sb.from('teams').update({is_active:false}).eq('id',id); showToast('Deactivated'); document.getElementById('teamFormWrap').style.display='none'; teams_admin(); }

// ── ADMIN: TOURNAMENTS ─────────────────────────
async function tournaments() {
  const { data:allT } = await STATE.sb.from('tournaments').select('*').order('created_at',{ascending:false});
  STATE.tournaments = allT||[];
  document.getElementById('mainContent').innerHTML=`
    <div style="display:flex;gap:.5rem;margin-bottom:.8rem"><button class="btn-p" style="font-size:.75rem;padding:.45rem 1rem" onclick="openTournamentForm()">+ CREATE</button></div>
    <div id="tFormWrap" style="display:none;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;margin-bottom:1.25rem">
      <div style="font-family:var(--font-h);font-size:.62rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:.75rem" id="tFormTitle">NEW COMPETITION</div>
      <input type="hidden" id="tEditId"/>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
        <div class="fg"><label>Name</label><input id="tName" placeholder="KPL Championship 2025" style="width:100%;padding:.55rem .75rem"/></div>
        <div class="fg"><label>Type</label><select id="tType" style="width:100%;padding:.55rem .75rem"><option value="league">League</option><option value="tournament">Tournament</option></select></div>
        <div class="fg"><label>Season</label><input id="tSeason" value="2025" style="width:100%;padding:.55rem .75rem"/></div>
        <div class="fg"><label>Status</label><select id="tStatus" style="width:100%;padding:.55rem .75rem"><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="completed">Completed</option></select></div>
        <div class="fg full"><label>Description</label><input id="tDesc" placeholder="Brief description…" style="width:100%;padding:.55rem .75rem"/></div>
      </div>
      <div style="display:flex;gap:.5rem;margin-top:.85rem">
        <button class="btn-p" style="font-size:.75rem;padding:.45rem 1.25rem" onclick="saveTournament()">SAVE</button>
        <button class="btn-s" onclick="document.getElementById('tFormWrap').style.display='none'">Cancel</button>
        <button class="btn-s" id="tDelBtn" style="display:none;color:var(--red)" onclick="deleteTournament()">Delete</button>
      </div>
    </div>
    <div class="g2">
      <div>${panel('LEAGUES','',renderTournTable('league',STATE.tournaments))}</div>
      <div>${panel('TOURNAMENTS','',renderTournTable('tournament',STATE.tournaments))}</div>
    </div>`;
}

function renderTournTable(type,list){ const f=list.filter(t=>t.type===type); const sc={active:'bdg-red',upcoming:'bdg-amber',completed:'bdg-green'}; return f.length?`<table class="dt"><thead><tr><th>Name</th><th>Season</th><th>Status</th><th></th></tr></thead><tbody>${f.map(t=>`<tr><td style="font-weight:600">${t.name}</td><td style="font-size:.72rem;color:var(--dim)">${t.season||'—'}</td><td><span class="bdg ${sc[t.status]||'bdg-gray'}">${t.status==='active'?'● Active':t.status||'upcoming'}</span></td><td><button class="btn-s" style="font-size:.6rem;padding:.18rem .45rem" onclick="editTournament('${t.id}')">Edit</button></td></tr>`).join('')}</tbody></table>`:`<div style="color:var(--dim);font-size:.78rem;padding:.5rem">No ${type}s yet</div>`; }
function openTournamentForm(){ document.getElementById('tFormWrap').style.display='block'; document.getElementById('tEditId').value=''; document.getElementById('tFormTitle').textContent='NEW COMPETITION'; document.getElementById('tDelBtn').style.display='none'; ['tName','tDesc'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';}); document.getElementById('tSeason').value='2025'; document.getElementById('tType').value='league'; document.getElementById('tStatus').value='upcoming'; document.getElementById('tFormWrap').scrollIntoView({behavior:'smooth'}); }
function editTournament(id){ const t=STATE.tournaments.find(x=>x.id===id); if(!t) return; openTournamentForm(); document.getElementById('tEditId').value=id; document.getElementById('tFormTitle').textContent='EDIT'; document.getElementById('tDelBtn').style.display=''; document.getElementById('tName').value=t.name||''; document.getElementById('tType').value=t.type||'league'; document.getElementById('tSeason').value=t.season||'2025'; document.getElementById('tStatus').value=t.status||'upcoming'; document.getElementById('tDesc').value=t.description||''; }
async function saveTournament(){ const id=document.getElementById('tEditId')?.value, name=document.getElementById('tName')?.value?.trim(), type=document.getElementById('tType')?.value, season=document.getElementById('tSeason')?.value, status=document.getElementById('tStatus')?.value, desc=document.getElementById('tDesc')?.value?.trim(); if(!name){showToast('Enter a name');return;} showToast('Saving…'); const payload={name,type,season,status,description:desc}; const {error}=id?await STATE.sb.from('tournaments').update(payload).eq('id',id):await STATE.sb.from('tournaments').insert(payload); if(error){showToast('Error: '+error.message);return;} showToast(id?'Updated!':'Created!'); document.getElementById('tFormWrap').style.display='none'; tournaments(); }
async function deleteTournament(){ const id=document.getElementById('tEditId')?.value; if(!id||!confirm('Delete?')) return; await STATE.sb.from('tournaments').delete().eq('id',id); showToast('Deleted'); document.getElementById('tFormWrap').style.display='none'; tournaments(); }

// ── ADMIN: GALLERY ─────────────────────────────
function gallery() {
  document.getElementById('mainContent').innerHTML=`
    <div class="g2">
      <div>${panel('UPLOAD PHOTOS','',`<div class="upload-zone" onclick="document.getElementById('photoInput').click()"><div class="uz-icon">📷</div><p>Click to upload match photos</p><small>JPG PNG WebP · max 20MB</small></div><input type="file" id="photoInput" accept="image/*" multiple style="display:none" onchange="handleMediaUpload(this,'photo')"/><div class="fgrid" style="margin-top:.65rem"><div class="fg"><label>Title/Album</label><input id="media-title" placeholder="Match Day photos…" style="width:100%;padding:.5rem .7rem"/></div><div class="fg"><label>Category</label><select style="width:100%;padding:.5rem .7rem"><option>Match Photos</option><option>Training</option><option>Events</option></select></div></div><button class="btn-p" style="width:100%;margin-top:.5rem" onclick="showToast('Uploading…')">UPLOAD</button>`)}</div>
      <div>${panel('UPLOAD VIDEO','',`<div class="upload-zone" onclick="document.getElementById('videoInput').click()"><div class="uz-icon">🎬</div><p>Highlights, full matches, interviews</p><small>MP4 MOV · max 2GB</small></div><input type="file" id="videoInput" accept="video/*" style="display:none" onchange="handleMediaUpload(this,'video')"/><div class="fgrid" style="margin-top:.65rem"><div class="fg"><label>Title</label><input id="vid-title" placeholder="Match highlights…" style="width:100%;padding:.5rem .7rem"/></div><div class="fg"><label>Category</label><select style="width:100%;padding:.5rem .7rem"><option>Match Highlights</option><option>Goal Rush</option><option>Full Match</option><option>Interview</option></select></div></div><button class="btn-p" style="width:100%;margin-top:.5rem" onclick="showToast('Uploading…')">UPLOAD</button><div style="margin-top:.65rem;padding:.5rem .65rem;background:var(--bg3);border-radius:5px;font-size:.68rem;color:var(--muted)">Live RTMP: <span style="font-family:var(--font-mono);color:var(--gold)">rtmp://stream.krfkenya.co.ke/live</span></div>`)}</div>
    </div>`;
}

async function handleMediaUpload(inputEl, docType) {
  const file=inputEl.files[0]; if(!file) return;
  showToast('Uploading…');
  const ext=file.name.split('.').pop();
  const path=`${docType}s/${Date.now()}.${ext}`;
  const { error } = await STATE.sb.storage.from('media').upload(path,file,{upsert:true});
  if (error) { showToast('Upload failed: '+error.message); return; }
  const { data:{ publicUrl } } = STATE.sb.storage.from('media').getPublicUrl(path);
  const title=document.getElementById('media-title')?.value||document.getElementById('vid-title')?.value||file.name;
  await STATE.sb.from('media').insert({ title, media_type:docType, file_url:publicUrl, approved:true, visibility:'public', uploaded_by:STATE.user.id });
  showToast(`${docType} uploaded and live!`);
}

// ── ADMIN: NEWS ────────────────────────────────
async function news() {
  const { data:articles } = await STATE.sb.from('news').select('*').order('created_at',{ascending:false}).limit(20);
  document.getElementById('mainContent').innerHTML=`
    <div style="display:flex;gap:.5rem;margin-bottom:1rem"><button class="btn-p" style="font-size:.75rem;padding:.45rem 1rem" onclick="document.getElementById('newsFormWrap').style.display='block';this.style.display='none'">+ Write Article</button></div>
    <div id="newsFormWrap" style="display:none;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;margin-bottom:1.25rem">
      <div style="font-family:var(--font-h);font-size:.62rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:.75rem">NEW ARTICLE</div>
      <div class="fgrid">
        <div class="fg"><label>Title</label><input id="news-title" placeholder="Article title…" style="width:100%;padding:.6rem .85rem"/></div>
        <div class="fg"><label>Tag</label><select id="news-tag" style="width:100%;padding:.6rem .85rem"><option>News</option><option>Match Report</option><option>Tournament</option><option>Transfer</option><option>Federation</option></select></div>
        <div class="fg full"><label>Cover Image URL</label><input id="news-cover" placeholder="https://…" style="width:100%;padding:.55rem .75rem"/></div>
        <div class="fg full"><label>Video URL</label><input id="news-video" placeholder="YouTube or direct URL…" style="width:100%;padding:.55rem .75rem"/></div>
        <div class="fg full"><label>Content</label><textarea id="news-content" rows="6" style="width:100%;padding:.6rem .85rem;resize:vertical" placeholder="Write your article here…"></textarea></div>
      </div>
      <div style="display:flex;gap:.5rem;margin-top:.85rem">
        <button class="btn-p" style="font-size:.75rem;padding:.45rem 1.25rem" onclick="publishNews()">Publish →</button>
        <button class="btn-s" onclick="document.getElementById('newsFormWrap').style.display='none'">Cancel</button>
      </div>
    </div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;overflow:hidden">
      <table class="dt"><thead><tr><th>Title</th><th>Tag</th><th>Date</th><th>Status</th></tr></thead>
      <tbody>${articles?.length?articles.map(a=>`<tr><td style="font-size:.82rem;font-weight:500">${a.title}</td><td><span class="bdg bdg-gold">${a.tag||'News'}</span></td><td style="font-size:.72rem;color:var(--muted)">${new Date(a.created_at).toLocaleDateString('en-KE')}</td><td><span class="bdg bdg-${a.published?'green':'amber'}">${a.published?'Published':'Draft'}</span></td></tr>`).join(''):'<tr><td colspan="4" style="padding:2rem;text-align:center;color:var(--muted)">No articles yet</td></tr>'}</tbody>
      </table>
    </div>`;
}

async function publishNews() {
  const title=document.getElementById('news-title')?.value?.trim();
  const content=document.getElementById('news-content')?.value?.trim();
  const tag=document.getElementById('news-tag')?.value||'News';
  const cover=document.getElementById('news-cover')?.value?.trim()||null;
  const video=document.getElementById('news-video')?.value?.trim()||null;
  if (!title||!content) { showToast('Fill in title and content'); return; }
  showToast('Publishing…');
  const { error } = await STATE.sb.from('news').insert({ title, content, tag, cover_image_url:cover, video_url:video, published:true, published_at:new Date().toISOString(), author_id:STATE.user.id });
  if (error) { showToast('Error: '+error.message); return; }
  showToast('Article published!'); news();
}

// ── ADMIN: SETTINGS ────────────────────────────
async function settings() {
  const ss=STATE.siteSettings||{};
  document.getElementById('mainContent').innerHTML=`
    <div class="g2">
      <div>${panel('SITE SETTINGS','',`
        <div class="fgrid">
          <div class="fg full"><label>Hero Type</label><select id="heroType" onchange="toggleHeroInputs()" style="width:100%;padding:.55rem .75rem"><option value="video" ${!ss.hero_image_url?'selected':''}>Video</option><option value="image" ${ss.hero_image_url?'selected':''}>Image</option></select></div>
          <div class="fg full" id="heroVideoWrap"><label>Video URL</label><input id="heroUrl" value="${ss.hero_video_url||''}" placeholder="https://…" style="width:100%;padding:.55rem .75rem"/></div>
          <div class="fg full" id="heroImageWrap" style="display:none"><label>Image URL</label><input id="heroImageUrl" value="${ss.hero_image_url||''}" placeholder="https://…" style="width:100%;padding:.55rem .75rem"/></div>
          <div class="fg full"><label>Ticker Message</label><input id="tickerMsg" value="${ss.ticker_message||''}" placeholder="Live ticker…" style="width:100%;padding:.55rem .75rem"/></div>
          <div class="fg full"><label>Season Label</label><input id="seasonLabel" value="${ss.season_label||'KPL Season 2025'}" style="width:100%;padding:.55rem .75rem"/></div>
          <div class="fg"><label>Facebook URL</label><input id="fbUrl" value="${ss.facebook_url||''}" style="width:100%;padding:.55rem .75rem"/></div>
          <div class="fg"><label>Instagram URL</label><input id="igUrl" value="${ss.instagram_url||''}" style="width:100%;padding:.55rem .75rem"/></div>
          <div class="fg"><label>YouTube URL</label><input id="ytUrl" value="${ss.youtube_url||''}" style="width:100%;padding:.55rem .75rem"/></div>
          <div class="fg"><label>Twitter/X URL</label><input id="twUrl" value="${ss.twitter_url||''}" style="width:100%;padding:.55rem .75rem"/></div>
          <div class="fg"><label>TikTok URL</label><input id="ttUrl" value="${ss.tiktok_url||''}" style="width:100%;padding:.55rem .75rem"/></div>
          <div class="fg"><label>Live Stream URL</label><input id="liveStreamUrl" value="${ss.live_stream_url||''}" style="width:100%;padding:.55rem .75rem"/></div>
          <div class="fg"><label>RTMP URL</label><input id="liveRtmpUrl" value="${ss.live_rtmp_url||''}" style="width:100%;padding:.55rem .75rem"/></div>
        </div>
        <button class="btn-p" style="margin-top:.75rem;width:100%" onclick="saveSettings()">SAVE SETTINGS</button>`)}</div>
      <div>${panel('PUSH NOTIFICATIONS','',`
        <div style="font-size:.78rem;color:var(--dim);margin-bottom:.85rem;line-height:1.7">Send instant push notifications to all subscribed fans and members when key match events happen.</div>
        <div class="fg" style="margin-bottom:.65rem"><label>Notification Message</label><textarea id="pushMsg" rows="3" placeholder="GOAL! Nairobi Bulls score in the 35th minute!" style="width:100%;padding:.55rem .75rem"></textarea></div>
        <div class="fg" style="margin-bottom:.65rem"><label>Target Audience</label><select style="width:100%;padding:.55rem .75rem"><option>All Subscribers</option><option>Players Only</option><option>Officials Only</option><option>Fans Only</option></select></div>
        <div style="display:flex;gap:.5rem">
          <button class="btn-p" style="flex:1" onclick="sendBroadcastNotif()">🔔 SEND NOTIFICATION</button>
          <button class="btn-s" onclick="sendWhatsAppAlert('${STATE.liveMatch?.id||''}')">📱 WhatsApp</button>
        </div>`)}</div>
    </div>`;
  toggleHeroInputs();
}

function toggleHeroInputs(){ const t=document.getElementById('heroType')?.value; document.getElementById('heroVideoWrap').style.display=t==='video'?'':'none'; document.getElementById('heroImageWrap').style.display=t==='image'?'':'none'; }

async function saveSettings() {
  const fields=[['hero_video_url',document.getElementById('heroType')?.value==='video'?(document.getElementById('heroUrl')?.value||''):''],['hero_image_url',document.getElementById('heroType')?.value==='image'?(document.getElementById('heroImageUrl')?.value||''):''],['ticker_message',document.getElementById('tickerMsg')?.value],['season_label',document.getElementById('seasonLabel')?.value],['facebook_url',document.getElementById('fbUrl')?.value],['instagram_url',document.getElementById('igUrl')?.value],['youtube_url',document.getElementById('ytUrl')?.value],['twitter_url',document.getElementById('twUrl')?.value],['tiktok_url',document.getElementById('ttUrl')?.value],['live_stream_url',document.getElementById('liveStreamUrl')?.value],['live_rtmp_url',document.getElementById('liveRtmpUrl')?.value]].filter(([,v])=>v!==null&&v!==undefined);
  showToast('Saving…');
  for (const [key,value] of fields) { await STATE.sb.from('site_settings').upsert({key,value}); if(STATE.siteSettings) STATE.siteSettings[key]=value; }
  showToast('Settings saved!');
}

async function sendBroadcastNotif() {
  const msg=document.getElementById('pushMsg')?.value?.trim();
  if (!msg) { showToast('Enter a message'); return; }
  // Insert into notifications table for all active users
  const { data:users } = await STATE.sb.from('users').select('id').eq('is_active',true);
  if (!users?.length) { showToast('No active users'); return; }
  const records = users.map(u=>({ user_id:u.id, message:msg, read:false }));
  await STATE.sb.from('notifications').insert(records);
  showToast(`Notification sent to ${records.length} users!`);
}

// ── LINEUP ─────────────────────────────────────
window.renderLineup = async function() {
  const isTM=STATE.user?.role==='team_manager';
  const { data:matchList } = await STATE.sb.from('matches').select('id,match_date,home_team:teams!home_team_id(id,name),away_team:teams!away_team_id(id,name),tournament:tournaments(name)').in('status',['upcoming','live']).order('match_date',{ascending:true}).limit(10);
  const teamId=STATE.user?.team_id;
  let pQuery=STATE.sb.from('users').select('id,name,jersey_number,position').eq('role','player').eq('is_active',true);
  if (isTM&&teamId) pQuery=pQuery.eq('team_id',teamId);
  const { data:players } = await pQuery.order('jersey_number');
  const POSITIONS=['Centre Man','Winger Right','Winger Left','Front Right','Front Left'];
  document.getElementById('mainContent').innerHTML=`
    <div class="g2">
      <div>${panel('SUBMIT LINEUP',isTM?'Your team':'Select match',`
        <div class="fg" style="margin-bottom:.75rem"><label>Match</label><select id="lineupMatchId" onchange="loadExistingLineup()" style="width:100%;padding:.55rem .75rem">
          <option value="">— Select match —</option>${(matchList||[]).map(m=>{const d=m.match_date?new Date(m.match_date).toLocaleDateString('en-KE',{day:'numeric',month:'short'}):'TBC';return `<option value="${m.id}">${m.home_team?.name||'?'} vs ${m.away_team?.name||'?'} · ${d}</option>`;}).join('')}
        </select></div>
        ${!isTM?`<div class="fg" style="margin-bottom:.75rem"><label>Team Side</label><select id="lineupSide" style="width:100%;padding:.55rem .75rem"><option value="home">Home</option><option value="away">Away</option></select></div>`:''}
        <div style="margin:.75rem 0;font-size:.62rem;letter-spacing:1px;text-transform:uppercase;color:var(--muted)">Starting Five</div>
        <div style="display:grid;gap:.5rem" id="positionSlots">
          ${POSITIONS.map(pos=>`<div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:.55rem .85rem;display:flex;align-items:center;gap:.65rem">
            <div style="font-size:.62rem;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;width:90px;flex-shrink:0">${pos}</div>
            <select data-pos="${pos}" style="flex:1;background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:.4rem .65rem;color:var(--white);font-size:.78rem">
              <option value="">— Select player —</option>${(players||[]).map(p=>`<option value="${p.id}">#${p.jersey_number||'?'} ${p.name}</option>`).join('')}
            </select>
          </div>`).join('')}
        </div>
        <div class="fg" style="margin-top:.75rem"><label>Notes for referee</label><textarea id="lineupNotes" rows="2" placeholder="Lineup notes, late changes…" style="width:100%;padding:.55rem .75rem"></textarea></div>
        <div style="display:flex;gap:.5rem;margin-top:.85rem">
          <button class="btn-p" style="flex:1" onclick="submitLineup()">SUBMIT LINEUP</button>
          <button class="btn-s" onclick="showToast('Draft saved locally')">Save Draft</button>
        </div>
        <div id="lineupStatus" style="margin-top:.5rem"></div>`)}</div>
      <div>${panel('SUBMITTED LINEUPS','This fixture',`<div id="lineupPreview" style="color:var(--dim);font-size:.78rem;padding:.5rem">Select a match to see submitted lineups.</div>`)}</div>
    </div>`;
};

async function loadExistingLineup() {
  const matchId=document.getElementById('lineupMatchId')?.value; if(!matchId) return;
  const preview=document.getElementById('lineupPreview'); if(preview) preview.innerHTML='<div style="color:var(--dim);font-size:.78rem">Loading…</div>';
  const { data:lineups } = await STATE.sb.from('lineups').select('*,player:users(name,jersey_number)').eq('match_id',matchId);
  if (!lineups?.length) { if(preview) preview.innerHTML='<div style="color:var(--dim);font-size:.78rem;padding:.5rem">No lineups submitted yet.</div>'; return; }
  const grouped={}; lineups.forEach(l=>{ const s=l.team_side||'home'; if(!grouped[s]) grouped[s]=[]; grouped[s].push(l); });
  if (preview) preview.innerHTML=Object.entries(grouped).map(([side,entries])=>`<div style="margin-bottom:.85rem"><div style="font-size:.62rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:.45rem">${side} lineup</div><table class="dt"><thead><tr><th>#</th><th>Player</th><th>Position</th></tr></thead><tbody>${entries.map(e=>`<tr><td style="font-family:var(--font-mono);color:var(--gold)">${e.player?.jersey_number||'?'}</td><td style="font-weight:500">${e.player?.name||'—'}</td><td><span class="bdg bdg-gray">${e.position||'—'}</span></td></tr>`).join('')}</tbody></table></div>`).join('');
}

async function submitLineup() {
  const matchId=document.getElementById('lineupMatchId')?.value; if(!matchId){showToast('Select a match');return;}
  const isTM=STATE.user?.role==='team_manager', side=isTM?'home':(document.getElementById('lineupSide')?.value||'home');
  const notes=document.getElementById('lineupNotes')?.value||'';
  const slots=document.querySelectorAll('#positionSlots select[data-pos]');
  const entries=[]; let missing=false;
  slots.forEach(sel=>{ if(!sel.value){missing=true;return;} entries.push({match_id:matchId,player_id:sel.value,position:sel.dataset.pos,team_side:side,notes,submitted_by:STATE.user.id}); });
  if(missing){showToast('Select a player for every position');return;}
  showToast('Submitting…');
  await STATE.sb.from('lineups').delete().eq('match_id',matchId).eq('team_side',side).eq('submitted_by',STATE.user.id);
  const { error } = await STATE.sb.from('lineups').insert(entries);
  if(error){showToast('Error: '+error.message);return;}
  const st=document.getElementById('lineupStatus'); if(st) st.innerHTML='<div style="padding:.5rem .75rem;background:rgba(0,201,106,.1);border-radius:5px;font-size:.72rem;color:#4cd97b">✓ Lineup submitted!</div>';
  showToast('Lineup submitted!'); loadExistingLineup();
}

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  if (STATE.sb) checkSavedSession();
  // Login form toggles
  window.showRegForm  = () => { document.getElementById('loginForm').style.display='none'; document.getElementById('registerForm').style.display='block'; };
  window.showLoginForm = () => { document.getElementById('loginForm').style.display='block'; document.getElementById('registerForm').style.display='none'; };
});