// 공개 웹에 메일 주소가 글자 그대로 남지 않게 누를 때 쓸 주소를 여기서 만든다(메일 주소 수집 프로그램 막기).
// 스크립트가 꺼져 있으면 버튼은 앱 첫 화면으로 간다. 앱의 "앱 소개" 탭에서도 보낼 수 있다.
const mail = document.getElementById('mail');
if (mail) {
  const to = ['bbongssem', 'naver.com'].join('@');
  mail.href = `mailto:${to}?subject=${encodeURIComponent('[아들아사랑해] 문의')}`;
}
