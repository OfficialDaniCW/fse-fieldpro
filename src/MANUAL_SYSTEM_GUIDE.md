# Enhanced Manual System Guide

## Overview

The FSE FieldPro manual system has been upgraded to provide a **wiki-like experience** with intelligent organization, comprehensive section navigation, and smart grouping by brand and component type.

---

## Key Features

### 1. **Smart Manual Organization (ManualOrganizer)**

Manuals are automatically grouped by:
- **Brand/Manufacturer** (e.g., Gilbarco, Wayne, Tokheim)
- **Component Type** (automatically detected):
  - 💧 **Hydraulic Systems** — pumps, hoses, valves, flow systems
  - ⚡ **Electrical Systems** — motors, switches, relays, circuits, sensors
  - ⚙️ **Mechanical Systems** — gears, bearings, shafts, couplings, brakes
  - 📦 **Parts & Components** — seals, gaskets, rings, filters
  - 📄 **Miscellaneous** — everything else

**Benefits:**
- Field technicians quickly find manuals relevant to their system type
- Reduces cognitive load vs. flat lists
- Makes it easy for the agent to suggest related documentation

### 2. **Wiki-Like Manual Viewer (ManualWikiViewer)**

When opening a manual, users see:

#### **Header Section**
- Manual title, manufacturer, model, version
- Back button to manual list

#### **Summary Card**
- AI-generated overview of the manual contents
- Quick context before diving deeper

#### **Original PDF**
- Embedded PDF with download & fullscreen buttons
- Access to the actual document for verification

#### **Exploded View Diagram** (if available)
- Visual reference for complex assemblies
- Pan & zoom controls for detailed inspection

#### **Error Codes & Fault Diagnosis**
- All error codes parsed from PDF
- What each code means
- Common causes

#### **Troubleshooting Procedures**
- Step-by-step guides
- Numbered procedures with visual formatting
- Safety warnings highlighted in orange

#### **Table of Contents (Sidebar)**
- Sticky navigation panel (on desktop)
- Links to each section
- Smooth scroll navigation
- Collapsible for mobile

#### **Manual Sections**
- Full manual content organized by extracted sections
- Headings highlighted with red underlines
- Steps formatted with numbered circles
- Safety warnings in orange alert boxes

### 3. **Intelligent Manual Guide Agent (manual_guide)**

A dedicated AI agent that helps users find and understand manuals.

**Agent Capabilities:**
- Find manuals by brand ("Show me all Gilbarco manuals")
- Group by component type ("What electrical system manuals do we have?")
- Search by function ("I need hydraulic pump documentation")
- Diagnose issues ("How do I fix error code E02?")
- Recommend related manuals based on user's equipment

**Access:**
- Available in dashboard for administrative use
- WhatsApp integration available
- Can be queried from Chat page for context

**Tool Access:**
- Read-only access to Manual entity
- Read-only access to Part entity
- Can recommend related parts from manuals

---

## How to Use

### For Field Technicians (Manuals Page)

1. **Browse Manuals:**
   - Visit **Manuals** page
   - Manuals automatically grouped by brand & component type
   - Expand brand to see component categories
   - Expand category to see specific manuals

2. **Search Manuals:**
   - Use search bar at top
   - Searches by title, brand, model, version
   - Results stay grouped by organization

3. **View Manual:**
   - Click on a manual to open wiki view
   - See table of contents (sticky sidebar on desktop)
   - Read error codes, troubleshooting, full content
   - Download original PDF for offline use
   - View diagrams and parts references

4. **Quick Actions:**
   - Download PDF for offline access
   - View in fullscreen for detail inspection
   - Jump to specific sections via TOC
   - Ask AI for interpretation via "Ask AI about this manual" button

### For Admins (Admin Panel)

1. **Upload Manuals:**
   - Admin → Bulk Upload tab
   - Upload PDFs in batch
   - Auto-tagging by manufacturer/model
   - Extraction status tracked

