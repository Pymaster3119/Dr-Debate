import querygpt
import re
from googleapiclient.discovery import build

# Load system texts
with open('server/systemtext/gatherinfo', 'r') as file:
    system_text = file.read()
with open('server/systemtext/search', 'r') as file:
    search_system_text = file.read()

# Google Custom Search configuration
API_KEY = 'AIzaSyBbRzx3J86LLC375kZVUU1RUcYwuK0k1TY'  # replace with your actual API key
CSE_ID = '23074c75a5f794396'     # replace with your Custom Search Engine ID

# Initialize Google Search service
def google_search(query, num=10):
    service = build("customsearch", "v1", developerKey=API_KEY)
    res = service.cse().list(q=query, cx=CSE_ID, num=num).execute()
    results = []
    for item in res.get("items", []):
        results.append({
            "url": item.get("link"),
            "description": item.get("snippet")
        })
    return results

# Generates queries from a question using querygpt
def searchqueries(question):
    messages = [{"role": "system", "content": system_text}, {"role": "user", "content": question}]
    queries = querygpt.run_query(messages=messages, system_text=system_text)
    querieslist = []
    print(queries)
    for i in range(1, 11):
        pattern = f"Query{i}: (.*)"
        match = re.search(pattern, queries)
        if match:
            querieslist.append(match.group(1))
    return querieslist

# Handles a search query and formats the result for querygpt
def handlesearchqueries(query):
    print(query)
    links = google_search(query, num=10)
    message = f"Search query: {query}\n"
    for item in links:
        message += f"Link: {item['url']} Description: {item['description']}\n"
    response = querygpt.run_query(system_text=search_system_text, user_prompt=message)
    return response

# Example usage
if __name__ == "__main__":
    print(handlesearchqueries("CACI average salary"))