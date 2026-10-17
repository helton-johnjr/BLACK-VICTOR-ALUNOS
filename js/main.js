const ENDPOINT = 'COLE_AQUI_A_URL_DO_WEBHOOK'; // [FALTA] recebe e-mail + WhatsApp (POST JSON)
const GRUPO_VIP = ''; // [FALTA] link do Grupo Exclusivo de Alunos no WhatsApp (botão da página de obrigado)
const POLITICA_PRIVACIDADE = ''; // [FALTA] URL da política de privacidade (rodapé)
const REVELACAO = '2026-10-28T20:00:00-03:00'; // 28/10, 20h (Brasília) — encontro ao vivo no Zoom
const DESTINO_POS_REVELACAO = ''; // [FALTA] opcional: para onde mandar quem abrir a página depois das 20h de 28/10 (ex.: link do Zoom)
const DESTINO_SUCESSO = 'obrigado.html';
const ORIGEM = 'vd-bf26-captura-alunos';

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function urlSegura(valor) {
    if (typeof valor !== 'string' || !valor.trim()) return null;
    try {
      const u = new URL(valor, location.href);
      return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
    } catch (_) { return null; }
  }

  // Gancho de eventos: não instala tracker. Com GTM/Pixel na página, repassa.
  function track(nome, detalhe = {}) {
    const payload = Object.assign({ event: nome }, detalhe);
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
  }

  /* 1. UTMs da visita (guardadas na sessão, como nas LPs das trilhas) ---------- */
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'fbclid', 'gclid', 'sck', 'src'];
  const params = new URLSearchParams(location.search);
  let utms = {};
  try { utms = JSON.parse(sessionStorage.getItem('lp_utms') || '{}') || {}; } catch (_) { utms = {}; }
  UTM_KEYS.forEach((k) => { const v = params.get(k); if (v) utms[k] = v; });
  try { sessionStorage.setItem('lp_utms', JSON.stringify(utms)); } catch (_) { /* navegação privada */ }

  /* 2. Contador para a revelação (data fixa: não reinicia ao recarregar) ------- */
  const ALVO = new Date(REVELACAO).getTime();
  let contadorId = null;

  function renderContador() {
    const ms = Math.max(0, ALVO - Date.now());
    const t = {
      d: Math.floor(ms / 86400000),
      h: Math.floor(ms / 3600000) % 24,
      m: Math.floor(ms / 60000) % 60,
      s: Math.floor(ms / 1000) % 60,
    };
    $$('[data-countdown] [data-cd]').forEach((slot) => {
      const v = String(t[slot.dataset.cd]).padStart(2, '0');
      if (slot.textContent !== v) slot.textContent = v;
    });
    if (ms > 0) return true;

    $$('[data-countdown-wrap]').forEach((wrap) => {
      $$('[data-cd-running]', wrap).forEach((el) => { el.hidden = true; });
      $$('[data-cd-done]', wrap).forEach((el) => { el.hidden = false; });
    });
    clearInterval(contadorId);
    const destino = urlSegura(DESTINO_POS_REVELACAO);
    if (destino) location.replace(destino);
    return false;
  }

  /* 3. Reveal no scroll --------------------------------------------------------- */
  function iniciarReveal() {
    const itens = $$('.reveal');
    if (reduzMovimento || !('IntersectionObserver' in window)) {
      itens.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    itens.forEach((el) => io.observe(el));
  }

  /* 4. Formulário --------------------------------------------------------------- */
  const MENSAGENS = {
    email: 'Confere o e-mail? Parece que falta alguma coisa.',
    whatsapp: 'Digite o WhatsApp com DDD: (61) 91234-5678.',
    envio: 'Não consegui enviar agora. Tenta de novo em instantes.',
    semEndpoint: 'Formulário ainda não conectado. [FALTA: ENDPOINT no js/main.js]',
  };

  function digitosWhatsApp(valor) {
    let d = valor.replace(/\D/g, '');
    if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
    return d.slice(0, 11);
  }
  function mascararWhatsApp(valor) {
    const d = digitosWhatsApp(valor);
    if (!d) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  function whatsappValido(v) {
    const d = digitosWhatsApp(v);
    const ddd = Number(d.slice(0, 2));
    return d.length === 11 && ddd >= 11 && ddd <= 99 && d[2] === '9';
  }
  function marcarErro(input, msg) {
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const erro = document.getElementById(input.getAttribute('aria-describedby'));
    if (erro) erro.textContent = msg || '';
  }

  function iniciarFormulario(form) {
    const card = form.closest('[data-form-card]');
    const email = $('[name="email"]', form);
    const whatsapp = $('[name="whatsapp"]', form);
    const honeypot = $('[name="website"]', form);
    const botao = $('[data-submit]', form);
    const rotulo = $('[data-submit-label]', form);
    const status = $('[data-status]', form);
    const sucesso = $('[data-success]', card);
    const textoBotao = rotulo.textContent;

    whatsapp.addEventListener('input', () => {
      whatsapp.value = mascararWhatsApp(whatsapp.value);
      if (whatsapp.getAttribute('aria-invalid') === 'true' && whatsappValido(whatsapp.value)) marcarErro(whatsapp, '');
    });
    email.addEventListener('input', () => {
      if (email.getAttribute('aria-invalid') === 'true' && emailValido(email.value)) marcarErro(email, '');
    });
    email.addEventListener('blur', () => { if (email.value.trim()) marcarErro(email, emailValido(email.value) ? '' : MENSAGENS.email); });
    whatsapp.addEventListener('blur', () => { if (whatsapp.value) marcarErro(whatsapp, whatsappValido(whatsapp.value) ? '' : MENSAGENS.whatsapp); });

    function destravar() {
      botao.disabled = false;
      botao.removeAttribute('aria-busy');
      rotulo.textContent = textoBotao;
    }

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (botao.disabled) return;
      status.textContent = '';

      const okEmail = emailValido(email.value);
      const okWhats = whatsappValido(whatsapp.value);
      marcarErro(email, okEmail ? '' : MENSAGENS.email);
      marcarErro(whatsapp, okWhats ? '' : MENSAGENS.whatsapp);
      if (!okEmail) { email.focus(); return; }
      if (!okWhats) { whatsapp.focus(); return; }
      if (honeypot && honeypot.value) return;

      const endpoint = /^https?:\/\//i.test(ENDPOINT) ? urlSegura(ENDPOINT) : null;
      if (!endpoint) { status.textContent = MENSAGENS.semEndpoint; return; }

      botao.disabled = true;
      botao.setAttribute('aria-busy', 'true');
      rotulo.textContent = 'Enviando…';

      const payload = Object.assign({
        email: email.value.trim(),
        whatsapp: `55${digitosWhatsApp(whatsapp.value)}`,
        origem: ORIGEM,
        url: location.href,
        enviado_em: new Date().toISOString(),
      }, utms);

      const controle = new AbortController();
      const limite = setTimeout(() => controle.abort(), 15000);
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controle.signal,
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        form.hidden = true;
        sucesso.hidden = false;
        $('[data-success-title]', sucesso).focus({ preventScroll: true });
        track('lead', { origem: ORIGEM });
        if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
        setTimeout(() => { location.href = DESTINO_SUCESSO; }, 1200);
      } catch (_) {
        status.textContent = MENSAGENS.envio;
        destravar();
      } finally {
        clearTimeout(limite);
      }
    });
  }

  /* 5. Todo botão leva ao formulário da dobra 1 --------------------------------- */
  function iniciarAncoras() {
    const card = document.getElementById('form-hero');
    if (!card) return;
    $$('[data-to-form]').forEach((a) => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        card.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth', block: 'center' });
        const email = $('[name="email"]', card);
        if (email && !email.closest('form').hidden) {
          setTimeout(() => email.focus({ preventScroll: true }), reduzMovimento ? 0 : 600);
        }
      });
    });
  }

  /* 6. CTA fixo no celular: aparece sempre que o botão do formulário não está na tela
        (inclusive na abertura, se ele ficar abaixo da dobra) e some no CTA final ---- */
  function iniciarCtaFixo() {
    const barra = $('[data-sticky-cta]');
    const cardHero = document.getElementById('form-hero');
    const botaoForm = cardHero && $('[data-submit]', cardHero);
    const ctaFinal = document.getElementById('cta-final');
    if (!barra || !botaoForm || !('IntersectionObserver' in window)) return;
    const estado = { formNaTela: true, finalNaTela: false };
    const atualizar = () => {
      const enviado = $('[data-form]', cardHero).hidden;
      const mostrar = !enviado && !estado.formNaTela && !estado.finalNaTela;
      barra.classList.toggle('is-visible', mostrar);
      barra.inert = !mostrar;
      barra.setAttribute('aria-hidden', String(!mostrar));
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === botaoForm) estado.formNaTela = e.isIntersecting;
        else estado.finalNaTela = e.isIntersecting;
      });
      atualizar();
    });
    io.observe(botaoForm);
    if (ctaFinal) io.observe(ctaFinal);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if ($('[data-countdown]') && renderContador()) contadorId = setInterval(renderContador, 1000);

    const grupo = urlSegura(GRUPO_VIP);
    $$('[data-group-link]').forEach((a) => {
      if (grupo) {
        a.href = grupo;
        a.addEventListener('click', () => track('grupo_vip_click', { origem: ORIGEM }));
      } else {
        a.setAttribute('aria-disabled', 'true');
        a.title = '[FALTA: link do Grupo Exclusivo no js/main.js]';
        a.addEventListener('click', (ev) => ev.preventDefault());
      }
    });

    const politica = urlSegura(POLITICA_PRIVACIDADE);
    $$('[data-privacy]').forEach((a) => {
      if (!politica) return;
      a.href = politica; a.target = '_blank'; a.rel = 'noopener'; a.hidden = false;
    });

    $$('[data-form]').forEach(iniciarFormulario);
    iniciarAncoras();
    iniciarReveal();
    iniciarCtaFixo();
  });
})();
