// 앱 파일은 저장해 두고 오프라인에서도 연다. 자료(content.json)는 온라인이면 새 자료를 먼저 받는다.
// 받은 자료는 검사를 통과하고 저장된 자료보다 새 판일 때만 저장한다. 앱 파일을 바꾸면 CACHE 이름을 올린다.
const CACHE = 'adeul-v10';
const SCHEMA = 1;

// logic.js의 contentProblem과 같은 검사. 서비스워커는 모듈을 못 쓰는 브라우저가 있어 그대로 옮겨 둔다.
// tools/test_web.mjs가 두 검사의 결과가 같은지 확인한다.
const isDay = (t) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t || '');
  if (!m) return false;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= new Date(Date.UTC(y, mo, 0)).getUTCDate();
};
function usable(c) {
  if (!c || typeof c !== 'object' || c.schema !== SCHEMA) return false;
  if (!Array.isArray(c.stores) || c.stores.length < 100) return false;
  const dates = [c.baseDate, c.closuresCheckedOn, ...(c.closures || []).flatMap((x) => [x.to, ...(x.from ? [x.from] : [])])];
  if (!dates.every(isDay)) return false;
  const names = new Set(c.stores.map((s) => s && s.name));
  if ((c.closures || []).some((x) => !names.has(x.name))) return false;
  if (!Array.isArray(c.tips) || !c.tips.length) return false;
  return c.stores.every((s) => s && typeof s.name === 'string' && Array.isArray(s.specials) && Array.isArray(s.entryRules));
}
// 지금 저장된 자료에 있는 훈련소·공식 사이트 묶음이 새 자료에서 통째로 빠지면 받지 않는다.
const keepsSections = (fresh, old) => !old || ['camps', 'links'].every((k) => !(old[k] || []).length || (fresh[k] || []).length);

async function freshContent(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match('content.json');
  const old = saved ? await saved.clone().json().catch(() => null) : null;
  const savedRevision = old?.revision ?? 0;
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    const body = response.ok ? await response.clone().json().catch(() => null) : null;
    if (usable(body) && body.revision >= savedRevision && keepsSections(body, old)) {
      await cache.put('content.json', response.clone());
      return response;
    }
    // 검사에 떨어진 자료는 버리고 저장된 자료를 쓴다.
  } catch {
    // 오프라인이면 저장된 자료를 쓴다.
  }
  return saved || Response.error();
}
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'logic.js', 'content.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png', 'fonts/DoHyeon-Regular.ttf'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  if (new URL(request.url).pathname.endsWith('/content.json')) {
    event.respondWith(freshContent(request));
    return;
  }
  // 화면 열기(안드로이드 앱의 /?from=android 포함)는 주소 뒤 ?를 무시하고 저장된 첫 화면을 쓴다. 오프라인이어도 열림.
  if (request.mode === 'navigate') {
    event.respondWith(caches.match(request, { ignoreSearch: true })
      .then((hit) => hit || fetch(request))
      .catch(() => caches.match('./')));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
