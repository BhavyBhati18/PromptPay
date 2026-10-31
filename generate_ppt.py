import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Color Palette (Dark SaaS Linear/Vercel Theme)
COLOR_BG = RGBColor(10, 15, 29)          # Deep Navy/Charcoal
COLOR_CARD = RGBColor(18, 25, 46)        # Card Background
COLOR_CYAN = RGBColor(56, 189, 248)      # Electric Cyan
COLOR_PURPLE = RGBColor(167, 139, 250)   # Soft Purple
COLOR_GREEN = RGBColor(52, 211, 153)     # Mint Green
COLOR_WHITE = RGBColor(241, 245, 249)    # Crisp White
COLOR_MUTED = RGBColor(148, 163, 184)    # Slate Gray
COLOR_BORDER = RGBColor(30, 41, 69)      # Subtle Border

def apply_background(slide):
    # Add dark background rectangle
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg.fill.solid()
    bg.fill.fore_color.rgb = COLOR_BG
    bg.line.color.rgb = COLOR_BG

def add_header(slide, tag, title):
    # Tag
    tx_tag = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.5), Inches(0.4))
    tf_tag = tx_tag.text_frame
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = tag.upper()
    p_tag.font.size = Pt(11)
    p_tag.font.bold = True
    p_tag.font.color.rgb = COLOR_CYAN

    # Title
    tx_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.5), Inches(0.8))
    tf_title = tx_title.text_frame
    p_title = tf_title.paragraphs[0]
    p_title.text = title
    p_title.font.size = Pt(28)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_WHITE

def add_card(slide, left, top, width, height, title, body_bullets, accent_color=COLOR_CYAN):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = COLOR_CARD
    card.line.color.rgb = COLOR_BORDER
    card.line.width = Pt(1)

    # Accent bar top
    bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, Inches(0.08))
    bar.fill.solid()
    bar.fill.fore_color.rgb = accent_color
    bar.line.fill.background()

    # Content
    tx = slide.shapes.add_textbox(left + Inches(0.3), top + Inches(0.2), width - Inches(0.6), height - Inches(0.3))
    tf = tx.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = title
    p0.font.size = Pt(17)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_WHITE
    p0.space_after = Pt(12)

    for item in body_bullets:
        p = tf.add_paragraph()
        p.text = "• " + item
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_MUTED
        p.space_after = Pt(8)

# ── SLIDE 1: TITLE SLIDE ──────────────────────────────────────────────────
s1 = prs.slides.add_slide(prs.slide_layouts[6])
apply_background(s1)

# Main Title Box
tbox = s1.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.3), Inches(3.0))
tf = tbox.text_frame
tf.word_wrap = True

p_badge = tf.paragraphs[0]
p_badge.text = "⚡ THE FUTURE OF SEARCH MONETIZATION"
p_badge.font.size = Pt(13)
p_badge.font.bold = True
p_badge.font.color.rgb = COLOR_CYAN
p_badge.space_after = Pt(14)

p_main = tf.add_paragraph()
p_main.text = "PayGpt"
p_main.font.size = Pt(56)
p_main.font.bold = True
p_main.font.color.rgb = COLOR_WHITE
p_main.space_after = Pt(14)

p_sub = tf.add_paragraph()
p_sub.text = "Monetizing 1.8 Billion Daily Prompts on ChatGPT & Google Gemini"
p_sub.font.size = Pt(22)
p_sub.font.color.rgb = COLOR_MUTED
p_sub.space_after = Pt(20)

p_sub2 = tf.add_paragraph()
p_sub2.text = "Investor Pitch Deck  |  Seed Round Opportunity  |  2026"
p_sub2.font.size = Pt(13)
p_sub2.font.color.rgb = COLOR_PURPLE

# ── SLIDE 2: THE PROBLEM ──────────────────────────────────────────────────
s2 = prs.slides.add_slide(prs.slide_layouts[6])
apply_background(s2)
add_header(s2, "The Market Shift", "The Death of Google Search & The AI Blindspot")

