# Production Deployment Guide

Complete guide to deploy Doc.X Intelligent Document Management System to production.

---

## 🎯 Prerequisites

- GitHub account
- Netlify or Vercel account (for frontend)
- Render.com account (for backend)
- Supabase account (for database + storage)
- OpenRouter API key (for GPT-4)
- OpenAI API key (for embeddings)

---

## 📦 Step 1: Setup Supabase (Database + Storage)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Project name: `docx-intelligent`
   - Database password: (save securely)
   - Region: Choose closest to your users
4. Wait for project to be created

### 1.2 Create Documents Table

1. Go to **SQL Editor** in Supabase dashboard
2. Run the following SQL:

```sql
-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  object_path VARCHAR(500) NOT NULL,
  department VARCHAR(100),
  summary TEXT,
  confidence FLOAT,
  vector_id VARCHAR(255),
  source VARCHAR(50) DEFAULT 'manual',
  priority VARCHAR(20) DEFAULT 'normal',
  is_private BOOLEAN DEFAULT FALSE,
  owner_email VARCHAR(255),
  owner_user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_department ON documents(department);
CREATE INDEX idx_documents_upload_date ON documents(created_at DESC);
CREATE INDEX idx_documents_private ON documents(is_private, owner_email);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth)
CREATE POLICY "Enable all access for authenticated users" ON documents
  FOR ALL USING (true);
```

### 1.3 Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click "Create bucket"
3. Bucket name: `documents`
4. Public bucket: **Yes** (or set up RLS policies)
5. Click "Create"

### 1.4 Get Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon/public key** (or service_role key for backend)

---

## 🖥️ Step 2: Deploy Backend to Render

### 2.1 Push Code to GitHub

```bash
cd /path/to/Doc.X-Intelligent
git init
git add .
git commit -m "Initial commit - production ready"
git branch -M main
git remote add origin https://github.com/yourusername/docx-intelligent.git
git push -u origin main
```

### 2.2 Create Render Service

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `docx-backend`
   - **Region**: Oregon (or closest)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - **Instance Type**: Starter (or higher)

5. Add Environment Variables:
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_KEY` = Your Supabase service key
   - `STORAGE_BUCKET` = `documents`
   - `OPENROUTER_API_KEY` = Your OpenRouter key
   - `OPENAI_API_KEY` = Your OpenAI key
   - `ENVIRONMENT` = `production`
   - `LOG_LEVEL` = `INFO`

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL (e.g., `https://docx-backend.onrender.com`)

**Note:** ChromaDB runs embedded within the backend service - no separate deployment needed.

---

## 🌐 Step 3: Deploy Frontend to Netlify/Vercel

### Option A: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import existing project"
3. Connect GitHub repository
4. Configure:
   - **Branch**: `main`
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

5. Add Environment Variable:
   - `VITE_API_URL` = Your Render backend URL (e.g., `https://docx-backend.onrender.com`)

6. Click "Deploy site"
7. Copy your frontend URL (e.g., `https://docx-intelligent.netlify.app`)

### Option B: Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:
   - `VITE_API_URL` = Your Render backend URL (e.g., `https://docx-backend.onrender.com`)

6. Click "Deploy"
7. Copy your frontend URL

---

## 🔧 Step 4: Configure CORS

Update your backend CORS settings:

1. Go to Render dashboard → Your backend service
2. Add/Update environment variable:
   - `CORS_ORIGINS` = `https://your-frontend.netlify.app` (or Vercel URL)

3. Redeploy or restart service

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Backend Health

Visit: `https://your-backend.onrender.com/health`

Should return:
```json
{
  "status": "healthy",
  "services": {
    "database": true,
    "storage": true,
    "vector_db": true
  }
}
```

### 5.2 Check Frontend

1. Visit your frontend URL
2. Try logging in (default: `department123` / `456`)
3. Upload a test document
4. Check if it appears in dashboard

---

