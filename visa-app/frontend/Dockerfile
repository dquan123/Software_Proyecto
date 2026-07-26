FROM node:20

WORKDIR /app

ARG VITE_API_URL
ARG VITE_API_PORT

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_PORT=$VITE_API_PORT

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]

#Frontend Dockerfile
