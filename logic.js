// 앱(Shared/Logic.swift)과 같은 규칙을 쓴다. data/test_vectors.json으로 양쪽을 같은 사례로 시험한다.
export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const SERVICES = {
  army: { name: '육군', months: 18, ok: true },
  marine: { name: '해병대', months: 18, ok: true },
  navy: { name: '해군', months: 20, ok: true },
  air: { name: '공군', months: 21, ok: true },
  reserve: { name: '상근예비역', months: 18, ok: false, why: '상근예비역은 본인만 마트를 이용할 수 있어요. 부모님은 군인가족 대상이 아니에요. 그래도 적금 같은 다른 제도는 챙기실 수 있어요.' },
  social: { name: '사회복무요원', months: 21, ok: false, why: '사회복무요원은 영외마트 이용 대상이 아니에요. 그래도 적금 같은 다른 제도는 챙기실 수 있어요.' },
  officer: { name: '장교·부사관', months: null, ok: true },
};

const pad = (n) => String(n).padStart(2, '0');
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export function parseDay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  if (mo < 1 || mo > 12 || d < 1 || d > lastDay(y, mo)) return null;
  return { y, m: mo, d };
}

export const toIso = (day) => `${day.y}-${pad(day.m)}-${pad(day.d)}`;
const ordinal = (day) => Math.round(Date.UTC(day.y, day.m - 1, day.d) / 86400000);
const weekday = (day) => new Date(Date.UTC(day.y, day.m - 1, day.d)).getUTCDay();
const before = (a, b) => ordinal(a) < ordinal(b);
export const monthDay = (day) => `${day.m}월 ${day.d}일`;
export const longDay = (day) => `${day.y}년 ${day.m}월 ${day.d}일 ${WEEKDAYS[weekday(day)]}요일`;

export function today(now = new Date()) {
  const text = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return parseDay(text);
}

export function dischargeDate(enlist, months) {
  const total = enlist.y * 12 + (enlist.m - 1) + months;
  const y = Math.floor(total / 12);
  const m = total % 12 + 1;
  const last = lastDay(y, m);
  if (enlist.d > last) return { y, m, d: last };
  if (enlist.d > 1) return { y, m, d: enlist.d - 1 };
  const prev = total - 1;
  const py = Math.floor(prev / 12);
  const pm = prev % 12 + 1;
  return { y: py, m: pm, d: lastDay(py, pm) };
}

export function summarize({ enlist, service, manualEnd }, now) {
  const sv = SERVICES[service] || SERVICES.army;
  const start = parseDay(enlist);
  const manual = parseDay(manualEnd);
  const end = manual || (start && sv.months ? dischargeDate(start, sv.months) : null);
  const left = end ? ordinal(end) - ordinal(now) : null;
  const dateProblem = Boolean(start && end && before(end, start));
  let progress = 0;
  if (start && end && !dateProblem && ordinal(end) > ordinal(start)) {
    progress = Math.min(1, Math.max(0, (ordinal(now) - ordinal(start)) / (ordinal(end) - ordinal(start) + 1)));
  }
  let headline;
  if (!sv.ok) headline = '마트 이용 대상이 아니에요';
  else if (dateProblem) headline = '날짜를 다시 봐 주세요';
  else if (left === null) headline = sv.months ? '입대일을 넣어 주세요' : '전역일을 넣어 주세요';
  else if (left < 0) headline = '전역했어요';
  else if (left === 0) headline = '오늘 전역해요';
  else headline = `D-${left}`;
  let note;
  if (!sv.ok) note = sv.why;
  else if (dateProblem) note = '전역일이 입대일보다 빨라요. 날짜를 다시 확인해 주세요.';
  else if (!end) note = sv.months ? '입대일을 넣으시면 전역일을 계산해 드릴게요.' : '장교와 부사관은 복무 기간이 달라 전역일을 직접 넣어 주세요.';
  else if (start && before(now, start)) note = '아직 입대 전이네요. 가족 증명은 입대한 뒤에 준비하시면 되고, 훈련소에 있는 동안 이용할 수 있는지는 마트에 물어보세요.';
  else if (left < 0) note = '아이가 전역하면 부모님 이용 자격도 달라져요. 가시기 전에 마트에 물어보세요.';
  else note = '전역일까지 남은 날이에요. 전역하는 날에도 이용할 수 있는지, 정확히 언제까지 되는지는 공식 자료에 없어서 마트에 물어보시는 게 정확해요.';
  return { sv, start, end, left, progress, dateProblem, headline, note };
}

/** 병 계급. 앱의 Ranks와 같다. */
export const RANKS = ['이병', '일병', '상병', '병장'];

