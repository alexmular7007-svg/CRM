make a # 🚀 COMPLETE DEPLOYMENT GUIDE: AWS + VERCEL

**Goal**: Deploy Backend on AWS + Frontend on Vercel  
**Time**: ~2-3 hours (first time)  
**Difficulty**: Intermediate

---

## 📋 PREREQUISITES

Before starting, you need:

1. **AWS Account** - Free tier eligible
2. **Vercel Account** - Free tier ok
3. **GitHub Account** - Already have it ✅
4. **API Keys** - Already in .env.example ✅

---

## 🔷 PART 1: BACKEND DEPLOYMENT ON AWS (40 min)

### Phase 1.1: Prepare AWS Account

#### Step 1: Create AWS Account
1. Visit: https://aws.amazon.com/free
2. Sign up (eligible for free tier)
3. Add payment method (needed for billing alerts)
4. Verify email

#### Step 2: Create IAM User
1. Go to **IAM Console**: https://console.aws.amazon.com/iam
2. Click **Users** → **Create user**
3. Name: `crm-deployment`
4. Click **Next**
5. Attach policy: `AdministratorAccess` (for now, restrict later)
6. Click **Create user**
7. Go to user → **Security credentials** → **Create access key**
8. Select **Other** → **Create access key**
9. Copy: **Access Key ID** and **Secret Access Key** (save safely!)

#### Step 3: Install AWS CLI
```powershell
# For Windows
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Or via PowerShell
choco install awscli
```

Configure it:
```powershell
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key
# Default region: us-east-1
# Default format: json
```

---

### Phase 1.2: Set Up RDS Database

#### Step 1: Create RDS Instance
1. Go to **RDS Dashboard**: https://console.aws.amazon.com/rds
2. Click **Create database**
3. Choose:
   - **Engine**: PostgreSQL
   - **Version**: 15.x or latest
   - **Template**: Free tier
4. **Settings**:
   - DB instance identifier: `crm-taskflow-db`
   - Master username: `postgres`
   - Master password: **STRONG PASSWORD** (copy it!)
5. **Connectivity**:
   - Public accessibility: **Yes** (for now)
   - VPC: default
6. Click **Create database** (takes 5-10 min)

#### Step 2: Get Database Info
1. Go to **RDS** → **Databases**
2. Click your database → **Connectivity & security**
3. Copy:
   - **Endpoint**: `crm-taskflow-db.xxxx.us-east-1.rds.amazonaws.com`
   - **Port**: `5432`

#### Step 3: Update .env for Production
```env
DATABASE_URL=jdbc:postgresql://crm-taskflow-db.xxxx.us-east-1.rds.amazonaws.com:5432/crm_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=YOUR_STRONG_PASSWORD
```

---

### Phase 1.3: Set Up Redis on ElastiCache

#### Step 1: Create ElastiCache Redis
1. Go to **ElastiCache**: https://console.aws.amazon.com/elasticache
2. Click **Redis clusters** → **Create**
3. Choose:
   - **Name**: `crm-cache`
   - **Engine version**: 7.0 or latest
   - **Node type**: `cache.t3.micro` (free tier)
4. **Connectivity**:
   - Multi-AZ: Off
   - Auto failover: Off
5. Click **Create**

#### Step 2: Get Redis Endpoint
1. Click your cluster
2. Copy **Primary endpoint**: `crm-cache.xxxx.ng.0001.use1.cache.amazonaws.com:6379`

#### Step 3: Update .env
```env
REDIS_HOST=crm-cache.xxxx.ng.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

### Phase 1.4: Set Up ECR & ECS for Backend

#### Step 1: Create ECR Repository
```powershell
# Create repository
aws ecr create-repository --repository-name crm-backend --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 2: Build & Push Docker Image
```powershell
# From crm-backend folder
cd crm-backend

# Build image
docker build -t crm-backend:latest .

# Tag for ECR
docker tag crm-backend:latest YOUR_AWS_ID.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest

# Push to ECR
docker push YOUR_AWS_ID.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest
```

