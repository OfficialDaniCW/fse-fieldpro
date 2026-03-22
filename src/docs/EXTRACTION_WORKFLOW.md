# AI-Driven Parts Extraction Workflow

## Overview
When a new manual is uploaded to the system, an automated workflow extracts parts, specifications, and installation steps, populating the Parts database and linking them to the source manual.

## Workflow Steps

### 1. Manual Upload (Triggered by User)
- Admin uploads PDF via **BulkUpload** page or **ManualForm** modal
- PDF is uploaded to storage and a Manual record is created
- Fields populated: `title`, `equipment_manufacturer`, `equipment_model`, `version`, `pdf_file`

### 2. Entity Automation: `initManualExtraction` (Immediate)
- **Trigger:** Manual record created
- **Action:** Sets `extracted_parts_status` to `"pending"` (if PDF exists) or `"none"` (if no PDF)
- **Timing:** Runs immediately after creation

### 3. Scheduled Queue Processor: `processManualQueue` (Every 10 Minutes)
- **Trigger:** Scheduled automation runs every 10 minutes
- **Action:** Finds all manuals with `extracted_parts_status = "pending"` and processes them
- **Processing:**
  1. Marks manual as `"processing"`
  2. Invokes `bulkProcessManual` backend function
  3. On success, marks manual as `"done"`
  4. On failure, reverts to `"pending"` for retry on next run

### 4. Parts Extraction: `bulkProcessManual` (AI-Driven)
- **Inputs:** Manual ID, PDF file URL
- **Processing Stages:**
  1. **Full Text Extraction:** LLM extracts all text from PDF
  2. **Structured Data Extraction:** Error codes, troubleshooting steps, summary
  3. **Parts Extraction:** LLM identifies parts with:
     - Part number
     - Description
     - Component type
     - System area
     - Installation steps (1–3)
     - Safety warnings
     - Specifications
  4. **Deduplication:** Checks if part_number already exists before creating
  5. **Source Linking:** Each extracted part gets `source_manual_id` field

### 5. Parts Database Population
- New parts are created in the **Part** entity
- Linked to source manual via `source_manual_id`
- Indexed for search and lookup by FSE technicians

## Data Flow

```
User Upload
    ↓
Manual Entity Created
    ↓
Entity Automation: initManualExtraction (marks "pending")
    ↓
Scheduled Queue: processManualQueue (every 10 min)
    ↓
Backend Function: bulkProcessManual
    ├─ Extract full text
    ├─ Extract error codes & troubleshooting
    ├─ Extract parts & specifications
    └─ Create Part records (linked to manual)
    ↓
Manual marked "done"
    ↓
Parts available for FSE search
```

## Status States

| Status | Meaning |
|--------|---------|
| `"pending"` | Queued for extraction, waiting for scheduled processor |
| `"processing"` | Currently extracting (should be brief) |
| `"done"` | Extraction complete, parts populated |
| `"none"` | Manual has no PDF, no extraction attempted |

## Monitoring

- **BulkUpload Page:** Displays extraction queue status
- **ExtractionMonitor Component:** Shows pending, processing, done counts
- **Manual Entity:** Check `extracted_parts_status` field to see current state

## Performance Notes

- **Queue runs:** Every 10 minutes (configurable in automation settings)
- **Per-manual extraction time:** 30–90 seconds (LLM processing)
- **Batch processing:** Multiple manuals queued in parallel blocks (no conflicts)
- **Retry logic:** Failed extractions marked as "pending" for next queue run

## Error Handling

- If extraction fails, manual reverts to `"pending"` status
- Retry happens automatically on next queue run (10 min later)
- Check logs in backend function dashboard for detailed errors

## Future Enhancements

- Webhook notifications on extraction complete
- Web UI to manually trigger extraction for specific manuals
- Extraction progress timeline / history per manual
- Parts deduplication with fuzzy matching (same part, different number)