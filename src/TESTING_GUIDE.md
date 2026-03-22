# FSE FieldPro — Comprehensive Testing Guide

## Pre-Launch Testing Checklist

This guide walks through all features, agents, and functions to ensure everything is working correctly before production go-live.

---

## 1. AGENT TESTING (Chat Page)

### Setup
1. Navigate to **Chat** page
2. Messages should be empty (or show history if resuming session)
3. Image/Voice buttons should be visible in input area

### Test 1.1: Exact Part Number Search
**Query:** `140852556`
**Expected Result:**
- ✅ Part is found (if exists in DB)
- ✅ Full part details shown (part_number, description, brand, model, safety warnings)
- ✅ Installation steps displayed (if available)
- ✅ Part added to "Parts Used" tray

**If part doesn't exist:** Should return "not in TSG FieldPro database yet" message

---

### Test 1.2: Fuzzy Description Search
**Query:** `VR hose connector`
**Expected Result:**
- ✅ Searches across part_number, description, brand, component_type
- ✅ Returns top 3 matches ranked by relevance
- ✅ Shows: part number · brand · model
- ✅ Parts added to tray

**Verify Weighting:**
- Exact match in field → highest score
- Prefix match → medium score
- Substring match → lower score
- part_number field weighted 5x higher than what_it_does

---

### Test 1.3: Obsolete Part Handling
**Setup:** Create a part with `is_obsolete: true` and `superseded_by: "NEW-PART-123"`
**Query:** Search for the obsolete part
**Expected Result:**
- ✅ Shows warning: "⚠️ This part is obsolete"
- ✅ Displays the obsolete part details
- ✅ Shows "Recommended replacement:" with new part
- ✅ Replacement part details shown in full

---

### Test 1.4: Image Upload & OCR
**Setup:** Have a clear photo of a part label with text/numbers
**Steps:**
1. Click image upload button
2. Select the test image
3. Type a question or leave empty ("What part is this?")
4. Send

**Expected Result:**
- ✅ Image displays in message
- ✅ OCR extracts visible text from image
- ✅ Text is searched in parts DB
- ✅ Matching parts returned with full details
- ⚠️ **Fallback:** If no part match, searches manuals for context

---

### Test 1.5: Manual Search & Error Codes
**Setup:** Must have at least 1 manual uploaded with manual_text + error_codes
**Query:** `error code E02` or `fault diagnosis`
**Expected Result:**
- ✅ No part match found
- ✅ LLM semantic ranking kicks in
- ✅ Relevant manuals retrieved (top 2)
- ✅ Manual context built (summary + error codes + troubleshooting)
- ✅ AI generates response using manual content
- ✅ Response includes: cause, steps, safety warnings
- ✅ Manual title and model cited

---

### Test 1.6: Voice Input
**Browser:** Chrome or Safari (WebKit)
**Steps:**
1. Click microphone button
2. Speak clearly: "What's part number 140852556?"
3. Wait for transcription

**Expected Result:**
- ✅ Microphone button shows listening state (animated red)
- ✅ Text appears in input field
- ✅ Message sent automatically
- ✅ Part search executes

---

### Test 1.7: Session Persistence
**Steps:**
1. Send a message in chat
2. Refresh the page (Cmd+R)
3. Return to Chat page

**Expected Result:**
- ✅ Previous conversation history restored
- ✅ "Resumed previous session" banner shown
- ✅ Option to "Start fresh" clears history
- ✅ Conversation ID persisted in localStorage

---

### Test 1.8: Parts Used Tray
**Setup:** Search and add 2-3 parts
**Expected Result:**
- ✅ Each part appears in tray at bottom
- ✅ Can remove individual parts (X button)
- ✅ "Clear all" button clears tray
- ✅ Tray persists during conversation

---

## 2. PART_FINDER AGENT TESTING (Dashboard)

### Setup
- Go to **Admin** panel if configured, or access agent directly from agent menu
- Part_finder agent should be available

### Test 2.1: WhatsApp Integration (Optional)
**If enabled:**
1. Get WhatsApp connect URL: `base44.agents.getWhatsAppConnectURL('part_finder')`
2. Share link with test user
3. User messages: "What part connects the VR hose?"

**Expected Result:**
- ✅ Conversation starts on WhatsApp
- ✅ Agent responds with matching parts
- ✅ Part numbers prominently displayed

---

## 3. MANUAL MANAGEMENT (Admin Page)

### Setup
1. Go to **Admin** → **Manuals** tab
2. No manuals uploaded yet (expected)

