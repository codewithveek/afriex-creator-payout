# client/Dockerfile
# Build context must be the repo root (see docker-compose.yml).
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo

# NEXT_PUBLIC_* variables are inlined into the browser bundle at BUILD time,
# so the API URL must be a build arg, and it must be the URL the BROWSER can
# reach (localhost:4000 on your machine), not the compose service name.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY client/package.json client/
RUN pnpm install --frozen-lockfile --filter client

COPY client/ client/
RUN pnpm --filter client build

EXPOSE 3000
CMD ["pnpm", "--filter", "client", "start"]
