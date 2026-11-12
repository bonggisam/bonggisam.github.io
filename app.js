import { SERVICES, badgeText, barPosition, cityOf, contentProblem, dialable, entryRows, longDay, parseDay, rankTrack, staleNotice, storeNotices, storeStatus, suggestedStage, summarize, toIso, today, weekRows } from './logic.js';

/** 제보를 받을 주소. 정해지면 HTTPS 주소를 넣는다. 비어 있으면 내용을 복사해 옮기도록 안내한다. */
const REPORT_ENDPOINT = '';
/** "커피 한 잔 사 주기" 송금 링크(토스, 카카오페이 등). 비어 있으면 후원 칸을 숨긴다.
 *  '/'로 끝나면(예: 토스 아이디 링크) 금액을 뒤에 붙여 버튼마다 금액이 채워진 채 열린다. */
const DONATE_URL = '';
/** 아이폰 앱의 인앱 상품과 같은 세 가지. 2026-11-12 추가. */
const DONATE_OPTIONS = [['☕', '커피 한 잔', 3300], ['☕☕', '커피 두 잔', 6600], ['🍚', '든든한 한 끼', 11000]];
// 안드로이드 앱은 웹앱을 ?from=android로 연다. 구글 플레이 결제 정책 때문에 앱 안에서는 외부 후원 링크를 보이지 않는다.
const inAndroidApp = (() => {
  try {
    if (new URLSearchParams(location.search).get('from') === 'android' || document.referrer.startsWith('android-app://')) sessionStorage.setItem('adeul-android', '1');
    return sessionStorage.getItem('adeul-android') === '1';
  } catch {
    return false;
  }
})();
const KEY = 'adeul-local-v1';
const TOWN = '쇼핑타운';
const ISSUES = ['영업시간', '들어가는 시간', '주소나 위치', '전화번호', '물건 들어오는 날', '품목', '기타'];
const TABS = [['home', '홈'], ['shop', '장보기'], ['camps', '훈련소'], ['todo', '팁'], ['about', '만든 사람']];
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  shop: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11.5l2-8H6.2"/>',
  camps: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  todo: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  about: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
};

/** 앱에 바라는 점. 2026-11-12부터 메일 대신 질문과 같은 구글 설문지로 받는다(메일 주소를 드러내지 않으려고). */
/** "다른 부모님께 알려 주기"로 보내는 글. 앱의 ShareInvite.message와 같다. 웹앱 주소는 따로 붙인다. */
const SHARE_TEXT = "아이를 군에 보낸 부모님께 도움이 되는 무료 앱이에요. 전역일 계산, 훈련소별 수료식 안내, 영외마트 여는 시간까지 가입 없이 볼 수 있어요. 'Love You, Son'";
const wishView = { text: '', state: 'idle' };

/** 방문자 수. 서버(functions/api/visits.js)가 없거나 오프라인이면 null로 두고 화면에서 숨긴다.
 *  GitHub Pages에는 서버가 없어 묻지 않는다. */
const visits = { today: null, total: null };
const VISIT_KEY = 'adeul-visit-day';

function visitLine() {
  if (visits.total === null) return '<p id="visit-count" hidden></p>';
  const n = (x) => x.toLocaleString('ko-KR');
  return `<p id="visit-count" class="visits">${em('👀')}오늘 <b>${n(visits.today)}</b>명, 지금까지 <b>${n(visits.total)}</b>명이 이 앱을 찾아 주셨어요</p>`;
}

/** 한 기기에서 하루 한 번만 센다. 기기에는 마지막으로 센 날짜만 저장한다. */
async function loadVisits() {
  if (location.hostname.endsWith('github.io')) return;
  const day = toIso(today());
  let counted = false;
  try { counted = localStorage.getItem(VISIT_KEY) === day; } catch { /* 저장소 없음 */ }
  try {
    const res = await fetch('api/visits', { method: counted ? 'GET' : 'POST', cache: 'no-store' });
    if (!res.ok) return;
    const got = await res.json();
    if (!Number.isInteger(got?.today) || !Number.isInteger(got?.total) || got.today < 0 || got.total < 0) return;
    if (!counted) { try { localStorage.setItem(VISIT_KEY, day); } catch { /* 저장소 없음 */ } }
    visits.today = got.today;
    visits.total = got.total;
    const box = document.getElementById('visit-count');
    if (box) box.outerHTML = visitLine();
  } catch {
    // 오프라인이거나 서버가 없으면 숫자를 보이지 않는다.
  }
}

const view = document.getElementById('view');
let content = null;
const shop = { region: '서울', city: '', query: '' };
const report = { issue: ISSUES[0], text: '', day: '', state: 'idle', mode: 'fix' };
let relation = null;
let eraseAsked = false;
const tipsView = { stage: null, query: '' };
const linksView = { group: null };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nowDay = () => today();

function readLocal() {
  const base = { enlist: '', service: 'army', manualEnd: '', saved: [], welcomed: false };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return base;
  }
}

