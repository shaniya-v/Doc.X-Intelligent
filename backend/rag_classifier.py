import os
import json
import numpy as np
from typing import List, Dict, Any
import requests
from datetime import datetime
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class RAGDepartmentClassifier:
    """RAG-based department classification for KMRL documents"""
    
    def __init__(self):
        self.openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        if not self.openrouter_api_key:
            print("⚠️ WARNING: OPENROUTER_API_KEY not found in environment")
        else:
            print(f"🔑 OpenRouter API key loaded: {self.openrouter_api_key[:15]}...")
        self.knowledge_base = []
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.document_vectors = None
        self.department_embeddings = {}
        self.load_knowledge_base()
        
    def load_knowledge_base(self):
        """Load existing KMRL document knowledge base"""
        knowledge_path = os.path.join(os.path.dirname(__file__), 'data', 'kmrl_knowledge_base.json')
        vectors_path = os.path.join(os.path.dirname(__file__), 'data', 'document_vectors.pkl')
        
        try:
            if os.path.exists(knowledge_path):
                with open(knowledge_path, 'r', encoding='utf-8') as f:
                    self.knowledge_base = json.load(f)
                    
                # Load pre-computed vectors if available
                if os.path.exists(vectors_path):
                    with open(vectors_path, 'rb') as f:
                        data = pickle.load(f)
                        if isinstance(data, dict):
                            self.document_vectors = data.get('vectors')
                            self.vectorizer = data.get('vectorizer', self.vectorizer)
                        else:
                            # Old format - just vectors
                            self.document_vectors = data
                            self.build_vector_index()
                else:
                    # Build vector index if it doesn't exist
                    self.build_vector_index()
                        
                print(f"📚 Loaded {len(self.knowledge_base)} documents from knowledge base")
            else:
                self.create_initial_knowledge_base()
                
        except Exception as e:
            print(f"⚠️ Error loading knowledge base: {e}")
            self.create_initial_knowledge_base()
    
    def create_initial_knowledge_base(self):
        """Create initial KMRL-specific knowledge base with comprehensive examples"""
        print("📚 Creating comprehensive KMRL knowledge base...")
        
        self.knowledge_base = [
            # Engineering Department
            {
                "content": "Track signal failure at Ernakulam Junction requires immediate repair and maintenance work on electrical systems",
                "department": "Engineering",
                "keywords": ["track", "signal", "failure", "repair", "maintenance", "electrical", "infrastructure"],
                "malayalam_keywords": ["ട്രാക്ക്", "സിഗ്നൽ", "അറ്റകുറ്റപ്പണി", "ഇലക്ട്രിക്കൽ"],
                "confidence": 1.0,
                "examples": ["signal problems", "track maintenance", "infrastructure repair", "technical issues", "equipment failure"]
            },
            {
                "content": "Metro rail track inspection report showing wear and tear requiring replacement of rail sections",
                "department": "Engineering", 
                "keywords": ["metro", "track", "inspection", "wear", "replacement", "rail", "sections"],
                "malayalam_keywords": ["മെട്രോ", "പരിശോധന", "മാറ്റിസ്ഥാപിക്കൽ"],
                "confidence": 1.0,
                "examples": ["track inspection", "rail replacement", "maintenance schedule"]
            },
            
            # Finance Department
            {
                "content": "Budget allocation for metro construction project Q4 2025 procurement and vendor payment processing",
                "department": "Finance",
                "keywords": ["budget", "allocation", "procurement", "payment", "vendor", "cost", "invoice", "financial"],
                "malayalam_keywords": ["ബജറ്റ്", "പണം", "ചെലവ്", "വാങ്ങൽ", "കരാർ"],
                "confidence": 1.0,
                "examples": ["budget requests", "payment processing", "procurement", "vendor management", "financial reporting"]
            },
            {
                "content": "Invoice processing for metro station construction materials and contractor payments",
                "department": "Finance",
                "keywords": ["invoice", "processing", "materials", "contractor", "payments", "construction"],
                "malayalam_keywords": ["ഇൻവോയ്സ്", "കൺസ്ട്രക്ടർ", "പണം"],
                "confidence": 1.0,
                "examples": ["invoice management", "contractor payments", "material costs"]
            },
            
            # Human Resources
            {
                "content": "Employee training schedule for metro operators safety certification and skill development programs",
                "department": "Human Resources",
                "keywords": ["employee", "training", "operators", "safety", "certification", "skill", "development", "staff"],
                "malayalam_keywords": ["ജീവനക്കാർ", "പരിശീലനം", "സർട്ടിഫിക്കേഷൻ", "വികസനം"],
                "confidence": 1.0,
                "examples": ["staff training", "employee management", "certification programs", "skill development"]
            },
            {
                "content": "Recruitment notification for metro train drivers and station management positions",
                "department": "Human Resources",
                "keywords": ["recruitment", "notification", "drivers", "station", "management", "positions", "hiring"],
                "malayalam_keywords": ["നിയമനം", "ഡ്രൈവർമാർ", "സ്റ്റേഷൻ", "മാനേജ്മെന്റ്"],
                "confidence": 1.0,
                "examples": ["recruitment drives", "job notifications", "position hiring"]
            },
            
            # Operations
            {
                "content": "Metro train schedule optimization and passenger service frequency adjustment for peak hours",
                "department": "Operations",
                "keywords": ["schedule", "optimization", "passenger", "service", "frequency", "peak", "hours", "train"],
                "malayalam_keywords": ["ഷെഡ്യൂൾ", "യാത്രക്കാർ", "സേവനം", "ട്രെയിൻ"],
                "confidence": 1.0,
                "examples": ["train scheduling", "passenger services", "route optimization", "service frequency"]
            },
            
            # Safety & Security
            {
                "content": "Safety incident report passenger accident at Kaloor station emergency response and investigation",
                "department": "Safety & Security",
                "keywords": ["safety", "incident", "accident", "emergency", "response", "investigation", "passenger"],
                "malayalam_keywords": ["സുരക്ഷ", "അപകടം", "അടിയന്തിര", "അന്വേഷണം"],
                "confidence": 1.0,
                "examples": ["safety incidents", "emergency response", "security protocols", "accident investigation"]
            },
            
            # Administration
            {
                "content": "Administrative circular regarding new office policies and general documentation procedures",
                "department": "Administration",
                "keywords": ["administrative", "circular", "policies", "documentation", "procedures", "office"],
                "malayalam_keywords": ["ഭരണപരം", "സർക്കുലർ", "നയങ്ങൾ", "ഓഫീസ്"],
                "confidence": 1.0,
                "examples": ["office policies", "administrative procedures", "general documentation"]
            }
        ]
        
        self.save_knowledge_base()
        self.build_vector_index()
    
    def save_knowledge_base(self):
        """Save knowledge base to file"""
        os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)
        knowledge_path = os.path.join(os.path.dirname(__file__), 'data', 'kmrl_knowledge_base.json')
        
        with open(knowledge_path, 'w', encoding='utf-8') as f:
            json.dump(self.knowledge_base, f, ensure_ascii=False, indent=2)
    
    def build_vector_index(self):
        """Build TF-IDF vectors for all documents in knowledge base"""
        if not self.knowledge_base:
            return
            
        documents = [doc['content'] + ' ' + ' '.join(doc['keywords']) for doc in self.knowledge_base]
        self.document_vectors = self.vectorizer.fit_transform(documents)
        
        # Save vectors and vectorizer together
        vectors_path = os.path.join(os.path.dirname(__file__), 'data', 'document_vectors.pkl')
        with open(vectors_path, 'wb') as f:
            pickle.dump({
                'vectors': self.document_vectors,
                'vectorizer': self.vectorizer
            }, f)
        
        print(f"🔍 Built vector index for {len(documents)} documents")
    
    def retrieve_similar_documents(self, query_text: str, top_k: int = 3) -> List[Dict]:
        """Retrieve most similar documents using vector similarity"""
        if self.document_vectors is None:
            self.build_vector_index()
        
        # Vectorize query
        query_vector = self.vectorizer.transform([query_text])
        
        # Calculate similarity
        similarities = cosine_similarity(query_vector, self.document_vectors).flatten()
        
        # Get top-k most similar documents
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        similar_docs = []
        for idx in top_indices:
            if similarities[idx] > 0.1:  # Minimum similarity threshold
                doc = self.knowledge_base[idx].copy()
                doc['similarity'] = float(similarities[idx])
                similar_docs.append(doc)
        
        return similar_docs
    
    def analyze_with_rag(self, document_content: str, filename: str = "", subject: str = "") -> Dict[str, Any]:
        """Analyze document using RAG approach with OpenRouter AI"""
        
        # Combine all available text for analysis
        full_text = f"{filename} {subject} {document_content}".strip()
        
        # Retrieve similar documents from knowledge base
        similar_docs = self.retrieve_similar_documents(full_text, top_k=5)
        
        # Prepare context from similar documents
        context = self.prepare_context(similar_docs)
        
        # Use OpenRouter AI with enhanced context
        ai_result = self.classify_with_enhanced_ai(full_text, context)
        
        # Add RAG-specific information
        ai_result['rag_context'] = {
            'similar_documents_found': len(similar_docs),
            'similar_departments': [doc['department'] for doc in similar_docs],
            'similarity_scores': [doc['similarity'] for doc in similar_docs],
            'context_used': bool(similar_docs)
        }
        
        return ai_result
    
    def prepare_context(self, similar_docs: List[Dict]) -> str:
        """Prepare context from similar documents for AI analysis"""
        if not similar_docs:
            return ""
        
        context_parts = ["Previous KMRL document examples for reference:"]
        
        for i, doc in enumerate(similar_docs[:3], 1):
            context_parts.append(f"""
Example {i} (Similarity: {doc['similarity']:.2f}):
Content: {doc['content'][:200]}...
Department: {doc['department']}
Keywords: {', '.join(doc['keywords'][:5])}
Malayalam Keywords: {', '.join(doc['malayalam_keywords'][:3])}
""")
        
        return '\n'.join(context_parts)
    
    def classify_with_enhanced_ai(self, content: str, context: str) -> Dict[str, Any]:
        """Classify document using OpenRouter AI with RAG context"""
        
        prompt = f"""
        You are an expert document classifier for KMRL (Kochi Metro Rail Limited). 
        
        Based on the following context from previous KMRL documents and the new document content, 
        provide a comprehensive analysis including document summary and department classification.
        
        {context}
        
        NEW DOCUMENT TO CLASSIFY:
        Content: {content[:2000]}
        
        KMRL DEPARTMENTS:
        1. Engineering - Track maintenance, signal systems, infrastructure, technical repairs
        2. Finance - Budget, payments, procurement, financial reporting, vendor management  
        3. Human Resources - Employee management, training, recruitment, policies
        4. Operations - Train scheduling, passenger services, station management, route planning
        5. Safety & Security - Safety incidents, emergency response, security protocols, investigations
        6. Administration - General admin, office policies, documentation, circulars
        
        INSTRUCTIONS:
        - First, provide a clear summary of what the document contains
        - Identify key information, facts, and findings mentioned in the document
        - Then determine the most appropriate department for routing
        - Consider both English and Malayalam keywords
        - Use the context from similar previous documents to inform your decision
        - Provide reasoning based on specific keywords and content themes
        
        Return your analysis as JSON:
        {{
            "document_summary": "Clear summary of what this document contains and its main points",
            "key_findings": ["finding1", "finding2", "finding3"],
            "main_topics": ["topic1", "topic2"], 
            "department": "department_name",
            "confidence_score": 0-100,
            "primary_keywords": ["keyword1", "keyword2"],
            "reasoning": "detailed explanation for department assignment",
            "malayalam_content_detected": true/false,
            "document_type": "type_of_document",
            "priority": "urgent/high/normal/low",
            "recommended_actions": ["action1", "action2"],
            "technical_details": ["detail1", "detail2"] 
        }}
        """
        
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://doc-x-intelligent.app",
                    "X-Title": "DOC.X Intelligent"
                },
                json={
                    "model": "meta-llama/llama-3.1-8b-instruct",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert KMRL document classifier. Always return valid JSON responses for department classification."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.3
                },
                timeout=30
            )
            
            if response.status_code == 200:
                ai_response = response.json()
                content_text = ai_response['choices'][0]['message']['content']
                
                # Extract JSON from response
                try:
                    json_start = content_text.find('{')
                    json_end = content_text.rfind('}') + 1
                    if json_start != -1 and json_end != -1:
                        json_str = content_text[json_start:json_end]
                        result = json.loads(json_str)
                        
                        # Validate and normalize department name
                        result['department'] = self.normalize_department_name(result.get('department', 'Administration'))
                        
                        print(f"🤖 RAG Analysis: {result['department']} (confidence: {result.get('confidence_score', 0)}%)")
                        return result
                except json.JSONDecodeError:
                    print("⚠️ JSON parsing failed, using text analysis")
                    return self.parse_ai_text_response(content_text)
            else:
                error_msg = response.text if response.text else "Unknown error"
                print(f"❌ OpenRouter API error: {response.status_code} - {error_msg[:100]}")
                return self.fallback_classification(content)
                
        except Exception as e:
            print(f"⚠️ RAG analysis failed: {e}")
            return self.fallback_classification(content)
    
    def normalize_department_name(self, department: str) -> str:
        """Normalize department names to match KMRL structure"""
        department_mapping = {
            'engineering': 'Engineering',
            'finance': 'Finance', 
            'human resources': 'Human Resources',
            'hr': 'Human Resources',
            'operations': 'Operations',
            'safety': 'Safety & Security',
            'safety & security': 'Safety & Security',
            'security': 'Safety & Security',
            'administration': 'Administration',
            'admin': 'Administration'
        }
        
        return department_mapping.get(department.lower(), 'Administration')
    
    def parse_ai_text_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI response when JSON extraction fails"""
        # Basic text parsing fallback
        department = 'Administration'
        confidence = 50
        
        if 'engineering' in response_text.lower():
            department = 'Engineering'
            confidence = 75
        elif 'finance' in response_text.lower():
            department = 'Finance' 
            confidence = 75
        elif 'human resources' in response_text.lower() or 'hr' in response_text.lower():
            department = 'Human Resources'
            confidence = 75
        elif 'operations' in response_text.lower():
            department = 'Operations'
            confidence = 75
        elif 'safety' in response_text.lower():
            department = 'Safety & Security'
            confidence = 75
        
        return {
            'department': department,
            'confidence_score': confidence,
            'primary_keywords': [],
            'reasoning': 'Parsed from AI text response',
            'malayalam_content_detected': False,
            'document_type': 'unknown',
            'priority': 'normal',
            'recommended_actions': [f'Route to {department} department']
        }
    
    def fallback_classification(self, content: str) -> Dict[str, Any]:
        """Fallback classification using keyword matching"""
        content_lower = content.lower()
        
        # Simple keyword-based classification
        if any(word in content_lower for word in ['maintenance', 'repair', 'track', 'signal', 'infrastructure']):
            return {
                'department': 'Engineering',
                'confidence_score': 60,
                'primary_keywords': ['maintenance', 'repair'],
                'reasoning': 'Keyword-based classification (fallback)',
                'malayalam_content_detected': False,
                'document_type': 'maintenance_document',
                'priority': 'normal',
                'recommended_actions': ['Route to Engineering department']
            }
        elif any(word in content_lower for word in ['budget', 'payment', 'cost', 'invoice']):
            return {
                'department': 'Finance',
                'confidence_score': 60,
                'primary_keywords': ['budget', 'payment'],
                'reasoning': 'Keyword-based classification (fallback)',
                'malayalam_content_detected': False,
                'document_type': 'financial_document',
                'priority': 'normal',
                'recommended_actions': ['Route to Finance department']
            }
        else:
            return {
                'department': 'Administration',
                'confidence_score': 30,
                'primary_keywords': [],
                'reasoning': 'Default assignment (fallback)',
                'malayalam_content_detected': False,
                'document_type': 'general_document',
                'priority': 'normal',
                'recommended_actions': ['Review and assign to appropriate department']
            }
    
    def add_document_to_knowledge_base(self, content: str, department: str, filename: str = "", confidence: float = 1.0):
        """Add a new document to the knowledge base for future learning"""
        
        # Extract keywords from content
        keywords = self.extract_keywords(content)
        malayalam_keywords = self.extract_malayalam_keywords(content)
        
        new_doc = {
            'content': content,
            'department': department,
            'keywords': keywords,
            'malayalam_keywords': malayalam_keywords,
            'confidence': confidence,
            'filename': filename,
            'added_date': datetime.now().isoformat(),
            'examples': [filename] if filename else []
        }
        
        self.knowledge_base.append(new_doc)
        
        # Rebuild vector index
        self.build_vector_index()
        self.save_knowledge_base()
        
        print(f"📚 Added new document to knowledge base: {department}")
    
    def extract_keywords(self, content: str) -> List[str]:
        """Extract important keywords from content"""
        # Simple keyword extraction - can be enhanced with NLP
        words = re.findall(r'\b\w+\b', content.lower())
        important_words = [word for word in words if len(word) > 3 and word.isalpha()]
        return list(set(important_words[:10]))  # Top 10 unique keywords
    
    def extract_malayalam_keywords(self, content: str) -> List[str]:
        """Extract Malayalam keywords from content"""
        malayalam_pattern = r'[\u0d00-\u0d7f]+'
        malayalam_words = re.findall(malayalam_pattern, content)
        return list(set(malayalam_words[:5]))  # Top 5 Malayalam words
    
    def get_knowledge_base_stats(self) -> Dict[str, Any]:
        """Get statistics about the knowledge base"""
        if not self.knowledge_base:
            return {'total_documents': 0, 'departments': {}}
        
        dept_counts = {}
        for doc in self.knowledge_base:
            dept = doc['department']
            dept_counts[dept] = dept_counts.get(dept, 0) + 1
        
        return {
            'total_documents': len(self.knowledge_base),
            'departments': dept_counts,
            'last_updated': datetime.now().isoformat(),
            'avg_confidence': sum(doc.get('confidence', 0) for doc in self.knowledge_base) / len(self.knowledge_base)
        }