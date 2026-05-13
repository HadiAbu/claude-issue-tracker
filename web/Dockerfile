FROM node:20-alpine

WORKDIR /app

# Add this line before the build step in web/Dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