function writeLocal(patch) {
  const next = { ...readLocal(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장할 수 없는 환경이면 이번 방문 동안만 보여 준다 */
  }
  return next;
}

const baseText = () => { const d = parseDay(content.baseDate); return `${d.y}년 ${d.m}월 ${d.d}일`; };
const checkedText = () => { const d = parseDay(content.closuresCheckedOn); return `${d.y}년 ${d.m}월 ${d.d}일`; };
const staleBox = () => { const t = staleNotice(content, today()); return t ? `<p class="notice caution">${esc(t)}</p>` : ''; };
const storeById = (id) => content.stores.find((s) => s.id === id);
const citiesIn = (region) => [...new Set(content.stores.filter((s) => s.region === region).map(cityOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
const inRegion = (region, city) => content.stores
  .filter((s) => s.region === region && (!city || cityOf(s) === city))
  .sort((a, b) => (cityOf(a) + a.name).localeCompare(cityOf(b) + b.name, 'ko'));

const lines = (text) => String(text || '').split(';').map((x) => x.trim()).filter(Boolean);
const card = (item) => `<div class="card"><h3>${item.emoji ? em(item.emoji) : ''}${esc(item.title)}</h3><p>${esc(item.body)}</p>${item.source ? `<small>${esc(item.source)}</small>` : ''}</div>`;
const backLink = (href, label = '뒤로') => `<a class="back" href="${href}">‹ ${label}</a>`;

const bar = (time, cls = '', active = false) => {
  const pos = barPosition(time);
  return `<span class="bar ${cls}" aria-hidden="true"><i class="${active ? 'active' : ''}" style="left:${pos.left}%;width:${pos.width}%"></i></span>`;
};
const axis = '<div class="axis" aria-hidden="true"><span>8시</span><span>20시</span></div>';

function entryBars(rows) {
  if (!rows.length) return '';
  return `${rows.map((r) => `<div class="entry"><div><span>${r.active ? `<b>${esc(r.label)}</b>` : esc(r.label)}</span><span>${esc(r.time)}</span></div>${bar(r.time, '', r.active)}</div>`).join('')}${axis}`;
}

/** 자료에 든 바깥 주소는 https만 쓴다. 자료가 잘못돼도 javascript: 같은 주소가 화면에 들어가지 않게. */
const safeUrl = (u) => (typeof u === 'string' && /^https:\/\//.test(u) ? u : null);

function storeRow(store) {
  const now = nowDay();
  const status = storeStatus(store, now, content);
  const city = cityOf(store);
  const rows = entryRows(store, now, content);
  const hours = status.kind === 'open' && rows.length ? (status.line.match(/\d{1,2}:\d{2}~\d{1,2}:\d{2}/) || [''])[0] : '';
  return `<a class="row" href="#/store/${store.id}"><span class="row-head"><span><b>${esc(store.name)}</b>${city ? `<span>${esc(city)}</span>` : ''}</span>${hours ? `<span class="time">${esc(hours)}</span>` : ''}</span>${hours ? `${bar(hours, 'thin')}<small>${em('🟢')}오늘 열어요${store.separate ? ', 입장 시간 구분 있음' : ''}</small>` : `<span class="status ${status.kind}">${esc(status.line)}</span>`}</a>`;
}

function todayCard(store) {
  const now = nowDay();
  const status = storeStatus(store, now, content);
  return `<a class="card hero saved" href="#/store/${store.id}"><span class="sticker" aria-hidden="true">⭐ 저장한 마트</span><h2>${em('🏪')}${esc(store.name)}</h2><p class="headline ${status.kind}">${esc(status.line)}</p>${entryBars(entryRows(store, now, content))}</a>`;
}

function renderHome() {
  const local = readLocal();
  const now = nowDay();
  const s = summarize(local, now);
  const saved = local.saved.map(storeById).filter(Boolean);
  return `<h1 class="sr">홈</h1>
  ${ddayHero(s, now)}
  ${saved.length ? '<h2 class="on-olive">🛒 오늘 갈 마트</h2>' : ''}
  ${saved.length ? `${todayCard(saved[0])}${saved.slice(1).map(storeRow).join('')}${staleBox() || `<small>${esc(baseText())} 운영표와 휴점 공지를 보고 정리했어요.</small>`}`
    : `<div class="card hero"><h2>${em('🛒')}자주 가는 마트가 오늘 몇 시에 여는지 바로 보여 드릴게요</h2><p>마트를 하나 저장해 두시면 여기에 오늘 여는 시간이 나와요.</p><a class="btn" href="#/shop">${em('🛒')}마트 찾으러 가기</a></div>`}
  <div class="tiles"><a class="tile brass" href="#/check"><span aria-hidden="true">🪪</span>처음이라면</a><a class="tile cream" href="#/papers"><span aria-hidden="true">🎒</span>가져갈 것</a><a class="tile deep" href="#/camps"><span aria-hidden="true">🎖️</span>수료식</a></div>`;
}

/** 홈 위쪽. 전역까지 남은 날을 달력처럼 크게 보여 준다. 누르면 날짜를 고친다. 앱의 DischargeHero와 같다. */
function ddayHero(s, now) {
  const date = longDay(now).replace(/^\d+년 /, '');
  const counting = s.sv.ok && !s.dateProblem && s.left !== null && s.left > 0;
  let tail;
  if (!s.sv.ok) tail = '눌러서 복무 형태를 고칠 수 있어요.';
  else if (!s.end || s.dateProblem) tail = '누르시면 입대일로 전역일을 계산해 드려요.';
  else if (s.left > 0) tail = `${longDay(s.end)}에 전역해요`;
  else if (s.left === 0) tail = '그동안 정말 고생 많으셨어요 🎉';
  else tail = `${longDay(s.end)}에 전역했어요`;
  const big = counting ? `<span class="num">${s.left}</span>` : `<span class="word">${esc(s.headline)}</span>`;
  // 계급장 오르기(2판 5번): 남은 날, 이병→병장 예상 진급 달, 복무 진행 막대. 앱의 DischargeHero와 같다.
  const track = rankTrack(s, now);
  const chev = (n, on) => `<span class="chev${on ? ' on' : ''}">${'<i></i>'.repeat(n)}</span>`;
  const ranks = track ? `<span class="ranks" aria-hidden="true">${track.steps.map((r, i) => `<span>${chev(i + 1, i <= track.current)}<b>${r.name}</b><small>${i === 0 ? '입대' : `${r.from.y === now.y ? '' : `${String(r.from.y).slice(2)}년 `}${r.from.m}월`}${i === track.current && i > 0 ? ' 🎉' : ''}</small></span>`).join('')}</span>
    <span class="progress" aria-hidden="true"><i style="width:${Math.round(s.progress * 100)}%"></i></span>
    <span class="tail">예상 진급 달이에요. 부대 심사에 따라 늦어질 수 있어요.</span>` : '';
  const lead = track && track.current >= 0 ? `🪖 지금 ${RANK_NOW[track.current]}` : '🪖 우리 아이';
  const rankText = track && track.current >= 0 ? ` 지금 ${track.steps[track.current].name}, 복무 ${Math.round(s.progress * 100)}% 지났어요.` : '';
  return `<a class="dday" href="#/dday" aria-label="${esc(`${date}. ${counting ? `전역까지 ${s.left}일` : s.headline}. ${tail}.${rankText} 눌러서 입대일과 전역일 고치기`)}">
    <span class="top" aria-hidden="true"><span class="lead"><span>${esc(lead)}</span><b>${counting ? '전역까지' : esc(date)}</b></span>${big}</span>
    <span class="tail" aria-hidden="true">${esc(tail)}</span>
    ${ranks}</a>`;
}
const RANK_NOW = ['이병이에요', '일병이에요', '상병이에요', '병장이에요'];

const welcome = { service: 'army', date: '' };

/** 처음 열 때 한 번 보여 준다. 가입은 없고, 넘겨도 홈의 큰 숫자를 눌러 나중에 넣을 수 있다. */
function renderWelcome() {
  const now = nowDay();
  if (!welcome.date) welcome.date = toIsoDay(now);
  const sv = SERVICES[welcome.service];
  const asksEnd = !sv.months;
  const s = summarize(asksEnd ? { enlist: '', service: welcome.service, manualEnd: welcome.date } : { enlist: welcome.date, service: welcome.service, manualEnd: '' }, now);
  let result = '';
  if (!sv.ok) result = `<p class="notice caution">${esc(s.note)}</p>`;
  else if (s.end && !s.dateProblem) {
    result = `<div class="result"><small>${s.left > 0 ? '전역까지' : '전역일'}</small>${s.left > 0 ? `<p class="num">${s.left}<em>일 남았어요</em></p>` : ''}<p><b>${esc(longDay(s.end))}${s.left >= 0 ? '에 전역해요' : '에 전역했어요'}</b></p></div>`;
  }
  return `<div class="welcome" style="display:grid;gap:16px">
  <p class="big-emoji" aria-hidden="true">🎖️</p><h1>우리 아이 전역일,<br>같이 세어 볼까요?</h1>
  <p class="lede">입대일을 넣으시면 전역일과 남은 날을 계산해 드려요. 가입은 없고, 날짜는 이 기기에만 저장돼요.</p>
  <h2>어디에서 복무하나요?</h2>
  <div class="chips">${Object.entries(SERVICES).map(([k, v]) => `<button type="button" data-wservice="${k}" aria-pressed="${k === welcome.service}">${esc(v.name)}${v.months ? ` ${v.months}개월` : ''}</button>`).join('')}</div>
  <div class="card form"><label for="welcome-date">${asksEnd ? '전역일' : '입대일'}</label><input type="date" id="welcome-date" value="${esc(welcome.date)}"></div>
  <div aria-live="polite">${result}</div>
  <button type="button" class="btn accent" data-welcome="save">${em('💾')}이렇게 저장할게요</button>
  <button type="button" class="btn outline" data-welcome="later">${em('⏰')}나중에 할게요</button>
  <small>홈 화면 위쪽의 큰 숫자를 누르면 언제든 넣거나 고칠 수 있어요.</small></div>`;
}

const toIsoDay = (d) => `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
const needsWelcome = () => { const l = readLocal(); return !l.welcomed && !l.enlist && !l.manualEnd; };

function renderDday() {
  const local = readLocal();
  const s = summarize(local, nowDay());
  return `${backLink('#/home')}
  <h1>입대일과 전역일</h1>
  <div class="card form">
    <label for="enlist">입대일</label>
    <input type="date" id="enlist" data-local="enlist" value="${esc(local.enlist)}">
    <label for="service">복무 형태</label>
    <select id="service" data-local="service">${Object.entries(SERVICES).map(([k, v]) => `<option value="${k}" ${local.service === k ? 'selected' : ''}>${esc(v.name)}${v.months ? ` ${v.months}개월` : ''}</option>`).join('')}</select>
    <label for="manualEnd">전역일 직접 고치기(선택)</label>
    <input type="date" id="manualEnd" data-local="manualEnd" value="${esc(local.manualEnd)}">
    <small>이 정보는 이 기기에만 저장돼요. 가입도 필요 없어요. 아이폰 Safari에서는 7일간 쓰지 않으면 지워질 수 있어요.</small>
  </div>
  <div class="card" aria-live="polite">
    <small>마트 이용 남은 날</small>
    <p class="big ${s.headline.startsWith('D-') ? '' : 'long'}">${esc(s.headline)}</p>
    ${s.end && !s.dateProblem ? `<p>예상 전역일 <b>${esc(longDay(s.end))}</b></p>` : ''}
    <p>${esc(s.note)}</p>
    <small>휴가, 징계, 조기 전역 같은 일로 실제 전역일은 조금 달라질 수 있어요.</small>
  </div>`;
}

function renderCheck() {
  const answer = relation === null ? null : content.relations[relation];
  return `${backLink('#/home')}
  <h1>자녀와 어떤 관계인가요?</h1>
  ${content.relations.map((r, i) => `<button type="button" class="opt" data-relation="${i}" aria-pressed="${relation === i}">${esc(r.label)}</button>`).join('')}
  ${answer ? `<div class="card answer" aria-live="polite"><b>${esc(answer.answer)}</b>${answer.eligible ? `<p>사회복무요원이나 상근예비역의 부모님은 이용하실 수 없어요.</p><a class="btn" href="#/papers">${em('🎒')}가져갈 것 보기</a>` : ''}</div>` : '<p>고르시면 바로 알려 드릴게요.</p>'}`;
}

const renderPapers = () => `${backLink('#/home')}<h1>이것만 챙겨 가세요</h1>${content.papers.map(card).join('')}<a class="btn outline" href="#/rules">${em('💡')}더 알아 두면 좋은 것</a>`;
const renderRules = () => `${backLink('#/home')}<h1>알아 두면 좋아요</h1>${content.rules.map(card).join('')}`;
const renderGoods = () => `${backLink('#/shop')}<h1>이런 걸 팔아요</h1><p>${esc(content.goodsNote)}</p>${content.goods.map(card).join('')}`;

function shopResults() {
  const q = shop.query.trim();
  if (q) return content.stores.filter((s) => s.name.includes(q) || s.address.includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  return inRegion(shop.region, shop.city);
}

function renderShopList() {
  if (!shop.query.trim() && shop.region === TOWN) {
    return `<div class="card"><h2>쇼핑타운 ${content.towns.length}곳</h2><p>마트와 같은 자격으로 들어갈 수 있어요. 다만 군 마트 가격인 건 일부 품목뿐이에요. 여는 날과 시간이 지점마다 달라서 먼저 확인해 보세요.</p>${content.towns.map((t) => `<p class="town"><b>${esc(t)} 쇼핑타운</b></p>`).join('')}</div>`;
  }
  const list = shopResults();
  const title = shop.query.trim() ? `찾은 마트 ${list.length}곳` : `${shop.region}${shop.city ? ` ${shop.city}` : ''} ${list.length}곳`;
  return `<div style="display:grid;gap:10px"><h2>${esc(title)}</h2>${list.length ? list.map(storeRow).join('') : '<p>그런 마트는 못 찾았어요. 다른 이름이나 지역으로 찾아볼까요?</p>'}${staleBox()}<small>${esc(baseText())} 운영표와 ${esc(checkedText())}까지 나온 휴점 공지를 보고 정리했어요.</small></div>`;
}

function renderShop() {
  const long = shop.region !== TOWN && inRegion(shop.region).length > 8;
  return `<h1>어느 마트에 갈까요</h1>
  <label class="field" for="q">마트 이름이나 주소로 찾기</label>
  <input type="search" id="q" value="${esc(shop.query)}" autocomplete="off">
  <p class="field">지역 고르기</p>
  <div class="chips">${[...content.regions, TOWN].map((r) => `<button type="button" data-region="${esc(r)}" aria-pressed="${r === shop.region}">${esc(r)}</button>`).join('')}</div>
  ${long ? `<p class="field">시·군 고르기</p><div class="chips">${shop.city
    ? `<button type="button" data-city="${esc(shop.city)}" aria-pressed="true">${esc(shop.city)}</button><button type="button" data-city="" aria-pressed="false">다른 시·군 고르기</button>`
    : citiesIn(shop.region).map((c) => `<button type="button" data-city="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>` : ''}
  <div id="shop-list">${renderShopList()}</div>
  <a class="btn outline" href="#/goods">${em('🛍️')}무엇을 파나요</a>`;
}

function renderStore(id) {
  const store = storeById(id);
  if (!store) return `${backLink('#/shop', '장보기')}<h1>마트를 찾지 못했어요</h1><p>목록에서 다시 골라 주세요.</p>`;
  const now = nowDay();
  const status = storeStatus(store, now, content);
  const saved = readLocal().saved.includes(store.id);
  const tel = dialable(store);
  const firstPhone = (store.phone || '').split('/')[0].trim();
  const mapName = store.name.replace(/\([^)]*\)\s*/, '');
  const fact = (t, v) => `<dt>${esc(t)}</dt><dd>${esc(v)}</dd>`;
  return `${backLink('#/shop', '장보기')}
  <div><h1>${esc(store.name)}</h1><small>${esc(store.address)}</small></div>
  <div class="card">
    <h2 class="headline ${status.kind}">${esc(status.line)}</h2>
    ${entryBars(entryRows(store, now, content))}
    ${storeNotices(store, now, content).map((n) => `<p class="notice ${n.strong ? '' : 'caution'}">${esc(n.text)}</p>`).join('')}
  </div>
  <div class="card">
    <h2>영업시간</h2>
    ${weekRows(store).map((r) => `<div class="entry"><div><span>${esc(r.label)}</span><span>${esc(r.time)}</span></div>${bar(r.time, 'mid')}</div>`).join('')}
    ${axis}
    ${store.closedDays || store.lunch ? `<dl>${store.closedDays ? fact('쉬는 날', lines(store.closedDays).join('\n')) : ''}${store.lunch ? fact('점심시간', lines(store.lunch).join('\n')) : ''}</dl>` : ''}
  </div>
  ${store.separate ? `<div class="card"><dl>${fact('누가 언제 들어가나요', lines(store.separate).join('\n'))}</dl><small>부모님도 '현역가족' 시간에 들어가실 수 있을 것 같은데, 딱 잘라 적어 둔 규정은 아직 못 찾았어요. 처음 가실 땐 전화로 한 번 물어보시면 마음 편해요.</small></div>` : ''}
  <div class="card"><dl>${store.notes.length ? fact('알아 두면 좋아요', store.notes.join('\n')) : ''}${fact('물건 들어오는 날', content.stockNote)}</dl></div>
  ${tel ? `<a class="btn" href="tel:${esc(tel)}">${em('📞')}전화 걸기 ${esc(firstPhone)}</a>` : '<p class="notice caution">전화번호는 아직 확인하고 있어요.</p>'}
  <div class="pair">
    <a class="btn outline" target="_blank" rel="noopener" href="https://map.naver.com/p/search/${encodeURIComponent(`국군복지단 ${mapName}`)}">${em('🗺️')}네이버 지도</a>
    <a class="btn outline" target="_blank" rel="noopener" href="https://map.kakao.com/?q=${encodeURIComponent(`국군복지단 ${mapName}`)}">${em('🗺️')}카카오맵</a>
  </div>
  <button type="button" class="btn outline" data-toggle-save="${store.id}">${saved ? '자주 가는 마트에서 빼기' : '자주 가는 마트로 저장'}</button>
  <a class="btn outline" target="_blank" rel="noopener" href="https://search.naver.com/search.naver?query=${encodeURIComponent(`${mapName} 영외마트 후기`)}">${em('💬')}다른 부모님 후기 찾아보기</a>
  <small>네이버 검색 결과가 열려요. 글 내용은 이 앱이 확인한 게 아니라서, 시간이나 휴점은 위 정보를 봐 주세요.</small>
  <a class="btn outline" href="#/report/${store.id}">${em('✏️')}틀린 내용 알려 주기</a>
  <small>${esc(baseText())} 운영표와 ${esc(checkedText())}까지 나온 휴점 공지를 보고 정리했어요. 가시기 전에 전화 한 통 하시면 더 확실해요.</small>`;
}

function reportText(store) {
  if (report.mode === 'ask') return ['[Love You, Son 질문]', report.text.trim()].join('\n');
  return ['[Love You, Son 정보 제보]', `대상: ${store ? store.name : '앱 전체'}`, `항목: ${report.issue}`, `내용: ${report.text.trim()}`, report.day ? `직접 확인한 날: ${report.day}` : ''].filter(Boolean).join('\n');
}

/** 질문은 구글 설문지로 받는다(content.questionForm). 'PREFILL' 자리에 적은 글을 채워 연다. */
function formUrl(text) {
  const form = safeUrl(content.questionForm) ? content.questionForm : '';
  return form && form.replace('PREFILL', encodeURIComponent(text));
}

function formNotice() {
  if (report.state !== 'opened') return '';
  return `<p class="notice caution">설문지가 새 창으로 열렸어요. 거기서 <b>제출</b>을 눌러야 보내져요.${content.questionForm.includes('PREFILL') ? '' : ' 적으신 내용은 복사해 두었으니 붙여 넣어 주세요.'}</p>`;
}

function renderAsk() {
  report.mode = 'ask';
  return `${backLink('#/qna')}
  <h1>질문 남기기</h1>
  <div class="card form">
    <p>군에 간 아이 일로 궁금한 걸 남겨 주세요. 다른 부모님께도 도움이 될 만한 질문을 골라 공식 자료를 찾아보고 <b>묻고 답하기</b>에 답을 올려요.</p>
    <label for="report-text">궁금한 것</label>
    <textarea id="report-text" rows="6" maxlength="300" placeholder="예: 수료식 날 아이 먹을 걸 싸 가도 되나요?">${esc(report.text)}</textarea>
    <small>이름, 전화번호, 아이 부대명처럼 누군지 알 수 있는 내용은 적지 말아 주세요. 따로 답장은 못 드리고, 모든 질문에 답하지는 못해요. 급한 일은 국방헬프콜 1303으로 전화해 주세요.</small>
    ${formNotice()}
    ${report.state === 'none' ? '<p class="notice caution">아직 질문 받는 곳을 준비하고 있어요. 아래 버튼으로 적으신 내용을 복사해 둘 수 있어요.</p>' : ''}
    ${report.state === 'copied' ? '<p class="notice caution">복사했어요. 아직 만든 사람에게 보내진 건 아니에요.</p>' : ''}
    ${report.state === 'none' || report.state === 'copied'
    ? '<button type="button" class="btn outline" data-copy-report="">내용 복사하기</button>'
    : `<button type="button" class="btn" data-send-report="">${em('📮')}${formUrl('') ? '설문지로 보내기' : '보내기'}</button>`}
  </div>`;
}

function renderQna() {
  const list = [...(content.qna || [])].sort((a, b) => (a.on < b.on ? 1 : a.on > b.on ? -1 : 0));
  return `${backLink('#/todo')}
  <h1>묻고 답하기</h1>
  <p class="on-olive">부모님들이 남겨 주신 질문에 만든 사람이 공식 자료를 찾아 답했어요.</p>
  <a class="btn accent" href="#/ask">${em('✍️')}질문 남기기</a>
  ${list.length ? list.map((x) => `<details class="tip"><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p><small>${esc(x.on.replaceAll('-', '. '))}. 답함</small></details>`).join('')
    : '<div class="card"><p>아직 올라온 답이 없어요. 첫 질문을 남겨 주세요.</p></div>'}
  <small>답은 그날 확인한 공식 안내를 바탕으로 했어요. 부대마다 다를 수 있으니 중요한 일은 부대나 병무청에 한 번 더 확인해 주세요.</small>`;
}

function renderReport(id) {
  report.mode = 'fix';
  const store = id ? storeById(id) : null;
  const backTo = store ? `#/store/${store.id}` : '#/todo';
  if (report.state === 'sent') return `${backLink(backTo)}<h1>잘 받았어요</h1><div class="card"><p>확인하고 바로 고쳐 둘게요. 연락처를 받지 않아서 따로 답장은 못 드려요. 알려 주셔서 고마워요.</p></div>`;
  return `${backLink(backTo)}
  <h1>틀린 내용 알려 주기</h1>
  <div class="card form">
    <p>가 보셨는데 앱과 달랐나요? 알려 주시면 다른 부모님들께도 도움이 돼요.</p>
    <p><b>대상: ${esc(store ? store.name : '앱 전체')}</b></p>
    <p class="field">무엇이 다른가요?</p>
    <div class="chips">${ISSUES.map((x) => `<button type="button" data-issue="${esc(x)}" aria-pressed="${x === report.issue}">${esc(x)}</button>`).join('')}</div>
    <label for="report-text">실제로는 어땠는지 적어 주세요</label>
    <textarea id="report-text" rows="5" placeholder="예: 토요일은 오후 3시에 문을 닫아요">${esc(report.text)}</textarea>
    <label for="report-day">직접 확인한 날(선택)</label>
    <input type="date" id="report-day" value="${esc(report.day)}">
    <small>이름과 연락처는 묻지 않아요. 물건 들어오는 날은 직접 보신 것만 적어 주세요.</small>
    ${formNotice()}
    ${report.state === 'failed' ? '<p class="notice">보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.</p>' : ''}
    ${report.state === 'none' ? '<p class="notice caution">아직 제보 받는 곳을 준비하고 있어요. 아래 버튼으로 적으신 내용을 복사해 둘 수 있어요.</p>' : ''}
    ${report.state === 'copied' ? '<p class="notice caution">복사했어요. 아직 관리자에게 보내진 건 아니에요.</p>' : ''}
    ${report.state === 'none' || report.state === 'copied'
    ? `<button type="button" class="btn outline" data-copy-report="${esc(store ? store.id : '')}">내용 복사하기</button>`
    : `<button type="button" class="btn" data-send-report="${esc(store ? store.id : '')}" ${report.state === 'sending' ? 'disabled' : ''}>${report.state === 'sending' ? '보내는 중이에요' : '보내기'}</button>`}
  </div>`;
}

function tipItems(current) {
  const q = tipsView.query.trim();
  const list = q ? content.tips.filter((x) => x.title.includes(q) || x.body.includes(q)) : content.tips.filter((x) => x.stage === current);
  return `${q ? `<h2>찾은 팁 ${list.length}건</h2>` : ''}${list.length ? list.map((x) => `<details class="tip"><summary>${esc(x.title)}</summary><p>${esc(x.body)}</p><small>${esc(x.source)}</small>${safeUrl(x.url) ? `<a class="text-link" target="_blank" rel="noopener" href="${esc(x.url)}">출처 열기</a>` : ''}</details>`).join('') : '<p>딱 맞는 팁을 못 찾았어요. 다른 말로 찾아볼까요?</p>'}`;
}

/** 공식 사이트 모음. 앱의 LinksView와 같다. */
function renderLinks() {
  const groups = content.linkGroups || [];
  const links = content.links || [];
  const suggested = suggestedStage(summarize(readLocal(), nowDay()), nowDay());
  const current = linksView.group || (groups.some((g) => g.id === suggested) ? suggested : groups[0]?.id);
  const checked = links[0] ? parseDay(links[0].checked) : null;
  return `${backLink('#/todo')}<h1>공식 사이트 모음</h1>
  <p>병무청, 국방부, 각 군의 공식 누리집이에요. 주소는 직접 열어 확인했어요.</p>
  <div class="chips">${groups.map((g) => `<button type="button" data-lgroup="${esc(g.id)}" aria-pressed="${g.id === current}">${STAGE_EMOJI[g.id] ? em(STAGE_EMOJI[g.id]) : ''}${esc(g.title)}</button>`).join('')}</div>
  ${links.filter((l) => l.group === current && safeUrl(l.url)).map((l) => `<div class="card link"><small>${esc(l.org)}</small><h2>${esc(l.title)}</h2><p>${esc(l.body)}</p>${l.login !== '필요 없음' ? `<small>로그인: ${esc(l.login)}</small>` : ''}<a class="btn outline open" target="_blank" rel="noopener" href="${esc(l.url)}" aria-label="${esc(l.title)} 열기">열기</a></div>`).join('')}
  <small>${checked ? `${checked.y}년 ${checked.m}월 ${checked.d}일` : '최근'}에 열어 확인한 주소예요. 군 누리집은 와이파이나 시간에 따라 안 열릴 때가 있어요. 조회와 신청은 자녀 본인 인증이 필요한 곳이 많아요.</small>
  <a class="btn outline" href="#/report">${em('✏️')}열리지 않는 링크 알려 주기</a>`;
}

/** 장식 이모지. 화면 읽기 프로그램은 읽지 않는다. */
const em = (e) => `<span class="em" aria-hidden="true">${e}</span>`;
const CAMP_EMOJI = { nonsan: '🪖', division: '⛺️', navy: '⚓️', marine: '🦅', airforce: '✈️' };
const STAGE_EMOJI = { before: '🎒', training: '🪖', unit: '🏕️', money: '💰', care: '💚', after: '🎓', help: '☎️' };
const mapSearch = (q) => `https://map.kakao.com/?q=${encodeURIComponent(q)}`;

/** 입대 장소(훈련소)별 안내. 앱의 CampsView와 같다. */
function renderCamps() {
  const camps = content.camps || [];
  const checked = camps[0] ? parseDay(camps[0].checked) : null;
  return `<h1>훈련소</h1>
  <p>입영통지서에 적힌 곳을 골라 보세요. 위치, 수료식, 수료 날 함께 있을 곳, 후반기 교육을 모아 두었어요.</p>
  ${camps.map((c) => `<a class="card camp" href="#/camp/${esc(c.id)}"><h2>${em(CAMP_EMOJI[c.id] || '🎖️')}${esc(c.name)} <small>${esc(c.branch)}</small></h2><p>${esc(c.summary)}</p></a>`).join('')}
  <small>${checked ? `${checked.y}년 ${checked.m}월 ${checked.d}일` : '최근'}에 각 군 공식 누리집과 병무청 자료로 정리했어요. 기수마다 다를 수 있어서, 초청장과 부대 안내가 가장 정확해요.</small>`;
}

const campView = { region: '', camp: '' };

/** 사단 신병교육대 부대별 목록. 앱의 UnitList와 같다. */
function unitList(units) {
  if (!units.length) return '';
  const province = (u) => (u.region || '').split(' ')[0];
  const regions = [...new Set(units.map(province).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
  const shown = campView.region && units.length > 1 ? units.filter((u) => province(u) === campView.region) : units;
  const fact = (t, v) => (v ? `<dt>${esc(t)}</dt><dd>${esc(v)}</dd>` : '');
  const one = units.length === 1;
  return `<h2 class="section">${one ? '병무청 찾아가는 길' : `부대별 찾아가는 길 (${units.length}곳)`}</h2>
  <small>${one ? '' : '입영통지서에 적힌 부대를 찾아 누르세요. '}병무청 "입영부대 가는길" 안내를 그대로 옮겼어요.</small>
  ${regions.length > 1 ? `<div class="chips"><button type="button" data-uregion="" aria-pressed="${!campView.region}">전체</button>${regions.map((r) => `<button type="button" data-uregion="${esc(r)}" aria-pressed="${campView.region === r}">${esc(r)}</button>`).join('')}</div>` : ''}
  ${shown.map((u) => {
    const tel = (u.phone.match(/0\d{1,2}-\d{3,4}-\d{4}/) || [''])[0].replace(/\D/g, '');
    return `<details class="tip unit"${one ? ' open' : ''}><summary>${esc(u.name)}${u.region ? ` <small>${esc(u.region)}</small>` : ''}</summary><dl>${fact('주소', u.address)}${fact('내비 검색어', u.navi)}${fact('대중교통', u.transit)}${fact('전화', u.phone)}${fact('알아 두면 좋아요', u.notes)}</dl>
    <div class="pair"><a class="btn outline open" target="_blank" rel="noopener" href="${esc(mapSearch(u.map || u.address))}">${em('🗺️')}지도 보기</a>${tel ? `<a class="btn outline open" href="tel:${esc(tel)}">${em('📞')}전화 걸기</a>` : ''}</div>
    ${safeUrl(u.url) ? `<a class="text-link" target="_blank" rel="noopener" href="${esc(u.url)}">${em('📄')}병무청 안내 원문</a>` : ''}</details>`;
  }).join('')}`;
}

function renderCamp(id) {
  const c = (content.camps || []).find((x) => x.id === id);
  if (!c) return `${backLink('#/camps')}<h1>찾는 훈련소가 없어요</h1>`;
  if (campView.camp !== id) campView.region = '';
  campView.camp = id;
  const sec = (emoji, title, body, more = '', hi = false) => (body ? `<div class="card"><h2${hi ? ' class="hi"' : ''}>${em(emoji)}${esc(title)}</h2><p>${esc(body)}</p>${more ? `<small>${esc(more)}</small>` : ''}</div>` : '');
  const main = (c.phone.match(/0\d{1,2}-\d{3,4}-\d{4}|1\d{3}-\d{4}/) || [''])[0];
  const tel = main.replace(/\D/g, '');
  return `${backLink('#/camps')}<small>${esc(c.branch)}</small><h1>${esc(c.name)}</h1><p>${esc(c.summary)}</p>
  ${(c.units || []).length > 1 ? unitList(c.units) : ''}
  ${sec('📍', '어디에 있나요', c.location, c.directions)}${sec('🎒', '입영하는 날', c.enlistDay)}${sec('⏳', '훈련 기간', c.training)}${sec('🎓', '수료식', c.graduation)}
  ${sec('🤗', '수료 날 아들과 함께 있을 곳', c.graduationDay, '', true)}${sec('📚', '후반기 교육', c.afterTraining)}${sec('💌', '편지와 소포', c.mail)}${sec('🏘️', '주변 여건', c.nearby)}${c.phone ? `<div class="card"><h2>전화번호</h2><p style="white-space:pre-line">${esc(c.phone.split(',').map((x) => x.trim()).join('\n'))}</p></div>` : ''}
  ${(c.units || []).length === 1 ? unitList(c.units) : ''}
  ${c.caution ? `<p class="notice caution">확인할 것: ${esc(c.caution)}</p>` : ''}
  ${tel.length >= 7 ? `<a class="btn" href="tel:${esc(tel)}">${em('📞')}대표 번호로 전화 걸기 ${esc(main)}</a>` : ''}
  ${c.mapPlace ? `<a class="btn outline" target="_blank" rel="noopener" href="${esc(mapSearch(c.mapPlace))}">${em('🗺️')}지도에서 위치 보기</a>` : ''}
  ${c.mapArea ? `<div class="pair"><a class="btn outline" target="_blank" rel="noopener" href="${esc(mapSearch(`${c.mapArea} 식당`))}">${em('🍚')}주변 식당 찾기</a><a class="btn outline" target="_blank" rel="noopener" href="${esc(mapSearch(`${c.mapArea} 숙박`))}">${em('🛏️')}주변 숙소 찾기</a></div>` : ''}
  ${(c.links || []).filter(safeUrl).map((u, i) => `<a class="btn outline" target="_blank" rel="noopener" href="${esc(u)}">${i === 0 ? '공식 누리집 열기' : '공식 안내 더 보기'}</a>`).join('')}
  <small>식당과 숙소는 특정 가게를 추천하지 않아요. 지도에서 주변을 찾아보시고, 수료식 날은 붐비니 미리 알아 두시면 좋아요.</small>`;
}

function renderTodo() {
  const current = tipsView.stage || suggestedStage(summarize(readLocal(), nowDay()), nowDay());
  return `<h1>팁</h1>
  <a class="btn" href="tel:1303"><span>${em('📞')}걱정될 땐 1303<small class="on-dark">국방헬프콜이에요. 24시간 무료고, 부모님도 전화하실 수 있어요</small></span></a>
  <label class="field" for="tip-q">궁금한 내용 찾기</label>
  <input type="search" id="tip-q" value="${esc(tipsView.query)}" autocomplete="off">
  <a class="btn outline" href="#/links">${em('🏛️')}병무청·국방부 공식 사이트 모음</a>
  <div class="chips">${content.stages.map((x) => `<button type="button" data-stage="${esc(x.id)}" aria-pressed="${x.id === current && !tipsView.query.trim()}">${STAGE_EMOJI[x.id] ? em(STAGE_EMOJI[x.id]) : ''}${esc(x.title)}</button>`).join('')}</div>
  <div id="tip-list" style="display:grid;gap:10px">${tipItems(current)}</div>
  <small>부대나 군마다 다른 게 많아요. "논산은"이라고 적힌 건 육군훈련소 이야기예요. 헷갈리면 아이나 부대에 한 번 물어보세요.</small>
  <h2 class="section">${em('📢')}소식</h2>${content.news.map(card).join('')}
  <button type="button" class="btn accent" data-share="1">${em('📣')}다른 부모님께 알려 주기</button>
  <p class="notice caution" id="share-done" hidden>안내 문구를 복사했어요.</p>
  <a class="btn outline" href="#/qna">${em('💬')}묻고 답하기${content.qna?.length ? ` <small>${content.qna.length}개</small>` : ''}</a>
  <a class="btn outline" href="#/rules">${em('🙋')}누가, 어떻게 이용하나요</a>
  <a class="btn outline" href="#/report">${em('✏️')}틀린 내용 알려 주기</a>`;
}

/** 다섯 번째 탭 "만든 사람". 소개, 커피 한 잔, 바라는 점. 앱의 AboutView와 같은 내용. */
function renderAbout() {
  const reasons = [
    ['🎒', '입대 전', '"뭘 사서 보내야 하나요?"', '막상 알아보면 대부분 부대에서 나눠 줘요. 그래서 꼭 챙길 서류와 사지 않아도 되는 것을 공식 안내 그대로 정리했어요. 입대일만 넣으면 전역일과 남은 날도 바로 계산돼요.'],
    ['🪖', '훈련소', '"소포 보내도 되나요? 수료식은 언제예요? 사진은 언제 올라와요?"', '부모님들이 제일 많이 묻는 게 이것들인데, 답이 훈련소마다 달라요. 그래서 훈련소 탭에 육군훈련소, 사단 신병교육대, 해군, 해병대, 공군을 곳별로 나눠 두었어요.'],
    ['⛺', '자대 배치', '"자대는 언제 알 수 있어요? 연락이 없는데 괜찮은 걸까요?"', '자대 이야기는 공식 답이 "그 부대에 물어보세요"인 경우가 많아요. 그래서 확인할 곳과, 걱정될 때 부모님도 전화할 수 있는 국방헬프콜 1303을 팁에 함께 넣었어요.'],
    ['🛒', '영외마트', '"부모도 갈 수 있나요? 오늘 문 여나요?"', `아이가 군에 있으면 부모님도 영외마트를 쓸 수 있는데, 마트마다 여는 시간과 쉬는 날이 달라요. 전국 ${content.stores.length}곳을 정리해 두었고, 자주 가는 곳을 저장하면 홈에서 오늘 시간을 바로 보여 드려요.`],
  ];
  const won = (n) => `${n.toLocaleString('ko-KR')}원`;
  const donateButtons = DONATE_OPTIONS.map(([icon, name, amount]) =>
    `<a class="btn accent tip" target="_blank" rel="noopener" href="${esc(DONATE_URL.endsWith('/') ? DONATE_URL + amount : DONATE_URL)}">${em(icon)}<span>${name}</span><b>${won(amount)}</b></a>`).join('');
  const coffee = DONATE_URL && !inAndroidApp ? `<div class="card coffee"><div class="coffee-head"><span aria-hidden="true">☕</span><span><h2>커피 한 잔 사 주기</h2><small>앱은 지금처럼 무료예요</small></span></div><p>앱이 도움이 되셨다면 만든 사람에게 커피나 밥 한 끼 값을 보내 주세요. 앱을 오래 지키는 데 큰 힘이 돼요. 보내셔도 달라지는 기능은 없고, 안 보내셔도 모든 기능을 그대로 쓰실 수 있어요.</p>${donateButtons}<small>송금 서비스 화면이 새로 열려요. 이 앱은 결제 정보를 받지 않아요.</small></div>` : '';
  return `<div class="maker"><span class="avatar" aria-hidden="true">🫡</span><span><h1>만든 사람</h1><p>아들을 군대에 보낸 한 가족이 만들었어요</p></span></div>
  ${coffee}
  <div class="card story"><h2>${em('❤️')}이 앱을 만든 이유</h2>
  <p><b>안녕하세요. 이 앱은 아들을 군대에 보낸 한 가족이 만들었어요.</b></p>
  <p>아이를 군에 보내고 나니 궁금한 게 끝이 없었어요. 소포는 보내도 되는지, 수료식은 언제인지, 자대는 언제 알 수 있는지. 답은 병무청, 국방부, 각 군 누리집에 흩어져 있어서 한 번에 찾기가 쉽지 않았어요.</p>
  <p>나라를 지키는 아이들 덕분에 우리가 편히 지내는 만큼, 그 아이들을 기다리는 가족들은 조금이라도 덜 헤매셨으면 했어요. 그래서 공식 자료를 하나하나 읽고 한곳에 모아 이 앱을 만들었어요.</p>
  <p>큰 도움은 아니어도, 같은 마음으로 아이를 기다리는 군인가족분들께 작은 힘이 되면 좋겠어요.</p>
  ${visitLine()}</div>
  <h2 class="section">${em('🧭')}이런 정보를 모아 둔 이유</h2>
  ${reasons.map(([e, stage, q, a]) => `<div class="card"><h2>${em(e)}${esc(stage)}</h2><p class="question">${esc(q)}</p><p>${esc(a)}</p></div>`).join('')}
  <div class="card"><h2>${em('💌')}앱에 바라는 점 보내기</h2><p>이런 정보가 더 있으면 좋겠다, 이건 불편하다, 무엇이든 좋아요. 적어 주신 이야기는 만든 사람이 하나하나 읽어요.</p>
  <label class="field" for="wish-text">바라는 점</label>
  <textarea id="wish-text" rows="4" placeholder="예: 해군 수료식 날 주변 정보도 있으면 좋겠어요">${esc(wishView.text)}</textarea>
  ${wishView.state === 'opened' ? '<p class="notice caution">설문지가 새 창으로 열렸어요. 거기서 <b>제출</b>을 눌러야 보내져요.</p>' : ''}
  ${wishView.state === 'copied' ? '<p class="notice caution">아직 받는 곳을 준비하고 있어요. 적으신 내용을 복사해 두었어요.</p>' : ''}
  <button type="button" class="btn accent" data-send-wish="1">${em('📮')}설문지로 보내기</button>
  <small>로그인 없이 보내지고, 이름이나 연락처는 묻지 않아요. 따로 답장은 못 드려요.</small></div>
  <h2 class="section">${em('ℹ️')}알아 두실 것</h2>
  ${card({ title: '국군복지단의 공식 앱이 아니에요', emoji: '🏷️', body: '공개된 공식 자료를 사람이 하나하나 읽고 정리한 무료 앱이에요. 법률 상담은 아니라서, 가시기 전엔 마트에 전화해 보시는 게 제일 정확해요.' })}
  ${card({ title: '언제 자료인가요', emoji: '🗓️', body: `마트 ${content.stores.length}곳은 ${baseText()} 운영표로, 휴점 공지는 ${checkedText()}까지 살펴보고 정리했어요. 지금 쓰는 자료는 ${content.revision}판이에요.`, source: '국군복지단 월간 공지' })}
  ${card({ title: '무엇을 저장하나요', emoji: '🔒', body: '입대일, 복무 형태, 전역일, 저장한 마트만 이 기기에 저장해요. 가입은 없고 위치도 쓰지 않아요. 질문·제보·바라는 점은 구글 설문지로 받고, 적어 주신 내용만 만든 사람에게 가요. 이름이나 연락처는 받지 않아요.' })}
  ${eraseAsked ? '<p class="notice">입대일과 저장한 마트를 모두 지울까요?</p><button type="button" class="btn" data-erase="yes">지우기</button><button type="button" class="btn outline" data-erase="no">취소</button>'
    : `<button type="button" class="btn outline" data-erase="ask">${em('🧹')}이 기기에 저장한 정보 지우기</button>`}`;
}


function route() {
  const [name = 'home', arg] = location.hash.replace(/^#\/?/, '').split('/');
  const known = { camps: renderCamps, links: renderLinks, welcome: renderWelcome, home: renderHome, dday: renderDday, check: renderCheck, papers: renderPapers, rules: renderRules, goods: renderGoods, shop: renderShop, todo: renderTodo, about: renderAbout };
  if (name === 'store') return { tab: 'shop', html: renderStore(arg) };
  if (name === 'camp') return { tab: 'camps', html: renderCamp(arg) };
  if (name === 'qna') return { tab: 'todo', html: renderQna() };
  if (name === 'ask') return { tab: 'todo', html: renderAsk() };
  if (name === 'report') return { tab: arg ? 'shop' : 'todo', html: renderReport(arg) };
  const tab = ['shop', 'goods'].includes(name) ? 'shop' : name === 'camps' ? 'camps' : name === 'about' ? 'about' : ['todo', 'links'].includes(name) ? 'todo' : 'home';
  return { tab, html: (known[name] || renderHome)() };
}

function draw({ keepFocusId, moveFocus } = {}) {
  let tab = 'home';
  let html;
  try { ({ tab, html } = route()); } catch {
    html = '<h1>이 화면을 그리지 못했어요</h1><p>자료에 빠진 칸이 있는 것 같아요. 다른 탭을 눌러 보시고, 계속되면 새로고침해 주세요.</p>';
  }
  view.innerHTML = html;
  document.querySelectorAll('[data-tab]').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (keepFocusId) {
    const again = document.getElementById(keepFocusId) || document.querySelector(`[${keepFocusId}]`);
    if (again) again.focus();
  } else if (moveFocus) {
    window.scrollTo(0, 0);
    const heading = view.querySelector('h1');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
}

async function sendReport(id) {
  const store = id ? storeById(id) : null;
  if (!report.text.trim()) {
    const box = document.getElementById('report-text');
    box.setAttribute('aria-invalid', 'true');
    box.focus();
    return;
  }
  const url = formUrl(reportText(store));
  if (url) {
    window.open(url, '_blank', 'noopener');
    if (!content.questionForm.includes('PREFILL')) await copyText(reportText(store));
    report.state = 'opened';
    draw();
    return;
  }
  if (!REPORT_ENDPOINT) {
    report.state = 'none';
    draw();
    return;
  }
  report.state = 'sending';
  draw();
  try {
    const res = await fetch(REPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: store?.id ?? null, storeName: store?.name ?? '앱 전체', issue: report.issue, text: report.text.trim(), confirmedOn: report.day || null, appVersion: 'web' }),
    });
    report.state = res.ok ? 'sent' : 'failed';
  } catch {
    report.state = 'failed';
  }
  draw();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

document.addEventListener('click', async (event) => {
  // "본문으로 건너뛰기"는 주소를 바꾸지 않고 본문으로 포커스만 옮긴다(주소가 바뀌면 홈으로 가 버림).
  if (event.target.closest('a.skip')) { event.preventDefault(); view.focus(); return; }
  const t = event.target.closest('button');
  if (!t) return;
  const d = t.dataset;
  if (d.stage !== undefined) { tipsView.stage = d.stage; tipsView.query = ''; draw(); }
  else if (d.region !== undefined) { shop.region = d.region; shop.city = ''; shop.query = ''; draw(); }
  else if (d.city !== undefined) { shop.city = d.city; draw(); }
  else if (d.relation !== undefined) { relation = +d.relation; draw(); }
  else if (d.uregion !== undefined) { campView.region = d.uregion; draw({ keepFocusId: `data-uregion="${d.uregion}"` }); }
  else if (d.lgroup !== undefined) { linksView.group = d.lgroup; draw({ keepFocusId: `data-lgroup="${d.lgroup}"` }); }
  else if (d.wservice !== undefined) { welcome.service = d.wservice; draw({ keepFocusId: `data-wservice="${d.wservice}"` }); }
  else if (d.welcome === 'save') {
    const asksEnd = !SERVICES[welcome.service].months;
    writeLocal({ service: welcome.service, enlist: asksEnd ? '' : welcome.date, manualEnd: asksEnd ? welcome.date : '', welcomed: true });
    location.hash = '#/home';
  } else if (d.welcome === 'later') { writeLocal({ welcomed: true }); location.hash = '#/home'; }
  else if (d.toggleSave) {
    const local = readLocal();
    const saved = local.saved.includes(d.toggleSave) ? local.saved.filter((x) => x !== d.toggleSave) : [...local.saved, d.toggleSave];
    writeLocal({ saved });
    draw({ keepFocusId: 'data-toggle-save' });
  } else if (d.issue !== undefined) { report.issue = d.issue; draw(); }
  else if (d.sendReport !== undefined) await sendReport(d.sendReport);
  else if (d.sendWish) {
    const text = wishView.text.trim();
    const box = document.getElementById('wish-text');
    if (!text) { box?.setAttribute('aria-invalid', 'true'); box?.focus(); return; }
    const body = `[Love You, Son 바라는 점]\n${text}`;
    const url = formUrl(body);
    if (url) {
      window.open(url, '_blank', 'noopener');
      if (!content.questionForm.includes('PREFILL')) await copyText(body);
      wishView.state = 'opened';
    } else if (await copyText(body)) wishView.state = 'copied';
    draw({ keepFocusId: 'data-send-wish' });
  }
  else if (d.copyReport !== undefined) {
    const store = d.copyReport ? storeById(d.copyReport) : null;
    if (await copyText(reportText(store))) { report.state = 'copied'; draw(); }
  } else if (d.share) {
    const text = SHARE_TEXT;
    if (navigator.share) {
      try { await navigator.share({ title: 'Love You, Son', text, url: location.origin + location.pathname }); } catch { /* 공유 취소 */ }
    } else if (await copyText(`${text} ${location.origin}${location.pathname}`)) {
      document.getElementById('share-done').hidden = false;
    }
  } else if (d.erase === 'ask') { eraseAsked = true; draw(); }
  else if (d.erase === 'no') { eraseAsked = false; draw(); }
  else if (d.erase === 'yes') {
    try { localStorage.removeItem(KEY); } catch { /* 저장소 없음 */ }
    eraseAsked = false;
    location.hash = '#/welcome';
  }
});

document.addEventListener('input', (event) => {
  const t = event.target;
  if (t.id === 'q') {
    shop.query = t.value;
    document.getElementById('shop-list').innerHTML = renderShopList();
  } else if (t.id === 'tip-q') {
    tipsView.query = t.value;
    const current = tipsView.stage || suggestedStage(summarize(readLocal(), nowDay()), nowDay());
    document.getElementById('tip-list').innerHTML = tipItems(current);
    document.querySelectorAll('[data-stage]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.stage === current && !t.value.trim())));
  } else if (t.id === 'report-text') {
    report.text = t.value;
    t.removeAttribute('aria-invalid');
  } else if (t.id === 'wish-text') {
    // 다시 그리지 않는다(입력 중 커서가 튀지 않게).
    wishView.text = t.value;
  } else if (t.id === 'report-day') {
    report.day = t.value;
  }
});

document.addEventListener('change', (event) => {
  const t = event.target;
  // 처음 화면 날짜 칸: 입력할 때마다 다시 그리면 연도를 치는 중에 칸이 초기화된다. 다 고른 뒤에만 다시 그림.
  if (t.id === 'welcome-date') {
    if (t.value) { welcome.date = t.value; draw({ keepFocusId: 'welcome-date' }); }
    return;
  }
  if (t.dataset.local) {
    writeLocal({ [t.dataset.local]: t.value });
    draw({ keepFocusId: t.id });
  }
});

window.addEventListener('hashchange', () => {
  if (location.hash && !location.hash.startsWith('#/')) return;
  if (location.hash.startsWith('#/report') || location.hash.startsWith('#/ask')) { report.text = ''; report.day = ''; report.issue = ISSUES[0]; report.state = 'idle'; }
  eraseAsked = false;
  draw({ moveFocus: true });
});

document.getElementById('tabs').innerHTML = TABS.map(([k, label]) => `<a data-tab="${k}" href="#/${k}"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>${label}</a>`).join('');

async function start() {
  try {
    const res = await fetch('content.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(String(res.status));
    const fresh = await res.json();
    const problem = contentProblem(fresh);
    if (problem) throw new Error(problem);
    content = fresh;
    const name = location.hash.replace(/^#\/?/, '').split('/')[0];
    if (needsWelcome() && (!name || name === 'home')) location.replace('#/welcome');
    draw();
    loadVisits();
  } catch {
    view.innerHTML = '<h1>자료를 불러오지 못했어요</h1><p>인터넷이 연결됐는지 보시고 새로고침해 주세요.</p>';
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

start();
