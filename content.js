/**
 * AI Search Ads - Content Script for ChatGPT & Google Gemini
 * Detects prompt submissions, sends search event to background, displays reward notification & sponsored ad.
 * Ad appears as an inline banner at the top of the visible chat area.
 */

(function () {
  let lastSearchTime = 0;
  let activeToast = null;
  let isProcessing = false;
  let currentAdBanner = null;

  const isChatGPT = window.location.hostname.includes("chatgpt.com") || window.location.hostname.includes("openai.com");
  const isGemini = window.location.hostname.includes("gemini.google.com");
  const currentPlatform = isChatGPT ? "chatgpt" : isGemini ? "gemini" : "ai";

  console.log(`[AI Search Ads] Active on ${currentPlatform}. Ready to reward searches.`);

  // Create isolated container for our UI
  let rootContainer = document.getElementById("ai-ads-root");
  if (!rootContainer) {
    rootContainer = document.createElement("div");
    rootContainer.id = "ai-ads-root";
    document.body.appendChild(rootContainer);
  }

  /**
   * Reads current text from the active input or recently submitted prompt
   */
  function extractPromptText() {
    let text = "";

    if (isChatGPT) {
      const textarea = document.querySelector("#prompt-textarea") ||
                       document.querySelector("textarea[data-id='root']") ||
                       document.querySelector("div[contenteditable='true']");
      if (textarea) {
        text = textarea.value || textarea.innerText || "";
      }

      if (!text.trim()) {
        const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
        if (userMessages.length > 0) {
          text = userMessages[userMessages.length - 1].innerText || "";
        }
      }
    } else if (isGemini) {
      const qlEditor = document.querySelector(".ql-editor") ||
                       document.querySelector("rich-textarea div[contenteditable='true']") ||
                       document.querySelector("div[role='textbox']");
      if (qlEditor) {
        text = qlEditor.innerText || qlEditor.textContent || "";
      }

      if (!text.trim()) {
        const userQueries = document.querySelectorAll(".user-query-container, .query-text, user-query");
        if (userQueries.length > 0) {
          text = userQueries[userQueries.length - 1].innerText || "";
        }
      }
    }

    return text.trim();
  }

  /**
   * Handles user submission event
   */
  async function handleSearchTriggered(fallbackQuery = "") {
    const now = Date.now();
    if (now - lastSearchTime < 2500 || isProcessing) {
      return;
    }

    let query = extractPromptText() || fallbackQuery;

    if (!query) {
      await new Promise(r => setTimeout(r, 300));
      query = extractPromptText() || fallbackQuery || "User Query";
    }

    lastSearchTime = now;
    isProcessing = true;

    try {
      if (!chrome.runtime?.id) {
        console.warn("[AI Search Ads] Extension reloaded. Please refresh the page.");
        return;
      }

      const response = await chrome.runtime.sendMessage({
        action: "RECORD_SEARCH",
        payload: {
          query,
          platform: currentPlatform,
          timestamp: new Date().toISOString()
        }
      });

      console.log("[AI Search Ads] Background response:", JSON.stringify(response));

      if (response && response.success) {
        // Earnings popup notification removed as requested; earnings still tracked in background and dashboard.
        if (response.ad) {
          console.log("[AI Search Ads] Ad received:", response.ad.title, "- injecting now");
          // Wait a moment for the response to start appearing, then show the ad
          setTimeout(() => showSponsoredAd(response.ad), 800);
        } else {
          console.warn("[AI Search Ads] No ad returned from background!");
        }
      }
    } catch (err) {
      console.warn("[AI Search Ads] Error communicating with background worker:", err);
    } finally {
      isProcessing = false;
    }
  }

  /**
   * Displays the reward toast notification (top-right, brief)
   */
  function showRewardToast(reward, newBalance) {
    if (activeToast) {
      activeToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = "ai-ads-toast";
    toast.innerHTML = `
      <div class="ai-ads-toast-icon">💰</div>
      <div class="ai-ads-toast-body">
        <div class="ai-ads-toast-title">+$${reward.toFixed(4)} Earned!</div>
        <div class="ai-ads-toast-desc">Current Balance: $${newBalance.toFixed(4)}</div>
      </div>
    `;

    rootContainer.appendChild(toast);
    activeToast = toast;

    setTimeout(() => {
      if (toast && toast.parentElement) {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }

  /**
   * Displays the sponsored ad as a banner pinned at the top of the chat content area.
   * Uses a reliable approach: finds the <main> element and prepends the ad inside it,
   * or falls back to a fixed-position bar just below the top navbar.
   */
  function showSponsoredAd(ad) {
    // Remove any previous ad banner
    if (currentAdBanner && currentAdBanner.parentElement) {
      currentAdBanner.remove();
    }
    document.querySelectorAll(".ai-ads-inline-banner").forEach(el => el.remove());

    const banner = document.createElement("div");
    banner.className = "ai-ads-inline-banner";
    banner.setAttribute("data-ai-ads", "true");

    banner.innerHTML = `
      <span class="ai-ads-inline-badge">Ad</span>
      <span class="ai-ads-inline-icon">${ad.icon || "🚀"}</span>
      <a href="${ad.url}" target="_blank" rel="noopener noreferrer" class="ai-ads-inline-title">${ad.title}</a>
      <span class="ai-ads-inline-sep">·</span>
      <a href="${ad.url}" target="_blank" rel="noopener noreferrer" class="ai-ads-inline-cta">${ad.cta || "Learn More"} →</a>
      <button class="ai-ads-inline-close" title="Close">✕</button>
    `;

    // STRATEGY: Use fixed positioning at the top of the viewport, below any navbar.
    // This is 100% reliable — doesn't depend on ChatGPT/Gemini's internal DOM structure.
    banner.style.cssText = `
      position: fixed;
      top: 52px;
      left: 50%;
      transform: translateX(-50%) translateY(-10px);
      width: calc(100% - 300px);
      max-width: 820px;
      z-index: 9999990;
      opacity: 0;
    `;

    document.body.appendChild(banner);
    currentAdBanner = banner;

    console.log("[AI Search Ads] ✅ Ad banner injected into DOM:", ad.title);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        banner.style.opacity = "1";
        banner.style.transform = "translateX(-50%) translateY(0)";
      });
    });

    // Close button
    const closeBtn = banner.querySelector(".ai-ads-inline-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        banner.style.opacity = "0";
        banner.style.transform = "translateX(-50%) translateY(-10px)";
        setTimeout(() => banner.remove(), 300);
        currentAdBanner = null;
      });
    }

    // Track clicks
    const links = banner.querySelectorAll(".ai-ads-inline-cta, .ai-ads-inline-title");
    links.forEach(link => {
      link.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          action: "RECORD_CLICK",
          payload: { adId: ad.id }
        });
      });
    });

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (banner && banner.parentElement) {
        banner.style.opacity = "0";
        banner.style.transform = "translateX(-50%) translateY(-10px)";
        setTimeout(() => {
          banner.remove();
          currentAdBanner = null;
        }, 300);
      }
    }, 30000);
  }

  // --- LISTENERS ---

  // 1. Enter key listener on inputs
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      const activeEl = document.activeElement;
      if (!activeEl) return;

      const isPromptInput =
        activeEl.id === "prompt-textarea" ||
        activeEl.getAttribute("data-id") === "root" ||
        activeEl.classList.contains("ql-editor") ||
        activeEl.getAttribute("contenteditable") === "true" ||
        activeEl.closest("rich-textarea") ||
        activeEl.closest("form");

      if (isPromptInput) {
        const queryText = activeEl.value || activeEl.innerText || "";
        if (queryText.trim().length > 1) {
          handleSearchTriggered(queryText.trim());
        }
      }
    }
  }, true);

  // 2. Click listener on send buttons
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target) return;

    const sendButton =
      target.closest('button[data-testid="send-button"]') ||
      target.closest('button[data-testid="fruitjuice-send-button"]') ||
      target.closest('button[aria-label*="Send" i]') ||
      target.closest('button[aria-label*="Submit" i]') ||
      target.closest('button.send-button') ||
      target.closest('.send-button-container') ||
      target.closest('form button[type="submit"]');

    if (sendButton) {
      handleSearchTriggered();
    }
  }, true);

  // 3. Form submit event
  document.addEventListener("submit", (e) => {
    handleSearchTriggered();
  }, true);

})();
