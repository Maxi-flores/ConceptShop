# ConceptSHOP Architecture

## Current Structure

ConceptSHOP is a React/Vite frontend application.

Known top-level areas:

- `src/` - application source.
- `public/` - public assets.
- `dist/` - build output.
- `package.json` - scripts and dependency metadata.

## Main Modules

Observed source areas include:

- `src/components/` - reusable UI and workflow components.
- `src/pages/` - route-level pages.
- `src/context/` - React context providers.
- `src/firebase/` - Firebase integration modules.
- `src/services/` - domain services such as forecasting and marketing.
- `src/utils/` - utility helpers.
- `src/constants/` - shared constants.

## Data Flow

The frontend manages UI state through React context and domain services. Firebase modules provide persistence and authentication integration. AWS SDK dependencies indicate additional cloud integration points.

## Runtime Flow

Local runtime is Vite-based:

```powershell
npm run dev
```

Production build uses:

```powershell
npm run build
```

## Dependencies

Key dependencies include React, Vite, Firebase, AWS SDK clients, Framer Motion, i18next, Recharts, regression, and UUID.

## Integration Points

- Firebase authentication and data services.
- AWS Lambda/S3 client dependencies.
- Forecasting and marketing services.
- Product, order, shipping, stakeholder, and chat workflows.

## Known Boundaries

- Governance tasks must not change product code.
- Environment files and credentials are sensitive.
- Lockfiles and dependencies require explicit review.

## Future Architecture Notes

- Add detailed data model documentation.
- Document Firebase collection usage.
- Document AWS integration responsibilities.
- Add validation expectations for critical user workflows.
