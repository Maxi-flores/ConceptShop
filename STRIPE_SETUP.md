# Stripe Setup Placeholder

ConceptSHOP currently uses a placeholder billing flow. When Stripe is added for real, wire it like this:

## Products

- Premium Monthly: `€6/month`
- Pro Yearly: `€60/year`

## Backend

- Create a Checkout Session endpoint in your backend or Cloud Function.
- Create webhook handlers for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

## Firestore updates

Update `users/{uid}` from the backend webhook only:

- `stripeCustomerId`
- `stripeSubscriptionId`
- `licensePlan`
- `billingStatus`
- `currentPeriodEnd`

## Security

- Never expose Stripe secret keys in the frontend.
- Never store secret API keys in Firestore.
- Keep the frontend limited to safe, non-sensitive plan metadata.
