FROM node:20-alpine

WORKDIR /app

# 1. Copy package files first
COPY package*.json ./

# 2. Install your dependencies
RUN npm install

# 3. Copy the rest of your application source code
COPY . .

# 4. Set the build arguments right before the build step
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# 5. Run the build (with the log flag to prevent silent crashes)
RUN npm run build --max-logs=0

EXPOSE 5173

# 6. Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]