add_card(s2, Inches(0.8), Inches(2.0), Inches(3.6), Inches(4.7), 
         "Search Behavior Changed", 
         ["Users no longer click 10 blue links on Google.",
          "Over 1.8B daily questions are typed directly into ChatGPT & Gemini.",
          "High intent: users are actively searching for solutions, tools, and code.",
          "Conversational search is replacing traditional SEO."],
         COLOR_CYAN)

add_card(s2, Inches(4.8), Inches(2.0), Inches(3.6), Inches(4.7), 
         "Zero Monetization Layer", 
         ["Generative AI engines have no native ad infrastructure.",
          "OpenAI and Google do not offer direct sponsored listings inside chats.",
          "Companies are losing their #1 customer acquisition channel.",
          "Ad spending has no home in the generative AI era."],
         COLOR_PURPLE)

add_card(s2, Inches(8.8), Inches(2.0), Inches(3.6), Inches(4.7), 
         "The User Burnout", 
         ["Users are flooded with spam, paywalls, and annoying pop-ups elsewhere.",
          "Users receive zero financial reward for generating valuable intent data.",
          "Ad-blocker usage is at an all-time high of 42% worldwide.",
          "Consumers demand privacy and non-disruptive experiences."],
         COLOR_GREEN)

# ── SLIDE 3: THE SOLUTION ────────────────────────────────────────────────
s3 = prs.slides.add_slide(prs.slide_layouts[6])
apply_background(s3)
add_header(s3, "Our Solution", "PayGpt: The Universal AI Search Monetization Layer")

add_card(s3, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), 
         "For Internet Users: Earn As You Ask", 
         ["Sleek Chrome extension works seamlessly across ChatGPT & Google Gemini.",
          "Earns $0.0003 instantly per prompt without changing daily workflows.",
          "Real-time wallet balance, instant withdrawal requests to PayPal / Bank.",
          "100% passive, zero friction, and zero impact on AI response accuracy."],
         COLOR_CYAN)

add_card(s3, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.7), 
         "For Advertisers: Ultra High-Intent Placement", 
         ["Precision keyword matching: show ads only when relevant terms are prompted.",
          "Native, single-line recommendation cards that blend with the AI interface.",
          "Highest CTR in digital ads (2.0% - 3.5%) because recommendations are contextual.",
          "Self-serve advertiser campaign manager with real-time impression & click analytics."],
         COLOR_PURPLE)

# ── SLIDE 4: HOW IT WORKS ────────────────────────────────────────────────
s4 = prs.slides.add_slide(prs.slide_layouts[6])
apply_background(s4)
add_header(s4, "Product Architecture", "How PayGpt Operates in Real Time")

steps = [
    ("Step 1", "User Prompts AI", "User types a question into ChatGPT or Gemini (e.g., 'Best PostgreSQL cloud hosting')."),
    ("Step 2", "Intent Analysis", "PayGpt extension detects intent keywords in 12ms and queries the auction engine."),
    ("Step 3", "Contextual Card", "A sleek, non-intrusive sponsored recommendation appears right above the response."),
    ("Step 4", "Dual Value Split", "Advertiser gets an ultra-targeted lead; user wallet receives reward credit instantly.")
]

for idx, (step_num, step_title, step_desc) in enumerate(steps):
    left = Inches(0.8 + idx * 2.95)
    c = slide_shape = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(2.3), Inches(2.75), Inches(4.2))
    c.fill.solid()
    c.fill.fore_color.rgb = COLOR_CARD
    c.line.color.rgb = COLOR_BORDER

    tf_c = c.text_frame
    tf_c.word_wrap = True

    p_num = tf_c.paragraphs[0]
    p_num.text = step_num.upper()
    p_num.font.size = Pt(11)
    p_num.font.bold = True
    p_num.font.color.rgb = COLOR_CYAN
    p_num.space_after = Pt(6)

    p_t = tf_c.add_paragraph()
    p_t.text = step_title
    p_t.font.size = Pt(17)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_WHITE
    p_t.space_after = Pt(12)

    p_d = tf_c.add_paragraph()
    p_d.text = step_desc
    p_d.font.size = Pt(12)
    p_d.font.color.rgb = COLOR_MUTED

