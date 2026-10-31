import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

pdf_path = os.path.join(os.path.dirname(__file__), "PayGpt_Business_and_Revenue_Model.pdf")
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    leftMargin=40,
    rightMargin=40,
    topMargin=40,
    bottomMargin=40
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=24,
    leading=28,
    textColor=colors.HexColor('#0F172A'),
    alignment=1
)

subtitle_style = ParagraphStyle(
    'DocSubTitle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=11,
    leading=15,
    textColor=colors.HexColor('#475569'),
    alignment=1
)

h1_style = ParagraphStyle(
    'SectionH1',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=14,
    leading=18,
    textColor=colors.HexColor('#0284C7'),
    spaceBefore=14,
    spaceAfter=6
)

h2_style = ParagraphStyle(
    'SectionH2',
    parent=styles['Heading3'],
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=14,
    textColor=colors.HexColor('#0F172A'),
    spaceBefore=8,
    spaceAfter=4
)

body_style = ParagraphStyle(
    'BodyDark',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13,
    textColor=colors.HexColor('#1E293B'),
    spaceAfter=6
)

bullet_style = ParagraphStyle(
    'BulletText',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=12,
    textColor=colors.HexColor('#334155'),
    leftIndent=12,
    spaceAfter=3
)

callout_style = ParagraphStyle(
    'CalloutText',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9.5,
    leading=13.5,
    textColor=colors.HexColor('#0369A1'),
    alignment=1
)

elements = []

# Title Section
elements.append(Paragraph("PAYGPT TECHNOLOGIES INC.", ParagraphStyle('Brand', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#0284C7'), alignment=1)))
elements.append(Spacer(1, 4))
elements.append(Paragraph("Complete Business & Revenue Model Blueprint", title_style))
elements.append(Spacer(1, 4))
elements.append(Paragraph("Monetizing the Generative AI Search Layer with High-Intent Sponsored Recommendations", subtitle_style))
elements.append(Spacer(1, 10))
elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=2, spaceAfter=14))

# 1. Executive Summary
elements.append(Paragraph("1. Executive Summary", h1_style))
elements.append(Paragraph(
    "<b>PayGpt</b> is a browser extension and adtech platform that turns millions of daily queries on OpenAI ChatGPT "
    "and Google Gemini into a non-intrusive, contextual advertising marketplace. By giving users a micro-incentive "
    "($0.0003 per search) and presenting ultra-targeted sponsored tools above AI answers, PayGpt achieves an unprecedented "
    "<b>94%+ gross margin</b> while solving the primary pain point of traditional search ads: user fatigue and low relevancy.",
    body_style
))

# 2. Market Opportunity
elements.append(Paragraph("2. The Market Disruption: Why AI Search Ads?", h1_style))
elements.append(Paragraph(
    "Over 1.8 billion prompts are executed daily across ChatGPT and Google Gemini. Users are no longer scrolling "
    "through 10 blue links on Google. Instead, they ask conversational questions with clear commercial intent "
    "(e.g., <i>'How do I host a PostgreSQL database?'</i> or <i>'Best email outreach software for SaaS'</i>). "
    "However, existing AI engines offer zero direct ad real estate. PayGpt bridges this multi-billion dollar gap "
    "through a client-side injection layer.",
    body_style
))

# 3. Unit Economics
elements.append(Paragraph("3. Unit Economics & Profit Margins", h1_style))
elements.append(Paragraph(
    "The core financial advantage of PayGpt lies in the spread between user payout ($0.0003 per prompt) and commercial B2B advertising rates ($6.00 CPM or $0.75 CPC).",
    body_style
))

unit_table_data = [
    [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Per 1 Prompt</b>", body_style), Paragraph("<b>Per 1,000 Prompts (CPM)</b>", body_style), Paragraph("<b>Per 100,000 Prompts</b>", body_style), Paragraph("<b>Profit Margin</b>", body_style)],
    [Paragraph("Advertiser Revenue (CPM)", body_style), Paragraph("$0.0060", body_style), Paragraph("$6.00", body_style), Paragraph("$600.00", body_style), Paragraph("100%", body_style)],
    [Paragraph("User Incentive Payout", body_style), Paragraph("$0.0003", body_style), Paragraph("$0.30", body_style), Paragraph("$30.00", body_style), Paragraph("5.0%", body_style)],
    [Paragraph("Platform Gross Profit", body_style), Paragraph("<b>$0.0057</b>", body_style), Paragraph("<b>$5.70</b>", body_style), Paragraph("<b>$570.00</b>", body_style), Paragraph("<b>95.0%</b>", body_style)]
]

t1 = Table(unit_table_data, colWidths=[1.8*inch, 1.1*inch, 1.4*inch, 1.4*inch, 1.0*inch])
t1.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#E0F2FE')),
]))
elements.append(t1)
elements.append(Spacer(1, 10))

# 4. Two Advertiser Billing Models
elements.append(Paragraph("4. Advertiser Pricing Models: CPM vs. CPC", h1_style))
elements.append(Paragraph(
    "<b>Model A: Impression Model (CPM - Cost Per 1,000 Views)</b><br/>"
    "Advertisers pay for verified brand impressions. When a user prompts a keyword matching the advertiser's category, "
    "their ad banner is displayed. Recommended rate: <b>$5.00 - $8.00 CPM</b>.",
    body_style
))
elements.append(Paragraph(
    "<b>Model B: Performance Model (CPC - Cost Per Click)</b><br/>"
    "Advertisers only pay when a user clicks the sponsored link. At an industry-average 2% CTR (20 clicks per 1,000 impressions), "
    "charging <b>$0.75 per click</b> generates <b>$15.00 revenue per 1,000 queries</b>, boosting net gross margin to <b>98%</b>.",
    body_style
))

