# Multi-stage build: avoids Nixpacks/Nix (heavy on disk). Use this in Coolify
# with Build Pack = Dockerfile, base directory = FE.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_BACKEND_URL=https://api.volleyball4-2.com
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_USE_MSW=false

RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
