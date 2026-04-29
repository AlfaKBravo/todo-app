FROM node:20-slim as builder

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Final stage
FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/index.js ./
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/config ./config
COPY --from=builder /app/utils ./utils

EXPOSE 5000

# We use prisma db push in the CMD for simplicity in this small app, 
# but in larger apps we'd use migrations.
CMD ["sh", "-c", "npx prisma db push && node index.js"]
