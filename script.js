/* ==========================================================
   Serene Moments by M&M — Shared JavaScript
   Navigation, transitions, reveal animations, tabs & forms
   ========================================================== */
'use strict';

const PHONE_INTL = '250780626870';
const EMAIL = 'serenemomentsrw@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
  initPageLoad();
  initHeader();
  initMobileNav();
  initActiveLink();
  initReveal();
  initTabs();
  initContactForm();
  initToTop();
  setYear();
});

/* ── Page curtain + smooth page transitions ── */
function initPageLoad() {
  requestAnimationFrame(() => document.body.classList.add('loaded'));
  // Restore if user navigates back (bfcache)
  window.addEventListener('pageshow', e => {
    if (e.persisted) document.body.classList.remove('leaving');
  });

  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    const isInternalPage = /^[\w-]+\.html(\?[^#]*)?(#.*)?$/.test(href);
    if (!isInternalPage || a.target === '_blank') return;
    a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(() => { window.location.href = href; }, 450);
    });
  });
}

/* ── Header background on scroll ── */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Mobile navigation ── */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  document.querySelectorAll('.nav-links a').forEach(a =>
    a.addEventListener('click', () => {
      document.body.classList.remove('nav-open');
      document.body.style.overflow = '';
    })
  );
}

/* ── Highlight current page in nav ── */
function initActiveLink() {
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach(a => {
    const target = a.getAttribute('href').split(/[?#]/)[0].toLowerCase();
    if (target === file) a.classList.add('active');
  });
}

/* ── Scroll reveal with automatic stagger ── */
function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  // Stagger siblings inside [data-stagger] containers
  document.querySelectorAll('[data-stagger]').forEach(group => {
    group.querySelectorAll(':scope > [data-reveal]').forEach((el, i) => {
      el.style.transitionDelay = `${i * 110}ms`;
    });
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  els.forEach(el => io.observe(el));
}

/* ── Services tabs (supports deep links like services.html#weddings) ── */
function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  if (!buttons.length) return;

  const activate = id => {
    const panel = document.getElementById(id);
    if (!panel) return false;
    buttons.forEach(b => {
      const on = b.dataset.tab === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === id));
    return true;
  };

  buttons.forEach(btn => btn.addEventListener('click', () => {
    activate(btn.dataset.tab);
    history.replaceState(null, '', '#' + btn.dataset.tab);
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }));

  const hash = location.hash.slice(1);
  if (hash && activate(hash)) {
    setTimeout(() => {
      const section = document.getElementById('event-services');
      if (section) window.scrollTo({ top: section.offsetTop - 80, behavior: 'smooth' });
    }, 600);
  }
}

/* ── Contact form: validates, then opens email or WhatsApp with details ── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // Preselect service from ?service=...
  const pre = new URLSearchParams(location.search).get('service');
  if (pre && form.service) {
    const opt = [...form.service.options].find(o => o.value === pre);
    if (opt) form.service.value = pre;
  }

  const rules = {
    name:    v => v.trim().length >= 2 || 'Please enter your full name.',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Please enter a valid email address.',
    service: v => v !== '' || 'Please choose a service.',
    message: v => v.trim().length >= 10 || 'Please share a few details about your request.'
  };

  const validate = field => {
    const rule = rules[field.name];
    if (!rule) return true;
    const result = rule(field.value);
    const wrap = field.closest('.field');
    const err = wrap.querySelector('.err');
    const ok = result === true;
    wrap.classList.toggle('invalid', !ok);
    if (err) err.textContent = ok ? '' : result;
    return ok;
  };

  Object.keys(rules).forEach(name => {
    const f = form.elements[name];
    if (f) f.addEventListener('blur', () => validate(f));
  });

  const buildMessage = () => {
    const d = new FormData(form);
    const serviceLabel = form.service.options[form.service.selectedIndex]?.text || '';
    return [
      `Hello Serene Moments by M&M,`,
      ``,
      `Name: ${d.get('name')}`,
      `Email: ${d.get('email')}`,
      d.get('phone') ? `Phone: ${d.get('phone')}` : null,
      `Service: ${serviceLabel}`,
      d.get('date') ? `Preferred date: ${d.get('date')}` : null,
      d.get('guests') ? `Number of participants: ${d.get('guests')}` : null,
      ``,
      `${d.get('message')}`
    ].filter(l => l !== null).join('\n');
  };

  const allValid = () => Object.keys(rules).map(n => validate(form.elements[n])).every(Boolean);
  const status = document.getElementById('form-status');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!allValid()) return;
    const subject = encodeURIComponent(`Enquiry: ${form.service.options[form.service.selectedIndex].text}`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${encodeURIComponent(buildMessage())}`;
    status.textContent = 'Your email app is opening with your enquiry ready to send. Thank you — we will get back to you shortly!';
    status.classList.add('show');
  });

  const wa = document.getElementById('send-whatsapp');
  if (wa) wa.addEventListener('click', () => {
    if (!allValid()) return;
    window.open(`https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(buildMessage())}`, '_blank', 'noopener');
    status.textContent = 'WhatsApp is opening with your enquiry. We look forward to chatting with you!';
    status.classList.add('show');
  });
}

/* ── Back to top ── */
function initToTop() {
  const btn = document.querySelector('.to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 600), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function setYear() {
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
}