2. **Monitor Extraction:**
   - Manuals tab shows extraction status
   - ✓ = Text extracted (searchable)
   - ⚠ = Not extracted yet
   - Click refresh icon to re-extract if needed

3. **Manage Manuals:**
   - Delete old or duplicate manuals
   - View PDF to verify content
   - Re-extract if PDF was improved

4. **Use manual_guide Agent:**
   - Admin panel shows banner: "manual_guide agent"
   - Can use agent to verify manual organization
   - Agent can summarize which manuals cover which topics

---

## Technical Details

### Component Structure

```
pages/Manuals.js
├─ ManualOrganizer (grouping display)
└─ ManualWikiViewer (detail view)
  ├─ Header
  ├─ TableOfContents (sidebar)
  ├─ Summary
  ├─ PdfViewer
  ├─ ContentSection (error codes)
  ├─ ContentSection (troubleshooting)
  └─ Manual Sections (extracted content)
```

### Smart Grouping Algorithm

```javascript
// Component type detection:
if (text.match(/hydraulic|pump|hose|valve|flow/)) → Hydraulic
else if (text.match(/electric|motor|switch|relay|circuit/)) → Electrical
else if (text.match(/gear|bearing|shaft|coupling|brake/)) → Mechanical
else if (text.match(/part|component|seal|gasket|ring/)) → Parts
else → Miscellaneous
```

Search is performed on:
- Manual title
- Equipment model
- Manual summary
- Full extracted text (when available)

### Section Extraction

The viewer automatically extracts sections from manual text by looking for:
- Markdown headings: `# Section Name`
- ALL CAPS headers: `ERROR CODES:`
- Colons at end of lines: `TROUBLESHOOTING:`

If 3+ sections found, displays structured view. Otherwise, displays as-is.

### Table of Contents Generation

TOC is built from extracted sections, providing:
- Clickable links to each section
- Smooth scroll navigation
- Sticky sidebar (desktop)
- Collapsible for space (mobile)

---

## Agent: manual_guide

### Configuration

**Tools Available:**
- Manual (read-only): Can query all manual data
- Part (read-only): Can cross-reference parts mentioned in manuals

**Key Instructions:**
- Organize information by Brand → Component Type → Version
- Help users find right manual for their equipment/problem
- Explain which manuals apply and why
- Summarize key sections from manuals
- Provide context about component relationships

### Example Queries

**User:** "Show me all Gilbarco manuals"
**Agent Response:** Groups by component type, counts per category, explains what each covers

**User:** "What electrical system manuals do we have?"
**Agent Response:** Lists all electrical manuals, brief description, recommends for specific issues

**User:** "I have error code E02. Where do I look?"
**Agent Response:** Searches error_codes field in manuals, finds E02 definitions, recommends relevant troubleshooting procedures

**User:** "Which manuals cover hydraulic seals?"
**Agent Response:** Searches manual titles & content for hydraulic + seals, cross-references with Part entity, provides installation context

### WhatsApp Integration

If enabled, users can message the agent on WhatsApp:
```
👋 Welcome to the Manual Guide! I can help you find equipment manuals...

📚 "Show me all Gilbarco manuals"
⚡ "What electrical system manuals do we have?"
🔧 "I need a manual for hydraulic pumps"
❓ "How do I diagnose error code E02?"
```

---

## Data Insights

### What Gets Extracted from PDFs

During manual processing, the system extracts:

1. **manual_text** — Full text from PDF (via OCR)
   - Searchable in Chat
   - Used for section extraction
   - Fallback if other fields empty

2. **error_codes** — Parsed error code section
   - Code: Meaning pairs
   - Solutions/actions
   - Severity levels

3. **troubleshooting_steps** — Step-by-step procedures
   - Diagnostic steps
   - Fix procedures
   - Safety warnings

