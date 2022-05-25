import json
import pprint
import nltk
# nltk.download('punkt')
import pandas as pd
import os
import re
# pp = pprint.PrettyPrinter(indent=4)

def getDataset():
    file = open("data/articles.json")
    data = json.load(file)
    return data["data"]["Article"]

def paragraph_to_sentences(content):
    import re
    content = re.sub(r'([a-z])\.([A-Z])', r'\1. \2', content)
    return list(nltk.tokenize.sent_tokenize(content))

def article_to_paragraphs(content):
    return list(filter(None, re.split(r'\n', content)))

def article_to_sentences(content):
    return paragraph_to_sentences(" ".join(article_to_paragraphs(content)))

def df_to_csv(df, filepath="data/sentiments.csv"):
    dirname = os.path.dirname(__file__)
    relative_path = os.path.join(dirname, filepath)
    df.to_csv(relative_path, index=False)

# sentences = article_to_sentences(dataset[21]["content"])
