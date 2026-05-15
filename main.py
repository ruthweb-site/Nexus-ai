import os
import json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="AI Log Analyzer")

# Initialize OpenAI client for NVIDIA API
# The NVIDIA API key should be in the environment variable NVIDIA_API_KEY
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

# Create a client pointing to the NVIDIA API endpoint
# Note: Nvidia's API is compatible with OpenAI's client.
try:
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=NVIDIA_API_KEY
    )
except Exception as e:
    print(f"Warning: Could not initialize NVIDIA API client: {e}")
    client = None

# We use the Llama 3.1 8B model available on NVIDIA NIM as it is supported for your API key tier
NVIDIA_MODEL = "meta/llama-3.1-8b-instruct"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# We must ensure the static directory exists before mounting
os.makedirs(STATIC_DIR, exist_ok=True)

# Mount static files to serve HTML, CSS, JS
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    with open(index_path, "r") as f:
        return f.read()

@app.post("/analyze")
async def analyze_log(file: UploadFile = File(...)):
    if not file.filename.endswith('.log') and not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="Only .log or .txt files are supported.")
    
    # Read the file content
    try:
        content = await file.read()
        log_text = content.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    # Truncate if too long (just for demo purposes to avoid token limits)
    max_chars = 15000
    if len(log_text) > max_chars:
        log_text = log_text[-max_chars:] # grab the tail of the log

    if not client or not NVIDIA_API_KEY or NVIDIA_API_KEY == "your_nvidia_api_key_here":
        # Return mock data if API is not configured
        return {
            "incident_overview": "This is a mock incident overview. Please add your valid NVIDIA_API_KEY to the .env file.",
            "metrics": {
                "total_errors": 1,
                "total_warnings": 0,
                "failed_services": 1
            },
            "recommendations": [
                "Verify database credentials in .env",
                "Restart the PostgreSQL service"
            ],
            "errors": [
                {
                    "message": "Mock Error: Database connection failed",
                    "affected_service": "DatabaseService",
                    "severity": "Critical",
                    "confidence_score": "95%",
                    "root_cause": "Network timeout or invalid credentials.",
                    "explanation": "The application could not connect to the database.",
                    "fix": "Check if the database service is running and credentials are correct.",
                    "recommended_debugging_areas": ["Inspect Database logs", "Verify Docker network connectivity", "Check environment variables"]
                }
            ]
        }

    # Prompt for the AI
    prompt = f"""
Analyze the provided system logs and generate a professional AI-powered incident analysis report.

Provide your response strictly as a JSON object with the following structure:
{{
  "incident_overview": "A brief, professional overall summary of the incident and system health.",
  "metrics": {{
    "total_errors": 0,
    "total_warnings": 0,
    "failed_services": 0
  }},
  "recommendations": [
    "List of proactive, actionable smart recommendations based on the logs."
  ],
  "errors": [
    {{
      "message": "The exact error message or log line",
      "affected_service": "Name of the service affected.",
      "severity": "Critical, High, Medium, or Low",
      "confidence_score": "e.g. 92%",
      "root_cause": "The most likely underlying root cause.",
      "explanation": "A beginner-friendly explanation of what this error means",
      "fix": "Suggested Fix: Actionable steps to resolve this issue",
      "recommended_debugging_areas": ["High-level investigation guidance area 1", "Area 2"]
    }}
  ]
}}

Rules:
* Tone: Professional, DevOps/SRE style, clear and concise.
* Focus only on intelligent analysis, debugging guidance, and human-readable recommendations.
* Do NOT generate terminal commands, shell scripts, installation commands, or destructive actions.
* Recommended Debugging Areas should contain only high-level investigation guidance, not executable commands (e.g. "Review JWT validation configuration", "Inspect AWS IAM permissions").
* Avoid destructive or risky actions, fake endpoints, and unrealistic debugging steps.

Here is the log:
---
{log_text}
---
"""

    try:
        completion = client.chat.completions.create(
            model=NVIDIA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            top_p=0.7,
            max_tokens=1024,
        )
        
        # Parse the response
        response_text = completion.choices[0].message.content
        
        # Clean up the response to extract JSON
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
            
        result = json.loads(response_text)
        return result
        
    except json.JSONDecodeError:
        print(f"Failed to parse JSON. Raw response: {response_text}")
        raise HTTPException(status_code=500, detail="AI returned an invalid response format.")
    except Exception as e:
        print(f"Error calling NVIDIA API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing log: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