4. **summary** — AI-generated overview
   - What the manual covers
   - Key sections
   - Who should use it

5. **exploded_view_image_url** — Diagram extraction
   - Visual assembly reference
   - Part identification
   - Installation sequence

### Search Integration

Manuals are searchable from:
- **Manuals page** — Text, title, model search
- **Chat page** — "What manual covers...?" queries
- **manual_guide agent** — Intelligent recommendations
- **Activity Log** — Track which manuals accessed

---

## Best Practices

### For Uploading Manuals

1. **Use clear file names:**
   - ✅ `Gilbarco_SK700_v2.1_Service_Manual.pdf`
   - ❌ `document1.pdf`

2. **Fill metadata completely:**
   - Manufacturer: Brand name
   - Model: Equipment model number
   - Version: Revision/version info
   - Extraction: Enable for complex equipment

3. **Review after extraction:**
   - Check extracted error codes are correct
   - Verify troubleshooting steps are complete
   - Review exploded view (if extracted)

4. **Upload related manuals as set:**
   - All SK700 versions together
   - All Gilbarco products grouped
   - Newest version last (overwrites older)

### For Technicians Using Manuals

1. **Browse by component type first:**
   - Know what system you're troubleshooting?
   - Open that component category
   - Skim related manuals

2. **Use TOC for detail dives:**
   - Found relevant manual?
   - Click section in TOC to jump there
   - Read sub-sections without scrolling

3. **Download for offline:**
   - On field site without connection?
   - Download PDF while online
   - Access anytime without internet

4. **Cross-reference with Chat:**
   - Reading a manual?
   - Found relevant error code or part?
   - Use "Ask AI about this manual" to get interpretation
   - Chat remembers manual context

---

## Troubleshooting

### Manual not appearing in lists

**Check:**
1. Is manual status "done" in extraction?
2. Is manufacturer field filled?
3. Try refresh page (F5)

**Solution:**
1. Re-extract: Admin → Manuals tab → refresh icon
2. Verify PDF opens: Admin → click PDF icon
3. Check filter: Manuals page → clear search

### Sections not extracting properly

**Cause:** PDF has poor text recognition (scanned image)

**Solution:**
1. Use higher-quality PDF if available
2. Admin → Manuals → click refresh to re-extract
3. Accept non-ideal extraction; human review trumps AI

### Agent not finding manuals

**Check:**
1. Are manuals actually uploaded? (Admin → Manuals tab)
2. Are they extracted? (✓ Text extracted indicator)
3. Try simpler query terms

**Solution:**
1. Upload and extract more manuals
2. Use brand name or exact model number
3. Agent improves as more manuals added

### TOC links not scrolling

**Check:**
1. Mobile vs desktop? (TOC sticky only on desktop)
2. Manual sections extracted properly?

**Solution:**
1. On mobile: Collapse TOC, scroll manually
2. Re-extract manual if sections missing
3. Update browser (JavaScript issue)

---

## Future Enhancements

Potential improvements for next phase:

1. **Section linking** — Cross-link error code to solution procedure
2. **Part linking** — Highlight parts mentioned in manuals
3. **Video integration** — Link video tutorials to sections
4. **User annotations** — Technicians add notes to sections
5. **Mobile TOC search** — Search within TOC on mobile
6. **Export sections** — Download specific section as PDF
7. **Diagram labeling** — Label parts in exploded views
8. **Manual versioning** — Track changes between versions

---

## Summary

The enhanced manual system provides:
- ✅ **Smart organization** by brand & component type
- ✅ **Wiki-like navigation** with table of contents
- ✅ **Rich content** with error codes, diagrams, procedures
- ✅ **Intelligent agent** for discovery & guidance
- ✅ **Offline access** via PDF download
- ✅ **AI integration** for interpretation & context

This transforms manuals from static PDFs into an interactive knowledge base that field technicians can navigate intuitively while maintaining access to the original source documents.