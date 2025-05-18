import querygpt
import json
with open("server/systemtext/debate", "r") as f:
    system_prompt = f.read()
with open("server/systemtext/evaluator", "r") as f:
    evaluator_system_text = f.read()

# Pro side functions
def pro_openingstatement(prompt, knowledge):
    base_prompt = f"You are on the 'pro' side of the debate. The question at hand is {prompt}. The following knowledge has been retrieved from the internet for you to use in your argument:\n"
    for i in knowledge.keys():
        base_prompt += f"{i}: {knowledge[i]}\n"

    prompt = base_prompt + "Please provide an opening statement."
    opening_statement = querygpt.run_query(system_text=system_prompt, user_prompt=prompt)
    return opening_statement


def pro_rebuttals(prompt, knowledge, pro_agent_opening_statement, con_opening_statement):
    base_prompt = f"You are on the 'pro' side of the debate. The question at hand is {prompt}. The following knowledge has been retrieved from the internet for you to use in your argument:\n"
    for i in knowledge.keys():
        base_prompt += f"{i}: {knowledge[i]}\n"

    prompt = base_prompt + "Please provide an opening statement."
    messages = [{"role": "user", "content": prompt}, {"role": "assistant", "content": pro_agent_opening_statement}]
    user_prompt = f"Great! Now provide a rebuttal. The 'con' side has provided the following opening statement:\n{con_opening_statement}"
    print("herhehehehe")
    rebuttal = querygpt.run_query(system_text=system_prompt, messages=messages, user_prompt=user_prompt)
    print('djone')
    return rebuttal

def pro_closing_statements(prompt, knowledge, pro_agent_opening_statement, con_opening_statement, pro_agent_rebuttal, con_rebuttal):
    base_prompt = f"You are on the 'pro' side of the debate. The question at hand is {prompt}. The following knowledge has been retrieved from the internet for you to use in your argument:\n"
    for i in knowledge.keys():
        base_prompt += f"{i}: {knowledge[i]}\n"

    prompt = base_prompt + "Please provide an opening statement."
    messages = [{"role": "user", "content": prompt}, {"role": "assistant", "content": pro_agent_opening_statement}, {"role": "user", "content": f"Great! Now provide a rebuttal. The 'con' side has provided the following opening statement:\n{con_opening_statement}"}, {"role": "assistant", "content": pro_agent_rebuttal}]
    user_prompt = f"Great! Now provide a closing statement. The 'con' side has provided the following rebuttal:\n{con_rebuttal}"
    closing_statement = querygpt.run_query(system_text=system_prompt, messages=messages, user_prompt=user_prompt)
    return closing_statement

def evaluate(prompt, pro_agent_opening_statement, con_opening_statement, pro_agent_rebuttal, con_rebuttal, pro_agent_closing_statement, con_closing_statement):
    evaluator_prompt = f"The question at hand in this debate is {prompt}. The pro side has provided the following arguments:\nOpening statement: {pro_agent_opening_statement}\nRebuttal: {pro_agent_rebuttal}\nClosing statement: {pro_agent_closing_statement}\nThe con side has provided the following arguments:\nOpening statement: {con_opening_statement}\nRebuttal: {con_rebuttal}\nClosing statement: {con_closing_statement}\nPlease evaluate the debate based on the appropriate criterion."
    evaluation = querygpt.run_query(system_text=evaluator_system_text, user_prompt=evaluator_prompt)
    winner = "pro" if "pro" in evaluation else "con"
    return evaluation, winner

def pro_debate_append(filename, question, knowledge, user_answer):
    with open(filename, "r") as f:
        data = json.load(f)
    if len(data) == 0:
        agent_response = pro_openingstatement(question, knowledge)
    elif len(data) == 1:
        print("Rebubbbgtall")
        agent_response = pro_rebuttals(question, knowledge, data[0]['content'], user_answer)
        print('HJereelkjer')
    elif len(data) == 3:
        agent_response = pro_closing_statements(question, knowledge, data[0]['content'], data[1]['content'], data[2]['content'], user_answer)
    elif len(data) == 5:
        agent_response = evaluate(question, data[0]['content'], data[1]['content'], data[2]['content'], user_answer, data[4]['content'], user_answer)
    else:
        return
    data.append({"speaker": "con", "type": "opening", "content": user_answer})
    if len(data) != 6:
        data.append({"speaker": "pro", "type": "rebuttal", "content": agent_response})
    else:
        data.append({"evaluation": agent_response[0], "winner": agent_response[1]})
    print(data)
    print(filename)
    with open(filename, "w") as f:
        json.dump(data, f)