### Test 3.1: Manual Upload
**Steps:**
1. Click **"Add Manual"** button
2. Fill form:
   - Title: "SK700 Service Manual"
   - Manufacturer: "Gilbarco"
   - Model: "SK700"
   - Version: "v2.1"
   - PDF file: Select a real equipment manual (5-50 MB OK)
   - **extract_diagrams:** Toggle ON (for pumps/motors)
3. Submit

**Expected Result:**
- ✅ Manual record created
- ✅ PDF uploaded
- ✅ Manual appears in list with file icon
- ✅ Status shows "⚠ No text extracted" (not yet processed)

---

### Test 3.2: Manual Extraction Queue
**Setup:** Wait or monitor the queue
**Expected Behavior:**
1. **initManualExtraction** triggered (manual create event)
2. Manual queued for processing
3. **processManualQueue** runs every 10 minutes (or manually trigger)
4. **bulkProcessManual** invoked
5. Manual status updates to "✓ Text extracted"

**To Monitor:**
- Go to Admin → Activity Log
- Search for "Manual" entity, "update" action
- Should see manual_text, summary, error_codes populated

---

### Test 3.3: Diagram Extraction
**Setup:** Manual with extract_diagrams = true
**Expected Result:**
- ✅ exploded_view_image_url populated after extraction
- ✅ Image accessible in ManualViewer
- ✅ ExplodedViewViewer shows pan/zoom controls

---

### Test 3.4: Manual Viewer
**Steps:**
1. From **Manuals** page, click a manual
2. View full manual viewer

**Expected Result:**
- ✅ Manual metadata shown (title, manufacturer, model)
- ✅ PDF embedded and viewable
- ✅ Error codes section displayed (if extracted)
- ✅ Troubleshooting steps visible
- ✅ Exploded view diagram with zoom/pan (if extracted)
- ✅ Links to related parts shown

---

## 4. PARTS DATABASE (Admin Page)

### Test 4.1: Create Part
**Steps:**
1. Admin → **Parts** tab → **Add**
2. Fill form:
   - Part Number: `TSG-140852556-A`
   - Description: `SK700 fuel pump seal assembly`
   - Brand: `Parker`
   - Model: `SK700`
   - What it does: `Creates watertight seal for fuel pump housing`
   - Safety warning: `Do not use with mineral oils`
   - Installation steps: 3 steps provided
3. Submit

**Expected Result:**
- ✅ Part created
- ✅ Appears in parts list
- ✅ ActivityLog records "create" event
- ✅ Part searchable in Chat

---

### Test 4.2: Edit Part
**Steps:**
1. Parts list → Click edit (pencil icon)
2. Change: `safety_warning` field
3. Save

**Expected Result:**
- ✅ Part updated
- ✅ ActivityLog records "update" event
- ✅ ActivityLog shows what field changed (from/to values)
- ✅ Chat reflects new safety warning immediately

---

### Test 4.3: Delete Part
**Steps:**
1. Parts list → Click delete (trash icon)
2. Confirm deletion

**Expected Result:**
- ✅ Part removed from database
- ✅ ActivityLog records "delete" event
- ✅ Search no longer finds deleted part
- ✅ If part was favorited, favorite still shows but links to "not found"

---

## 5. OFFLINE MODE TESTING

### Setup
- Have network connection initially
- Queued actions will auto-sync when online

### Test 5.1: Offline Queue
**Steps:**
1. Go to **Offline Mode** page
2. View "Pending Changes" section
3. If any offline-created parts, they show here

**Expected Result:**
- ✅ Queue shows: entity type, action, user, timestamp
- ✅ "Queued" status with clock icon
- ✅ Retry button available
- ✅ Can remove from queue manually

---

### Test 5.2: Conflict Resolution
**Steps:**
1. Create a part while offline (stored in queue)
2. Go online (SyncManager auto-triggers)
3. If sync conflict detected, view in Offline Mode

**Expected Result:**
- ✅ "Conflicts" section shows conflict items
- ✅ Can view: local data vs. server data
- ✅ Can choose "Keep local" or "Accept server"
- ✅ Conflict resolved, action retried

---

### Test 5.3: Favorites Offline
**Steps:**
1. Mark 2-3 parts as favorites (star icon)
2. Go to Favorites page → See them
3. Go offline (toggle network)
4. Refresh page

**Expected Result:**
- ✅ Favorites list still visible (from local storage)
- ✅ Part details cached and readable
- ✅ Can tap through to part cards
- ✅ When online, syncs with server

---