#### Step 3: Create ECS Cluster
1. Go to **ECS**: https://console.aws.amazon.com/ecs
2. Click **Clusters** → **Create cluster**
3. Choose:
   - **Cluster name**: `crm-cluster`
   - **Infrastructure**: EC2
4. **EC2 instances**:
   - **Desired capacity**: 1
   - **Instance type**: `t3.micro` (free tier)
5. Click **Create**

#### Step 4: Create Task Definition
1. Go to **Task Definitions** → **Create new task definition**
2. **Name**: `crm-backend-task`
3. **Container**:
   - **Name**: `crm-backend`
   - **Image**: `YOUR_AWS_ID.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest`
   - **Port mappings**: `8080:8080`
4. **Environment variables**:
   ```
   SPRING_PROFILES_ACTIVE=prod
   DATABASE_URL=jdbc:postgresql://...
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=...
   JWT_SECRET=...
   XAI_API_KEY=...
   REDIS_HOST=...
   ```
5. Click **Create**

#### Step 5: Create Service
1. Go to your **Cluster** → **Services** → **Create**
2. **Choose launch type**: EC2
3. **Task definition**: crm-backend-task
4. **Service name**: `crm-backend-service`
5. **Desired tasks**: 1
6. Click **Create service**

---

### Phase 1.5: Set Up Load Balancer

#### Step 1: Create Application Load Balancer
1. Go to **EC2** → **Load Balancers**
2. Click **Create Load Balancer**
3. Choose: **Application Load Balancer**
4. **Name**: `crm-alb`
5. **Listener**:
   - Port: 80 (HTTP)
   - Forward to: Target Group
6. Create **Target Group**:
   - **Name**: `crm-backend-tg`
   - **Port**: 8080
   - **Protocol**: HTTP
7. Click **Create**

#### Step 2: Update Service to Use ALB
1. Go to **ECS** → **Services** → Edit
2. **Load balancing**: Add load balancer
3. Choose **ALB** and target group
4. Save

---

### Phase 1.6: Get Backend URL
After ~5 min:
1. Go to **Load Balancers**
2. Copy your ALB's **DNS name**:
   ```
   crm-alb-XXXXX.us-east-1.elb.amazonaws.com
   ```

**Backend URL**: `http://crm-alb-XXXXX.us-east-1.elb.amazonaws.com`

---

## 🟡 PART 2: FRONTEND DEPLOYMENT ON VERCEL (20 min)

### Phase 2.1: Set Up Vercel Account

#### Step 1: Create Vercel Account
1. Visit: https://vercel.com/signup
2. Click **Continue with GitHub**
3. Authorize Vercel to access GitHub

#### Step 2: Import Project
1. Click **Add New** → **Project**
2. **Import Git Repository**
3. Search: `CRM-TaskFlow` (or TASKFLOW-AI)
4. Click **Import**

---

### Phase 2.2: Configure Environment Variables

#### Step 1: Add Env Vars in Vercel
1. In Vercel project → **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_API_URL=http://crm-alb-XXXXX.us-east-1.elb.amazonaws.com
   VITE_WS_URL=ws://crm-alb-XXXXX.us-east-1.elb.amazonaws.com/ws
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=taskflow_avatars
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GITHUB_CLIENT_ID=your_github_client_id
   ```
3. Click **Save**

#### Step 2: Update Root Directory
1. Go to **Project Settings** → **Root Directory**
2. Set: `crm-frontend`
3. Save

---

### Phase 2.3: Deploy Frontend

#### Step 1: Manual Deploy
1. Go to **Deployments**
2. Click **Deploy now** (it auto-deploys from main)
3. Wait for build to complete (~3-5 min)

#### Step 2: Get Frontend URL
After deployment:
- Your **Vercel URL**: `https://your-project-name.vercel.app`

---

## 🔐 PART 3: CONNECT BACKEND & FRONTEND

