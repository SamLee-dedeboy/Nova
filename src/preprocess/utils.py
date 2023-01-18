import json
from nltk import tokenize

def save_json(data, filepath=r'new_dict.json'):
    with open(filepath, 'w') as fp:
        json.dump(data, fp, indent=4)

def splitSentences(content, post_process=lambda x:x):
    return list(map(post_process, tokenize.sent_tokenize(content)))

