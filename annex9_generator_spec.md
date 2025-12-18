# Spec: Taxi Collectif “Bon de commande” Generator (Wallonia – Annex 9)

## 1. Goal
Build a small application that automatically generates a **“Bon de commande d’un service de taxis collectifs”** document (Annex 9 model of the Walloon Government Decree / Order) from structured input data, exporting a **print-ready PDF** (and optionally DOCX) that matches the official layout as closely as possible.

The app must:
- Collect the required booking/order data through a simple UI (web form) and/or CLI.
- Validate mandatory fields and formats.
- Produce a final PDF with the **Annex 9 layout** (header, title, stamps/areas, fields).
- Store generated documents with a unique reference number.
- Allow re-generation and editing from saved data.

> Note: The exact field list and layout must be driven by a **template definition** derived from the official Annex 9 form. The system should be flexible enough to update the template if the law or formatting changes.

## 2. Users & Use Cases
### Users
- Taxi operator / dispatcher
- Administrative staff
- Compliance officer / auditor

### Core Use Cases
1. Create a new order by filling a form → Generate PDF.
2. Load an existing order by reference → Re-generate the PDF identically.
3. Batch-generate multiple orders from CSV/Excel import.
4. Maintain template versions (e.g., “Annex9_v2009”, “Annex9_vYYYY”).

## 3. Output Requirements
### PDF Requirements
- A4 portrait
- Embedded fonts
- Consistent margins
- Crisp text (vector, not raster)
- Stable rendering across viewers (Adobe, Preview, etc.)
- File naming convention: `annex9_order_<reference>_<YYYYMMDD>.pdf`

### Optional Output
- DOCX (for editing) + PDF render
- PNG preview (thumbnail)

## 4. Data Model
### Entities
#### `Order`
- `id` (UUID)
- `reference` (string, unique; e.g., `TC-2025-000123`)
- `created_at`, `updated_at`
- `template_version` (string; default `Annex9_v2009`)
- `status` (draft | generated | sent | archived)
- `language` (fr by default; multi-language support optional)
- `data` (JSON blob with all fields used to render the document)

#### `Template`
- `version` (string)
- `name` (string)
- `description`
- `layout_spec` (JSON) defining positions, fonts, and fields
- `assets` (images: logos, stamps placeholders, etc.)

## 5. Field Specification (Template-Driven)
Implement a template-driven approach so the field list is not hard-coded.

### Field Types
- `text` (single line)
- `textarea` (multi-line)
- `date`
- `time`
- `number`
- `checkbox`
- `signature_block` (name + signature image or sign-on-screen)
- `stamp_block` (operator stamp placeholder)
- `computed` (auto-filled: reference, creation date, totals, etc.)

### Example Field Groups (to be confirmed from Annex 9)
- Operator identification (name, address, license/authorization)
- Passenger details (name, contact, if applicable)
- Trip details (pickup address, drop-off address, date/time, route notes)
- Service modality (collective taxi service)
- Pricing/charge details (if the form includes them)
- Validation blocks (operator stamp, signatures)
- Legal references (pre-filled header text)

## 6. Validation Rules
- Mandatory fields are defined by the template (per field `required=true`).
- Dates must be valid and in local format (FR: `DD/MM/YYYY`).
- Times in `HH:MM`.
- Prevent PDF generation if required fields missing.
- Address: allow multiline, enforce max length to avoid overflow.
- If signatures are required, ensure a signature image exists.

## 7. Rendering Engine
### Recommended Strategy
Use a **fixed-layout PDF renderer** driven by the template layout spec:
- Coordinates in millimeters mapped to PDF points.
- Each field has a bounding box (x, y, w, h).
- Text auto-wraps inside its box.
- Font size scales down slightly if overflow (configurable per field).
- Optional debug mode to draw field bounding boxes.

### Implementation Options
- Node.js: `pdf-lib` or `PDFKit`
- Python: `reportlab`
- Web: Server-side generation preferred for consistent output.

### Template Approaches
**Approach A (Preferred): Overlay on official blank form**
1. Store the official Annex 9 blank form as a PDF background (`annex9_blank.pdf`).
2. Render user-entered values as an overlay on top (text/signature).
Pros: Perfect layout alignment, easier compliance.
Cons: Need a clean blank background PDF and careful coordinate tuning.

**Approach B: Rebuild layout from scratch**
Pros: No background dependency.
Cons: Harder to match official form precisely; more maintenance.

## 8. UI/UX Requirements
### Web UI (Minimal)
- New Order page: form with sections matching the document.
- “Generate PDF” button.
- Preview panel (optional): rendered PDF preview in-browser.
- Order list with search by reference, date, passenger name (if present).
- “Export” actions: PDF download, email send (optional).

### CLI (Optional)
- `generate --template Annex9_v2009 --input order.json --output out.pdf`
- `batch-generate --csv orders.csv --outdir ./out`

## 9. Import/Export
### Import
- CSV / XLSX with a mapping configuration:
  - Columns → template fields
  - Provide a mapping UI or JSON mapping file.

### Export
- PDF (mandatory)
- JSON snapshot of rendered data (for audit)
- Optional: ZIP bundle per order (PDF + JSON + signature images)

## 10. Audit & Compliance
- Store a **render snapshot** (final JSON + template version + hash).
- Keep immutable generated PDFs (do not overwrite; version them).
- Add a PDF metadata block: author, reference, creation timestamp.
- Ability to reproduce the exact PDF later from the stored snapshot.

## 11. Security & Privacy
- Role-based access (admin, operator, viewer).
- Encrypt stored signatures at rest (if stored).
- Avoid embedding more personal data than required.
- Basic logging (who generated what, when).

## 12. Non-Functional Requirements
- Generate a PDF in < 2 seconds for a single order.
- Batch: 1,000 orders under 10 minutes on a standard server.
- Deterministic output: same input + same template → identical PDF bytes (ideally).

## 13. Template Layout Spec (JSON)
Define a schema like:

```json
{
  "version": "Annex9_v2009",
  "page": {"size": "A4", "orientation": "portrait"},
  "fonts": [{"name":"Helvetica","path":null}],
  "background_pdf": "annex9_blank.pdf",
  "fields": [
    {
      "key": "operator_name",
      "type": "text",
      "required": true,
      "box_mm": {"x": 20, "y": 55, "w": 120, "h": 7},
      "font": {"name":"Helvetica","size": 10},
      "wrap": false,
      "align": "left"
    }
  ]
}
```

The rendering engine must:
- Convert `box_mm` to PDF coordinates.
- Place text with padding (e.g., 1.5mm).
- Wrap/clip per settings.
- Support optional fixed-line baseline placement for forms.

## 14. Testing Plan
- Unit tests for:
  - Field validation
  - Coordinate conversion mm→pt
  - Text wrapping & overflow rules
- Golden-file tests:
  - Render sample orders and compare PDF hashes or visual diff (pixel-based).
- Template calibration tests:
  - Use a “grid” debug overlay to tune positions.

## 15. Deliverables
1. Minimal web app + PDF generator
2. Template `Annex9_v2009` (layout JSON + background PDF)
3. Sample data set (10 orders) + expected PDFs
4. Admin guide: how to update field positions & add template versions

## 16. Open Questions (for implementation)
- Do we have a clean official blank PDF (without filled sample text)? If not, we must create one or rebuild layout.
- Which signature method is needed: image upload only, or on-screen signing?
- Multi-language: keep FR only (official form) or generate bilingual labels?

---
**Success criteria:** A dispatcher can enter an order in < 2 minutes and produce a PDF that matches the official Annex 9 “bon de commande” format, suitable for printing and auditing.
