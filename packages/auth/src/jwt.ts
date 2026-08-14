import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export type AccessTokenClaims = {
  sub: string;
  type: "access";
};

export async function signAccessToken(
  secret: string,
  userId: string,
  ttlSeconds = 900,
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(key);
}

export async function verifyAccessToken(secret: string, token: string): Promise<string | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    if (payload.type !== "access" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export type IdTokenClaims = JWTPayload & {
  sub: string;
  email?: string;
  email_verified?: boolean;
  nonce?: string;
};

export async function signIdToken(
  secret: string,
  issuer: string,
  audience: string,
  claims: { sub: string; email?: string; email_verified?: boolean; nonce: string },
  ttlSeconds = 300,
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  const builder = new SignJWT({
    email: claims.email,
    email_verified: claims.email_verified ?? false,
    nonce: claims.nonce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`);

  return builder.sign(key);
}

export async function verifyIdToken(
  secret: string,
  token: string,
  expected: { issuer: string; audience: string; nonce: string },
): Promise<IdTokenClaims | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, {
      issuer: expected.issuer,
      audience: expected.audience,
    });
    if (payload.nonce !== expected.nonce) return null;
    if (!payload.sub) return null;
    return payload as IdTokenClaims;
  } catch {
    return null;
  }
}