/**
 * 예상 진급 달. 입대한 달을 첫 달로 쳐서 3개월째 1일에 일병, 그 6개월 뒤 상병, 다시 6개월 뒤 병장.
 * 병 진급 최저 복무 기간(이병 2·일병 6·상병 6개월)을 따른 예상이라 진급 심사에 따라 늦어질 수 있다.
 * 입대일이 없거나, 마트 이용 대상이 아니거나, 장교·부사관이거나, 날짜가 어긋나면 null.
 */
export function rankTrack(s, now) {
  if (!s.start || !s.sv.ok || !s.sv.months || s.dateProblem) return null;
  const firstOf = (k) => { const t = s.start.y * 12 + (s.start.m - 1) + k; return { y: Math.floor(t / 12), m: (t % 12) + 1, d: 1 }; };
  const days = [s.start, firstOf(2), firstOf(8), firstOf(14)];
  let current = -1;
  days.forEach((d, i) => { if (!before(now, d)) current = i; });
  return { steps: RANKS.map((name, i) => ({ name, from: days[i] })), current };
}

export function cityOf(store) {
  const words = (store.address || '').split(' ');
  const first = words[0] || '';
  const second = words[1] || '';
  if (/[시군구]$/.test(second)) return second;
  if (/[시군]$/.test(first) && !first.includes('특별') && !first.includes('광역')) return first;
  const m = /^[가-힣]+?[시군](?=[가-힣0-9])/.exec(second);
  return m ? m[0] : '';
}

function activeClosure(store, day, content) {
  return content.closures.find((c) => {
    if (c.name !== store.name) return false;
    const to = parseDay(c.to);
    if (!to || before(to, day)) return false;
    const from = parseDay(c.from);
    return from ? !before(day, from) : true;
  }) || null;
}

function reopenUnknown(store, day, content) {
  return content.closures.some((c) => c.name === store.name && c.reopenUnknown && before(parseDay(c.to), day));
}

function regularlyClosed(store, day) {
  const first = (store.closedDays || '').split(';')[0];
  const wd = weekday(day);
  return first.includes(`${WEEKDAYS[wd]}요일`) || (first.startsWith('토·일') && (wd === 0 || wd === 6));
}

function hoursOn(store, day) {
  const wd = weekday(day);
  const key = wd === 6 ? '토' : wd === 0 ? '일' : '평일';
  const part = (store.hours || '').split(';').map((x) => x.trim()).find((x) => x.startsWith(key));
  const value = part ? part.slice(key.length).trim() : '';
  return value.includes(':') ? value : null;
}

function recurringRule(store, day) {
  const wd = weekday(day);
  return store.specials.find((r) => {
    if (r.weekday !== wd || r.ordinal === undefined) return false;
    if (r.ordinal === -1) return day.d + 7 > lastDay(day.y, day.m);
    if (r.ordinal === 0) return true;
    return Math.floor((day.d - 1) / 7) + 1 === r.ordinal;
  });
}

export function storeStatus(store, day, content) {
  const name = WEEKDAYS[weekday(day)];
  const closure = activeClosure(store, day, content);
  if (closure) return { line: `${closure.reason} 때문에 ${monthDay(parseDay(closure.to))}까지 쉬어요`, kind: 'closed' };
  if (reopenUnknown(store, day, content)) return { line: '다시 여는지 확인이 필요해요', kind: 'check' };
  if (regularlyClosed(store, day)) return { line: `${name}요일은 쉬는 날이에요`, kind: 'closed' };
  const dated = store.specials.find((r) => r.date === toIso(day));
  if (dated) return { line: `오늘은 재고조사 날이라 ${dated.hours}에만 열어요`, kind: 'check' };
  const rule = recurringRule(store, day);
  if (rule && rule.hours) return { line: `재물조사 날일 수 있어요. 그렇다면 ${rule.hours}에 열어요`, kind: 'check' };
  if (rule && rule.closedHours) return { line: `재물조사 날일 수 있어요. 그렇다면 ${rule.closedHours}에는 닫아요`, kind: 'check' };
  const hours = hoursOn(store, day);
  if (hours) return { line: `오늘 ${hours}에 열어요`, kind: 'open' };
  return { line: `${name}요일 운영 정보가 없어요`, kind: 'check' };
}

const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** 8시부터 20시까지 축에서 막대의 위치를 백분율로 돌려준다. */
export function barPosition(text) {
  const [start, end] = text.split('~').map(toMinutes);
  const axisStart = 480;
  const axisEnd = 1200;
  const span = axisEnd - axisStart;
  return { left: Math.max(0, (start - axisStart) / span) * 100, width: Math.max(0, (Math.min(end, axisEnd) - Math.max(start, axisStart)) / span) * 100 };
}

export function entryRows(store, day, content) {
  if (storeStatus(store, day, content).kind !== 'open') return [];
  const wd = weekday(day);
  const rule = store.entryRules.find((r) => r.weekdays.includes(wd));
  if (rule) {
    return [
      { label: '현역과 그 가족', time: rule.active, active: true },
      { label: '국방가족 누구나', time: rule.everyone, active: false },
    ];
  }
  const hours = hoursOn(store, day);
  return hours ? [{ label: '누구나', time: hours, active: false }] : [];
}

