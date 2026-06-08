'use strict';

/* ── i18n Dictionary ────────────────────────────────────────────────────── */
const DICT = {
  en: {
    meta_title:    'Pick Your Gift',
    title:         'Choose Your Gift Box!',
    subtitle:      'One box hides a special reward',
    hint:          'Tap a box to reveal what\'s inside',
    try_again:     '❌ Not this one! One more try.',
    win_step3:     'Revealing the last box…',
    win_title:     'Congratulations!',
    win_desc:      'Your reward has been activated',
    reward_text:   '+200% Bonus  •  150 Free Spins',
    timer_label:   'Offer expires in:',
    button_action: 'Claim My Reward →',
  },
  ru: {
    meta_title:    'Выбери Подарок',
    title:         'Выбери Свой Бокс!',
    subtitle:      'В одном боксе спрятана особая награда',
    hint:          'Нажми на бокс, чтобы узнать что внутри',
    try_again:     '❌ Не здесь! Ещё одна попытка.',
    win_step3:     'Открываем последний бокс…',
    win_title:     'Поздравляем!',
    win_desc:      'Ваша награда активирована',
    reward_text:   '+200% Бонус  •  150 Фриспинов',
    timer_label:   'Предложение истекает через:',
    button_action: 'Получить Награду →',
  },
  es: {
    meta_title:    'Elige tu Caja',
    title:         '¡Elige tu Caja Regalo!',
    subtitle:      'Una caja esconde una recompensa especial',
    hint:          'Toca una caja para ver qué hay dentro',
    try_again:     '❌ ¡Aquí no! Un intento más.',
    win_step3:     'Abriendo la última caja…',
    win_title:     '¡Felicidades!',
    win_desc:      'Tu recompensa ha sido activada',
    reward_text:   '+200% Bono  •  150 Giros Gratis',
    timer_label:   'La oferta expira en:',
    button_action: 'Reclamar mi Recompensa →',
  },
  pt: {
    meta_title:    'Escolha sua Caixa',
    title:         'Escolha sua Caixa Presente!',
    subtitle:      'Uma caixa esconde uma recompensa especial',
    hint:          'Toque em uma caixa para revelar o que há dentro',
    try_again:     '❌ Não aqui! Mais uma tentativa.',
    win_step3:     'Revelando a última caixa…',
    win_title:     'Parabéns!',
    win_desc:      'Sua recompensa foi ativada',
    reward_text:   '+200% Bônus  •  150 Giros Grátis',
    timer_label:   'Oferta expira em:',
    button_action: 'Reivindicar Recompensa →',
  },
  de: {
    meta_title:    'Wähle deine Box',
    title:         'Wähle deine Geschenkbox!',
    subtitle:      'Eine Box versteckt eine besondere Belohnung',
    hint:          'Tippe auf eine Box, um zu sehen was drin ist',
    try_again:     '❌ Nicht hier! Noch ein Versuch.',
    win_step3:     'Letzte Box wird geöffnet…',
    win_title:     'Glückwunsch!',
    win_desc:      'Deine Belohnung wurde aktiviert',
    reward_text:   '+200% Bonus  •  150 Freispiele',
    timer_label:   'Angebot läuft ab in:',
    button_action: 'Belohnung beanspruchen →',
  },
};

/* ── Destination URL (Base64 — swap with your encoded target URL)
   Note: Base64 is light obfuscation against basic scrapers, not cryptography.
   For real URL protection use a server-side redirect endpoint instead.
   To encode: btoa('https://your-target-url.com')                          */
const _D = 'aHR0cHM6Ly9sa3ZuLmNjLzczOTVhNQ==';

/* ── Language Detection ─────────────────────────────────────────────────── */
function detectLang() {
  const code = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return DICT[code] ? code : 'en';
}

const lang = detectLang();
const t    = DICT[lang];

/* ── Apply i18n ─────────────────────────────────────────────────────────── */
function applyI18n() {
  document.documentElement.lang = lang;
  document.title = t.meta_title;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });
}

