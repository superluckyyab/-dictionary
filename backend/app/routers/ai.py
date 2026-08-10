from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/api/ai", tags=["ai"])

_API_KEY = "c718f5b6ab5f41c890d84bbf8f9ed240.PQwZfjzCFY2EJUNK"
_API_URL = "https://api.z.ai/api/paas/v4/chat/completions"
_MODEL   = "glm-4.5-flash"


class CompleteRequest(BaseModel):
    prompt: str


@router.post("/complete")
async def ai_complete(req: CompleteRequest):
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                _API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {_API_KEY}",
                },
                json={
                    "model": _MODEL,
                    "messages": [{"role": "user", "content": req.prompt}],
                    "max_tokens": 2048,
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
            return {"text": text}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"AI API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