export function weekRows(store) {
  const names = { 평일: '평일', 토: '토요일', 일: '일요일' };
  return (store.hours || '').split(';').map((x) => x.trim()).filter((x) => x.includes(':')).map((x) => {
    const [key, time] = x.split(' ');
    return { label: names[key] || key, time };
  });
}

export function suggestedStage(summary, now) {
  if (!summary.start || before(now, summary.start)) return 'before';
  if (summary.left !== null && summary.left <= 60) return 'after';
  return ordinal(now) - ordinal(summary.start) < 42 ? 'training' : 'unit';
}

export function badgeText(summary) {
  if (!summary.sv.ok) return '마트 이용 대상이 아니에요';
  if (summary.dateProblem) return '날짜를 다시 봐 주세요';
  if (summary.left === null) return summary.sv.months ? '입대일 넣기' : '전역일 넣기';
  if (summary.left < 0) return '전역했어요';
  if (summary.left === 0) return '오늘 전역해요';
  return `전역까지 ${summary.left}일`;
}

export function storeNotices(store, day, content) {
  const out = [];
  const closure = activeClosure(store, day, content);
  if (closure) {
    const from = parseDay(closure.from);
    out.push({ strong: true, text: `국군복지단 공지를 보니 ${from ? `${monthDay(from)}부터 ` : ''}${monthDay(parseDay(closure.to))}까지 ${closure.reason} 때문에 쉰대요.${closure.next ? ` ${closure.next}이에요.` : ''}` });
  }
  if (reopenUnknown(store, day, content)) {
    const c = content.closures.find((x) => x.name === store.name);
    out.push({ strong: false, text: `공사가 ${monthDay(parseDay(c.to))}까지로 공지됐는데, 다시 연다는 공지는 아직 못 봤어요. 가시기 전에 꼭 전화해 보세요.` });
  }
  if (store.conflict) out.push({ strong: false, text: `${store.conflict} 공식 자료마다 조금씩 달라요. 전화로 한 번 확인해 보세요.` });
  const stale = staleNotice(content, day);
  if (stale) out.push({ strong: false, text: stale });
  return out;
}

// 앱의 ContentLibrary와 같은 기준이다. tools/build_data.py의 SCHEMA와 맞춘다.
export const SCHEMA = 1;
export const CLOSURE_STALE_DAYS = 10;

/** 받은 자료를 쓸 수 있는지 본다. 쓸 수 없으면 이유를, 쓸 수 있으면 null을 돌려준다. */
export function contentProblem(c) {
  if (!c || typeof c !== 'object') return 'unreadable';
  if (c.schema !== SCHEMA) return `schema ${c.schema}`;
  if (!Array.isArray(c.stores) || c.stores.length < 100) return 'too few stores';
  const dates = [c.baseDate, c.closuresCheckedOn, ...(c.closures || []).flatMap((x) => [x.to, ...(x.from ? [x.from] : [])])];
  const bad = dates.find((d) => !parseDay(d));
  if (bad !== undefined) return `bad date ${bad}`;
  const names = new Set(c.stores.map((s) => s.name));
  const stray = (c.closures || []).find((x) => !names.has(x.name));
  if (stray) return `unknown store ${stray.name}`;
  if (!Array.isArray(c.tips) || !c.tips.length) return 'no tips';
  // 앱(Decodable)은 이런 마트를 통째로 거절한다. 웹도 그려 보기 전에 막는다.
  const broken = c.stores.find((s) => !s || typeof s.name !== 'string' || !Array.isArray(s.specials) || !Array.isArray(s.entryRules));
  if (broken) return `broken store ${broken?.name ?? '?'}`;
  return null;
}

/** 자료가 오래됐을 때 보여 줄 문장. 앱의 staleNotice와 같다. */
export function staleNotice(content, day) {
  const parts = [];
  const checked = parseDay(content.closuresCheckedOn);
  if (checked && ordinal(day) - ordinal(checked) > CLOSURE_STALE_DAYS) {
    parts.push(`휴점 공지를 살펴본 지 ${ordinal(day) - ordinal(checked)}일이 지났어요.`);
  }
  const base = parseDay(content.baseDate);
  if (base) {
    const next = base.m === 12 ? { y: base.y + 1, m: 1, d: 8 } : { y: base.y, m: base.m + 1, d: 8 };
    if (!before(day, next)) parts.push(`영업시간은 ${base.y}년 ${base.m}월 운영표 그대로예요.`);
  }
  return parts.length ? [...parts, '가시기 전에 전화로 한 번 확인해 보세요.'].join(' ') : null;
}

export const dialable = (store) => {
  const digits = (store.phone || '').split('/')[0].replace(/\D/g, '');
  return digits || null;
};
