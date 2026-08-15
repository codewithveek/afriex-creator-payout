# server/Dockerfile
# Build context must be the repo root (see docker-compose.yml), because the
# pnpm workspace lockfile lives there.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# Install workspace deps for the server package only
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY server/package.json server/
RUN pnpm install --frozen-lockfile --filter server

# Build
COPY server/ server/
RUN pnpm --filter server build

# Dev dependencies are kept in this image on purpose: the same image runs
# drizzle-kit migrations and the seed script in the one-shot migrate service.
EXPOSE 4000
CMD ["node", "server/dist/server.js"]