### Step 1: Update CORS on Backend
1. Go to **ECS** → **Task Definition**
2. **Update task definition**
3. Update environment:
   ```
   CORS_ALLOWED_ORIGINS=https://your-project-name.vercel.app
   WEBSOCKET_ALLOWED_ORIGINS=https://your-project-name.vercel.app
   ```
4. Update service to use new task definition

### Step 2: Update OAuth Redirects
1. Go to **Google Cloud Console**
2. Update OAuth redirect URI:
   ```
   https://your-project-name.vercel.app/oauth2/callback
   ```
3. Same for GitHub OAuth

### Step 3: Test Connection
1. Visit: `https://your-project-name.vercel.app`
2. Try to **Login**
3. Should connect to your AWS backend ✅

---

## 📊 PART 4: MONITORING & LOGS

### Backend Logs
```powershell
# View ECS logs
aws logs tail /ecs/crm-backend-task --follow

# Or in AWS Console
Go to CloudWatch → Logs → Log Groups
```

### Frontend Logs
In Vercel:
1. Go to **Deployments**
2. Click deployment
3. **Logs** tab shows build & runtime logs

---

## 💰 COST ESTIMATE (Monthly)

| Service | Free Tier | Estimated Cost |
|---------|-----------|-----------------|
| RDS (db.t3.micro) | 12 months | $0-10 |
| ElastiCache (micro) | 12 months | $0-5 |
| EC2 (t3.micro) | 12 months | $0-10 |
| Load Balancer | - | $16/month |
| Data Transfer | 1GB/month | $0 |
| Vercel | Free tier | $0 |
| **TOTAL** | - | ~$16-30/month |

**After free tier**: Plan to budget $30-50/month

---

## 🆘 TROUBLESHOOTING

### Backend Not Starting
```bash
# Check logs
aws logs tail /ecs/crm-backend-task --follow

# Common issues:
# 1. Database connection - verify RDS credentials
# 2. Redis connection - verify ElastiCache endpoint
# 3. Environment variables - check task definition
```

### Frontend Not Connecting to Backend
1. Check **VITE_API_URL** is correct
2. Verify backend is running in ECS
3. Check CORS settings on backend
4. Check browser console for errors

### CORS Errors
1. Update `CORS_ALLOWED_ORIGINS` on backend
2. Redeploy ECS service
3. Clear browser cache

---

## ✅ DEPLOYMENT CHECKLIST

### Before Deploying
- [ ] AWS account created
- [ ] RDS database running
- [ ] Redis cluster running
- [ ] ECR repository created
- [ ] Docker image pushed to ECR
- [ ] ECS cluster created
- [ ] Load balancer configured
- [ ] Vercel account created
- [ ] GitHub repo connected to Vercel

### After Deploying
- [ ] Frontend loads
- [ ] Can login
- [ ] WebSocket connects
- [ ] Can create tasks
- [ ] Can chat in real-time
- [ ] OAuth works (Google/GitHub)
- [ ] Database queries work
- [ ] File uploads work
- [ ] No CORS errors
- [ ] No 404s on API calls

---

## 📈 NEXT STEPS

1. **Monitor**: Set up CloudWatch alerts
2. **SSL Certificate**: Update to HTTPS
3. **Domain**: Add custom domain
4. **Database Backup**: Enable RDS automated backups
5. **CDN**: Add CloudFront for static files
6. **CI/CD**: Set up GitHub Actions auto-deploy

---

## 🎯 QUICK COMMANDS REFERENCE

```powershell
# AWS CLI
aws configure
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t crm-backend:latest .
docker tag crm-backend:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest

# View logs
aws logs tail /ecs/crm-backend-task --follow
```

---

## 📞 HELPFUL LINKS

- [AWS Free Tier](https://aws.amazon.com/free)
- [Vercel Docs](https://vercel.com/docs)
- [Spring Boot on AWS](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/java-se-nginx.html)
- [PostgreSQL RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/best_practices.html)

---

**Status**: Ready for deployment  
**Created**: July 2, 2026  
**Version**: 1.0

