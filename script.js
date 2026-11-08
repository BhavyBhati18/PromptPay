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
    const idx = Math.max(0, sibs.indexOf(el));
    el.style.setProperty("--d", (idx * 60) + "ms");
  });
  if ("IntersectionObserver" in window) {
    const revObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          revObs.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    reveals.forEach((el) => revObs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* stepper: rail fill to active step */
  const stepper = $("#stepper");
  if (stepper) {
    const steps = $$(".step-card", stepper);
    const fill = $("#stepper-fill");
    const setStep = (idx) => {
      steps.forEach((s, i) => {
        s.classList.toggle("is-active", i === idx);
        s.setAttribute("aria-pressed", i === idx ? "true" : "false");
      });
      if (fill) fill.style.setProperty("--p", (idx / (steps.length - 1) * 100).toFixed(1) + "%");
    };
    const timers = [];
    const cancelAuto = () => { timers.forEach(clearTimeout); timers.length = 0; };
    steps.forEach((s, i) => s.addEventListener("click", () => { cancelAuto(); setStep(i); }));
    setStep(0);
    if ("IntersectionObserver" in window) {
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

  /* hero demo: interactive multi-prompt typing loop */
  const SCENARIOS = [
    {
      prompt: "Compare three cheap cloud hosts for a side project",
      answer: "Here's a quick take: pick the one with the simplest deploy, a free tier you won't outgrow this month, and clear pricing. Want a table?",
      sponsorTag: "Sponsored",
      sponsorText: "DigitalOcean · Cloud & AI Hosting · link above the results",
      promptsAdded: 40
    },
    {
      prompt: "Best AI code editor with real-time autocompletion?",
      answer: "Cursor offers deep codebase indexing, multi-file edits, and instant terminal debugging with integrated AI models.",
      sponsorTag: "Live Sponsor",
      sponsorText: "Cursor AI · The AI Code Editor · Try Free",
      promptsAdded: 35
    },
    {
      prompt: "Where can I find curated backpacking trips for Spiti Valley?",
      answer: "Safarnamma offers curated high-altitude departures with verified local road captains, homestays, and 24/7 route support.",
      sponsorTag: "Verified Ad",
      sponsorText: "Safarnamma · Curated Group Trips & Backpacking Journeys",
      promptsAdded: 45
    },
    {
      prompt: "Top tools to fix grammar and polish technical documentation",
      answer: "Grammarly and Notion AI provide context-aware rewriting, active voice suggestions, and automatic technical term consistency.",
      sponsorTag: "Sponsored",
      sponsorText: "Grammarly · AI Writing Assistant for Developers",
      promptsAdded: 30
    }
  ];

  const RATE = 0.0003;
  const typeEl = $("#demo-type"), aiEl = $("#demo-ai"), aiTxt = $("#demo-ai-text");
  const sponsorEl = $("#demo-sponsor"), valEl = $("#demo-value"), sendEl = $("#demo-send");
  const burstEl = $("#demo-burst");
  const money = (n) => "$" + n.toFixed(4);

  function coinBurst(target, n) {
    if (!target) return;
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
    if (!typeEl || !aiEl || !valEl) return;
    const userEl = $(".demo-user");
    const sponsorTagEl = sponsorEl ? sponsorEl.querySelector(".demo-sponsor-tag") : null;
    const sponsorSpanEl = sponsorEl ? sponsorEl.querySelector("span:not(.demo-sponsor-tag)") : null;

    let scenarioIdx = 0;
    let accumulatedBalance = 0;

    while (true) {
      const cur = SCENARIOS[scenarioIdx % SCENARIOS.length];

      // Update sponsor text
      if (sponsorTagEl) sponsorTagEl.textContent = cur.sponsorTag;
      if (sponsorSpanEl) sponsorSpanEl.textContent = cur.sponsorText;

      // Reset states
      if (userEl) { userEl.classList.remove("done"); userEl.style.opacity = "0"; }
      aiEl.style.opacity = "0";
      aiEl.classList.remove("thinking");
      if (aiTxt) aiTxt.textContent = "";
      typeEl.textContent = "";
      if (sponsorEl) sponsorEl.classList.remove("show");
      valEl.classList.remove("tick");

      await sleep(500);

      // 1. User types prompt
      if (userEl) userEl.style.opacity = "1";
      for (let i = 1; i <= cur.prompt.length; i++) {
        typeEl.textContent = cur.prompt.slice(0, i);
        await sleep(32);
      }
      if (userEl) userEl.classList.add("done");
      await sleep(300);

      // 2. Press send button
      if (sendEl) sendEl.classList.add("press");
      await sleep(150);
      if (sendEl) sendEl.classList.remove("press");

      // 3. AI Thinking dots
      aiEl.style.opacity = "1";
      aiEl.classList.add("thinking");
      await sleep(800);
      aiEl.classList.remove("thinking");

      // 4. AI types response
      for (let i = 1; i <= cur.answer.length; i += 2) {
        if (aiTxt) aiTxt.textContent = cur.answer.slice(0, i);
        await sleep(14);
      }

      // 5. Sponsored placement reveals
      if (sponsorEl) sponsorEl.classList.add("show");
      await sleep(350);

      // 6. Balance increments with coin burst
      valEl.classList.add("tick");
      const targetBalance = accumulatedBalance + (RATE * cur.promptsAdded);
      const steps = cur.promptsAdded;
      for (let k = 1; k <= steps; k++) {
        const curVal = accumulatedBalance + (RATE * k);
        valEl.textContent = money(curVal);
        if (k % 8 === 0) coinBurst(burstEl, 4);
        await sleep(36);
      }
      accumulatedBalance = targetBalance;

      // Wrap around if it gets high
      if (accumulatedBalance > 0.10) {
        accumulatedBalance = 0;
      }

      // 7. Pause to let the user read
      await sleep(3000);

      // 8. Clean fade out before next scenario
      valEl.classList.remove("tick");
      if (userEl) userEl.style.opacity = "0";
      aiEl.style.opacity = "0";
      if (sponsorEl) sponsorEl.classList.remove("show");
      await sleep(600);

      scenarioIdx++;
    }
  }

  // Launch demo loop immediately
  if (typeEl) {
    demoLoop();
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

  /* card tilt: desktop only */
  if (fine) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });

    /* glow cursor follow */
    $$(".glow").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });

    /* magnetic buttons */
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.22;
        btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }
})();