# ── SLIDE 5: UNIT ECONOMICS ──────────────────────────────────────────────
s5 = prs.slides.add_slide(prs.slide_layouts[6])
apply_background(s5)
add_header(s5, "Unit Economics", "Unprecedented 95% Gross Margins")

add_card(s5, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), 
         "The Math of 1,000 Prompts (CPM)", 
         ["Advertiser Charge (Standard CPM): $6.00 per 1,000 views.",
          "User Payout (1,000 prompts x $0.0003): $0.30.",
          "Cloud Server & DB Cost: ~$0.02.",
          "Net Gross Profit: $5.68 per 1,000 queries.",
          "Gross Profit Margin: 94.7%."],
         COLOR_GREEN)

add_card(s5, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.7), 
         "The Math of Performance Clicks (CPC)", 
         ["Average Click-Through Rate (CTR): 2.0% (20 clicks / 1,000 views).",
          "Advertiser Charge (Standard CPC): $0.75 per click.",
          "Total Revenue from 20 clicks: $15.00.",
          "User Payout for 1,000 views: $0.30.",
          "Net Gross Profit: $14.70 (98.0% Margin)."],
         COLOR_CYAN)

# ── SLIDE 6: MARKET SIZE ────────────────────────────────────────────────
s6 = prs.slides.add_slide(prs.slide_layouts[6])
apply_background(s6)
add_header(s6, "Market Opportunity", "A $300B Ad Market Transitioning to AI")

add_card(s6, Inches(0.8), Inches(2.0), Inches(3.6), Inches(4.7), 
         "TAM: $300 Billion", 
         ["Total Global Search Advertising Market size.",
          "Currently dominated by Google Search text ads.",
          "Projected to shift 35% toward conversational AI interfaces by 2028."],
         COLOR_CYAN)

add_card(s6, Inches(4.8), Inches(2.0), Inches(3.6), Inches(4.7), 
         "SAM: $42 Billion", 
         ["High-intent software, SaaS, developer tools, and e-commerce ads.",
          "Businesses seeking direct leads from tech, developer, and creator queries."],
         COLOR_PURPLE)

add_card(s6, Inches(8.8), Inches(2.0), Inches(3.6), Inches(4.7), 
         "SOM: $150 Million", 
         ["PayGpt target capture within 36 months.",
          "Achieved with just 500,000 active browser extension users worldwide."],
         COLOR_GREEN)

# ── SLIDE 7: BUSINESS MODEL & TIERS ──────────────────────────────────────
s7 = prs.slides.add_slide(prs.slide_layouts[6])
apply_background(s7)
add_header(s7, "Commercial Offerings", "Packaged B2B Ad Products")

tiers = [
    ("Starter Pilot", "$150 / mo", ["25,000 Impressions", "Or ~200 Clicks", "5 Target Keywords", "User Cost: $7.50", "Net Profit: $142.50 (95%)"], COLOR_CYAN),
    ("Growth Package", "$500 / mo", ["100,000 Impressions", "Or ~750 Clicks", "20 Target Keywords", "User Cost: $30.00", "Net Profit: $470.00 (94%)"], COLOR_PURPLE),
    ("Scale Enterprise", "$1,500 / mo", ["350,000 Impressions", "Or ~3,000 Clicks", "Unlimited Keywords", "User Cost: $105.00", "Net Profit: $1,395.00 (93%)"], COLOR_GREEN)
]

for idx, (t_title, t_price, t_items, t_color) in enumerate(tiers):
    left = Inches(0.8 + idx * 3.9)
    add_card(s7, left, Inches(2.0), Inches(3.7), Inches(4.7), 
             f"{t_title}\n{t_price}", t_items, t_color)

# ── SLIDE 8: TECH & DEFESIBILITY ─────────────────────────────────────────
s8 = prs.slides.add_slide(prs.slide_layouts[6])
apply_background(s8)
add_header(s8, "Technology & Moat", "Production-Ready Full Stack Architecture")

