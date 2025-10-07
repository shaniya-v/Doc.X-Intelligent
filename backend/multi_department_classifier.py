"""
Enhanced Multi-Department Document Classifier for KMRL
Uses OpenRouter RAG for intelligent department analysis and task extraction
"""

import json
import re
from typing import Dict, List, Tuple, Any
from rag_classifier import RAGDepartmentClassifier
import requests

class MultiDepartmentClassifier(RAGDepartmentClassifier):
    """RAG-powered classifier for multi-department document analysis"""
    
    def __init__(self):
        super().__init__()
        
        # KMRL department structure for RAG context
        self.kmrl_departments = [
            'Engineering',
            'Rolling Stock & Mechanical', 
            'Electrical',
            'Signalling',
            'Operations',
            'Safety & Security',
            'Environment'
        ]
    
    def analyze_multi_department_document(self, content: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze a document for multi-department requirements using OpenRouter RAG
        """
        print("🤖 Starting RAG-powered multi-department analysis...")
        
        # Step 1: Use RAG to identify all departments mentioned
        departments_detected = self._detect_departments_with_rag(content)
        print(f"🏢 Departments detected via RAG: {list(departments_detected.keys())}")
        
        # Step 2: Use RAG to extract department-specific tasks
        department_tasks = self._extract_department_tasks_with_rag(content, departments_detected)
        
        # Step 3: Get overall document analysis via RAG
        overall_analysis = self._get_overall_rag_analysis(content)
        
        # Step 4: Determine primary department using RAG
        primary_department = self._determine_primary_department_with_rag(content, departments_detected)
        
        # Step 5: Calculate confidence based on RAG analysis
        confidence = self._calculate_rag_confidence(departments_detected, overall_analysis)
        
        result = {
            'is_multi_department': len(departments_detected) > 1,
            'departments_count': len(departments_detected),
            'departments_detected': list(departments_detected.keys()),
            'primary_department': primary_department,
            'confidence': confidence,
            'department_specific_tasks': department_tasks,
            'overall_analysis': overall_analysis,
            'routing_strategy': 'multi_department' if len(departments_detected) > 1 else 'single_department',
            'analysis_method': 'OpenRouter RAG'
        }
        
        print(f"✅ RAG multi-department analysis complete: {len(departments_detected)} departments")
        return result
    
    def _detect_departments_with_rag(self, content: str) -> Dict[str, List[str]]:
        """Use OpenRouter RAG to detect which departments are involved"""
        try:
            prompt = f"""Analyze this KMRL document and identify which departments are mentioned or require action.

KMRL Departments:
- Engineering (civil, track, infrastructure, construction)
- Rolling Stock & Mechanical (trains, brake systems, mechanical maintenance)
- Electrical (power supply, voltage, transformers, electrical systems)
- Signalling (communication systems, signals, ATC, interlocking)
- Operations (station facilities, passenger services, ticketing)
- Safety & Security (CCTV, security systems, safety protocols)
- Environment (cleaning, waterproofing, environmental management)

Document Content:
{content[:2000]}...

Return a JSON object with departments that are mentioned or need to take action, with evidence:
{{
    "department_name": ["evidence1", "evidence2", ...]
}}

Only include departments that are clearly mentioned or have relevant tasks."""

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
                            "content": "You are an expert KMRL operations analyst. Identify departments mentioned in documents based on context and content, not just keywords."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 800,
                    "temperature": 0.3
                },
                timeout=30
            )
            
            if response.status_code == 200:
                ai_response = response.json()
                content_response = ai_response['choices'][0]['message']['content']
                
                # Try to extract JSON from response
                try:
                    # Look for JSON in the response
                    json_match = re.search(r'\{.*\}', content_response, re.DOTALL)
                    if json_match:
                        departments = json.loads(json_match.group())
                        # Validate departments exist in KMRL structure
                        valid_departments = {}
                        for dept, evidence in departments.items():
                            if dept in self.kmrl_departments:
                                valid_departments[dept] = evidence
                        return valid_departments
                except json.JSONDecodeError:
                    pass
                
                # Fallback: parse text response
                return self._parse_text_departments_response(content_response)
            
        except Exception as e:
            print(f"❌ RAG department detection failed: {e}")
        
        # Fallback to simple content analysis
        return self._fallback_department_detection(content)
    
    def _extract_department_tasks_with_rag(self, content: str, departments: Dict[str, List[str]]) -> Dict[str, List[str]]:
        """Use OpenRouter RAG to extract specific tasks for each department"""
        department_tasks = {}
        
        for dept_name in departments.keys():
            try:
                prompt = f"""Extract specific tasks and action items for the {dept_name} department from this KMRL document.

Department Focus: {dept_name}
Document Content:
{content[:1500]}...

Return a JSON list of specific, actionable tasks for {dept_name}:
["task 1", "task 2", "task 3"]

Only include tasks that are:
1. Specifically for {dept_name} department
2. Actionable and clear
3. Mentioned in the document
4. Realistic for KMRL operations

Maximum 5 tasks per department."""

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
                                "content": f"You are a {dept_name} department specialist at KMRL. Extract only relevant, actionable tasks for your department from maintenance documents."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "max_tokens": 600,
                        "temperature": 0.3
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    ai_response = response.json()
                    content_response = ai_response['choices'][0]['message']['content']
                    
                    # Try to extract JSON array
                    try:
                        json_match = re.search(r'\[.*\]', content_response, re.DOTALL)
                        if json_match:
                            tasks = json.loads(json_match.group())
                            if isinstance(tasks, list) and tasks:
                                department_tasks[dept_name] = tasks[:5]  # Limit to 5
                    except json.JSONDecodeError:
                        # Fallback: extract tasks from text
                        tasks = self._parse_text_tasks_response(content_response)
                        if tasks:
                            department_tasks[dept_name] = tasks[:5]
                
            except Exception as e:
                print(f"❌ RAG task extraction failed for {dept_name}: {e}")
        
        return department_tasks
    
    def _get_overall_rag_analysis(self, content: str) -> Dict[str, Any]:
        """Get overall document analysis using OpenRouter RAG"""
        try:
            prompt = f"""Analyze this KMRL maintenance document and provide a comprehensive summary.

Document Content:
{content[:2000]}...

Provide analysis in JSON format:
{{
    "document_type": "type of document",
    "urgency_level": "low/medium/high/critical",
    "main_issues": ["issue1", "issue2", "issue3"],
    "coordination_required": true/false,
    "estimated_timeline": "timeline estimate",
    "priority_departments": ["dept1", "dept2"],
    "summary": "brief summary of the document"
}}"""

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
                            "content": "You are a KMRL operations manager. Analyze maintenance documents for coordination requirements and priorities."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 800,
                    "temperature": 0.3
                },
                timeout=30
            )
            
            if response.status_code == 200:
                ai_response = response.json()
                content_response = ai_response['choices'][0]['message']['content']
                
                try:
                    json_match = re.search(r'\{.*\}', content_response, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass
        
        except Exception as e:
            print(f"❌ RAG overall analysis failed: {e}")
        
        # Fallback analysis
        return {
            "document_type": "maintenance_report",
            "urgency_level": "medium",
            "main_issues": ["Multiple department coordination required"],
            "coordination_required": True,
            "summary": "Multi-department maintenance document requiring coordination"
        }
    
    def _determine_primary_department_with_rag(self, content: str, departments: Dict[str, List[str]]) -> str:
        """Use RAG to determine the primary department responsible"""
        if not departments:
            return "Operations"  # Default fallback
        
        if len(departments) == 1:
            return list(departments.keys())[0]
        
        try:
            dept_list = list(departments.keys())
            prompt = f"""From this KMRL document, determine which department should be the PRIMARY responsible department for coordination.

Available departments: {dept_list}
Document Content:
{content[:1000]}...

Consider:
1. Which department has the most critical tasks
2. Which department typically leads coordination for this type of issue
3. Which department's work affects others most

Return only the department name from the list above."""

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
                            "content": "You are a KMRL operations coordinator. Determine primary department responsibility based on document analysis."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 200,
                    "temperature": 0.3
                },
                timeout=30
            )
            
            if response.status_code == 200:
                ai_response = response.json()
                primary = ai_response['choices'][0]['message']['content'].strip()
                # Validate the response is one of our departments
                for dept in dept_list:
                    if dept.lower() in primary.lower():
                        return dept
        
        except Exception as e:
            print(f"❌ RAG primary department detection failed: {e}")
        
        # Fallback: return first department
        return list(departments.keys())[0]
    
    def _calculate_rag_confidence(self, departments: Dict[str, List[str]], overall_analysis: Dict[str, Any]) -> float:
        """Calculate confidence based on RAG analysis quality"""
        confidence = 0.5  # Base confidence
        
        # Boost confidence based on number of departments with evidence
        if departments:
            evidence_quality = sum(len(evidence) for evidence in departments.values())
            confidence += min(0.3, evidence_quality * 0.05)
        
        # Boost confidence if overall analysis indicates coordination
        if overall_analysis.get('coordination_required'):
            confidence += 0.15
        
        # Boost confidence based on analysis completeness
        if overall_analysis.get('urgency_level') in ['high', 'critical']:
            confidence += 0.1
        
        return min(0.95, confidence)
    
    def _parse_text_departments_response(self, response_text: str) -> Dict[str, List[str]]:
        """Parse department information from text response"""
        departments = {}
        
        for dept in self.kmrl_departments:
            if dept.lower() in response_text.lower():
                # Find evidence mentions
                evidence = []
                sentences = response_text.split('.')
                for sentence in sentences:
                    if dept.lower() in sentence.lower():
                        evidence.append(sentence.strip())
                
                if evidence:
                    departments[dept] = evidence[:3]  # Limit evidence
        
        return departments
    
    def _parse_text_tasks_response(self, response_text: str) -> List[str]:
        """Parse tasks from text response"""
        tasks = []
        
        # Look for bullet points or numbered lists
        lines = response_text.split('\n')
        for line in lines:
            line = line.strip()
            if re.match(r'^[-•*]\s*', line) or re.match(r'^\d+\.?\s*', line):
                task = re.sub(r'^[-•*\d\.]\s*', '', line).strip()
                if len(task) > 10:  # Only meaningful tasks
                    tasks.append(task)
        
        return tasks[:5]  # Limit to 5 tasks
    
    def _fallback_department_detection(self, content: str) -> Dict[str, List[str]]:
        """Simple fallback if RAG fails"""
        departments = {}
        content_lower = content.lower()
        
        # Simple keyword detection as absolute fallback
        simple_keywords = {
            'Engineering': ['track', 'civil', 'infrastructure'],
            'Rolling Stock & Mechanical': ['train', 'brake', 'mechanical'],
            'Electrical': ['electrical', 'power', 'voltage'],
            'Signalling': ['signal', 'communication'],
            'Operations': ['station', 'platform', 'passenger'],
            'Safety & Security': ['safety', 'security', 'cctv'],
            'Environment': ['cleaning', 'environment', 'water']
        }
        
        for dept, keywords in simple_keywords.items():
            found_keywords = [kw for kw in keywords if kw in content_lower]
            if found_keywords:
                departments[dept] = [f"keyword: {kw}" for kw in found_keywords]
        

# Test function for the multi-department classifier
def test_multi_department_classifier():
    """Test the RAG-powered multi-department classifier"""
    print("🧪 Testing RAG Multi-Department Classifier")
    print("=" * 50)
    
    classifier = MultiDepartmentClassifier()
    
    # Test document with multi-department content
    test_content = """
KMRL Monthly Maintenance Report - October 2025

ENGINEERING DEPARTMENT:
- Track inspection required at Ernakulam station due to settlement issues
- Viaduct structural assessment needed between Kaloor and Lissie stations
- Platform extension work coordination with Operations team

ROLLING STOCK & MECHANICAL:
- Brake system replacement for train KM-07 scheduled for next week
- Bogie maintenance for KM-03 and KM-05 trains
- Mechanical workshop equipment calibration pending

ELECTRICAL DEPARTMENT:
- Transformer maintenance at Kaloor substation causing power fluctuations
- OHLE system inspection from Aluva to Ernakulam stretch
- Power supply backup arrangements during maintenance

SIGNALLING DEPARTMENT:
- ATC module replacement at M.G. Road junction
- Signal delay issues at Edapally station requiring immediate attention
- Communication system upgrade coordination

OPERATIONS:
- Platform safety upgrades required at multiple stations
- Passenger information system updates
- Station facilities maintenance scheduling

SAFETY & SECURITY:
- CCTV camera installation at M.G. Road station
- Emergency evacuation drill planning for all stations
- Security personnel deployment schedule review

This report requires multi-department coordination for effective implementation.
    """
    
    try:
        result = classifier.analyze_multi_department_document(test_content)
        
        print(f"✅ Analysis Result:")
        print(f"   Multi-department: {result['is_multi_department']}")
        print(f"   Departments found: {result['departments_count']}")
        print(f"   Departments: {result['departments_detected']}")
        print(f"   Primary: {result['primary_department']}")
        print(f"   Confidence: {result['confidence']:.2f}")
        print(f"   Analysis method: {result['analysis_method']}")
        
        if result['department_specific_tasks']:
            print(f"\n📋 Department Tasks:")
            for dept, tasks in result['department_specific_tasks'].items():
                print(f"   {dept}:")
                for task in tasks[:3]:  # Show first 3 tasks
                    print(f"     • {task}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    test_multi_department_classifier()