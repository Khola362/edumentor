import httpx
import asyncio
from typing import AsyncGenerator
from app.core.config import settings
import re

class LLMService:
    def __init__(self):
        self.render_url = settings.punjab_api_url
        self.api_key = settings.punjab_api_key
        
        print("✅ LLMService initialized")
        print(f"   URL: {self.render_url}")
        print(f"   Key: {self.api_key[:3]}***")

    async def generate_response(
        self,
        messages: list,
        session_id: str = None,
        query: str = None,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:

        # Get the question from query or last user message
        user_query = query or ""
        if not user_query:
            for msg in reversed(messages):
                if msg.get("sender") == "user":
                    user_query = msg.get("content", "")
                    break

        if not user_query:
            yield "Please ask a Punjab textbook question."
            return

        url = f"{self.render_url}/ask"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key
        }

        payload = {
            "question": user_query,
            "top_k": 3,                # Use top_k instead of k
            "session_id": session_id or "default"
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                
                # Handle API errors
                if response.status_code != 200:
                    try:
                        error_info = response.json()
                        print("❌ Punjab API Error:", error_info)
                    except:
                        print("❌ Punjab API Error (raw):", response.text)
                    yield f"Punjab API error: {response.status_code}"
                    return

                data = response.json()
                answer = data.get("answer", "")

                # Split into Book / Teacher / Final answers
                pattern = r"📘 Book Answer:(.*?)🧠 Teacher Explanation:(.*?)✅ Final Answer:(.*)"
                match = re.search(pattern, answer, re.DOTALL)

                if match:
                    book_answer = match.group(1).strip()
                    teacher_explanation = match.group(2).strip()
                    final_answer = match.group(3).strip()

                    if stream:
                        # Stream word by word with space between sections
                        for section in [book_answer, teacher_explanation, final_answer]:
                            for word in section.split():
                                yield word + " "
                            yield "\n\n"
                    else:
                        # Return as single string
                        yield f"{book_answer} \n\n {teacher_explanation} \n\n {final_answer}"
                else:
                    # fallback if markers not found
                    if stream:
                        for word in answer.split():
                            yield word + " "
                    else:
                        yield answer

        except httpx.TimeoutException:
            yield "❌ Punjab API timeout. Please try again."
        except httpx.RequestError as e:
            print("❌ Request error:", e)
            yield "❌ Connection error. Please check Punjab API availability."
        except Exception as e:
            print("❌ Unexpected error:", e)
            yield "❌ Unexpected error occurred."

# Create instance
llm_service = LLMService()
