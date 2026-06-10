# Email Pipeline Setup Placeholder

ConceptSHOP can store safe email pipeline metadata in Firestore, but actual sending must happen in a backend service.

## Providers

- Gmail / Google Workspace
- Outlook / Microsoft 365
- Custom SMTP

## Backend requirement

- Use a Cloud Function or API route for sending mail.
- Never send email directly from the frontend with raw credentials.

## Safe Firestore fields

- `emailProvider`
- `senderEmail`
- `connectionStatus`
- `tokenLast4`
- `updatedAt`

## Do not store

- Raw OAuth access tokens
- SMTP passwords
- Full API secrets

## Recommended approach

- Keep only masked metadata in Firestore.
- Store secrets in a backend vault or secret manager.
- Use a backend test-connection endpoint instead of exposing provider credentials in the browser.
