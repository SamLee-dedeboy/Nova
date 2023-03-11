from nltk import tokenize

def list_to_dict(list, key=None):
    if not key:
        return {index: x for index, x in enumerate(list)}
    else:
        return {key(x): x for x in list}

# this function needs to be the same as server/processUtils: splitSentences()
def splitSentences(content):
    return _splitSentences(content, lambda x: x)

def _splitSentences(content, post_process=lambda x:x):
    return list(map(post_process, tokenize.sent_tokenize(content)))