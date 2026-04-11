FROM node:22-alpine AS build
WORKDIR /app

COPY . .
RUN npm ci
RUN npm run build --workspace @sra/api

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV API_PORT=4000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