# Con side functions

def con_openingstatement(prompt, knowledge, pro_agent_opening_statement):
    base_prompt = f"You are on the 'con' side of the debate. The question at hand is {prompt}. The pro side has provided the following opening statement:\n{pro_agent_opening_statement}\nThe following knowledge has been retrieved from the internet for you to use in your argument:\n"
    for i in knowledge.keys():
        base_prompt += f"{i}: {knowledge[i]}\n"

    prompt = base_prompt + "Please provide an opening statement."
    opening_statement = querygpt.run_query(system_text=system_prompt, user_prompt=prompt)
    return opening_statement


def con_rebuttals(prompt, knowledge, pro_agent_opening_statement, con_opening_statement, pro_rebuttal):
    base_prompt = f"You are on the 'con' side of the debate. The question at hand is {prompt}. The pro side has provided the following opening statement:\n{pro_agent_opening_statement}\nThe following knowledge has been retrieved from the internet for you to use in your argument:\n"
    for i in knowledge.keys():
        base_prompt += f"{i}: {knowledge[i]}\n"

    prompt = base_prompt + "Please provide an opening statement."
    messages = [{"role": "user", "content": prompt}, {"role": "assistant", "content": con_opening_statement}]
    user_prompt = f"Great! Now provide a rebuttal. The 'pro' side has provided the following rebuttal:\n{pro_rebuttal}"
    print("herhehehehe")
    rebuttal = querygpt.run_query(system_text=system_prompt, messages=messages, user_prompt=user_prompt)
    print('djone')
    return rebuttal

def con_closing_statements(prompt, knowledge, pro_agent_opening_statement, con_opening_statement, pro_agent_rebuttal, con_rebuttal, pro_agent_closing_statement):
    base_prompt = base_prompt = f"You are on the 'con' side of the debate. The question at hand is {prompt}. The pro side has provided the following opening statement:\n{pro_agent_opening_statement}\nThe following knowledge has been retrieved from the internet for you to use in your argument:\n"
    for i in knowledge.keys():
        base_prompt += f"{i}: {knowledge[i]}\n"

    prompt = base_prompt + "Please provide an opening statement."
    messages = [{"role": "user", "content": prompt}, {"role": "assistant", "content": con_opening_statement}, {"role": "user", "content": f"Great! Now provide a rebuttal. The 'pro' side has provided the following rebuttal:\n{pro_agent_rebuttal}"}, {"role": "assistant", "content": con_rebuttal}]
    user_prompt = f"Great! Now provide a closing statement. The 'pro' side has provided the following colosing statement:\n{pro_agent_closing_statement}"
    closing_statement = querygpt.run_query(system_text=system_prompt, messages=messages, user_prompt=user_prompt)
    return closing_statement


def con_debate_append(filename, question, knowledge, user_answer, flag=False):
    with open(filename, "r") as f:
        data = json.load(f)
    print(len(data))
    if len(data) == 0:
        agent_response = con_openingstatement(question, knowledge, user_answer)
    elif len(data) == 2:
        print("Rebubbbgtall")
        agent_response = con_rebuttals(question, knowledge, data[0]['content'], data[1]['content'], user_answer)
        print('HJereelkjer')
    elif len(data) == 4:
        agent_response = con_closing_statements(question, knowledge, data[0]['content'], data[1]['content'], data[2]['content'], data[3]['content'], user_answer)
    elif len(data) == 6:
        agent_response = evaluate(question, data[0]['content'], data[1]['content'], data[2]['content'], data[3]['content'], data[4]['content'], user_answer)
    else:
        return
    if not flag:
        data.append({"speaker": "pro", "type": "opening", "content": user_answer})
    if len(data) != 6:
        data.append({"speaker": "con", "type": "rebuttal", "content": agent_response})
    else:
        data.append({"evaluation": agent_response[0], "winner": agent_response[1]})
    print(data)
    print(filename)
    with open(filename, "w") as f:
        json.dump(data, f)
    if len(data) == 6:
        con_debate_append(filename, question, knowledge, user_answer, flag=True)