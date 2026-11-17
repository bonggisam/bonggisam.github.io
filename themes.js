// 앱 전체 디자인 12가지. "만든 사람 > 화면 디자인 고르기"에서 고르고 이 기기에만 저장한다.
// 원본은 기획안/아들아사랑해_전체디자인_12.html. 앱의 App/AppTheme.swift와 같은 값이다(한쪽을 고치면 다른 쪽도).
// 화면 구성은 그대로 두고 바탕색, 바탕 무늬, 칸 색, 강조색, 큰 숫자 글꼴만 바꾼다.
// 영업 중 초록, 휴점 빨강처럼 뜻이 있는 색은 그대로 둔다(어두운 달밤만 휴점 빨강을 밝게).

/** 큰 숫자 글꼴. 숫자만 쓰므로 앱에 넣은 두 글꼴 말고는 기기 글꼴을 쓴다. */
export const NUMBER_FONTS = {
  gasoek: ['"Gasoek One", "Do Hyeon", sans-serif', 400],
  dohyeon: ['"Do Hyeon", sans-serif', 400],
  serif: ['Georgia, "Times New Roman", serif', 700],
  rounded: ['ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", system-ui, sans-serif', 800],
  black: ['system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif', 900],
};

/** 바탕 무늬. 글씨를 가리지 않게 아주 옅게 둔다. 마지막에 바탕색을 붙여 background 한 줄로 쓴다. */
const svgUrl = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
export const PATTERNS = {
  none: '',
  hanji: `${svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.9 .04' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .42  0 0 0 -1.9 1.15'/></filter><rect width='220' height='220' filter='url(#f)'/></svg>")} 0 0/220px 220px`,
  celadon: 'radial-gradient(circle at 50% 100%, transparent 9px, rgba(255,255,255,.28) 10px, transparent 11.5px) 0 0/24px 13px',
  dancheong: 'linear-gradient(45deg, rgba(255,255,255,.06) 25%, transparent 25% 75%, rgba(255,255,255,.06) 75%) 0 0/18px 18px, linear-gradient(45deg, rgba(255,255,255,.06) 25%, transparent 25% 75%, rgba(255,255,255,.06) 75%) 9px 9px/18px 18px',
  indigo: 'radial-gradient(circle, rgba(255,255,255,.08) 2px, transparent 2.5px) 0 0/16px 16px, radial-gradient(circle, rgba(255,255,255,.05) 6px, transparent 7px) 8px 8px/32px 32px',
  petals: 'radial-gradient(ellipse 4px 2.6px at 30% 40%, rgba(220,110,160,.28) 98%, transparent) 0 0/46px 52px, radial-gradient(ellipse 3px 2px at 70% 75%, rgba(220,110,160,.22) 98%, transparent) 0 0/38px 44px',
  barley: 'repeating-linear-gradient(100deg, rgba(90,140,60,.08) 0 1px, transparent 1px 9px)',
  leaves: 'radial-gradient(circle, rgba(214,100,50,.18) 3px, transparent 3.5px) 0 0/40px 46px, radial-gradient(circle, rgba(230,170,60,.18) 2.5px, transparent 3px) 20px 23px/40px 46px',
  snow: 'radial-gradient(circle, rgba(255,255,255,.95) 1.6px, transparent 2px) 0 0/26px 30px, radial-gradient(circle, rgba(255,255,255,.75) 1px, transparent 1.4px) 13px 15px/26px 30px',
  stars: 'radial-gradient(circle, rgba(255,240,200,.55) 1px, transparent 1.4px) 0 0/34px 38px, radial-gradient(circle, rgba(255,255,255,.35) .8px, transparent 1.2px) 17px 19px/34px 38px',
  baekja: 'radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,.9), transparent 60%) 0 0/100% 100vh no-repeat',
};

