import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isValidLoginName } from "@/lib/login-name";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(254).refine(isValidLoginName),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip = request ? clientIp(request.headers) : "unknown";
        const byIp = rateLimit(`login:ip:${ip}`, 20, 15 * 60_000);
        const byEmail = rateLimit(`login:email:${email}`, 8, 15 * 60_000);
        if (!byIp.ok || !byEmail.ok) throw new TooManyAttempts();

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
