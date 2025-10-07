# DOC.X Intelligent Frontend

A React-based frontend for the DOC.X Intelligent document management system, featuring department-wise document organization and intelligent document routing.

## 🚀 Features

- **Department Dashboard**: Separate views for Engineering, Finance, and HR departments
- **Document Management**: View, analyze, and download documents
- **Real-time Analytics**: Live document statistics and processing insights
- **Smart Routing**: AI-powered document department assignment
- **Responsive Design**: Works on desktop and mobile devices
- **Multi-language Support**: English and Malayalam content support

## 🏗️ Architecture

### Components Structure
```
src/
├── components/
│   ├── Layout.tsx           # Main application layout with navigation
│   ├── Dashboard.tsx        # Overview dashboard with statistics
│   ├── DepartmentPage.tsx   # Department-specific document view
│   └── DocumentViewer.tsx   # Detailed document view and analysis
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/
│   ├── api.ts              # API communication functions
│   └── constants.ts        # Application constants and utilities
├── App.tsx                 # Main application component
└── main.tsx               # Application entry point
```

### Department Categories
1. **Engineering** (എഞ്ചിനീയറിംഗ്)
   - Track maintenance, signal systems, infrastructure
   - Technical repairs and asset management

2. **Finance** (ധനകാര്യം)
   - Budget management, procurement, vendor payments
   - Financial reporting and audit compliance

3. **Human Resources** (മാനവ വിഭവശേഷി)
   - Employee management, training, recruitment
   - HR policies and performance management

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 16+ and npm/yarn
- DOC.X Backend running on port 5000
- N8N workflow for document processing

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd "C:\Doc.X Intelligent\frontend"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open your browser to `http://localhost:3000`

### Build for Production
```bash
npm run build
npm run preview
```

## 🔧 Configuration

### Environment Setup
The frontend automatically proxies API requests to the backend:
- Frontend: `http://localhost:3000`
- Backend API: `http://127.0.0.1:5000/api`

### Backend Requirements
Ensure the following endpoints are available:
- `GET /api/documents` - Fetch documents with filtering
- `GET /api/departments/stats` - Department statistics
- `GET /api/analysis/document/:id` - Individual document details
- `GET /api/documents/download/:id` - Document download

## 📊 Features Overview

### Dashboard
- Real-time document count and statistics
- Department workload overview
- Recent documents list
- Source platform distribution

### Department Pages
- Filtered document views by department
- Priority-based organization (Urgent, High, Normal, Low)
- Source filtering (Gmail, SharePoint, Maximo, WhatsApp)
- Document metadata and analysis insights

### Document Viewer
- Detailed document information
- AI analysis summary and key topics
- Sender information and email context
- Recommended actions and priority alerts
- Department assignment details

## 🎨 UI/UX Features

### Design System
- Tailwind CSS for consistent styling
- KMRL brand colors and typography
- Responsive grid layouts
- Accessible component design

### Interactive Elements
- Hover states and smooth transitions
- Loading states and error handling
- Priority badges and status indicators
- Department color coding

### Navigation
- Breadcrumb navigation
- Department quick access
- Live status indicator
- Contextual links and actions

## 📁 Document Processing Flow

1. **N8N Workflow** → Sends documents to backend
2. **Backend Processing** → AI analysis and department routing
3. **Frontend Display** → Department-wise organization
4. **User Interaction** → View, analyze, and download documents

## 🔍 Document Information Display

For each document, the frontend shows:
- **Basic Info**: Title, filename, file type, size
- **Processing Details**: AI confidence, department assignment, priority
- **Content Analysis**: Summary, key topics, recommended actions
- **Source Context**: Sender information, email subject, date
- **Department Data**: Assigned department, contact info, due dates

## 🚀 Development

### Adding New Features
1. Create new components in `src/components/`
2. Update types in `src/types/index.ts`
3. Add API functions in `src/utils/api.ts`
4. Update routing in `App.tsx`

### Styling Guidelines
- Use Tailwind CSS classes
- Follow existing color scheme (KMRL blue, priority colors)
- Maintain responsive design patterns
- Include hover states and transitions

## 🔗 Integration Points

### Backend APIs
- Document retrieval and filtering
- Department statistics and workload
- Document analysis and insights
- File download and storage

### N8N Workflow
- Document upload and processing
- Multi-platform source handling
- Attachment detection and routing

## 📱 Responsive Design

The frontend adapts to different screen sizes:
- **Desktop**: Full layout with sidebar and detailed views
- **Tablet**: Stacked layout with accessible navigation
- **Mobile**: Optimized single-column layout

## 🔐 Security Considerations

- API requests through proxy to avoid CORS issues
- No sensitive data stored in frontend
- Secure document download through backend
- Input validation and error handling

## 📈 Performance

- Lazy loading of document lists
- Efficient API calls with caching
- Optimized bundle size with tree shaking
- Fast development server with HMR

## 🛟 Troubleshooting

### Common Issues
1. **Backend Connection**: Ensure backend is running on port 5000
2. **Missing Documents**: Check N8N workflow processing
3. **Styling Issues**: Verify Tailwind CSS compilation
4. **Type Errors**: Update TypeScript type definitions

### Development Tools
- React Developer Tools
- VS Code with TypeScript support
- Browser developer console
- Network tab for API debugging

## 🎯 Future Enhancements

- Real-time document updates via WebSocket
- Advanced search and filtering
- Document collaboration features
- Mobile app development
- Offline document access

---

**DOC.X Intelligent** - Smart India Hackathon 2025 🏆