/**
 * AI Search Ads - Advertiser Portal Controller
 * Manages ad campaign creation, editing, live analytics, and interactive in-page previews.
 * Works seamlessly in both Chrome Extension environment and standalone Web environment.
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Determine API base: relative path if on web server, or absolute if in extension
  const API_BASE = (typeof window !== "undefined" && window.location.origin && window.location.origin.startsWith("http"))
    ? `${window.location.origin}/api`
    : "http://localhost:3000/api";

  let campaigns = [];
  let currentEditingId = null;

  // DOM Elements - Navigation & Views
  const navItems = document.querySelectorAll(".nav-item");
  const viewSections = document.querySelectorAll(".view-section");
  const pageTitle = document.getElementById("page-title");
  const pageDesc = document.getElementById("page-desc");
  const btnTopCreate = document.getElementById("btn-top-create");

  // Metrics Elements
  const metricActiveCount = document.getElementById("metric-active-count");
  const metricImpressions = document.getElementById("metric-impressions");
  const metricClicks = document.getElementById("metric-clicks");
  const metricBudget = document.getElementById("metric-budget");
  const metricSpent = document.getElementById("metric-spent");

  // Filter & Grid
  const campaignsContainer = document.getElementById("campaigns-container");
  const filterStatus = document.getElementById("filter-status");

  // Form Elements
  const adCreateForm = document.getElementById("ad-create-form");
  const formAdId = document.getElementById("form-ad-id");
  const adCompany = document.getElementById("ad-company");
  const adIcon = document.getElementById("ad-icon");
  const adTitle = document.getElementById("ad-title");
  const adDescription = document.getElementById("ad-description");
  const adCta = document.getElementById("ad-cta");
  const adUrl = document.getElementById("ad-url");
  const adCategory = document.getElementById("ad-category");
  const adPlatform = document.getElementById("ad-platform");
  const adKeywords = document.getElementById("ad-keywords");
  const adBudget = document.getElementById("ad-budget");
  const btnCancelCreate = document.getElementById("btn-cancel-create");
  const btnSaveAd = document.getElementById("btn-save-ad");

  // Live Preview Elements
  const livePreviewIcon = document.getElementById("live-preview-icon");
  const livePreviewCompany = document.getElementById("live-preview-company");
  const livePreviewTitle = document.getElementById("live-preview-title");
  const livePreviewDesc = document.getElementById("live-preview-desc");
  const livePreviewCta = document.getElementById("live-preview-cta");

  // View Navigation
  function switchView(viewId) {
    navItems.forEach(item => {
      if (item.dataset.view === viewId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    viewSections.forEach(section => {
      if (section.id === viewId) {
        section.classList.add("active");
      } else {
        section.classList.remove("active");
      }
    });

    // Update Titles
    if (viewId === "view-campaigns") {
      pageTitle.innerText = "Active Ad Campaigns";
      pageDesc.innerText = "List and manage sponsored placements shown during ChatGPT and Gemini searches.";
    } else if (viewId === "view-create") {
      pageTitle.innerText = currentEditingId ? "Edit Ad Campaign" : "List New Ad Campaign";
      pageDesc.innerText = "Configure headlines, keywords, and budget for your AI search ad.";
    } else if (viewId === "view-preview") {
      pageTitle.innerText = "Live Search Preview";
      pageDesc.innerText = "See how your ad appears inside ChatGPT and Gemini conversations.";
    } else if (viewId === "view-requests") {
      pageTitle.innerText = "Advertising Requests";
      pageDesc.innerText = "Review incoming ad inquiries from businesses and import them directly into campaigns.";
      loadInquiries();
    } else if (viewId === "view-docs") {
      pageTitle.innerText = "Advertiser Guidelines";
      pageDesc.innerText = "Learn how AI search targeting and micropayment rewards operate.";
    }
  }

  navItems.forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  btnTopCreate.addEventListener("click", () => {
    resetForm();
    switchView("view-create");
  });

  btnCancelCreate.addEventListener("click", () => {
    resetForm();
    switchView("view-campaigns");
  });

  /**
   * Safe storage helper (works in web and extension)
   */
  async function saveToLocalCache(cList) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      try {
        await chrome.storage.local.set({ campaigns: cList });
      } catch (e) {
        console.warn("Chrome storage error:", e);
      }
    } else if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("ai_ads_campaigns", JSON.stringify(cList));
      } catch (e) {}
    }
  }

  async function getFromLocalCache() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      try {
        const data = await chrome.storage.local.get(["campaigns"]);
        if (data && data.campaigns && data.campaigns.length > 0) {
          return data.campaigns;
        }
      } catch (e) {}
    } else if (typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem("ai_ads_campaigns");
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  }

  /**
   * Load campaigns from backend API or local fallback
   */
  async function loadData() {
    try {
      const res = await fetch(`${API_BASE}/advertiser/campaigns`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.campaigns && json.campaigns.length > 0) {
          campaigns = json.campaigns;
          await saveToLocalCache(campaigns);
          updateMetrics();
          renderCampaigns();
          return;
        }
      }
    } catch (e) {
      console.warn("Backend API unreachable, using local cache:", e.message);
    }

    const cached = await getFromLocalCache();
    campaigns = cached || (typeof DEFAULT_CAMPAIGNS !== 'undefined' ? DEFAULT_CAMPAIGNS : []);
    updateMetrics();
    renderCampaigns();
  }

  /**
   * Calculate and update global dashboard metrics
   */
  function updateMetrics() {
    const activeList = campaigns.filter(c => c.status === "active");
    metricActiveCount.innerText = activeList.length;

    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
    metricImpressions.innerText = totalImpressions.toLocaleString();

    const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
    metricClicks.innerText = totalClicks.toLocaleString();

    const totalBudget = campaigns.reduce((acc, c) => acc + (parseFloat(c.budget) || 0), 0);
    metricBudget.innerText = `$${totalBudget.toFixed(2)}`;

    const totalSpent = campaigns.reduce((acc, c) => acc + (parseFloat(c.spent) || 0), 0);
    metricSpent.innerText = `Spent: $${totalSpent.toFixed(4)}`;
  }

  /**
   * Render campaign cards in grid
   */
  function renderCampaigns() {
    const filter = filterStatus.value;
    const filtered = campaigns.filter(c => {
      if (filter === "active") return c.status === "active";
      if (filter === "paused") return c.status === "paused";
      if (filter === "completed") return c.status === "completed";
      return true;
    });

    if (filtered.length === 0) {
      campaignsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b; background: #0f172a; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
          <h3>No campaigns found</h3>
          <p style="margin-top: 8px;">Create your first campaign to begin advertising on ChatGPT & Gemini.</p>
        </div>
      `;
      return;
    }

    campaignsContainer.innerHTML = filtered.map(c => {
      const ctr = (c.impressions && c.impressions > 0)
        ? ((c.clicks || 0) / c.impressions * 100).toFixed(1)
        : "0.0";

      const keywords = (c.keywords || []).map(k => `<span class="keyword-badge">${escapeHtml(k)}</span>`).join("");
      const isCompleted = c.status === "completed";
      const statusClass = isCompleted ? "completed" : (c.status === "active" ? "active" : "paused");
      const statusText = isCompleted ? "✓ Completed" : (c.status === "active" ? "● Active" : "⏸ Paused");
      const toggleActionText = isCompleted ? "Reactivate" : (c.status === "active" ? "Pause" : "Resume");
      const completeBtnText = isCompleted ? "Re-open" : "Mark Completed";

      const iconMarkup = (c.icon && (c.icon.startsWith("data:") || c.icon.includes("/") || c.icon.includes(".jpeg") || c.icon.includes(".jpg") || c.icon.includes(".png")))
        ? `<img src="${c.icon}" style="width:28px;height:28px;border-radius:6px;object-fit:cover;" alt="logo" />`
        : (c.icon || "🚀");

      return `
        <div class="ad-campaign-card" data-id="${c.id}">
          <div class="ad-card-top">
            <div class="ad-card-company">
              <div class="ad-card-icon">${iconMarkup}</div>
              <div class="ad-card-names">
                <h4>${escapeHtml(c.company)}</h4>
                <span>${escapeHtml(c.category || "General")} • ${c.platform === "all" ? "ChatGPT & Gemini" : c.platform}</span>
              </div>
            </div>
            <span class="status-tag ${statusClass}">${statusText}</span>
          </div>

          <div class="ad-card-headline">${escapeHtml(c.title)}</div>
          <div class="ad-card-body">${escapeHtml(c.description)}</div>

          <div class="ad-keywords-list">
            ${keywords}
          </div>

          <div class="ad-stats-bar">
            <div class="ad-stat-box">
              <strong>${(c.impressions || 0).toLocaleString()}</strong>
              <span>Impressions</span>
            </div>
            <div class="ad-stat-box">
              <strong>${(c.clicks || 0).toLocaleString()}</strong>
              <span>Clicks (${ctr}%)</span>
            </div>
            <div class="ad-stat-box">
              <strong>$${(c.spent || 0).toFixed(2)}</strong>
              <span>Spent of $${(c.budget || 0).toFixed(2)}</span>
            </div>
          </div>

          <div class="ad-card-actions">
            <button class="btn-card-action btn-toggle-status" data-id="${c.id}">${toggleActionText}</button>
            <button class="btn-card-action btn-mark-complete" data-id="${c.id}" data-current="${c.status}" style="color: #10b981;">${completeBtnText}</button>
            <button class="btn-card-action btn-edit-ad" data-id="${c.id}">Edit</button>
            <button class="btn-card-action danger btn-delete-ad" data-id="${c.id}">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    attachCardEventListeners();
  }

  function attachCardEventListeners() {
    // Toggle Active / Paused
    document.querySelectorAll(".btn-toggle-status").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        try {
          await fetch(`${API_BASE}/advertiser/campaign/${id}/toggle`, { method: "PATCH" });
        } catch (err) {}

        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
          try {
            await chrome.runtime.sendMessage({ action: "TOGGLE_CAMPAIGN_STATUS", payload: { id } });
          } catch (err) {}
        }
        await loadData();
      });
    });

    // Mark Campaign Completed / Active
    document.querySelectorAll(".btn-mark-complete").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const current = e.target.dataset.current;
        const nextStatus = current === "completed" ? "active" : "completed";
        try {
          await fetch(`${API_BASE}/advertiser/campaign/${id}/toggle`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus })
          });
        } catch (err) {}

        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
          try {
            await chrome.runtime.sendMessage({ action: "TOGGLE_CAMPAIGN_STATUS", payload: { id, status: nextStatus } });
          } catch (err) {}
        }
        await loadData();
      });
    });

    // Edit Ad
    document.querySelectorAll(".btn-edit-ad").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        const target = campaigns.find(c => c.id === id);
        if (target) {
          populateFormForEdit(target);
          switchView("view-create");
        }
      });
    });

    // Delete Ad
    document.querySelectorAll(".btn-delete-ad").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (confirm("Are you sure you want to delete this ad campaign?")) {
          try {
            await fetch(`${API_BASE}/advertiser/campaign/${id}`, { method: "DELETE" });
          } catch (err) {}

          if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
            try {
              await chrome.runtime.sendMessage({ action: "DELETE_CAMPAIGN", payload: { id } });
            } catch (err) {}
          }
          await loadData();
        }
      });
    });
  }

  filterStatus.addEventListener("change", renderCampaigns);

  /**
   * Form population & Live preview syncing
   */
  function populateFormForEdit(ad) {
    currentEditingId = ad.id;
    formAdId.value = ad.id;
    adCompany.value = ad.company || "";
    adIcon.value = ad.icon || "🚀";
    adTitle.value = ad.title || "";
    adDescription.value = ad.description || "";
    adCta.value = ad.cta || "Try Free";
    adUrl.value = ad.url || "";
    adCategory.value = ad.category || "Developer Tools";
    adPlatform.value = ad.platform || "all";
    adKeywords.value = (ad.keywords || []).join(", ");
    adBudget.value = ad.budget || 50.00;
    btnSaveAd.innerText = "💾 Update Ad Campaign";
    updateLivePreview();
  }

  function resetForm() {
    currentEditingId = null;
    formAdId.value = "";
    adCreateForm.reset();
    adIcon.value = "🚀";
    adBudget.value = "50.00";
    btnSaveAd.innerText = "🚀 Publish Ad Campaign";
    updateLivePreview();
  }

  function updateLivePreview() {
    const val = (adIcon.value || "").trim();
    if (val.startsWith("data:") || val.includes("/") || val.includes(".jpeg") || val.includes(".jpg") || val.includes(".png")) {
      livePreviewIcon.innerHTML = `<img src="${val}" alt="Logo" style="width:26px; height:26px; border-radius:6px; object-fit:cover; display:inline-block; vertical-align:middle;" />`;
    } else {
      livePreviewIcon.innerText = val || "🚀";
    }
    livePreviewCompany.innerText = adCompany.value || "Your Brand";
    livePreviewTitle.innerText = adTitle.value || "Compelling Ad Headline";
    livePreviewDesc.innerText = adDescription.value || "Clear value proposition highlighting your special product or service.";
    livePreviewCta.innerText = `${adCta.value || "Try Free"} →`;
  }

  // Live input sync to preview
  [adCompany, adIcon, adTitle, adDescription, adCta].forEach(input => {
    input.addEventListener("input", updateLivePreview);
  });

  /**
   * Submit Ad Form (Create or Update)
   */
  adCreateForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const keywordsArray = adKeywords.value
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);

    const campaignData = {
      id: formAdId.value || undefined,
      company: adCompany.value.trim(),
      icon: adIcon.value.trim() || "🚀",
      title: adTitle.value.trim(),
      description: adDescription.value.trim(),
      cta: adCta.value.trim(),
      url: adUrl.value.trim(),
      category: adCategory.value,
      platform: adPlatform.value,
      keywords: keywordsArray,
      budget: parseFloat(adBudget.value) || 50.00
    };

    btnSaveAd.disabled = true;
    btnSaveAd.innerText = "Saving Campaign...";

    try {
      // 1. Post to REST API directly
      const res = await fetch(`${API_BASE}/advertiser/campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData)
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      // 2. Also notify extension runtime if in extension context
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          await chrome.runtime.sendMessage({
            action: "SAVE_CAMPAIGN",
            payload: campaignData
          });
        } catch (err) {}
      }

      alert("🎉 Campaign published successfully! Your ad is now active in the search rotation.");

      // If this was imported from an inquiry, mark it as Imported
      if (adCreateForm.dataset.importedInquiryId) {
        await updateInquiryStatus(adCreateForm.dataset.importedInquiryId, "Imported");
        delete adCreateForm.dataset.importedInquiryId;
      }
      await loadData();
      resetForm();
      switchView("view-campaigns");
    } catch (err) {
      alert("Error saving campaign: " + err.message);
    } finally {
      btnSaveAd.disabled = false;
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  AD REQUESTS / INQUIRIES
  // ═══════════════════════════════════════════════════════════

  const requestsContainer = document.getElementById("requests-container");
  const btnRefreshRequests = document.getElementById("btn-refresh-requests");

  if (btnRefreshRequests) {
    btnRefreshRequests.addEventListener("click", loadInquiries);
  }

  async function loadInquiries() {
    if (!requestsContainer) return;
    requestsContainer.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b;"><h3>Loading...</h3></div>';

    try {
      let inquiries = [];
      let res = await fetch(`${API_BASE}/advertiser/inquiries`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        inquiries = json.inquiries || [];
      } else {
        // Fallback to /api/admin/database endpoint
        const adminKey = sessionStorage.getItem('adminKey') || 'admin123';
        const dbRes = await fetch(`${API_BASE}/admin/database?key=${encodeURIComponent(adminKey)}`, { credentials: 'include' });
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          inquiries = dbData.inquiries || [];
        } else {
          throw new Error("Unable to fetch inquiries from server");
        }
      }

      if (inquiries.length === 0) {
        requestsContainer.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b;background:#0f172a;border-radius:12px;border:1px dashed rgba(255,255,255,0.1);">
            <h3>No advertising requests yet</h3>
            <p style="margin-top:8px;">When businesses submit inquiries from the Advertise page, they will appear here.</p>
          </div>`;
        return;
      }

      requestsContainer.innerHTML = inquiries.map(inq => {
        const statusColor = inq.status === 'Pending Review' ? '#facc15'
          : inq.status === 'Imported' ? '#10b981'
          : inq.status === 'Rejected' ? '#f87171' : '#94a3b8';
        const statusBg = inq.status === 'Pending Review' ? 'rgba(234,179,8,0.12)'
          : inq.status === 'Imported' ? 'rgba(16,185,129,0.12)'
          : inq.status === 'Rejected' ? 'rgba(248,113,113,0.12)' : 'rgba(148,163,184,0.12)';

        const createdDate = inq.created_at ? new Date(inq.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'N/A';

        return `
          <div class="ad-campaign-card" style="position:relative;">
            <div class="ad-card-top">
              <div class="ad-card-company">
                <div class="ad-card-icon" style="font-size:1.3rem;">📬</div>
                <div class="ad-card-names">
                  <h4>${escapeHtml(inq.company)}</h4>
                  <span>${escapeHtml(inq.contact || '')} • ${escapeHtml(inq.email || '')}</span>
                </div>
              </div>
              <span class="status-tag" style="background:${statusBg};color:${statusColor};border:1px solid ${statusColor}33;">
                ${escapeHtml(inq.status || 'Pending Review')}
              </span>
            </div>

            <div class="ad-card-headline" style="margin-top:0.75rem;">
              <a href="${escapeHtml(inq.url)}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;text-decoration:none;word-break:break-all;">${escapeHtml(inq.url)}</a>
            </div>

            <div class="ad-stats-bar" style="margin-top:0.75rem;">
              <div class="ad-stat-box">
                <strong>${escapeHtml(inq.budget)}</strong>
                <span>Budget</span>
              </div>
              <div class="ad-stat-box">
                <strong>${inq.platform === 'all' ? 'Both' : escapeHtml(inq.platform)}</strong>
                <span>Platform</span>
              </div>
              <div class="ad-stat-box">
                <strong>${createdDate}</strong>
                <span>Submitted</span>
              </div>
            </div>

            ${inq.keywords ? '<div class="ad-keywords-list" style="margin-top:0.5rem;">' + inq.keywords.split(',').map(k => k.trim()).filter(k=>k).map(k => '<span class="keyword-badge">' + escapeHtml(k) + '</span>').join('') + '</div>' : ''}

            ${inq.goal ? '<div style="margin-top:0.75rem;padding:0.75rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;"><span style="font-size:0.75rem;color:#64748b;text-transform:uppercase;font-weight:600;">Campaign Goals</span><p style="color:#94a3b8;font-size:0.85rem;margin-top:0.25rem;line-height:1.5;">' + escapeHtml(inq.goal) + '</p></div>' : ''}

            <div class="ad-card-actions" style="margin-top:1rem;">
              <button class="btn-card-action btn-import-inquiry" data-inquiry-id="${inq.id}" data-company="${escapeHtml(inq.company)}" data-url="${escapeHtml(inq.url)}" data-platform="${escapeHtml(inq.platform || 'all')}" data-keywords="${escapeHtml(inq.keywords || '')}" data-goal="${escapeHtml(inq.goal || '')}" style="background:rgba(56,189,248,0.12);color:#38bdf8;border:1px solid rgba(56,189,248,0.3);font-weight:700;">
                🚀 Import to Campaign
              </button>
              ${inq.status !== 'Rejected' ? '<button class="btn-card-action btn-reject-inquiry" data-inquiry-id="' + inq.id + '" style="color:#f87171;">Reject</button>' : ''}
            </div>
          </div>`;
      }).join("");

      // Attach event listeners for import buttons
      document.querySelectorAll(".btn-import-inquiry").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const el = e.currentTarget;
          importInquiryToCampaign({
            id: el.dataset.inquiryId,
            company: el.dataset.company,
            url: el.dataset.url,
            platform: el.dataset.platform,
            keywords: el.dataset.keywords,
            goal: el.dataset.goal
          });
        });
      });

      // Attach event listeners for reject buttons
      document.querySelectorAll(".btn-reject-inquiry").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.currentTarget.dataset.inquiryId;
          if (confirm("Reject this advertising request?")) {
            await updateInquiryStatus(id, "Rejected");
            await loadInquiries();
          }
        });
      });

    } catch (err) {
      console.error("Failed to load inquiries:", err);
      requestsContainer.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:#f87171;background:rgba(248,113,113,0.06);border-radius:12px;border:1px solid rgba(248,113,113,0.2);">
          <h3>Failed to load requests</h3>
          <p style="margin-top:8px;">${err.message}</p>
        </div>`;
    }
  }

  function importInquiryToCampaign(inquiry) {
    // Reset form first
    resetForm();

    // Pre-fill company name
    adCompany.value = inquiry.company || "";

    // Pre-fill URL
    adUrl.value = inquiry.url || "";

    // Pre-fill platform
    if (inquiry.platform) {
      adPlatform.value = inquiry.platform;
    }

    // Pre-fill keywords
    if (inquiry.keywords) {
      adKeywords.value = inquiry.keywords;
    }

    // Pre-fill description from goal if available
    if (inquiry.goal) {
      adDescription.value = inquiry.goal;
    }

    // Auto-generate a title suggestion from company name
    adTitle.value = "Discover " + (inquiry.company || "Our Product");

    // Set default CTA
    adCta.value = "Learn More";

    // Update live preview
    updateLivePreview();

    // Mark form as import
    btnSaveAd.innerText = "🚀 Publish Imported Campaign";

    // Store inquiry id for status update after publishing
    adCreateForm.dataset.importedInquiryId = inquiry.id;

    // Switch to create view
    switchView("view-create");

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function updateInquiryStatus(inquiryId, status) {
    try {
      await fetch(`${API_BASE}/advertiser/inquiry/${inquiryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error("Failed to update inquiry status:", err);
    }
  }

    function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Check URL parameters (e.g. ?view=create)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("view") === "create") {
    switchView("view-create");
  }

  // Initial Load
  await loadData();
});
