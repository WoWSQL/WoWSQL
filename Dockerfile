# VelClaWSQL Studio — production container
# Build context: repository root
FROM node:20-alpine AS deps
WORKDIR /app
COPY studio/package.json studio/package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY studio/ ./
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_KONG_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_DASHBOARD_URL
ARG NEXT_PUBLIC_ANON_KEY
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_KONG_URL=${NEXT_PUBLIC_KONG_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL}
ENV NEXT_PUBLIC_ANON_KEY=${NEXT_PUBLIC_ANON_KEY}
RUN node -e "for (const k of ['NEXT_PUBLIC_API_URL','NEXT_PUBLIC_KONG_URL','NEXT_PUBLIC_WS_URL','NEXT_PUBLIC_DASHBOARD_URL']) { const v=process.env[k]; if (!v) throw new Error(k+' is required for production build'); const u=new URL(v); if (!['https:','wss:'].includes(u.protocol) || /^(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)$/i.test(u.hostname)) throw new Error(k+' must be a public HTTPS/WSS URL, not localhost'); }"
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
