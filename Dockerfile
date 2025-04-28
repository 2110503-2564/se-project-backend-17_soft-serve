# ใช้ Node.js ที่เหมาะสม
FROM node:18-alpine

# กำหนด Working Directory
WORKDIR /usr/src/app

# คัดลอกไฟล์ package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกโค้ดทั้งหมดไปยัง container
COPY . .

# กำหนดพอร์ตที่ backend จะรัน
EXPOSE 5000

# รัน backend ด้วยคำสั่ง dev หรือ start (พัฒนาหรือ production)
CMD ["npm", "run", "dev"]
