# Security Specification - MagliaMente

## 1. Data Invariants
- Only authorized admins can create, update, or delete works and categories.
- Anyone can read works and categories.
- Document IDs must be safe (alphanumeric).
- Timestamps must be server-generated.
- Strings like titles and descriptions must have size limits.
- The `admins` collection contains UIDs of authorized users.

## 2. The Dirty Dozen (Attack Payloads)
1. **The Ghost Field Attack**: Adding `isVerified: true` to a work.
   - Result: `PERMISSION_DENIED` (Strict schema check).
2. **The Identity Spoof**: Authenticated user (non-admin) trying to delete a work.
   - Result: `PERMISSION_DENIED` (Admin check failed).
3. **The ID Poisoning**: Using a 1KB string as a category ID.
   - Result: `PERMISSION_DENIED` (isValidId check).
4. **The Temporal Fraud**: Providing a fake `createdAt` from 1999.
   - Result: `PERMISSION_DENIED` (Server timestamp check).
5. **The Resource Exhaustion**: Title with 1MB of text.
   - Result: `PERMISSION_DENIED` (.size() check).
6. **The Unauthenticated Write**: Trying to add a work without logging in.
   - Result: `PERMISSION_DENIED` (isSignedIn check).
7. **The Admin Escalation**: Trying to add own UID to `admins` collection.
   - Result: `PERMISSION_DENIED` (Only existing admins or bootstrap can edit admins).
8. **The Category Nulling**: Updating a work to have an empty category.
   - Result: `PERMISSION_DENIED` (Validation helper).
9. **The Partial Update Gap**: Trying to change the `createdAt` during an update.
   - Result: `PERMISSION_DENIED` (AffectedKeys check).
10. **The orphan Write**: Creating a work with a category that doesn't exist.
    - Result: `PERMISSION_DENIED` (exists() check).
11. **The Malicious Slug**: Category slug with scripts like `<script>`.
    - Result: `PERMISSION_DENIED` (isValidId/regex check).
12. **The Email Spoofing**: Admin check by email string without checking `email_verified`.
    - Result: `PERMISSION_DENIED` (Security rules must use UID lookups).

## 3. Test Runner Concept
The `firestore.rules` will be verified against these patterns.
