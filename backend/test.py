import requests
import json

url = "https://370d4f70921d.ngrok-free.app/ask"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "rameez-secret-key-2026"
}
data = {
    "question": "What is force?"
}

response = requests.post(url, headers=headers, json=data)
print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")