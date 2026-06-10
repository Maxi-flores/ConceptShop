# Integrations Roadmap

ConceptSHOP is designed to grow into a broader platform connection layer. The current frontend only stores safe placeholders and status metadata.

## Future connections

- CRM contacts
- Seller accounts
- Buyer accounts
- Orders
- Shipping records
- Inventory records
- SQL database links
- AWS/customer infrastructure links
- Webhook connectors

## Suggested backend architecture

- Use backend token vaults for all secrets.
- Keep a sync status per connection.
- Log an audit trail for every integration action.
- Store only non-sensitive metadata in Firestore.

## Useful fields

- `status`
- `endpointUrl`
- `tokenLast4`
- `updatedAt`
- `syncStatus`
- `auditTrail`

## Frontend rule

- The frontend can display configuration, status, and placeholders.
- The frontend should not persist raw API secrets.
- Production syncing should always happen through a backend service.
