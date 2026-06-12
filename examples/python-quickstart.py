"""
WoWSQL Self-Hosted — Python Quickstart
=======================================

Prerequisites:
  pip install wowsql

Make sure WoWSQL is running:
  cd docker && docker compose up -d
"""

from wowsql import WoWSQL

# Connect to your self-hosted WoWSQL instance
db = WoWSQL(
    url="http://localhost:8080",         # Kong API gateway
    key="wowsql_anon_change_me_to_a_random_string"  # Your anon key from .env
)

# ─── Read data ───────────────────────────────────────────
print("Reading todos...")
result = db.table("todos").select("*").execute()
print(f"Found {len(result.data)} todos")
for todo in result.data:
    status = "done" if todo["completed"] else "pending"
    print(f"  [{status}] {todo['title']}")

# ─── Insert data ─────────────────────────────────────────
print("\nAdding a new todo...")
new_todo = db.table("todos").insert({
    "title": "Try WoWSQL self-hosted",
    "completed": False
}).execute()
print(f"Created: {new_todo.data[0]['title']}")

# ─── Update data ─────────────────────────────────────────
print("\nMarking it as done...")
db.table("todos").update({
    "completed": True
}).eq("title", "Try WoWSQL self-hosted").execute()
print("Updated!")

# ─── Filter & query ──────────────────────────────────────
print("\nCompleted todos:")
completed = db.table("todos").select("*").eq("completed", True).execute()
for todo in completed.data:
    print(f"  ✓ {todo['title']}")

print("\nDone! Your self-hosted WoWSQL is working perfectly.")