## 6. ACTIVITY LOG TESTING (Admin Page)

### Setup
- Must have created/edited/deleted parts or manuals
- Go to Admin → **Activity Log** tab

### Test 6.1: Log Filtering
**Steps:**
1. **Filter by Entity Type:** Select "Part" → Shows only part changes
2. **Filter by Action:** Select "update" → Shows only updates
3. **Search by User:** Type your email → Shows your changes only

**Expected Result:**
- ✅ Filters apply independently and combine correctly
- ✅ Timestamp shows when action occurred
- ✅ Changes detail shows field → (old → new)

---

### Test 6.2: Change Tracking
**Steps:**
1. Edit a part (change safety_warning)
2. Go to Activity Log
3. Find the update entry for that part

**Expected Result:**
- ✅ Entry shows: UPDATE badge, part name, part ID
- ✅ "Changes" section shows: `safety_warning: {from: "old text", to: "new text"}`
- ✅ User email and exact timestamp recorded

---

## 7. TSG PARTS VERIFICATION (Admin Page)

### Setup
1. Go to Admin → **TSG Verify** tab
2. Prepare TSG original parts list as CSV:
   ```csv
   part_number,description
   140852556,SK700 fuel pump seal assembly
   140852557,SK700 fuel pump gasket
   ```

### Test 7.1: Upload & Verify
**Steps:**
1. Click "Select TSG parts file"
2. Choose your CSV
3. Click "Verify"

**Expected Result:**
- ✅ File parsed (part_number, description extracted)
- ✅ Summary shown: Verified count, Flagged count, Updated count
- ✅ Results list shows each part:
   - ✓ Verified (part matches TSG original)
   - ✗ Discrepancy (name or number changed)
   - ⚠ New part (found in system but not in TSG list)

---

### Test 7.2: Discrepancy Detection
**Setup:** Create a part with part_number="TSG-123" but description different from TSG CSV
**Steps:**
1. Run TSG verification
2. Check results for this part

**Expected Result:**
- ✅ Flagged as "Discrepancy"
- ✅ Message: "Description mismatch: TSG says '...', current is '...'"
- ✅ PartVerification record created with discrepancy details
- ✅ Needs manual admin review

---

## 8. FULL WORKFLOW TEST (End-to-End)

### Scenario: Field Engineer Troubleshoots Equipment

**Setup:** 
- ✅ Parts DB populated with 10+ parts
- ✅ 1 manual uploaded and extracted
- ✅ Errors codes in manual parsed

**Steps:**
1. **FSE opens Chat page**
2. **FSE takes photo of unknown part label**
3. **Chat agent:** OCR extracts number "140852556"
4. **Chat agent:** Searches parts → Finds exact match
5. **FSE reviews:** Part details, safety warnings, installation steps
6. **FSE adds to favorites**
7. **FSE goes offline** (network toggles)
8. **FSE:**  Still able to view favorited part (cached)
9. **FSE goes online** → Offline queue syncs
10. **Admin reviews Activity Log** → Sees all FSE actions logged

**Success Criteria:**
- ✅ All steps complete without errors
- ✅ Data persists offline
- ✅ Sync works on reconnection
- ✅ Audit trail is complete

---

## 9. STRESS TEST

### Large Dataset
1. **Create 100+ parts** (use bulk import)
2. **Upload 3+ manuals** with complex text
3. **Search performance:**
   - Query 1: "pump seal" → Should return top 3 in <2s
   - Query 2: "140852" → Should return exact match in <1s
4. **Manual extraction:** 3 manuals processing concurrently → Monitor for errors

**Expected Result:**
- ✅ No UI freezing
- ✅ Search remains fast
- ✅ Extraction queue processes without race conditions

---

## 10. FINAL SIGN-OFF CHECKLIST

Before production deployment, verify:

- [ ] All 3 agents (Chat, part_finder, parts_verifier) tested & working
- [ ] Manual extraction succeeds on 5+ real equipment PDFs
- [ ] Offline sync tested (create/edit/delete while offline, verify sync online)
- [ ] No database corruption (test delete + re-create cycle)
- [ ] ActivityLog captures all changes
- [ ] TSG parts list uploaded & verified (0 discrepancies)
- [ ] Part_number and description fields immutable (never changed)
- [ ] Image OCR working with field-realistic photos
- [ ] Voice input working in Chrome/Safari
- [ ] Performance acceptable (search <2s for 100+ parts)
- [ ] Backup & disaster recovery plan in place

---

**Status:** Ready for production when all checks pass ✅