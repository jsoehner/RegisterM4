FROM node:22-alpine AS build
WORKDIR /app

COPY . .
RUN mkdir -p apps/web/public
RUN npm ci
RUN npm run build --workspace @sra/web

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/next.config.js ./apps/web/next.config.js

USER node

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "apps/web", "-p", "3000", "-H", "0.0.0.0"]