## 🔐 Step 6: Setup Gmail Integration (Optional)

### 6.1 Local Setup

1. Create Google Cloud Project
2. Enable Gmail API
3. Download OAuth credentials → save as `backend/gmail_credentials.json`
4. Run `python backend/gmail_setup.py` locally
5. Authenticate in browser
6. Token saved to `gmail_token.json`

### 6.2 Deploy to Render

1. In Render dashboard, go to your backend service
2. Go to "Shell" tab
3. Upload `gmail_credentials.json` and `gmail_token.json` to backend directory

4. Create a Cron Job (Render free tier supports this):
   - Go to "Cron Jobs" in Render
   - Create new job:
     - **Command**: `cd backend && python gmail_ingestion.py`
     - **Schedule**: `0 */6 * * *` (every 6 hours)

---

## 📊 Step 7: Monitor & Maintain

### Render Monitoring
- View logs in Render dashboard
- Set up alerts for service failures
- Monitor CPU/memory usage
- Check for errors in logs

### Supabase Monitoring
- Check database size usage
- Monitor storage bucket usage
- Review query performance in dashboard
- Set up backups

### Netlify/Vercel Monitoring
- Check build logs for errors
- Monitor bandwidth usage
- View analytics and traffic
- Check function logs (if using)

---

## 🚀 Production Checklist

- [ ] Supabase database created with correct schema
- [ ] Supabase storage bucket created (`documents`)
- [ ] Backend deployed to Render with all environment variables
- [ ] Frontend deployed to Netlify/Vercel with API URL configured
- [ ] CORS configured correctly in backend
- [ ] Health endpoint returns healthy status
- [ ] Test document upload works end-to-end
- [ ] Test search functionality
- [ ] Test private documents feature
- [ ] Gmail integration configured (optional)
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active (automatic)
- [ ] Monitoring and alerts set up
- [ ] Error tracking configured

---

## 🔄 Continuous Deployment

Both services auto-deploy on git push:

```bash
# Make changes to your code
git add .
git commit -m "Your changes description"
git push origin main

# Render and Netlify/Vercel will automatically deploy
# Wait 2-5 minutes for deployment to complete
```

---

## 💡 Troubleshooting

### Backend Issues
- **Build fails**: Check requirements.txt versions
- **Service crashes**: Check Render logs for Python errors
- **Database errors**: Verify Supabase credentials
- **Storage errors**: Check bucket name and permissions

### Frontend Issues
- **Build fails**: Check Node version and dependencies
- **API not connecting**: Verify `VITE_API_URL` is correct
- **CORS errors**: Update backend CORS_ORIGINS
- **Blank page**: Check browser console for errors

### Storage Issues
- **Upload fails**: Verify Supabase bucket exists and is public
- **Download fails**: Check object path in database
- **Permission errors**: Review Supabase bucket policies

### Common Fixes
```bash
# Rebuild frontend
cd frontend && npm run build

# Test backend locally
cd backend && uvicorn main:app --reload

# Check environment variables
echo $VITE_API_URL  # Frontend
echo $SUPABASE_URL  # Backend
```

---

## 📞 Support Resources

- **Render**: [render.com/docs](https://render.com/docs)
- **Netlify**: [docs.netlify.com](https://docs.netlify.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)

---

## 💰 Cost Estimation

**Free Tier (Development/Testing)**
- Render: Free for 750 hours/month (sleeps after 15 min inactivity)
- Netlify/Vercel: 100GB bandwidth free
- Supabase: 500MB database + 1GB storage free
- **Total**: $0/month

**Paid Tier (Production)**
- Render Starter: $7/month (always on)
- Netlify Pro: $19/month (or Vercel Hobby: Free)
- Supabase Pro: $25/month
- OpenRouter: ~$5-20/month (usage-based)
- **Total**: ~$56-81/month

---

**🎉 Your Doc.X system is now production-ready and deployed!**
