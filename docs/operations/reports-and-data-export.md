# Reports & Data Export (implementation-backed)

Overview

The repository contains report generation and export capabilities used by the frontend. Reports are implemented as services and may use document templates (SystemSetup) for rendering.

Implemented and verified

- Report services and exporters
  - Report/Services contains document export and data resolver services that can produce exported files and rendered documents using templates (integrates with SystemSetup document templates).
  - Reports are triggered via controllers in the Report module and may produce downloadable files.

- Available formats
  - Exports use PDF/document generation via template rendering service and standard export endpoints. Exact supported formats depend on template rendering service and report implementation.

- Filters and data sources
  - Reports accept query parameters described in controller FormRequests; filters vary by report type.
  - Source data typically comes from inventory, assets, borrowings, and related modules.

- Authorization
  - Report endpoints check policies/roles; dashboards and report visibility are role-protected.

Limitations

- No scheduled/export-by-email report runner was identified in the repository — scheduled report generation and emailing would be an infrastructure extension.

Source-of-truth files

- backend/app/Modules/Report/Services/
- backend/app/Modules/SystemSetup/Services/DocxTemplateService.php
- backend/app/Modules/SystemSetup/Models/DocumentTemplate.php
