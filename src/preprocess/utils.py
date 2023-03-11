import json
from nltk import tokenize

def save_json(data, filepath=r'new_dict.json'):
    with open(filepath, 'w') as fp:
        json.dump(data, fp, indent=4)

# this function needs to be the same as server/processUtils: splitSentences()
def splitSentences(content):
    return _splitSentences(content, lambda x: x)

def _splitSentences(content, post_process=lambda x:x):
    return list(map(post_process, tokenize.sent_tokenize(content)))

def getDataset(relative_path):
    file = open(relative_path)
    data = json.load(file)
    return data

def dict_to_json(dict, filepath="data/new_dict.json"):
    dirname = os.path.dirname(__file__)
    relative_path = os.path.join(dirname, filepath)
    with open(relative_path, 'w') as fp:
        json.dump(dict, fp, indent=4)