/* ── DOM References ─────────────────────────────────────────────────────── */
const safesEl      = Array.from(document.querySelectorAll('.safe'));
const stepHint     = document.getElementById('step-hint');
const winOverlay   = document.getElementById('win-overlay');
const countdownEl  = document.getElementById('countdown');
const ctaBtn       = document.getElementById('cta');
const confettiBox  = document.getElementById('confetti-container');

/* ── Game State ─────────────────────────────────────────────────────────── */
let step         = 0;  // 0 = waiting  1 = first miss done  2 = complete
let timerHandle  = null;
const TIMER_SECS = 5 * 60;

/* ── Helpers ────────────────────────────────────────────────────────────── */
function setHint(text, delay = 0) {
  setTimeout(() => {
    stepHint.style.opacity = '0';
    setTimeout(() => {
      stepHint.textContent = text;
      stepHint.style.opacity = '1';
    }, 180);
  }, delay);
}

function openSafe(el, icon) {
  el.classList.add('is-open');
  el.querySelector('.result').textContent = icon;
}

function disableAll() {
  safesEl.forEach(s => s.classList.add('is-disabled'));
}

function enableUnopened() {
  safesEl.forEach(s => {
    if (!s.classList.contains('is-open')) s.classList.remove('is-disabled');
  });
}

/* ── Click Handler ──────────────────────────────────────────────────────── */
function onSafeClick(e) {
  const safe = e.currentTarget;
  if (safe.classList.contains('is-open') || safe.classList.contains('is-disabled')) return;

  /* Step 0 → first click, always a miss */
  if (step === 0) {
    step = 1;
    disableAll();

    requestAnimationFrame(() => {
      openSafe(safe, '❌');
      safe.classList.add('is-miss');
      safe.addEventListener('animationend', () => safe.classList.remove('is-miss'), { once: true });
    });

    setHint(t.try_again, 320);
    enableUnopened();
    return;
  }

  /* Step 1 → second click, always a win */
  if (step === 1) {
    step = 2;
    disableAll();

    safe.classList.add('is-win');
    requestAnimationFrame(() => openSafe(safe, '🏆'));

    /* Step 3: auto-open the remaining (third) safe after a pause */
    setHint(t.win_step3, 900);
    setTimeout(() => {
      const third = safesEl.find(s => !s.classList.contains('is-open'));
      if (third) openSafe(third, '⭐');
      setTimeout(showWin, 500);
    }, 1400);
  }
}

/* ── Win Screen ─────────────────────────────────────────────────────────── */
function showWin() {
  winOverlay.removeAttribute('aria-hidden');
  launchConfetti();
  startTimer();
}

/* ── Countdown Timer ────────────────────────────────────────────────────── */
function startTimer() {
  let remaining = TIMER_SECS;

  function tick() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const label = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    countdownEl.textContent = label;
    countdownEl.setAttribute('datetime', `PT${m}M${s}S`);

    if (remaining <= 0) {
      clearInterval(timerHandle);
      return;
    }
    remaining--;
  }

  tick();
  timerHandle = setInterval(tick, 1000);
}

/* ── Confetti ────────────────────────────────────────────────────────────── */
const CONFETTI_COLORS = [
  '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1',
  '#96ceb4', '#ff8c00', '#39ff14', '#bf00ff',
];

function launchConfetti() {
  const total = 90;
  for (let i = 0; i < total; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'cp';
      const size = 7 + Math.random() * 8;
      el.style.cssText = [
        `left:${Math.random() * 100}%`,
        `width:${size}px`,
        `height:${size}px`,
        `background:${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]}`,
        `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
        `animation-duration:${1.6 + Math.random() * 2.2}s`,
      ].join(';');
      confettiBox.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, i * 22);
  }
}

/* ── CTA Redirect ────────────────────────────────────────────────────────── */
ctaBtn.addEventListener('click', () => {
  try {
    window.location.href = atob(_D);
  } catch {
    /* atob failed — _D is not valid Base64; replace with a correct encoded URL */
    console.error('Invalid destination encoding.');
  }
});

/* ── Init ────────────────────────────────────────────────────────────────── */
applyI18n();
safesEl.forEach(safe => safe.addEventListener('click', onSafeClick));
