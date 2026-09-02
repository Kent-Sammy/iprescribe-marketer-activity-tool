export {};

/**
 * Shape of the Clerk session token claims used for role-based access control.
 *
 * Requires a custom session token in the Clerk Dashboard
 * (Sessions -> Customize session token):
 *
 *   { "metadata": "{{user.public_metadata}}" }
 *
 * so `sessionClaims.metadata.role` is available in middleware without a
 * round-trip to the Clerk API.
 */
declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: "admin" | "marketer";
    };
  }
}