# 5. Standard Packages
elements.append(Paragraph("5. Ready-to-Sell Advertiser Packages", h1_style))

pkg_data = [
    [Paragraph("<b>Package Tier</b>", body_style), Paragraph("<b>Package Price</b>", body_style), Paragraph("<b>Deliverables</b>", body_style), Paragraph("<b>User Cost</b>", body_style), Paragraph("<b>Net Profit</b>", body_style)],
    [Paragraph("<b>Starter Pilot</b>", body_style), Paragraph("$150", body_style), Paragraph("25,000 Views or ~200 Clicks", body_style), Paragraph("$7.50", body_style), Paragraph("<b>$142.50 (95%)</b>", body_style)],
    [Paragraph("<b>Growth Tier</b>", body_style), Paragraph("$500", body_style), Paragraph("100,000 Views or ~750 Clicks", body_style), Paragraph("$30.00", body_style), Paragraph("<b>$470.00 (94%)</b>", body_style)],
    [Paragraph("<b>Scale & Dominate</b>", body_style), Paragraph("$1,500", body_style), Paragraph("350,000 Views + Priority Keywords", body_style), Paragraph("$105.00", body_style), Paragraph("<b>$1,395.00 (93%)</b>", body_style)]
]

t2 = Table(pkg_data, colWidths=[1.5*inch, 1.1*inch, 2.2*inch, 1.0*inch, 1.2*inch])
t2.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
]))
elements.append(t2)
elements.append(Spacer(1, 10))

elements.append(PageBreak())

# Page 2
elements.append(Paragraph("6. How Ads are Displayed (The Technical Mechanism)", h1_style))
elements.append(Paragraph(
    "1. <b>Real-Time Keyword Detection:</b> When the user submits a prompt on ChatGPT or Google Gemini, the content script extracts the intent tokens.<br/>"
    "2. <b>Instant Server Auction / Match:</b> The client sends an asynchronous verification ping to <code>/api/search/record</code>.<br/>"
    "3. <b>Zero-Flicker Native Injection:</b> A lightweight, glassmorphic single-line recommendation bar is mounted above the AI answer.<br/>"
    "4. <b>Fraud Prevention & Throttling:</b> Minimum intervals (5 seconds), query deduplication, and bot heuristics prevent abusive repeat prompts.<br/>"
    "5. <b>Safe User Payouts:</b> Payout requests are subjected to a $5.00 threshold with manual or batch admin review via <code>/api/admin/database</code>.",
    body_style
))

# 7. Financial Projections
elements.append(Paragraph("7. 3-Year Scaled Financial Projections", h1_style))

proj_data = [
    [Paragraph("<b>Milestone</b>", body_style), Paragraph("<b>Active Users</b>", body_style), Paragraph("<b>Monthly Prompts</b>", body_style), Paragraph("<b>Gross Ad Revenue</b>", body_style), Paragraph("<b>User Payouts</b>", body_style), Paragraph("<b>Net Monthly Margin</b>", body_style)],
    [Paragraph("Month 3 (Pilot)", body_style), Paragraph("2,500", body_style), Paragraph("1,500,000", body_style), Paragraph("$9,000", body_style), Paragraph("$450", body_style), Paragraph("<b>$8,550</b>", body_style)],
    [Paragraph("Month 12 (Scale)", body_style), Paragraph("25,000", body_style), Paragraph("15,000,000", body_style), Paragraph("$90,000", body_style), Paragraph("$4,500", body_style), Paragraph("<b>$85,500</b>", body_style)],
    [Paragraph("Month 24 (Expansion)", body_style), Paragraph("100,000", body_style), Paragraph("60,000,000", body_style), Paragraph("$360,000", body_style), Paragraph("$18,000", body_style), Paragraph("<b>$342,000</b>", body_style)]
]

t3 = Table(proj_data, colWidths=[1.4*inch, 1.0*inch, 1.3*inch, 1.2*inch, 1.0*inch, 1.3*inch])
t3.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
]))
elements.append(t3)
elements.append(Spacer(1, 14))

# 8. Technology Stack
elements.append(Paragraph("8. Production Technology Stack", h1_style))
elements.append(Paragraph(
    "• <b>Client Layer:</b> Chrome Manifest V3 Extension (Vanilla JS, CSS Isolation, zero framework bloat)<br/>"
    "• <b>Web & Frontend:</b> Netlify Edge CDN & Vercel deployment with SSL and custom domain routing<br/>"
    "• <b>API & Engine:</b> Node.js / Express deployed on Render cloud with automated auto-scaling<br/>"
    "• <b>Database:</b> MongoDB Atlas Cloud Cluster with Mongoose unified fallback architecture<br/>"
    "• <b>Security:</b> Bcrypt password hashing, JWT stateless authentication, HttpOnly cookies",
    body_style
))
elements.append(Spacer(1, 10))

# 9. Conclusion
elements.append(Paragraph("9. Strategic Summary", h1_style))
elements.append(Paragraph(
    "PayGpt aligns user incentives with advertiser goals. Users are rewarded for everyday AI workflow activities, "
    "while software companies gain access to the highest-intent moments of tech consumers with unprecedented CTRs. "
    "With negligible variable hosting costs and 94% unit margins, PayGpt is positioned to become the default monetization "
    "standard for the conversational AI ecosystem.",
    body_style
))

doc.build(elements)
print(f"Generated PDF: {pdf_path}")
