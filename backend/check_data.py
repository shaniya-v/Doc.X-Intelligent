#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))

result = supabase.table('documents').select('title, assigned_department, status, priority').execute()
print('📊 All Documents in Database:')
for doc in result.data or []:
    title = doc['title'][:40] + '...' if len(doc['title']) > 40 else doc['title']
    dept = doc['assigned_department']
    status = doc['status']
    priority = doc['priority']
    print(f'  • {title} -> {dept} ({status}, {priority})')

print(f'\nTotal documents: {len(result.data or [])}')