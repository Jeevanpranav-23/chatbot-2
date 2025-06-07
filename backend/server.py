from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import openai
from openai import OpenAI
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI configuration
openai_api_key = os.environ.get('OPENAI_API_KEY', '')
client = OpenAI(api_key=openai_api_key) if openai_api_key else None

# Create the main app without a prefix
app = FastAPI(title="CodeCraft API", description="AI-powered code generation and debugging platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class CodeRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt: str
    language: str = "javascript"
    request_type: str = "generate"  # generate, debug, explain, optimize
    code_input: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CodeResponse(BaseModel):
    id: str
    request_id: str
    generated_code: str
    explanation: str
    language: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CodeRequestCreate(BaseModel):
    prompt: str
    language: str = "javascript"
    request_type: str = "generate"
    code_input: Optional[str] = None

class DebugRequest(BaseModel):
    code: str
    language: str
    error_message: Optional[str] = None

class OptimizeRequest(BaseModel):
    code: str
    language: str
    optimization_type: str = "performance"  # performance, readability, security

# AI Code Generation Functions
async def generate_code_with_ai(prompt: str, language: str, request_type: str, code_input: Optional[str] = None) -> Dict[str, str]:
    """Generate code using OpenAI GPT"""
    try:
        if not client:
            # Fallback templates when no API key
            return await get_template_code(prompt, language, request_type)
        
        # Construct the system prompt based on request type
        if request_type == "generate":
            system_prompt = f"""You are an expert {language} developer. Generate clean, production-ready code based on the user's request. 
            Provide complete, functional code with proper error handling, comments, and best practices.
            Return only the code without explanations unless specifically asked."""
            
        elif request_type == "debug":
            system_prompt = f"""You are an expert {language} debugger. Analyze the provided code and fix any issues.
            Explain what was wrong and provide the corrected version.
            Format your response as: ISSUE: [explanation] FIXED CODE: [corrected code]"""
            
        elif request_type == "explain":
            system_prompt = f"""You are an expert {language} developer. Explain the provided code in detail.
            Break down what each part does, explain the logic, and provide insights about best practices."""
            
        elif request_type == "optimize":
            system_prompt = f"""You are an expert {language} developer. Optimize the provided code for better performance, readability, and maintainability.
            Explain the optimizations made and provide the improved version."""
        
        user_message = prompt
        if code_input:
            user_message = f"{prompt}\n\nCode to work with:\n```{language}\n{code_input}\n```"
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=2000,
            temperature=0.1
        )
        
        ai_response = response.choices[0].message.content
        
        # Parse response for debug requests
        if request_type == "debug" and "FIXED CODE:" in ai_response:
            parts = ai_response.split("FIXED CODE:")
            explanation = parts[0].replace("ISSUE:", "").strip()
            code = parts[1].strip()
            return {"code": code, "explanation": explanation}
        else:
            return {"code": ai_response, "explanation": "Code generated successfully"}
            
    except Exception as e:
        logging.error(f"AI generation error: {str(e)}")
        return await get_template_code(prompt, language, request_type)

async def get_template_code(prompt: str, language: str, request_type: str) -> Dict[str, str]:
    """Fallback template-based code generation"""
    templates = {
        "javascript": {
            "react_component": """import React, { useState, useEffect } from 'react';

const MyComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data or initialize component
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="my-component">
      <h1>My Component</h1>
      {/* Add your content here */}
    </div>
  );
};

export default MyComponent;""",
            "api_endpoint": """const express = require('express');
const router = express.Router();

// GET endpoint
router.get('/api/data', async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint
router.post('/api/data', async (req, res) => {
  try {
    const { body } = req;
    // Process data
    res.json({ success: true, message: 'Data created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;""",
            "function": """function myFunction(param1, param2) {
  // Add your logic here
  try {
    const result = param1 + param2;
    return result;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}"""
        },
        "python": {
            "function": """def my_function(param1, param2):
    \"\"\"
    Description of the function
    
    Args:
        param1: Description of param1
        param2: Description of param2
    
    Returns:
        Description of return value
    \"\"\"
    try:
        result = param1 + param2
        return result
    except Exception as e:
        print(f"Error: {e}")
        return None""",
            "class": """class MyClass:
    def __init__(self, name):
        self.name = name
        self.data = []
    
    def add_data(self, item):
        \"\"\"Add an item to the data list\"\"\"
        self.data.append(item)
        return len(self.data)
    
    def get_data(self):
        \"\"\"Get all data\"\"\"
        return self.data
    
    def __str__(self):
        return f"MyClass(name={self.name}, items={len(self.data)})\"""",
            "api": """from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None

@app.get("/api/items")
async def get_items():
    return {"items": []}

@app.post("/api/items")
async def create_item(item: Item):
    return {"message": "Item created", "item": item}

@app.get("/api/items/{item_id}")
async def get_item(item_id: int):
    return {"item_id": item_id}"""
        }
    }
    
    # Simple template matching
    prompt_lower = prompt.lower()
    
    if language in templates:
        if "react" in prompt_lower or "component" in prompt_lower:
            return {"code": templates[language].get("react_component", "// Template not available"), 
                   "explanation": "Generated React component template"}
        elif "api" in prompt_lower or "endpoint" in prompt_lower or "server" in prompt_lower:
            return {"code": templates[language].get("api", templates[language].get("api_endpoint", "// Template not available")), 
                   "explanation": "Generated API template"}
        elif "function" in prompt_lower:
            return {"code": templates[language].get("function", "// Template not available"), 
                   "explanation": "Generated function template"}
        elif "class" in prompt_lower and language == "python":
            return {"code": templates[language].get("class", "# Template not available"), 
                   "explanation": "Generated class template"}
    
    return {"code": f"// {language.title()} code for: {prompt}\n// Template-based generation - please provide OpenAI API key for advanced features", 
           "explanation": "Basic template generated. For advanced AI-powered code generation, please configure OpenAI API key."}

