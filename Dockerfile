# ধাপ ১: Vite React অ্যাপ বিল্ড করা
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ধাপ ২: Nginx দিয়ে Vite-এর 'dist' ফোল্ডার সার্ভ করা
FROM nginx:alpine

# Vite বিল্ড আউটপুট 'dist' ফোল্ডারে যায়
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]