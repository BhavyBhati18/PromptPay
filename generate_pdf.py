import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

data = [
    {
        "category": "Category 1: AI Code & Developer Tools",
        "user_queries": 'Users constantly ask ChatGPT/Gemini: "Write this React component", "Fix this Docker bug", "Python API script".',
        "tools": [
            {
                "name": "ShipFast (Marc Lou)",
                "url": "https://shipfa.st",
                "what": "Next.js AI boilerplate for solopreneurs.",
                "keywords": "build saas, nextjs template, stripe integration, auth boilerplate",
                "why": "Solo founder who spends aggressively on distribution and loves novel ad channels."
            },
            {
                "name": "Supastarter",
                "url": "https://supastarter.dev",
                "what": "Production-ready SaaS starter kits with Supabase & Prisma.",
                "keywords": "supabase react, saas boilerplate, prisma database setup",
                "why": ""
            },
            {
                "name": "v0 by Vercel / indie UI alternatives (21st.dev)",
                "url": "https://21st.dev",
                "what": "Open-source library of production UI components built for AI prompts.",
                "keywords": "tailwind components, shadcn ui, react navbar design",
                "why": ""
            },
            {
                "name": "Kapa.ai",
                "url": "https://kapa.ai",
                "what": "AI support bots trained on technical developer docs and GitHub repos.",
                "keywords": "developer documentation bot, rag documentation, github support ai",
                "why": ""
            },
            {
                "name": "Aider / OpenHands",
                "url": "",
                "what": "Terminal AI coding companions (or indie UI clients for them).",
                "keywords": "terminal ai, command line copilot, git auto commit ai",
                "why": ""
            }
        ]
    },
    {
        "category": "Category 2: AI Writing, SEO & Content Generators",
        "user_queries": 'Users constantly ask ChatGPT/Gemini: "Write an SEO blog post", "Help me rewrite this email", "Generate LinkedIn hook".',
        "tools": [
            {
                "name": "Writesonic / Chatsonic (or Katteb)",
                "url": "https://katteb.com",
                "what": "Fact-checked AI blog and article writer for SEO marketers.",
                "keywords": "write blog post, seo content, article writer, humanize ai text",
                "why": ""
            },
            {
                "name": "TweetHunter / Taplio (or Postwise.ai)",
                "url": "https://postwise.ai",
                "what": "AI tweet & LinkedIn post writer and scheduler.",
                "keywords": "linkedin content, twitter growth, viral post ideas",
                "why": ""
            },
            {
                "name": "Undetectable AI",
                "url": "https://undetectable.ai",
                "what": "Rewrites AI text to pass AI detectors (Turnitin, GPTZero).",
                "keywords": "bypass turnitin, ai detector check, humanize gpt",
                "why": ""
            },
            {
                "name": "SEOWriting.ai",
                "url": "https://seowriting.ai",
                "what": "1-click bulk SEO article creator for affiliate niche sites.",
                "keywords": "bulk seo, amazon affiliate article, niche site content",
                "why": ""
            },
            {
                "name": "Rytr",
                "url": "https://rytr.me",
                "what": "Lightweight AI writing assistant with affordable monthly plans.",
                "keywords": "copywriting templates, email pitch generator, catchy slogans",
                "why": ""
            }
        ]
    },
    {
        "category": "Category 3: AI Resume & Career Prep Tools",
        "user_queries": 'Users constantly ask ChatGPT/Gemini: "Review my resume", "Prepare for interview", "Write a cover letter".',
        "tools": [
            {
                "name": "Kickresume",
                "url": "https://kickresume.com",
                "what": "AI resume builder and ATS checker.",
                "keywords": "resume bullet points, ats resume template, software engineer cv",
                "why": ""
            },
            {
                "name": "Teal",
                "url": "https://tealhq.com",
                "what": "AI job application tracker and resume optimizer.",
                "keywords": "job search tracker, optimize resume for job, linkedin recruiter message",
                "why": ""
            },
            {
                "name": "Final Round AI",
                "url": "https://finalroundai.com",
                "what": "Real-time AI copilot for mock and live job interviews.",
                "keywords": "interview preparation, behavioral interview questions, system design interview",
                "why": ""
            },
            {
                "name": "LoopCV",
                "url": "https://loopcv.pro",
                "what": "Fully automated job application bot for job seekers.",
                "keywords": "apply to jobs automatically, cold email hiring managers",
                "why": ""
            }
        ]
    },
    {
        "category": "Category 4: AI Design, Visuals & Productivity",
        "user_queries": 'Users constantly ask ChatGPT/Gemini: "Make a logo", "Presentation outline", "Summarize this PDF".',
        "tools": [
            {
                "name": "Gamma App / Presentations.AI",
                "url": "https://presentations.ai",
                "what": "AI slide deck and presentation builder from prompt outlines.",
                "keywords": "pitch deck outline, powerpoint slides ai, presentation design",
                "why": ""
            },
            {
                "name": "Looka",
                "url": "https://looka.com",
                "what": "AI logo and brand kit generator for new companies.",
                "keywords": "startup logo ideas, brand identity design, color palette for tech company",
                "why": ""
            },
            {
                "name": "ChatPDF",
                "url": "https://chatpdf.com",
                "what": "Read and ask questions to research papers, legal contracts, and textbooks.",
                "keywords": "summarize pdf, extract table from pdf, study guide textbook",
                "why": ""
            },
            {
                "name": "Glasp",
                "url": "https://glasp.co",
                "what": "Social web highlighter and YouTube video AI summarizer.",
                "keywords": "summarize youtube video, highlight web articles, kindle notes export",
                "why": ""
            },
            {
                "name": "AudioPen",
                "url": "https://audiopen.ai",
                "what": "Turns rambling voice memos into structured, clear text notes.",
                "keywords": "voice memo notes, transcribe audio, meeting minutes summary",
                "why": ""
            },
            {
                "name": "Tome / Decktopus",
                "url": "https://decktopus.com",
                "what": "Instant lead-generation micro-presentations for sales reps.",
                "keywords": "sales deck template, one pager proposal, client pitch document",
                "why": ""
            }
        ]
    }
]

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#718096"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, 755, "AI Tools & Search Intent Directory")
            self.drawRightString(572, 755, "Ad Targeting & Pitch Guide")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(40, 747, 572, 747)
            
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 28, page_text)
        self.drawString(40, 28, "Confidential & Proprietary • Compiled for Pitching & Keyword Intent Mapping")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 38, 572, 38)
        self.restoreState()

