import urllib.request, urllib.error, json
try:
    # login
    req = urllib.request.Request('http://127.0.0.1:8000/api/auth/login', data=json.dumps({'email': 'test@local.dev', 'password': 'TestPass123'}).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read())['access_token']
    
    # get a session
    req_sessions = urllib.request.Request('http://127.0.0.1:8000/api/sessions?page=1&size=1', headers={'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(req_sessions) as r_s:
        sessions = json.loads(r_s.read())['sessions']
        if not sessions:
            print("No sessions found to close.")
            exit()
        session_id = sessions[0]['id']
    
    # close it
    req_close = urllib.request.Request(f'http://127.0.0.1:8000/api/sessions/{session_id}/close', data=json.dumps({}).encode(), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(req_close) as r_c:
        print(r_c.read())
except urllib.error.HTTPError as e:
    print("STATUS:", e.code)
    print("BODY:", e.read().decode())
except Exception as e:
    print("OTHER ERROR:", e)
