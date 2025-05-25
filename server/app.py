from flask import Flask, send_from_directory, request
import os
import threading
import time
import gatheringinfo
import debate
import debateanalyser
import sqlite3

# 0 - question asked from user->app
# 1 - search queries generated
# 2 - search queries answered
# 3 - debate initiated
# 4 - debate in progress 

userstates = {}
userquestions = {}
userstances = {}
askedquestions = {}
searchqueries = {}
searchqueriesanswers = {}
previousdebate = {}
newestmessage = {}
isuser = {}
timers = {}

numdebates = 1
totalanalyses = 1

app = Flask(__name__, static_folder='../client')

#region Practice Debate
@app.route('/sendQuestion', methods=['POST'])
def send_question():
    data = request.get_json()
    userhash = data['userhash']
    userquestions[userhash] = data['question']
    userstances[userhash] = data['stance']
    userstates[userhash] = 0
    threading.Thread(target=background_task, args=(userhash,), daemon=True).start()
    return "successfully received", 200

@app.route('/')
def index():
    global numdebates
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

def find_search_query_answers(user, number):
    searchqueriesanswers[user][searchqueries[user][number]] = gatheringinfo.handlesearchqueries(searchqueries[user][number])

def background_task(user):
    global numdebates
    while True:
        if user in timers and time.time()-timers[user] > 60:
            break
        try:
            if userstates[user] == 0:
                searchqueries[user] = gatheringinfo.searchqueries(userquestions[user])
                print(searchqueries)
                userstates[user] = 1
            if userstates[user] == 1:
                searchqueriesanswers[user] = {}
                print("hehehehehehe")
                for i in range(len(searchqueries[user])):
                    threading.Thread(target=find_search_query_answers, args=(user, i), daemon=True).start()
                userstates[user] = 1.5
            if userstates[user] == 1.5:
                allanswers = True
                for query in searchqueries[user]:
                    if query not in searchqueriesanswers[user]:
                        allanswers = False
                if allanswers:
                    userstates[user] = 2
            if userstates[user] == 3:
                if userstances[user] == "con":
                    opening_statement = debate.pro_openingstatement(userquestions[user], searchqueriesanswers[user])
                    with open(f"debatefiles/{user}.txt", "w") as f:
                        debate.json.dump([{"speaker": "pro", "type": "opening", "content": opening_statement}], f)
                else:
                    with open(f"debatefiles/{user}.txt", "w") as f:
                        debate.json.dump([], f)
                userstates[user] = 4    # Set state to 4 for both stances
            if userstates[user] == 4 and user in newestmessage and newestmessage[user] != "":
                print("Helloeofijsdfoijaswoifoiasduoiahtouhoawsr")
                if userstances[user] == "con":
                    debate.pro_debate_append(f"debatefiles/{user}.txt", userquestions[user], searchqueriesanswers[user], newestmessage[user])
                else:
                    debate.con_debate_append(f"debatefiles/{user}.txt", userquestions[user], searchqueriesanswers[user], newestmessage[user])
                newestmessage[user] = ""
                with open(f"debatefiles/{user}.txt", "r") as f:
                    data = debate.json.load(f)
                    if len(data) == 7:
                        numdebates += 1
                        if isuser[user]:
                            cur.execute("UPDATE users SET debate_count = debate_count + 1 WHERE username=?", (user,))
                            conn.commit()
                            if data[6]['winner'].lower() == userstances[user].lower():
                                cur.execute("UPDATE users SET debate_wins = debate_wins + 1 WHERE username=?", (user,))
                                conn.commit()
                                print("User won the debate")
            time.sleep(0.1)
        except Exception as e:
            print(f"Exception: {e}")
    print(f"Thread for user {user} has stopped.")
    
    #Delete debate file
    if os.path.exists(f'debatefiles/{user}.txt'):
        os.remove(f"debatefiles/{user}.txt")
@app.route('/debatetopics', methods=['POST'])
def topics():
    return send_from_directory(app.static_folder, 'debatetopics')

