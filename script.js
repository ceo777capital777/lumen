/* =========================================================
   LUMEN — интерактив сайта (чистый JS, без зависимостей)
   ========================================================= */

/* ---------- НАСТРОЙКИ КАЛЬКУЛЯТОРА (меняйте цены здесь) ---------- */
const CALC_CONFIG = {
  currency: '₽',
  minArea: 1,                 // минимальная площадь к расчёту, м²
  pricePerM2: {               // ориентировочная цена за м² (примерные значения)
    horizontal: 2900,
    vertical: 2400,
    roller: 3200,
    dayNight: 4200,
    blackout: 4600,
    pleated: 4800,
  },
  premiumColors: {            // наценка за премиальные оттенки (коэффициент)
    'Матовое золото': 1.12,
    'Бронза': 1.12,
    'Сланцевый синий': 1.08,
    'Олива': 1.08,
    'Пыльная роза': 1.08,
  },
  installPerItem: 900,        // монтаж за одно изделие
  rangeSpread: 0.12,          // показываем «от … до …» ±12%
};

/* ---------- ОТПРАВКА ЗАЯВКИ ----------
   Сейчас заявка никуда не уходит — просто показывается экран успеха.
   Чтобы подключить Telegram-бота заявок, замените тело функции на запрос
   к вашему серверу (НЕ храните токен бота в коде сайта!), например:

   return fetch('https://your-server.ru/lead', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(lead),
   }).then(r => { if (!r.ok) throw new Error('Ошибка отправки'); });
*/
async function sendLead(lead) {
  console.info('[LUMEN] Новая заявка (демо):', lead);
  await new Promise(r => setTimeout(r, 700));
}

/* ========================================================= */
document.documentElement.classList.remove('no-js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = n => Math.round(n).toLocaleString('ru-RU');

/* ---------- Появление при скролле ---------- */
const revealIO = 'IntersectionObserver' in window && !reduceMotion
  ? new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
  : null;
$$('.reveal').forEach(el => revealIO ? revealIO.observe(el) : el.classList.add('is-in'));

/* ---------- Счётчики в hero ---------- */
function countUp(el) {
  const target = +el.dataset.count;
  if (reduceMotion) { el.textContent = fmt(target); return; }
  const t0 = performance.now(), dur = 1800;
  const tick = t => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(target * e);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
setTimeout(() => $$('[data-count]').forEach(countUp), 500);

/* ---------- Меню: скрытие при скролле, активный пункт ---------- */
const header = $('.header');
let lastY = 0;
const navLinks = $$('.nav__links a');
const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);

/* ---------- Параллакс ---------- */
const parallaxEls = $$('[data-parallax]');

let ticking = false;
function onScroll() {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 40);
  header.classList.toggle('is-hidden', y > 600 && y > lastY && !document.body.classList.contains('menu-open'));
  lastY = y;

  const mid = y + innerHeight * 0.4;
  let current = null;
  sections.forEach(s => { if (s.offsetTop <= mid) current = s.id; });
  navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current));

  if (!reduceMotion) {
    parallaxEls.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      const offset = (r.top + r.height / 2 - innerHeight / 2) * -speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  }
  ticking = false;
}
window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
onScroll();

/* ---------- Мобильное меню ---------- */
const burger = $('.burger'), mobileMenu = $('#mobile-menu');
function setMenu(open) {
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  document.body.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) { mobileMenu.hidden = false; requestAnimationFrame(() => mobileMenu.classList.add('is-open')); }
  else { mobileMenu.classList.remove('is-open'); setTimeout(() => { if (!mobileMenu.classList.contains('is-open')) mobileMenu.hidden = true; }, 500); }
}
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
$$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });

/* ---------- Жидкое стекло реагирует на курсор ---------- */
if (finePointer && !reduceMotion) {
  const glow = $('.cursor-glow');
  let raf = null, px = 0, py = 0;
  window.addEventListener('pointermove', e => {
    px = e.clientX; py = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      glow.style.setProperty('--cx', px + 'px');
      glow.style.setProperty('--cy', py + 'px');
      raf = null;
    });
  }, { passive: true });

  $$('.glass').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty('--mx', x.toFixed(1) + '%');
      el.style.setProperty('--my', y.toFixed(1) + '%');
      el.style.setProperty('--angle', (x * 3.6).toFixed(0) + 'deg');
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '0%');
    });
  });

  /* лёгкий «магнит» для кнопок */
  $$('.btn--glass, .btn--gold').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / r.width;
      const dy = (e.clientY - r.top - r.height / 2) / r.height;
      btn.style.translate = `${(dx * 8).toFixed(1)}px ${(dy * 6).toFixed(1)}px`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
  });
}

/* ---------- Премиальные цвета: примерка в интерьере ---------- */
const stage = $('.colors__stage');
const swatches = $$('.swatch');
const colorSelect = $('#f-color');
let rollTimer;
function applySwatch(sw, { roll = true } = {}) {
  if (!sw || sw.classList.contains('is-active') && !roll) return;
  swatches.forEach(s => { const on = s === sw; s.classList.toggle('is-active', on); s.setAttribute('aria-checked', on); });
  const set = () => stage.style.setProperty('--swatch', sw.dataset.color);
  if (roll && !reduceMotion) {
    stage.classList.add('is-rolling');
    clearTimeout(rollTimer);
    rollTimer = setTimeout(() => { set(); stage.classList.remove('is-rolling'); }, 450);
  } else set();
  $('#color-name').textContent = sw.dataset.name;
  $('#color-code').textContent = sw.dataset.code;
  if (colorSelect) { colorSelect.value = sw.dataset.name; updateEstimate(); }
}
swatches.forEach(sw => {
  sw.addEventListener('click', () => applySwatch(sw));
  if (finePointer) sw.addEventListener('mouseenter', () => { if (!sw.classList.contains('is-active')) applySwatch(sw); });
});
/* стрелки по палитре (radiogroup) */
$('.swatches').addEventListener('keydown', e => {
  const i = swatches.findIndex(s => s.classList.contains('is-active'));
  let n = null;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % swatches.length;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + swatches.length) % swatches.length;
  if (n !== null) { e.preventDefault(); swatches[n].focus(); applySwatch(swatches[n]); }
});

