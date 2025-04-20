import querygpt

with open("server/systemtext/debateanalysis", "r") as f:
    system_prompt = f.read()

def debateanalyser(messages, debate_name, highlights):
    system_text = system_prompt.replace("<DEBATENAME>", debate_name)+str(highlights)
    real_messages = []
    for i in range(len(messages)):
        if i % 2 == 0:
            real_messages.append({"role": "assistant", "content": messages[i]})
        else:
            real_messages.append({"role": "user", "content": messages[i]})
    response = querygpt.run_query(messages=real_messages, system_text=system_text)
    return response