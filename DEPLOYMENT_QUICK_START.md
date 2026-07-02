# ⚡ DEPLOYMENT QUICK START (30 MIN OVERVIEW)

## 🎯 WHAT YOU'LL DO

**Backend (AWS)**: Docker container → ECR → ECS → Load Balancer  
**Frontend (Vercel)**: GitHub push → Auto-deploy  
**Database**: PostgreSQL RDS + Redis ElastiCache  

---

## 📋 TIMELINE

| Task | Time | Status |
|------|------|--------|
| Create AWS account + RDS | 10 min | ⏳ Do first |
| Create Redis + ECR | 5 min | ⏳ Then this |
| Build & push Docker image | 5 min | ⏳ Then this |
| Create ECS + Load Balancer | 10 min | ⏳ Then this |
| Connect Vercel | 5 min | ⏳ Finally |
| **TOTAL** | **35 min** | 🎯 |

---

## 🔷 PART 1: AWS BACKEND (20 MIN)

### 1️⃣ Create AWS Account (2 min)
Go to: https://aws.amazon.com/free → Sign up

### 2️⃣ Create RDS Database (5 min)
```
AWS Console → RDS → Create Database
- Engine: PostgreSQL 15
- Free tier template
- Endpoint: Save this URL
- Username: postgres
- Password: Make it strong!
```

### 3️⃣ Create Redis Cache (3 min)
```
AWS Console → ElastiCache → Create Redis
- Name: crm-cache
- Node type: cache.t3.micro
- Endpoint: Save this URL
```

### 4️⃣ Build Docker Image (5 min)
```powershell
cd crm-backend
docker build -t crm-backend:latest .
```

### 5️⃣ Push to ECR (5 min)
```powershell
# Create ECR repo
aws ecr create-repository --repository-name crm-backend

# Get login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag & push
docker tag crm-backend:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest
```

### 6️⃣ Create ECS + Load Balancer (5 min)
```
AWS Console → ECS → Create Cluster
- Cluster name: crm-cluster
- Instance type: t3.micro
- Create Service with Load Balancer
```

**Result**: You get a URL like:
```
http://crm-alb-XXXXX.us-east-1.elb.amazonaws.com
```

---

## 🟡 PART 2: VERCEL FRONTEND (10 MIN)

### 1️⃣ Create Vercel Account (2 min)
Go to: https://vercel.com/signup → Sign with GitHub

### 2️⃣ Import Your Project (2 min)
```
Vercel → Add New → Project
→ Import Git Repository
→ Select CRM-TaskFlow
→ Click Import
```

### 3️⃣ Add Environment Variables (3 min)
```
Settings → Environment Variables

Add:
VITE_API_URL=http://crm-alb-XXXXX.us-east-1.elb.amazonaws.com
VITE_WS_URL=ws://crm-alb-XXXXX.us-east-1.elb.amazonaws.com/ws
VITE_GOOGLE_CLIENT_ID=your_google_id
VITE_GITHUB_CLIENT_ID=your_github_id
```

### 4️⃣ Deploy (3 min)
```
Deployments → Deploy Now
Wait for build... (~5 min)
```

**Result**: You get a URL like:
```
https://crm-taskflow.vercel.app
```

---

## 🔗 CONNECT THEM

### Update Backend CORS
```
AWS ECS → Task Definition
Update environment variables:

CORS_ALLOWED_ORIGINS=https://crm-taskflow.vercel.app
WEBSOCKET_ALLOWED_ORIGINS=https://crm-taskflow.vercel.app
```

### Test It
1. Go to `https://crm-taskflow.vercel.app`
2. Click **Login**
3. Should connect to your AWS backend ✅

---

## 📊 WHAT COSTS MONEY

| Service | Cost |
|---------|------|
| RDS (database) | $0-10/month |
| ElastiCache (redis) | $0-5/month |
| EC2 (compute) | $0-10/month |
| Load Balancer | $16/month |
| Vercel | FREE ✅ |
| **Total** | ~$20-40/month |

**First 12 months**: Free tier saves you money!

---

## 🆘 IF SOMETHING BREAKS

### Backend Not working?
```powershell
# Check logs
aws logs tail /ecs/crm-backend-task --follow

# Likely issues:
# 1. Environment variables wrong → update task definition
# 2. Database down → check RDS console
# 3. Redis down → check ElastiCache console
```

### Frontend not connecting?
1. Check browser console (F12)
2. Verify `VITE_API_URL` is correct
3. Check CORS errors
4. Check backend is running

### CORS error?
1. Update `CORS_ALLOWED_ORIGINS` in backend
2. Redeploy ECS service
3. Wait 5 min for changes

---

## ✅ YOU'RE DONE WHEN

- [ ] Frontend loads at https://crm-taskflow.vercel.app
- [ ] Can see login page
- [ ] Can login (with email or OAuth)
- [ ] Can create tasks
- [ ] Real-time features work (chat)
- [ ] No red errors in browser console

---

## 📚 DETAILED GUIDE

For step-by-step details, see:
📖 `DEPLOYMENT_GUIDE_AWS_VERCEL.md`

This file has:
- Screenshots
- All commands with full options
- Troubleshooting for each step
- Cost breakdown
- Monitoring setup
- Security best practices

---

## 🚀 LET'S GO!

Ready to deploy? Follow these 3 steps:

1. **Read**: `DEPLOYMENT_GUIDE_AWS_VERCEL.md` (40 min)
2. **Execute**: Follow Part 1 & 2 (30 min)
3. **Verify**: Test at your live URLs ✅

**Total Time**: ~70 minutes (first time)

Good luck! 🎉

