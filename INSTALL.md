# DOC.X Intelligent - Installation Guide

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18 or higher
- Python 3.8 or higher  
- Git
- A Supabase account
- An OpenRouter API key

### 2. Clone Repository
```bash
git clone https://github.com/shaniya-v/Doc.X-Intelligent.git
cd Doc.X-Intelligent
```

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python app.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Database Setup (Supabase)
1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql`
3. Add your Supabase URL and key to `.env`

### 6. N8N Setup (Optional)
```bash
npm install -g n8n
n8n import:workflow workflows/DOC.X-Intelligent-Gmail-Processor.json
n8n start
```

### 7. Access the Application
- Frontend: http://localhost:3001
- Backend: http://localhost:5000
- N8N: http://localhost:5678

## 🔧 Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports in configuration files
2. **API key errors**: Verify your OpenRouter and Supabase keys
3. **CORS issues**: Check CORS_ORIGINS in .env
4. **File upload errors**: Verify file size limits and formats

### Getting Help
- Check our [GitHub Issues](https://github.com/shaniya-v/Doc.X-Intelligent/issues)
- Read the [full documentation](README.md)
- Contact support: support@docx-intelligent.com