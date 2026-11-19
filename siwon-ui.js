/* 시원동물의료센터 보호자 페이지 공통 UI
   1) 상단 실시간 진료 상태 배지 (Asia/Seoul, UTC+9 기준)
   2) 모바일 하단 고정 액션바 (전화 · 카톡 상담 · 오시는 길)
   - 진료시간은 faq.html / index.html의 실제 진료시간과 동일하게 유지할 것
     매일 09:00–21:00 / 점심 13:00–14:00 / 저녁 18:00–19:00 / 점심 13:00–14:00
*/
(function () {
  'use strict';

  var PHONE = '000-0000-0000';
  var KAKAO = '#kakao';

  var page = (function () {
    var p = location.pathname.split('/').pop();
    return p || 'index.html';
  })();
  var VISIT = (page === 'visit.html') ? '#way' : 'visit.html';

  /* 0=일 1=월 2=화 3=수 4=목 5=금 6=토  (매일 진료) */
  var SCHEDULE = {
    0: ['09:00', '21:00'],
    1: ['09:00', '21:00'],
    2: ['09:00', '21:00'],
    3: ['09:00', '21:00'],
    4: ['09:00', '21:00'],
    5: ['09:00', '21:00'],
    6: ['09:00', '21:00']
  };
  /* 개원 전에는 '개원 예정'으로 표시 (KST 2027-03-02 00:00) */
  var OPEN_DATE_UTC = Date.UTC(2027, 2, 1, 15, 0, 0);
  var OPEN_LABEL = '2027년 3월 2일 개원 예정';
  /* 점심·저녁 휴진 표시 여부 — false로 바꾸면 09–21시 연속 진료로 표시 */
  var HAS_BREAKS = true;
  var LUNCH_START = 13 * 60;
  var LUNCH_END = 14 * 60;
  var DINNER_START = 18 * 60;
  var DINNER_END = 19 * 60;
  var DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

  function toMin(hhmm) {
    var a = hhmm.split(':');
    return parseInt(a[0], 10) * 60 + parseInt(a[1], 10);
  }

  /* 기기 시간대와 무관하게 한국 시간(UTC+9)을 구한다 */
  function kstNow() {
    var ms = Date.now();
    var d = new Date(ms + 9 * 3600 * 1000);
    return { dow: d.getUTCDay(), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
  }

  function nextOpen(dow) {
    var i, nd;
    for (i = 1; i <= 7; i++) {
      nd = (dow + i) % 7;
      if (SCHEDULE[nd]) return { dow: nd, gap: i };
    }
    return null;
  }

  function gapLabel(gap, dow) {
    if (gap === 1) return '내일';
    if (gap === 2) return '모레';
    return DAY_KO[dow] + '요일';
  }

  function openText(dow) {
    return SCHEDULE[dow][0] + '–' + SCHEDULE[dow][1];
  }

  function statusFor(now) {
    if (!now && Date.now() < OPEN_DATE_UTC) {
      return { state: 'soon', main: OPEN_LABEL, sub: '개원 후 매일 09:00–21:00 진료' };
    }
    now = now || kstNow();
    var sch = SCHEDULE[now.dow];
    var t = now.min;
    var n, open, close;

    if (!sch) {
      n = nextOpen(now.dow);
      return {
        state: 'closed',
        main: '휴진',
        sub: '다음 진료 ' + gapLabel(n.gap, n.dow) + ' ' + SCHEDULE[n.dow][0] + ' 시작'
      };
    }

    open = toMin(sch[0]);
    close = toMin(sch[1]);

    if (t < open) {
      return { state: 'soon', main: '진료 시작 전', sub: '오늘 ' + sch[0] + ' 시작' };
    }
    if (HAS_BREAKS && t >= LUNCH_START && t < LUNCH_END) {
      return { state: 'break', main: '점심시간', sub: '14:00 진료 재개' };
    }
    if (HAS_BREAKS && t >= DINNER_START && t < DINNER_END) {
      return { state: 'break', main: '저녁시간', sub: '19:00 진료 재개' };
    }
    if (t < close) {
      return { state: 'open', main: '지금 진료 중', sub: '오늘 ' + openText(now.dow) };
    }
    n = nextOpen(now.dow);
    return {
      state: 'closed',
      main: '오늘 진료 마감',
      sub: '다음 진료 ' + gapLabel(n.gap, n.dow) + ' ' + SCHEDULE[n.dow][0] + ' 시작'
    };
  }

  function emojiFor(state) {
    if (state === 'open') return '🟢';
    if (state === 'break') return '🟡';
    if (state === 'soon' && Date.now() < OPEN_DATE_UTC) return '🗓️';
    return '⚪';
  }

  var CSS = [
    '.wc-status{background:#eef1f6;border-bottom:1px solid #d9e0e8;color:#2b3b4f;font-family:\'Pretendard\',sans-serif;-webkit-font-smoothing:antialiased}',
    '.wc-status-in{max-width:var(--max,860px);margin:0 auto;padding:.4rem 1.35rem;display:flex;align-items:center;gap:.5rem;line-height:1.5;word-break:keep-all}',
    '.wc-status-main{font-size:13.5px;font-weight:700;letter-spacing:-.01em;white-space:nowrap}',
    '.wc-status[data-state="open"] .wc-status-main{color:#156f3d}',
    '.wc-status[data-state="break"] .wc-status-main{color:#8a6100}',
    '.wc-status[data-state="soon"] .wc-status-main,.wc-status[data-state="closed"] .wc-status-main{color:#4a5a56}',
    '.wc-status-sub{font-size:12.5px;color:#5f6e6a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.wc-status-link{margin-left:auto;font-size:12.5px;font-weight:500;color:#a28251;text-decoration:none;white-space:nowrap}',
    '.wc-status-link:hover{text-decoration:underline}',
    '.wc-bar{display:none}',
    '.wc-spacer{display:none}',
    '@media(max-width:820px){',
    '.wc-bar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:400;background:rgba(255,255,255,.97);border-top:1px solid #dfe3e8;box-shadow:0 -6px 20px -12px rgba(14,42,79,.45);padding-bottom:env(safe-area-inset-bottom,0px);font-family:\'Pretendard\',sans-serif}',
    '.wc-bar-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:58px;padding:.45rem .15rem;text-decoration:none;color:#0e2a4f;font-size:13px;font-weight:700;line-height:1.25;border-right:1px solid #eaf0f7;-webkit-tap-highlight-color:transparent}',
    '.wc-bar-btn:last-child{border-right:0}',
    '.wc-bar-btn:active{background:#f3f5f8}',
    '.wc-bar-btn.kako{background:#fffbdd}',
    '.wc-bar-ico{font-size:17px;line-height:1}',
    '.wc-bar-num{font-size:11px;font-weight:500;color:#5f6e6a;letter-spacing:.02em}',
    '.wc-spacer{display:block;height:calc(62px + env(safe-area-inset-bottom,0px))}',
    'body.wc-has-bar .actionbar{bottom:calc(62px + env(safe-area-inset-bottom,0px))}',
    'body.wc-has-bar .toast{bottom:calc(78px + env(safe-area-inset-bottom,0px))}',
    'body.wc-has-bar .actionbar ~ .toast{bottom:calc(218px + env(safe-area-inset-bottom,0px))}',
    '}',
    '@media(max-width:420px){.wc-status-sub{display:none}}',
    '@media(prefers-reduced-motion:reduce){.wc-bar-btn{transition:none}}'
  ].join('');

  function addStyle() {
    var st = document.createElement('style');
    st.id = 'wc-ui-style';
    st.appendChild(document.createTextNode(CSS));
    (document.head || document.documentElement).appendChild(st);
  }

  function buildStatus() {
    var box = document.createElement('div');
    box.className = 'wc-status';
    box.id = 'wcStatus';
    box.setAttribute('role', 'status');
    box.innerHTML = '<div class="wc-status-in">' +
      '<span class="wc-status-main" id="wcStatusMain"></span>' +
      '<span class="wc-status-sub" id="wcStatusSub"></span>' +
      '<a class="wc-status-link" href="' + VISIT + '">진료시간·오시는 길 →</a>' +
      '</div>';
    return box;
  }

  function buildBar() {
    var bar = document.createElement('nav');
    bar.className = 'wc-bar';
    bar.id = 'wcBar';
    bar.setAttribute('aria-label', '빠른 상담 · 내원 안내');
    bar.innerHTML =
      '<a class="wc-bar-btn call" href="tel:' + PHONE + '">' +
        '<span class="wc-bar-ico" aria-hidden="true">📞</span><span>전화</span>' +
        '<span class="wc-bar-num">' + PHONE + '</span></a>' +
      '<a class="wc-bar-btn kako" href="' + KAKAO + '" target="_blank" rel="noopener">' +
        '<span class="wc-bar-ico" aria-hidden="true">💬</span><span>카톡 상담</span></a>' +
      '<a class="wc-bar-btn way" href="' + VISIT + '">' +
        '<span class="wc-bar-ico" aria-hidden="true">📍</span><span>오시는 길</span></a>';
    return bar;
  }

  function paint() {
    var main = document.getElementById('wcStatusMain');
    var sub = document.getElementById('wcStatusSub');
    var box = document.getElementById('wcStatus');
    if (!main || !box) return;
    var s = statusFor();
    box.setAttribute('data-state', s.state);
    main.innerHTML = '<span aria-hidden="true">' + emojiFor(s.state) + '</span> ' + s.main;
    if (sub) {
      var d = new Date(Date.now() + 9 * 3600 * 1000);
      var hh = ('0' + d.getUTCHours()).slice(-2);
      var mi = ('0' + d.getUTCMinutes()).slice(-2);
      sub.textContent = (s.state === 'open' || s.state === 'break')
        ? '지금 ' + hh + ':' + mi + ' · ' + s.sub
        : s.sub;
    }
  }

  function init() {
    if (document.getElementById('wcBar')) return; /* 한 번만 실행 */
    addStyle();

    var topbar = document.querySelector('.topbar');
    var status = buildStatus();
    if (topbar && topbar.parentNode) {
      topbar.parentNode.insertBefore(status, topbar.nextSibling);
    } else {
      document.body.insertBefore(status, document.body.firstChild);
    }
    paint();
    if (window.setInterval) {
      window.setInterval(paint, 60000);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) paint();
      });
    }

    document.body.appendChild(buildBar());
    var spacer = document.createElement('div');
    spacer.className = 'wc-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spacer);
    if (document.body.classList) document.body.classList.add('wc-has-bar');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* 진료 상태 계산 로직 노출 (검증·재사용용) */
  window.WCUI = {
    statusFor: statusFor,
    kstNow: kstNow,
    schedule: SCHEDULE,
    phone: PHONE,
    kakao: KAKAO
  };
})();
