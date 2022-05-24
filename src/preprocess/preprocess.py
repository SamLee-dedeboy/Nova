import json
import pprint
import nltk
# nltk.download('punkt')
import pandas as pd
import os
# pp = pprint.PrettyPrinter(indent=4)

def getDataset():
    file = open("data/articles.json")
    data = json.load(file)
    return data["data"]["Article"]

def paragraph_to_sentences(content):
    return list(nltk.sent_tokenize(content))

def article_to_paragraphs(content):
    return list(filter(None, content.split("\n")))

def article_to_sentences(content):
    return paragraph_to_sentences(" ".join(article_to_paragraphs(content)))

def df_to_csv(df, filepath="data/sentiments.csv"):
    dirname = os.path.dirname(__file__)
    relative_path = os.path.join(dirname, filepath)
    df.to_csv(relative_path, index=False)


