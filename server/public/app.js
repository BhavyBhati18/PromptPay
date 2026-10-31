/**
 * Public Website Controller
 * Interactive Earnings Projection Calculator and FAQ accordion logic.
 */

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
        faqItems.forEach(f => f.classList.remove("active"));
        if (!isActive) {
          item.classList.add("active");
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
