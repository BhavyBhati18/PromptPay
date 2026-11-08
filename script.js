/**
 * QueryPay theme v2: script.js
 * Part A is the site's original controller (calculator, FAQ, nav auth), unchanged in logic.
 * Part B is the v2 presentation layer: reveals, nav state, stepper, demo loop, tilt, coin burst.
 * Vanilla JS only. Everything degrades to the static page without it.
 */

/* ---------- Part A: original site logic ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const REWARD_RATE = 0.0003;
  const MIN_PAYOUT = 10.00;

  // Earnings Calculator Elements
  const searchSlider = document.getElementById("search-slider");
  const searchDisplay = document.getElementById("calc-search-display");
  const calcDaily = document.getElementById("calc-daily");
  const calcMonthly = document.getElementById("calc-monthly");
  const calcDaysToPayout = document.getElementById("calc-days-to-payout");

  function updateCalculator() {
    if (!searchSlider) return;
    const searches = parseInt(searchSlider.value, 10);
    searchDisplay.innerText = `${searches.toLocaleString()} prompts/day`;

    const daily = searches * REWARD_RATE;
    const monthly = daily * 30;
    const daysToPayout = Math.ceil(MIN_PAYOUT / daily);

    calcDaily.innerText = `$${daily >= 1 ? daily.toFixed(2) : daily.toFixed(3)}`;
    calcMonthly.innerText = `$${monthly.toFixed(2)}`;

    if (daysToPayout <= 1) {
      calcDaysToPayout.innerText = "Instant (1 Day)";
    } else if (daysToPayout < 365) {
      calcDaysToPayout.innerText = `${daysToPayout} Days`;
    } else {
      calcDaysToPayout.innerText = `${Math.round(daysToPayout / 30)} Months`;
    }
    // v2: fill the slider track to its value (presentation only)
    const min = +searchSlider.min, max = +searchSlider.max;
    searchSlider.style.setProperty("--p", ((searches - min) / (max - min) * 100).toFixed(2) + "%");
  }

  if (searchSlider) {
    searchSlider.addEventListener("input", updateCalculator);
    updateCalculator();
  }

  // FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const questionBtn = item.querySelector(".faq-question");
    if (questionBtn) {
      questionBtn.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        faqItems.forEach(f => {
          f.classList.remove("active");
          const q = f.querySelector(".faq-question");
          if (q) q.setAttribute("aria-expanded", "false");
        });
        if (!isActive) {
          item.classList.add("active");
          questionBtn.setAttribute("aria-expanded", "true");
        }
      });
    }
  });

  // Check auth state for nav buttons
  checkNavAuth();
});

async function checkNavAuth() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (data.authenticated && data.user) {
      const loginBtn = document.getElementById('nav-login-btn');
      const registerBtn = document.getElementById('nav-register-btn');
      const dashBtn = document.getElementById('nav-dashboard-btn');
      if (loginBtn) loginBtn.style.display = 'none';
      if (registerBtn) registerBtn.style.display = 'none';
      if (dashBtn) {
        dashBtn.style.display = 'inline-flex';
        dashBtn.textContent = `${data.user.name.split(' ')[0]}'s Portal →`;
      }

      // Check if logged in user is admin
      const adminAds = document.getElementById('admin-nav-ads');
      const adminDb = document.getElementById('admin-nav-db');
      if (data.user.email && data.user.email.toLowerCase() === 'bhavy4018.21@gmail.com') {
        if (adminAds) adminAds.style.display = 'inline-block';
        if (adminDb) adminDb.style.display = 'inline-block';
      }
    }
  } catch (e) {}
}

/* ---------- Part B: v2 presentation layer ---------- */
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* scroll: progress bar, navbar shrink, active section link */
  const navbar = $(".navbar");
  const bar = $(".scroll-progress");
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.setProperty("--p", max > 0 ? (h.scrollTop / max).toFixed(4) : 0);
    if (navbar) navbar.classList.toggle("scrolled", h.scrollTop > 24);
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); }
  }, { passive: true });
  onScroll();

  const navMap = {};
  $$(".nav-links a[data-nav]").forEach((a) => (navMap[a.dataset.nav] = a));
  if ("IntersectionObserver" in window) {
    const secObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          Object.values(navMap).forEach((a) => a.classList.remove("is-active"));
          const a = navMap[e.target.id];
          if (a) a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(navMap).forEach((id) => { const s = document.getElementById(id); if (s) secObs.observe(s); });
  }

  /* reveals: staggered by sibling order */
  const reveals = $$(".reveal");
  reveals.forEach((el) => {
    const sibs = el.parentElement ? $$(":scope > .reveal", el.parentElement) : [];
    const i = Math.max(0, sibs.indexOf(el));
    el.style.setProperty("--d", Math.min(i, 6) * 90 + "ms");
  });
  if ("IntersectionObserver" in window && !reduce) {
    const revObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); revObs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => revObs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* stepper: clickable, with an animated rail that fills to the active step */
  const stepper = $("#stepper");
  if (stepper) {
    const steps = $$(".step-card", stepper);
    const setStep = (idx) => {
      steps.forEach((s, i) => {
        const on = i === idx;
        s.classList.toggle("is-active", on);
        s.classList.toggle("done", i < idx);
        s.setAttribute("aria-pressed", on ? "true" : "false");
      });
      const fill = idx / (steps.length - 1);
      const f = $("#stepper-fill");
      if (f) f.style.setProperty("--fill", fill.toFixed(3));
    };
    const timers = [];
    const cancelAuto = () => { timers.forEach(clearTimeout); timers.length = 0; };
    steps.forEach((s, i) => s.addEventListener("click", () => { cancelAuto(); setStep(i); }));
    setStep(0);
    if ("IntersectionObserver" in window && !reduce) {
      let played = false;
      const stObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !played) {
            played = true;
            timers.push(setTimeout(() => setStep(1), 500));
            timers.push(setTimeout(() => setStep(2), 1250));
            stObs.disconnect();
          }
        });
      }, { threshold: 0.45 });
      stObs.observe(stepper);
    } else {
      setStep(2);
    }
  }

  /* hero demo: typed prompt -> answer -> sponsor slot -> illustrative ticker */
  const PROMPT = "Compare three cheap cloud hosts for a side project";
  const ANSWER = "Here's a quick take: pick the one with the simplest deploy, a free tier you won't outgrow this month, and clear pricing. Want a table?";
  const RATE = 0.0003;          // the site's own per-prompt rate (calculator)
  const PROMPTS = 40;           // illustrative count for one loop
  const typeEl = $("#demo-type"), aiEl = $("#demo-ai"), aiTxt = $("#demo-ai-text");
  const sponsorEl = $("#demo-sponsor"), valEl = $("#demo-value"), sendEl = $("#demo-send");
  const burstEl = $("#demo-burst");
  const money = (n) => "$" + n.toFixed(4);

  function coinBurst(target, n) {
    if (!target || reduce) return;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span");
      c.className = "burst-piece";
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 60;
      c.style.setProperty("--tx", Math.cos(a) * d + "px");
      c.style.setProperty("--ty", Math.sin(a) * d - 30 + "px");
      c.style.setProperty("--rot", (Math.random() * 540 - 270) + "deg");
      c.style.setProperty("--dur", (700 + Math.random() * 400) + "ms");
      c.style.position = "absolute"; c.style.left = "0"; c.style.top = "0";
      target.appendChild(c);
      setTimeout(() => c.remove(), 1200);
    }
  }

  async function demoLoop() {
    if (!typeEl) return;
    const userEl = $(".demo-user"), sponsorBox = sponsorEl;
    while (true) {
      userEl.classList.remove("done"); userEl.style.opacity = "0";
      aiEl.style.opacity = "0"; aiEl.classList.remove("thinking"); aiTxt.textContent = "";
      typeEl.textContent = ""; sponsorBox.classList.remove("show");
      valEl.textContent = money(0); valEl.classList.remove("tick");
      await sleep(600);
      userEl.style.opacity = "1";
      for (let i = 1; i <= PROMPT.length; i++) { typeEl.textContent = PROMPT.slice(0, i); await sleep(38); }
      userEl.classList.add("done");
      await sleep(350);
      sendEl.classList.add("press"); await sleep(140); sendEl.classList.remove("press");
      aiEl.style.opacity = "1"; aiEl.classList.add("thinking"); await sleep(900);
      aiEl.classList.remove("thinking");
      for (let i = 1; i <= ANSWER.length; i += 2) { aiTxt.textContent = ANSWER.slice(0, i); await sleep(16); }
      sponsorBox.classList.add("show");
      await sleep(400);
      valEl.classList.add("tick");
      for (let k = 1; k <= PROMPTS; k++) {
        valEl.textContent = money(RATE * k);
        if (k % 8 === 0) coinBurst(burstEl, 4);
        await sleep(42);
      }
      await sleep(2600);
      valEl.classList.remove("tick");
      userEl.style.opacity = "0"; aiEl.style.opacity = "0"; sponsorBox.classList.remove("show");
      await sleep(700);
    }
  }
  if (typeEl) {
    if (reduce) {
      typeEl.textContent = PROMPT; aiTxt.textContent = ANSWER; sponsorEl.classList.add("show");
      valEl.textContent = money(RATE * PROMPTS);
    } else {
      const demoObs = "IntersectionObserver" in window
        ? new IntersectionObserver((en) => { if (en[0].isIntersecting) { demoObs.disconnect(); demoLoop(); } }, { threshold: 0.3 })
        : null;
      if (demoObs) demoObs.observe($(".demo")); else demoLoop();
    }
  }

  /* coin burst on CTA click (navigation still happens) */
  $$(".burst-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const r = btn.getBoundingClientRect();
      const host = document.createElement("span");
      host.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:0;height:0;z-index:90;pointer-events:none`;
      document.body.appendChild(host);
      coinBurst(host, 22);
      setTimeout(() => host.remove(), 1300);
    });
  });

  /* desktop-only: tilt, glow-follow, magnetic buttons */
  if (fine && !reduce) {
    $$(".tilt, .tilt-soft").forEach((el) => {
      const max = el.classList.contains("tilt") ? 7 : 4;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        const rx = ((0.5 - y) * max).toFixed(2), ry = ((x - 0.5) * max).toFixed(2);
        el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
    $$(".glow").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left)).toFixed(0) + "px");
        el.style.setProperty("--my", ((e.clientY - r.top)).toFixed(0) + "px");
      });
    });
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--mgx", ((e.clientX - (r.left + r.width / 2)) * 0.18).toFixed(1) + "px");
        btn.style.setProperty("--mgy", ((e.clientY - (r.top + r.height / 2)) * 0.25).toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", () => { btn.style.setProperty("--mgx", "0px"); btn.style.setProperty("--mgy", "0px"); });
    });
  }
})();
