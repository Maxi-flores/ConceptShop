# ConceptSHOP Firestore Rules Notes

This document describes the intended access model for the current client-side invite flow.

## Collections

- `users/{uid}`: authenticated user profile used for dashboard access.
- `stakeholders/{uid}`: legacy stakeholder data used by existing dashboard screens.
- `inviteCodes/{code}`: invite documents created by admins and consumed by invited users.

## Recommended rules goals

- Users can read and update their own `users/{uid}` document.
- Admins can read team/member profiles they manage.
- Only admins can create or revoke invite documents.
- Invited users can accept an invite only once.
- Invite documents should transition from `pending` to `accepted` or `revoked` and never be reused.

## Important production note

The current front end validates invite codes directly from Firestore so that `/invite/code` can work before account creation.
That means the invite collection needs some read access from the client, which is not ideal for a public SaaS.

For production, the safest long-term option is:

1. Move invite creation to a Cloud Function.
2. Move invite validation/acceptance to a Cloud Function.
3. Keep Firestore rules strict and let the function enforce invite ownership, status, expiry, and email matching.

## Sample rule sketch

The exact rules will depend on your final identity model and whether admin access is controlled by custom claims or by the profile document.

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    function isAdminProfile() {
      return signedIn()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{uid} {
      allow read: if isOwner(uid) || isAdminProfile();
      allow create: if isOwner(uid);
      allow update: if isOwner(uid) || isAdminProfile();
      allow delete: if false;
    }

    match /stakeholders/{uid} {
      allow read: if isOwner(uid) || isAdminProfile();
      allow write: if isOwner(uid) || isAdminProfile();
    }

    match /inviteCodes/{code} {
      allow read: if signedIn();
      allow create: if isAdminProfile();
      allow update: if isAdminProfile() || (
        signedIn()
        && resource.data.status == 'pending'
        && request.resource.data.status == 'accepted'
        && request.resource.data.acceptedByUid == request.auth.uid
      );
      allow delete: if isAdminProfile();
    }
  }
}
```

## Caveats

- Firestore rules cannot fully validate "invite code belongs to email X" in a safe public-read setup.
- The client-side invite flow works, but it should be treated as an interim implementation.
- Prefer Cloud Functions before opening the product publicly.
