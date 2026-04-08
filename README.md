## ✅ Prerequisite Configuration

### 1) Add `config.env` in `config/config.env` first
Create/modify `config/config.env` with the following values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI={Your_MongoDB_URL_with_password}
JWT_SECRET=asdfjkl;;lkjfdsa
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
```

### 2) Important Notes About Test Data
- PREREQ* testcase need to be run first in order to update environment file.
- postman-environment.json will be updated every time the testcase ran, to reflect the new shop ID and user, admin token.

## 🚀 How to Run

```bash
npm install
npm run dev
```

## 🌏 Access the Frontend
👉 http://localhost:5000

## 🔧 How to do testcase

### Postman (Easiest)
1. Import `massage-reservation-tests.json`
2. Import `postman-environment.json`
3. Select the environment
4. Click **Runner** → **Run**

---

### Newman (CLI)
```bash
cd {Your_Directory}/be-project-68-bitkrub/testcase

npx newman run massage-reservation-tests.json \
  -e postman-environment.json \
  --export-environment postman-environment.json \
  --delay-request 100
```

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/iG82Gnyy)