# API Routes
@api_router.get("/")
async def root():
    return {"message": "CodeCraft API - AI-powered code generation platform"}

@api_router.post("/generate-code", response_model=CodeResponse)
async def generate_code(request: CodeRequestCreate):
    """Generate code based on natural language prompt"""
    try:
        # Save request to database
        code_request = CodeRequest(**request.dict())
        await db.code_requests.insert_one(code_request.dict())
        
        # Generate code using AI
        result = await generate_code_with_ai(
            request.prompt, 
            request.language, 
            request.request_type,
            request.code_input
        )
        
        # Create response
        response = CodeResponse(
            id=str(uuid.uuid4()),
            request_id=code_request.id,
            generated_code=result["code"],
            explanation=result["explanation"],
            language=request.language
        )
        
        # Save response to database
        await db.code_responses.insert_one(response.dict())
        
        return response
        
    except Exception as e:
        logging.error(f"Code generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")

@api_router.post("/debug-code")
async def debug_code(request: DebugRequest):
    """Debug and fix code issues"""
    try:
        prompt = f"Debug this {request.language} code"
        if request.error_message:
            prompt += f" that gives this error: {request.error_message}"
        
        result = await generate_code_with_ai(
            prompt,
            request.language,
            "debug",
            request.code
        )
        
        return {
            "original_code": request.code,
            "fixed_code": result["code"],
            "explanation": result["explanation"],
            "language": request.language
        }
        
    except Exception as e:
        logging.error(f"Debug error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Debug failed: {str(e)}")

@api_router.post("/optimize-code")
async def optimize_code(request: OptimizeRequest):
    """Optimize code for better performance or readability"""
    try:
        prompt = f"Optimize this {request.language} code for {request.optimization_type}"
        
        result = await generate_code_with_ai(
            prompt,
            request.language,
            "optimize",
            request.code
        )
        
        return {
            "original_code": request.code,
            "optimized_code": result["code"],
            "explanation": result["explanation"],
            "language": request.language,
            "optimization_type": request.optimization_type
        }
        
    except Exception as e:
        logging.error(f"Optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@api_router.post("/explain-code")
async def explain_code(code: str, language: str):
    """Explain what the code does"""
    try:
        result = await generate_code_with_ai(
            "Explain this code in detail",
            language,
            "explain",
            code
        )
        
        return {
            "code": code,
            "explanation": result["explanation"],
            "language": language
        }
        
    except Exception as e:
        logging.error(f"Explanation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")

@api_router.get("/code-history", response_model=List[CodeRequest])
async def get_code_history(limit: int = 50):
    """Get recent code generation history"""
    try:
        requests = await db.code_requests.find().sort("timestamp", -1).limit(limit).to_list(limit)
        return [CodeRequest(**request) for request in requests]
    except Exception as e:
        logging.error(f"History retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")

@api_router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported programming languages"""
    return {
        "languages": [
            {"id": "javascript", "name": "JavaScript", "extensions": [".js", ".jsx"]},
            {"id": "typescript", "name": "TypeScript", "extensions": [".ts", ".tsx"]},
            {"id": "python", "name": "Python", "extensions": [".py"]},
            {"id": "react", "name": "React", "extensions": [".jsx", ".tsx"]},
            {"id": "html", "name": "HTML", "extensions": [".html"]},
            {"id": "css", "name": "CSS", "extensions": [".css"]},
            {"id": "sql", "name": "SQL", "extensions": [".sql"]},
            {"id": "json", "name": "JSON", "extensions": [".json"]},
            {"id": "bash", "name": "Bash", "extensions": [".sh"]},
            {"id": "nodejs", "name": "Node.js", "extensions": [".js"]},
            {"id": "php", "name": "PHP", "extensions": [".php"]},
            {"id": "java", "name": "Java", "extensions": [".java"]},
            {"id": "csharp", "name": "C#", "extensions": [".cs"]},
            {"id": "go", "name": "Go", "extensions": [".go"]},
            {"id": "rust", "name": "Rust", "extensions": [".rs"]}
        ]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)