@app.route('/getSearchQueries', methods=['POST'])
def getSearchQueries():
    data = request.get_json()
    userhash = data['userhash']
    queries = searchqueriesanswers[userhash]
    return {"queries":queries, "finished":userstates[userhash] == 4}, 200
    
@app.route('/startDebate', methods=['POST'])
def startDebate():
    data = request.get_json()
    userhash = data['userhash']
    isusername = data['isuser']
    isuser[userhash] = isusername
    userstates[userhash] = 3
    timers[userhash] = time.time()
    return "successfully received", 200

@app.route('/getDebate', methods=['POST'])
def returndebatestate():
    data = request.get_json()
    userhash = data['userhash']
    debatefile = f"debatefiles/{userhash}.txt"
    with open(debatefile, 'r') as file:
        debatecontent = debate.json.load(file)
    if userstates[userhash] == 4:
        if userhash in previousdebate and previousdebate[userhash] == debatecontent:
            return "Reuse the same debate", 304
        debatefile = f"debatefiles/{userhash}.txt"
        with open(debatefile, 'r') as file:
            debatecontent = debate.json.load(file)
        previousdebate[userhash] = debatecontent
        timers[userhash] = time.time()
        return {"debate": debatecontent}, 200
    else:
        return "No debate available", 404

@app.route('/appendToDebate', methods=['POST'])
def appendToDebate():
    data = request.get_json()
    userhash = data['userhash']
    message = data['message']
    newestmessage[userhash] = message
    return "DOne", 200
#endregion

#region Debate Analysis
@app.route('/getAllDebateNames', methods=['POST'])
def returnalldebates():
    debatefiles = os.listdir("influentialdebates")
    debates = []
    for i in debatefiles:
        if i.endswith(".txt"):
            debates.append(i[:-4])
    return {"debates": debates}, 200

@app.route('/getDebateFile', methods=['POST'])
def returnDebate():
    data = request.get_json()
    filename = data['debatename']
    with open(f"influentialdebates/{filename}.txt", 'r') as file:
        debatecontent = file.read()
    return {"debatetext": debatecontent}, 200

@app.route('/getDebateAnalysis', methods=['POST'])
def returnDebateAnalysis():
    global totalanalyses
    data = request.get_json()
    debatename = data['debatename']
    highlights = data['highlights']
    messages = data['messages']
    response = debateanalyser.debateanalyser(messages, debatename, highlights)
    totalanalyses += 1
    return {"analysis": response}, 200
#endregion

#region About Page

@app.route('/numDebates', methods=['POST'])
def numDebates():
    return {"numDebates": numdebates}, 200

@app.route('/numAnalyses', methods=['POST'])
def numAnalyses():
    return {"numAnalyses": totalanalyses}, 200
#endregion

#region signin/signup, user profiles
conn = sqlite3.connect('server/users.db', check_same_thread=False)
cur = conn.cursor()

cur.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        debate_count INTEGER DEFAULT 0,
        debate_wins INTEGER DEFAULT 0
    )
''')
conn.commit()

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data['username']
    password = data['password']
    
    cur.execute('SELECT * FROM users WHERE username=?', (username,))
    if cur.fetchone() is not None:
        return "Username already exists", 400
    
    cur.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
    conn.commit()
    
    return {'success': True}, 200

@app.route('/signin', methods=['POST'])
def signin():
    data = request.get_json()
    username = data['username']
    password = data['password']
    
    cur.execute('SELECT * FROM users WHERE username=? AND password=?', (username, password))
    user = cur.fetchone()
    
    if user is None:
        return "Invalid credentials", 400
    
    return {'success': True}, 200

@app.route('/getUserDebateCount', methods=['POST'])
def get_user_debate_count():
    print("Here")
    data = request.get_json()
    username = data['username']
    
    cur.execute('SELECT debate_count, debate_wins FROM users WHERE username=?', (username,))
    result = cur.fetchone()
    
    if result is None:
        return "User not found", 404
    
    debate_count = result[0]
    debate_wins = result[1]
    return {'debate_count': debate_count, 'debate_wins': debate_wins}, 200
#endregion

if __name__ == '__main__':
    app.run(debug=False, port=8080)