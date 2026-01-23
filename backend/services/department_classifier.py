"""
Department Classifier Service
Uses RAG with LLM to classify documents into departments and generate summaries
"""
import os
import logging
from typing import Dict, Any, List
from openai import OpenAI

logger = logging.getLogger(__name__)

class DepartmentClassifier:
    
    DEPARTMENTS = [
        "Finance",
        "HR",
        "Operations",
        "Engineering",
        "Sales",
        "Marketing",
        "Legal",
        "IT",
        "Customer Support",
        "General"
    ]
    
    def __init__(self):
        # Use OpenRouter API
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        
        base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        self.openai_client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4-turbo-preview")
        
        logger.info(f"Department classifier initialized with model: {self.model}")
    
    async def initialize(self):
        """Initialize the classifier"""
        logger.info("✅ Classifier ready")
    
    async def classify_and_summarize(
        self,
        content: str,
        embedding: List[float],
        filename: str
    ) -> Dict[str, Any]:
        """
        Use LLM to classify document department and generate summary
        
        Returns:
            {
                "department": str,
                "summary": str,
                "confidence": float,
                "reasoning": str
            }
        """
        try:
            # Truncate content if too long
            max_content_length = 8000
            truncated_content = content[:max_content_length]
            if len(content) > max_content_length:
                truncated_content += "\n\n[Content truncated...]"
            
            # Create prompt for LLM
            prompt = self._create_classification_prompt(filename, truncated_content)
            
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert document classifier for an intelligent document management system. Your task is to accurately classify documents into departments and provide concise, informative summaries."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            # Parse response
            result = self._parse_llm_response(response.choices[0].message.content)
            
            logger.info(f"✅ Classification: {result['department']} (confidence: {result['confidence']})")
            return result
            
        except Exception as e:
            logger.error(f"❌ Classification failed: {e}", exc_info=True)
            # Return default classification
            return {
                "department": "General",
                "summary": "Error generating summary. Please review manually.",
                "confidence": 0.0,
                "reasoning": f"Classification error: {str(e)}"
            }
    
    def _create_classification_prompt(self, filename: str, content: str) -> str:
        """Create the prompt for LLM classification"""
        
        departments_list = ", ".join(self.DEPARTMENTS)
        
        prompt = f"""Analyze the following document and perform two tasks:

1. **Classify the department**: Determine which department this document belongs to from the following list:
   {departments_list}

2. **Generate a summary**: Create a concise 2-3 sentence summary of the document's key content and purpose.

**Document Information:**
- Filename: {filename}

**Document Content:**
{content}

**Output Format (MUST follow exactly):**
DEPARTMENT: [Choose one department from the list above]
CONFIDENCE: [Number between 0.0 and 1.0 indicating classification confidence]
SUMMARY: [2-3 sentence summary]
REASONING: [Brief explanation of why this department was chosen]

Be precise and ensure the department name exactly matches one from the list."""

        return prompt
    
    def _parse_llm_response(self, response_text: str) -> Dict[str, Any]:
        """Parse LLM response into structured format"""
        try:
            lines = response_text.strip().split('\n')
            result = {
                "department": "General",
                "summary": "",
                "confidence": 0.5,
                "reasoning": ""
            }
            
            for line in lines:
                line = line.strip()
                if line.startswith("DEPARTMENT:"):
                    dept = line.replace("DEPARTMENT:", "").strip()
                    # Validate department
                    if dept in self.DEPARTMENTS:
                        result["department"] = dept
                    else:
                        # Try to find closest match
                        for valid_dept in self.DEPARTMENTS:
                            if valid_dept.lower() in dept.lower():
                                result["department"] = valid_dept
                                break
                
                elif line.startswith("CONFIDENCE:"):
                    try:
                        conf = float(line.replace("CONFIDENCE:", "").strip())
                        result["confidence"] = max(0.0, min(1.0, conf))
                    except ValueError:
                        result["confidence"] = 0.5
                
                elif line.startswith("SUMMARY:"):
                    result["summary"] = line.replace("SUMMARY:", "").strip()
                
                elif line.startswith("REASONING:"):
                    result["reasoning"] = line.replace("REASONING:", "").strip()
            
            # Append remaining text to summary if exists
            if not result["summary"]:
                # Try to extract summary from full response
                summary_parts = []
                capture = False
                for line in lines:
                    if "SUMMARY:" in line:
                        capture = True
                        summary_parts.append(line.split("SUMMARY:")[1].strip())
                    elif capture and "REASONING:" not in line and "DEPARTMENT:" not in line and "CONFIDENCE:" not in line:
                        summary_parts.append(line.strip())
                    elif "REASONING:" in line:
                        capture = False
                
                if summary_parts:
                    result["summary"] = " ".join(summary_parts)
            
            # Ensure summary exists
            if not result["summary"]:
                result["summary"] = "Document processed successfully."
            
            return result
            
        except Exception as e:
            logger.error(f"Error parsing LLM response: {e}")
            return {
                "department": "General",
                "summary": response_text[:200] if response_text else "No summary available",
                "confidence": 0.3,
                "reasoning": "Failed to parse structured response"
            }
    
    def check_health(self) -> bool:
        """Check if service is healthy"""
        try:
            return bool(self.openai_api_key)
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
            return False
