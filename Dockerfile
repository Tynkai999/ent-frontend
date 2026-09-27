# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# ─── Développement (code monté en volume, HMR Vite) ─────────────────────────
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ─── Build (assets statiques de production) ─────────────────────────────────
FROM deps AS build
COPY . .
RUN npm run build

# ─── Production (nginx sert les assets) ──────────────────────────────────────
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