add_card(s8, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), 
         "Scalable Cloud Infrastructure", 
         ["Client: Chrome Manifest V3 extension with isolated Shadow DOM styling.",
          "Frontend: Netlify Edge CDN with automatic HTTPS & API proxying.",
          "Backend: Node.js / Express microservices hosted on Render with auto-wake.",
          "Database: MongoDB Atlas Cloud Cluster with Mongoose unified fallback.",
          "Security: JWT token stateless auth, bcrypt hashing, and rate limiting."],
         COLOR_CYAN)

add_card(s8, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.7), 
         "Competitive Moat & Network Effects", 
         ["High User Retention: Cash payout incentive creates daily active users.",
          "Data Flywheel: More prompt data leads to better keyword auction efficiency.",
          "First Mover Advantage: First live ad-network built on top of ChatGPT/Gemini.",
          "Advertiser Lock-in: Advertisers gain access to an audience that ad-blockers miss."],
         COLOR_PURPLE)

# ── SLIDE 9: FINANCIAL PROJECTIONS ───────────────────────────────────────
s9 = prs.slides.add_slide(prs.slide_layouts[6])
apply_background(s9)
add_header(s9, "Growth Forecast", "3-Year Financial & Metric Milestones")

add_card(s9, Inches(0.8), Inches(2.0), Inches(3.6), Inches(4.7), 
         "Year 1: Foundation", 
         ["Active Users: 25,000",
          "Monthly Prompts: 15 Million",
          "Monthly Revenue: $90,000",
          "User Payouts: $4,500",
          "Annual Net Run Rate: $1.02 Million",
          "Focus: Chrome Store listing & B2B SaaS advertisers."],
         COLOR_CYAN)

add_card(s9, Inches(4.8), Inches(2.0), Inches(3.6), Inches(4.7), 
         "Year 2: Scale", 
         ["Active Users: 100,000",
          "Monthly Prompts: 60 Million",
          "Monthly Revenue: $360,000",
          "User Payouts: $18,000",
          "Annual Net Run Rate: $4.1 Million",
          "Focus: Self-serve bidding marketplace & Claude/Perplexity support."],
         COLOR_PURPLE)

add_card(s9, Inches(8.8), Inches(2.0), Inches(3.6), Inches(4.7), 
         "Year 3: Expansion", 
         ["Active Users: 500,000",
          "Monthly Prompts: 300 Million",
          "Monthly Revenue: $1.8 Million",
          "User Payouts: $90,000",
          "Annual Net Run Rate: $20.5 Million",
          "Focus: Global expansion, mobile extensions, and enterprise SDK."],
         COLOR_GREEN)

# ── SLIDE 10: THE ASK ───────────────────────────────────────────────────
s10 = prs.slides.add_slide(prs.slide_layouts[6])
apply_background(s10)
add_header(s10, "Investment Opportunity", "The Seed Round: Accelerating Growth")

add_card(s10, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), 
         "The Funding Ask: $500,000", 
         ["Seeking $500K Seed Investment on SAFE / Priced Equity.",
          "Target Runway: 18 Months to reach $1.5M ARR cash-flow positive.",
          "Current Status: Working MVP, live deployment, validated end-to-end.",
          "Ready for immediate Chrome Web Store launch."],
         COLOR_CYAN)

add_card(s10, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.7), 
         "Use of Funds", 
         ["40% — User Acquisition (TikTok, YouTube Tech influencers, Student Ambassadors).",
          "30% — Engineering (Mobile Safari/Firefox extensions, real-time bidding DSP).",
          "20% — B2B Sales & Advertiser Outreach (Direct acquisition of SaaS brands).",
          "10% — Legal, Compliance & Infrastructure Reserves."],
         COLOR_GREEN)

ppt_path = os.path.join(os.path.dirname(__file__), "PayGpt_Investor_Pitch_Deck.pptx")
prs.save(ppt_path)
print(f"Generated Pitch Deck: {ppt_path}")
