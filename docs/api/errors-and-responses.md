# Errors and Response Shapes

Global JSON response wrapper (RespondsWithJson trait)

Successful response format (example):

{
  "success": true,
  "message": "Assets retrieved successfully.",
  "data": { /* resource payload */ }
}

Error response format (example):

{
  "success": false,
  "message": "An error occurred.",
  "errors": { /* validation or domain errors */ }
}

Common status codes produced by controllers
- 200 OK — successful operations
- 201 Created — resource creation (e.g., POST /assets)
- 400 Bad Request — domain errors
- 401 Unauthorized — unauthenticated (Sanctum middleware)
- 403 Forbidden — authorization failures (policies, role middleware)
- 404 Not Found — missing resources
- 422 Unprocessable Entity — validation errors

Validation errors
- Controllers and FormRequest classes return 422 with validation error details in the errors property.

Source of truth
- backend/app/Modules/Asset/Traits/RespondsWithJson.php
- All controllers using the trait (search for "use RespondsWithJson")
