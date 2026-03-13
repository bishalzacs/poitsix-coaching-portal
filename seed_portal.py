import os
from supabase import create_client, Client

# --- CONFIGURATION ---
# Replace these with your actual Supabase Project URL and Service Role Key
# You can find these in your Supabase Dashboard -> Project Settings -> API
SUPABASE_URL = "https://blfarufwumpoxzkaibww.supabase.co"
SUPABASE_KEY = "YOUR_SERVICE_ROLE_KEY" 

# YouTube Classes to embed
CLASSES = [
    {"title": "Class 1", "youtube_url": "https://www.youtube.com/watch?v=BiMQ-yiRim4", "index": 1, "description": "Introduction to the course and fundamental concepts."},
    {"title": "Class 2", "youtube_url": "https://www.youtube.com/watch?v=OIYajFhu1Ys", "index": 2, "description": "Deep dive into specialized techniques and workflows."},
    {"title": "Class 3", "youtube_url": "https://www.youtube.com/watch?v=3yBARf2h3Rg", "index": 3, "description": "Advanced strategies for peak performance."},
    {"title": "Class 4", "youtube_url": "https://www.youtube.com/watch?v=7panxaURIBY", "index": 4, "description": "Practical applications and real-world case studies."},
    {"title": "Class 5", "youtube_url": "https://www.youtube.com/watch?v=GDl7S8TR1u4", "index": 5, "description": "Optimizing results and scaling your process."},
    {"title": "Class 6", "youtube_url": "https://www.youtube.com/watch?v=Ed3BvIOW4Mc", "index": 6, "description": "Masterclass on professional implementation."},
    {"title": "Class 7", "youtube_url": "https://www.youtube.com/watch?v=z09SVKUzQc8", "index": 7, "description": "Final review, troubleshooting, and next steps."},
]

def seed_database():
    if SUPABASE_KEY == "YOUR_SERVICE_ROLE_KEY":
        print("❌ Error: Please provide your Supabase Service Role Key.")
        return

    print("🚀 Starting database seeding...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Insert new videos using indexing to prevent duplicates
    for cls in CLASSES:
        print(f"Adding {cls['title']}...")
        try:
            supabase.table('videos').upsert(cls, on_conflict='index').execute()
        except Exception as e:
            print(f"Failed to add {cls['title']}: {e}")
            
    print("✅ Seeding complete!")

if __name__ == "__main__":
    seed_database()