/* 칸 이름
   bg 화면 바탕 · bar 위쪽 막대 · card 칸 바탕 · edge 칸 테두리 · ink/muted 칸 안 글씨
   onBg/onBgMuted 화면 바탕 위 글씨 · hero 전역일 칸 · big 큰 숫자 · accent 막대 · accentInk 칸 안 강조 글씨
   tile1 첫 바로가기와 강조 버튼 · btn 주 버튼 · btnOn 고른 칩 글씨 · tab 아래 메뉴 · ring 화면 바탕 위 강조(고른 그림 테두리, 처음 화면 숫자)
   tag 상품 이름표(없으면 칸과 tile1을 섞는다) */
export const THEMES = [
  { id: 'gukbang', group: '지금 앱', name: '국방', emoji: '🪖', num: 'gasoek', mood: '지금 앱 그대로. 올리브 바탕, 광목 칸, 놋쇠 숫자.',
    c: { bg: '#4B5A2A', bar: '#2E3819', barInk: '#F3ECD6', card: '#F3ECD6', edge: '#E3BE5C', ink: '#2E3819', muted: '#5C6340', onBg: '#F3ECD6', onBgMuted: '#E4DDBF',
      hero: '#2E3819', heroInk: '#F3ECD6', heroSub: '#E4DDBF', heroEdge: '#E3BE5C', heroTrack: '#7A8752', big: '#E3BE5C', accent: '#4B5A2A', accentInk: '#4B5A2A', track: '#E0D8BC',
      tile1: '#E3BE5C', tile1Ink: '#2E3819', btn: '#2E3819', btnInk: '#F3ECD6', btnOn: '#E3BE5C', tab: '#2E3819', tabInk: '#C9C9A9', tabOn: '#E3BE5C', ring: '#E3BE5C', tag: '#F6E3A6' } },
  { id: 'hanji', group: '우리 것', name: '한지와 먹', emoji: '🖌️', num: 'serif', pattern: 'hanji', thin: true, mood: '닥종이 결이 보이는 한지 바탕에 먹빛 글씨, 붉은 낙관 하나.',
    c: { bg: '#EFE8DA', bar: '#2B2A27', barInk: '#F5EFE3', card: '#FBF7EF', edge: '#D9CFBC', ink: '#2B2A27', muted: '#6E675C', onBg: '#2B2A27', onBgMuted: '#6E675C',
      hero: '#2B2A27', heroInk: '#F5EFE3', heroSub: '#B9B1A2', heroEdge: '#D9CFBC', heroTrack: '#4A4741', big: '#F5EFE3', accent: '#B5352B', accentInk: '#B5352B', track: '#E7DFCF',
      tile1: '#B5352B', tile1Ink: '#FBF7EF', btn: '#2B2A27', btnInk: '#F5EFE3', btnOn: '#F5EFE3', tab: '#FBF7EF', tabInk: '#8B8478', tabOn: '#B5352B', ring: '#B5352B' } },
  { id: 'celadon', group: '우리 것', name: '청자', emoji: '🏺', num: 'serif', pattern: 'celadon', mood: '고려청자의 비췻빛. 바탕에 잔물결 무늬, 짙은 청록 칸.',
    c: { bg: '#9DC2B6', bar: '#2F5F57', barInk: '#EAF4F0', card: '#F2F8F5', edge: '#7FA99C', ink: '#1E3F39', muted: '#4F6F68', onBg: '#1E3F39', onBgMuted: '#2F5049',
      hero: '#2F5F57', heroInk: '#EAF4F0', heroSub: '#A9CBC1', heroEdge: '#7FA99C', heroTrack: '#4A7C72', big: '#F4E7C1', accent: '#2F5F57', accentInk: '#2F5F57', track: '#D5E6DF',
      tile1: '#F4E7C1', tile1Ink: '#2F5F57', btn: '#2F5F57', btnInk: '#EAF4F0', btnOn: '#F4E7C1', tab: '#F2F8F5', tabInk: '#6E8F87', tabOn: '#2F5F57', ring: '#1E3F39' } },
  { id: 'baekja', group: '우리 것', name: '백자와 청화', emoji: '🫖', num: 'serif', pattern: 'baekja', thin: true, mood: '달항아리처럼 맑은 흰 바탕에 청화 안료의 쪽빛 한 가지.',
    c: { bg: '#F4F2EC', bar: '#F4F2EC', barInk: '#24376B', card: '#FFFFFF', edge: '#DAD8D0', ink: '#1F2A44', muted: '#666B78', onBg: '#1F2A44', onBgMuted: '#666B78',
      hero: '#FFFFFF', heroInk: '#1F2A44', heroSub: '#6B7387', heroEdge: '#24376B', heroTrack: '#DCE1EE', big: '#24376B', accent: '#3A55A0', accentInk: '#3A55A0', track: '#E7E9EF',
      tile1: '#24376B', tile1Ink: '#FFFFFF', btn: '#24376B', btnInk: '#FFFFFF', btnOn: '#FFFFFF', tab: '#FFFFFF', tabInk: '#8C93A4', tabOn: '#24376B', ring: '#24376B' } },
  { id: 'dancheong', group: '우리 것', name: '단청', emoji: '🏯', num: 'black', pattern: 'dancheong', mood: '궁궐 처마의 단청. 짙은 뇌록 바탕에 주홍과 석간주, 노랑을 조금씩.',
    c: { bg: '#24574A', bar: '#173B32', barInk: '#F6EBD3', card: '#FAF3E3', edge: '#D9573F', ink: '#1F3B33', muted: '#5E6E66', onBg: '#FAF3E3', onBgMuted: '#CFE0D6',
      hero: '#8E2F25', heroInk: '#FFF3DE', heroSub: '#EBC0AE', heroEdge: '#F2C14E', heroTrack: '#A9483B', big: '#F2C14E', accent: '#24574A', accentInk: '#24574A', track: '#EADFC8',
      tile1: '#F2C14E', tile1Ink: '#173B32', btn: '#173B32', btnInk: '#FAF3E3', btnOn: '#F2C14E', tab: '#FAF3E3', tabInk: '#6D7E75', tabOn: '#8E2F25', ring: '#F2C14E' } },
  { id: 'indigo', group: '우리 것', name: '쪽빛 물들임', emoji: '🧵', num: 'black', pattern: 'indigo', mood: '쪽물 들인 무명. 깊은 남색 바탕에 흰 홀치기 점무늬.',
    c: { bg: '#24345E', bar: '#17223F', barInk: '#E9EEF8', card: '#F3F5FA', edge: '#8FA3CF', ink: '#1B2645', muted: '#5D6884', onBg: '#E9EEF8', onBgMuted: '#B9C4DE',
      hero: '#17223F', heroInk: '#E9EEF8', heroSub: '#A9B5D3', heroEdge: '#8FA3CF', heroTrack: '#33446F', big: '#BFD2FF', accent: '#2E4A8C', accentInk: '#2E4A8C', track: '#DCE3F2',
      tile1: '#BFD2FF', tile1Ink: '#17223F', btn: '#17223F', btnInk: '#E9EEF8', btnOn: '#BFD2FF', tab: '#E9EEF8', tabInk: '#6D7896', tabOn: '#24345E', ring: '#BFD2FF' } },
  { id: 'spring', group: '사계절', name: '봄, 진달래', emoji: '🌸', num: 'rounded', pattern: 'petals', mood: '연분홍 바탕에 꽃잎이 흩날려요. 진한 자홍 칸과 연둣빛 막대.',
    c: { bg: '#F9E4EC', bar: '#8E3B63', barInk: '#FFF2F7', card: '#FFFFFF', edge: '#EFB8CF', ink: '#4A2338', muted: '#86627A', onBg: '#4A2338', onBgMuted: '#7A5468',
      hero: '#8E3B63', heroInk: '#FFF2F7', heroSub: '#E7B6CD', heroEdge: '#EFB8CF', heroTrack: '#A5577E', big: '#FFD6E7', accent: '#7DB35A', accentInk: '#8E3B63', track: '#F3E1E9',
      tile1: '#E886B4', tile1Ink: '#4A2338', btn: '#8E3B63', btnInk: '#FFF2F7', btnOn: '#FFD6E7', tab: '#FFFFFF', tabInk: '#A88799', tabOn: '#8E3B63', ring: '#8E3B63' } },
  { id: 'summer', group: '사계절', name: '여름, 청보리', emoji: '🌾', num: 'dohyeon', pattern: 'barley', mood: '바람 부는 보리밭 결무늬. 맑은 연두 바탕과 여름 하늘색.',
    c: { bg: '#E4F0D2', bar: '#3E6B2C', barInk: '#F1F8E8', card: '#FFFFFF', edge: '#B6D492', ink: '#25401A', muted: '#5D7550', onBg: '#25401A', onBgMuted: '#50693F',
      hero: '#3E6B2C', heroInk: '#F1F8E8', heroSub: '#B9D4A4', heroEdge: '#B6D492', heroTrack: '#58873F', big: '#FFFFFF', accent: '#3F8FCB', accentInk: '#2A6E9F', track: '#E3EDDA',
      tile1: '#8EC1E6', tile1Ink: '#173A55', btn: '#3E6B2C', btnInk: '#F1F8E8', btnOn: '#FFFFFF', tab: '#FFFFFF', tabInk: '#7E9471', tabOn: '#3E6B2C', ring: '#3E6B2C' } },
  { id: 'autumn', group: '사계절', name: '가을, 단풍', emoji: '🍁', num: 'black', pattern: 'leaves', mood: '볕 좋은 가을 오후. 은행잎 노랑 바탕에 단풍잎 점, 붉은 칸.',
    c: { bg: '#F6E8C8', bar: '#7A3B22', barInk: '#FFF4E2', card: '#FFFBF2', edge: '#E9B65E', ink: '#4A2616', muted: '#86644E', onBg: '#4A2616', onBgMuted: '#7A5A44',
      hero: '#A8432A', heroInk: '#FFF4E2', heroSub: '#F1C5AE', heroEdge: '#E9B65E', heroTrack: '#C0634A', big: '#FFE08A', accent: '#C9772F', accentInk: '#A8432A', track: '#F1E3C6',
      tile1: '#E9A23B', tile1Ink: '#4A2616', btn: '#7A3B22', btnInk: '#FFF4E2', btnOn: '#FFE08A', tab: '#FFFBF2', tabInk: '#A88A72', tabOn: '#A8432A', ring: '#A8432A' } },
  { id: 'winter', group: '사계절', name: '겨울, 눈꽃', emoji: '❄️', num: 'gasoek', pattern: 'snow', mood: '눈 내리는 아침. 서리빛 하늘색 바탕에 눈송이, 동백 붉은 숫자.',
    c: { bg: '#D9E5F0', bar: '#2E4560', barInk: '#F0F5FA', card: '#FFFFFF', edge: '#B8CBDE', ink: '#1E3047', muted: '#5E7088', onBg: '#1E3047', onBgMuted: '#4E6078',
      hero: '#FFFFFF', heroInk: '#1E3047', heroSub: '#6D7F96', heroEdge: '#2E4560', heroTrack: '#DDE7F1', big: '#C8323F', accent: '#2E4560', accentInk: '#2E4560', track: '#E5EDF5',
      tile1: '#C8323F', tile1Ink: '#FFFFFF', btn: '#2E4560', btnInk: '#F0F5FA', btnOn: '#FFFFFF', tab: '#FFFFFF', tabInk: '#8193A8', tabOn: '#2E4560', ring: '#C8323F' } },
  { id: 'moon', group: '밤과 큰 글씨', name: '달밤', emoji: '🌙', num: 'gasoek', pattern: 'stars', thin: true, mood: '잠들기 전 보는 어두운 화면. 남색 밤하늘에 별, 달빛 노랑.',
    c: { bg: '#151B2C', bar: '#0E1320', barInk: '#E7EAF2', card: '#222A40', edge: '#323C58', ink: '#E7EAF2', muted: '#A2AAC0', onBg: '#E7EAF2', onBgMuted: '#A2AAC0',
      hero: '#0E1320', heroInk: '#E7EAF2', heroSub: '#9AA3BB', heroEdge: '#F0D27A', heroTrack: '#2A3350', big: '#F0D27A', accent: '#F0D27A', accentInk: '#F0D27A', track: '#323C58',
      tile1: '#F0D27A', tile1Ink: '#151B2C', btn: '#2A3350', btnInk: '#E7EAF2', btnOn: '#F0D27A', tab: '#222A40', tabInk: '#8D96AF', tabOn: '#F0D27A', ring: '#F0D27A', closed: '#FF8A7A' } },
  { id: 'clear', group: '밤과 큰 글씨', name: '또렷하게', emoji: '🔍', num: 'black', big: true, mood: '돋보기 없이 보기 좋게. 글자 한 단계 크게, 흰 바탕에 검정과 노랑.',
    c: { bg: '#FFFFFF', bar: '#000000', barInk: '#FFFFFF', card: '#FFFFFF', edge: '#000000', ink: '#000000', muted: '#222222', onBg: '#000000', onBgMuted: '#222222',
      hero: '#000000', heroInk: '#FFFFFF', heroSub: '#E6E6E6', heroEdge: '#000000', heroTrack: '#444444', big: '#FFD43B', accent: '#1D4ED8', accentInk: '#1D4ED8', track: '#E5E7EB',
      tile1: '#FFD43B', tile1Ink: '#000000', btn: '#000000', btnInk: '#FFFFFF', btnOn: '#FFD43B', tab: '#000000', tabInk: '#D4D4D4', tabOn: '#FFD43B', ring: '#000000', tag: '#FFF3B0' } },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** a에 b를 share만큼 섞는다. */
export const mix = (a, b, share) => `#${rgb(a).map((x, i) => Math.round(x * (1 - share) + rgb(b)[i] * share).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
/** 상대 밝기(WCAG). 0은 검정, 1은 흰색. */
export const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** 칸 값에서 따로 정하지 않은 색을 만든다. 앱의 Palette.init과 같은 셈이다. */
export function colorsOf(theme) {
  const c = theme.c;
  return {
    ...c,
    surface: mix(c.card, c.track, 0.5),
    cardLine: mix(c.track, c.ink, 0.15),
    heroTrack2: mix(c.heroTrack, c.hero, 0.4),
    tag: c.tag || mix(c.card, c.tile1, 0.2),
    closed: c.closed || '#A5321F',
  };
}

const cssName = (k) => `--t-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;

/** 고른 디자인을 문서 전체에 입힌다. style.css는 --t-* 값만 읽는다. */
export function applyTheme(theme, root = document.documentElement) {
  const colors = colorsOf(theme);
  for (const [k, v] of Object.entries(colors)) root.style.setProperty(cssName(k), v);
  const pattern = PATTERNS[theme.pattern || 'none'];
  root.style.setProperty('--t-page', pattern ? `${pattern}, ${colors.bg}` : colors.bg);
  root.style.setProperty('--t-edge-w', theme.thin ? '1.5px' : '3px');
  const [font, weight] = NUMBER_FONTS[theme.num] || NUMBER_FONTS.gasoek;
  root.style.setProperty('--number', font);
  root.style.setProperty('--t-num-w', String(weight));
  root.style.colorScheme = luminance(colors.bg) < 0.2 ? 'dark' : 'light';
  root.dataset.appTheme = theme.id;
  if (theme.big) root.dataset.bigText = '1'; else delete root.dataset.bigText;
  const meta = document.querySelector('meta[name="theme-color"]');
  // 브라우저 맨 위 막대 색. 바탕이 밝은 디자인은 바탕색으로(앱의 위쪽 막대와 같은 규칙).
  if (meta) meta.setAttribute('content', luminance(colors.bg) >= 0.2 ? colors.bg : colors.bar);
}