def build_pdf(filename="AI_Tools_and_Keywords_Directory.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    )
    
    cat_heading = ParagraphStyle(
        'CategoryHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
    )
    
    cat_sub = ParagraphStyle(
        'CategorySub',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )
    
    tool_title = ParagraphStyle(
        'ToolTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )
    
    url_style = ParagraphStyle(
        'UrlStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#2563EB')
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155')
    )
    
    kw_label = ParagraphStyle(
        'KwLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0369A1')
    )
    
    kw_text = ParagraphStyle(
        'KwText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#0284C7')
    )

    story = []
    
    # Title & Subtitle banner
    story.append(Paragraph("AI Tools & High-Intent Search Directory", title_style))
    story.append(Paragraph("A strategic reference mapping user search prompts (ChatGPT/Gemini) to niche AI products, relevant target keywords, and ad/distribution pitch angles.", subtitle_style))
    story.append(Spacer(1, 4))
    
    for c_idx, cat in enumerate(data):
        # Category Banner Card
        banner_content = [
            [Paragraph(f"<b>{cat['category']}</b>", cat_heading)],
            [Paragraph(f"<b>User Search Prompts:</b> {cat['user_queries']}", cat_sub)]
        ]
        banner_table = Table(banner_content, colWidths=[532])
        banner_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,0), 7),
            ('BOTTOMPADDING', (0,0), (-1,0), 2),
            ('TOPPADDING', (0,1), (-1,1), 2),
            ('BOTTOMPADDING', (0,1), (-1,1), 7),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('LINELEFT', (0,0), (0,-1), 3.5, colors.HexColor('#3B82F6')),
        ]))
        
        story.append(KeepTogether([banner_table, Spacer(1, 6)]))
        
        # Tools in category
        for t_idx, tool in enumerate(cat['tools']):
            left_parts = [Paragraph(f"<b>{tool['name']}</b>", tool_title)]
            if tool['url']:
                left_parts.append(Spacer(1, 2))
                left_parts.append(Paragraph(f'<font color="#2563EB"><u>{tool["url"]}</u></font>', url_style))
            
            right_parts = [
                Paragraph(f"<b>What they do:</b> {tool['what']}", body_style),
                Spacer(1, 3),
                Paragraph(f"<b>Target Keywords:</b> <i>{tool['keywords']}</i>", kw_text)
            ]
            
            if tool.get('why'):
                right_parts.append(Spacer(1, 3))
                right_parts.append(Paragraph(f"<b>Why pitch:</b> {tool['why']}", body_style))
            
            row_data = [[left_parts, right_parts]]
            row_table = Table(row_data, colWidths=[170, 362])
            
            bg_color = colors.HexColor('#FFFFFF') if t_idx % 2 == 0 else colors.HexColor('#F8FAFC')
            row_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), bg_color),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ('LINEBEFORE', (1,0), (1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ]))
            
            story.append(KeepTogether([row_table, Spacer(1, 4)]))
            
        story.append(Spacer(1, 8))
        
    doc.build(story, canvasmaker=NumberedCanvas)
    print("PDF build successful.")

if __name__ == '__main__':
    build_pdf()
