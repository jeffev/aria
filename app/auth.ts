import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { IS_DEMO, createGuestUser } from "@/lib/demo";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

// Na demo pública cada visitante ganha uma conta descartável, sem senha.
const guestProvider = Credentials({
  id: "guest",
  name: "Visitante",
  credentials: {},
  async authorize(_credentials, request) {
    // Sem limite, um script cria contas sem parar e enche o banco da demo.
    if (isRateLimited(`guest:${clientIp(request)}`, 10, 60 * 60 * 1000)) return null;
    return createGuestUser();
  },
});

// Login com Google só existe quando o OAuth está configurado (a demo não usa).
const googleProvider =
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })]
    : [];

const passwordProvider = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Senha", type: "password" },
  },
  async authorize(credentials, request) {
    if (!credentials?.email || !credentials?.password) return null;
    if (isRateLimited(`login:${clientIp(request)}`, 10, 15 * 60 * 1000)) return null;

    const user = await prisma.user.findUnique({
      where: { email: credentials.email as string },
    });

    if (!user?.password) return null;

    const valid = await bcrypt.compare(
      credentials.password as string,
      user.password
    );

    if (!valid) return null;
    return user;
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any),
  // Na demo a sessão vive o mesmo que a conta de visitante (24 h).
  session: { strategy: "jwt", ...(IS_DEMO && { maxAge: 24 * 3600 }) },
  // Na demo só existe o visitante: cadastro está desligado e a tela não mostra
  // senha, então deixar o login por senha ativo só abriria espaço pra força bruta.
  providers: IS_DEMO ? [guestProvider] : [...googleProvider, passwordProvider],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