/* ---------- Галерея + лайтбокс ---------- */
const lb = $('#lightbox');
const shots = $$('.shot');
let lbIndex = 0;
function openLb(i) {
  lbIndex = (i + shots.length) % shots.length;
  const s = shots[lbIndex], img = $('img', s);
  $('img', lb).src = s.dataset.full;
  $('img', lb).alt = img.alt;
  $('.lightbox__cap', lb).textContent = $('span', s).textContent;
  if (!lb.open) lb.showModal();
}
if (lb && typeof lb.showModal === 'function') {
  shots.forEach((s, i) => s.addEventListener('click', () => openLb(i)));
  $('.lightbox__close', lb).addEventListener('click', () => lb.close());
  $('.lightbox__prev', lb).addEventListener('click', () => openLb(lbIndex - 1));
  $('.lightbox__next', lb).addEventListener('click', () => openLb(lbIndex + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') openLb(lbIndex + 1);
    if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
  });
}

/* ---------- Калькулятор ---------- */
const form = $('#lead-form');
const out = $('#estimate'), note = $('#estimate-note');
function calcPrice() {
  const product = $('#f-product').value;
  const w = parseFloat($('#f-width').value), h = parseFloat($('#f-height').value);
  const qty = Math.max(1, parseInt($('#f-qty').value, 10) || 1);
  if (!(w > 0 && h > 0)) return null;
  const area = Math.max(CALC_CONFIG.minArea, (w / 100) * (h / 100));
  const k = CALC_CONFIG.premiumColors[$('#f-color').value] || 1;
  let total = area * CALC_CONFIG.pricePerM2[product] * k * qty;
  if ($('#f-install').checked) total += CALC_CONFIG.installPerItem * qty;
  return { total, area, qty };
}
function updateEstimate() {
  const r = calcPrice();
  if (!r) { out.textContent = '— ' + CALC_CONFIG.currency; note.textContent = 'Укажите размеры окна'; return; }
  const s = CALC_CONFIG.rangeSpread;
  const lo = Math.round(r.total * (1 - s) / 100) * 100, hi = Math.round(r.total * (1 + s) / 100) * 100;
  out.textContent = `${fmt(lo)} – ${fmt(hi)} ${CALC_CONFIG.currency}`;
  note.textContent = `${r.qty} шт. · ${r.area.toFixed(2).replace('.', ',')} м² каждое. Точную цену назовём после замера.`;
  out.classList.remove('is-bump'); void out.offsetWidth; out.classList.add('is-bump');
  setTimeout(() => out.classList.remove('is-bump'), 300);
}
form.addEventListener('input', updateEstimate);
form.addEventListener('change', updateEstimate);
colorSelect.addEventListener('change', () => {
  const sw = swatches.find(s => s.dataset.name === colorSelect.value);
  if (sw) applySwatch(sw, { roll: false });
});

/* маска телефона +7 (XXX) XXX-XX-XX */
const phone = $('#f-phone');
phone.addEventListener('input', () => {
  let d = phone.value.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  let v = '+7';
  if (p[0]) v += ' (' + p[0];
  if (p[0].length === 3) v += ')';
  if (p[1]) v += ' ' + p[1];
  if (p[2]) v += '-' + p[2];
  if (p[3]) v += '-' + p[3];
  phone.value = d.length > 1 ? v : '';
});

function validate() {
  const rules = {
    'f-width': el => +el.value >= 30 && +el.value <= 600,
    'f-height': el => +el.value >= 30 && +el.value <= 400,
    'f-name': el => el.value.trim().length >= 2,
    'f-phone': el => el.value.replace(/\D/g, '').length === 11,
  };
  let ok = true, first = null;
  Object.entries(rules).forEach(([id, test]) => {
    const el = document.getElementById(id), good = test(el);
    el.closest('.field').classList.toggle('is-invalid', !good);
    el.setAttribute('aria-invalid', !good);
    if (!good) { ok = false; first = first || el; }
  });
  if (first) first.focus();
  return ok;
}
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validate()) return;
  const btn = $('button[type=submit]', form);
  btn.disabled = true; $('span', btn).textContent = 'Отправляем…';
  const fd = Object.fromEntries(new FormData(form));
  const r = calcPrice();
  const lead = {
    product: $('#f-product').selectedOptions[0].textContent,
    width: +fd.width, height: +fd.height, qty: +fd.qty || 1,
    color: fd.color, install: !!fd.install,
    name: fd.name.trim(), phone: fd.phone,
    estimate: r ? Math.round(r.total) : null,
    page: location.href, createdAt: new Date().toISOString(),
  };
  try {
    await sendLead(lead);
    $('.form__success', form).hidden = false;
  } catch (err) {
    alert('Не удалось отправить заявку. Позвоните нам: +7 (900) 000-00-00');
  } finally {
    btn.disabled = false; $('span', btn).textContent = 'Отправить заявку';
  }
});
$('#form-reset').addEventListener('click', () => {
  form.reset(); $('.form__success', form).hidden = true; updateEstimate();
});
form.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) f.classList.remove('is-invalid'); });

/* ---------- Год в футере ---------- */
$('#year').textContent = new Date().getFullYear();
