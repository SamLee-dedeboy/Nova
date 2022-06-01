import json
import pprint
import nltk
# nltk.download('punkt')
import pandas as pd
import os
import re
import json
# pp = pprint.PrettyPrinter(indent=4)
import numpy as np

def getRawDataset():
    file = open("data/articles.json")
    data = json.load(file)
    return data["data"]["Article"]

def getDataset(relative_path):
    file = open(relative_path)
    data = json.load(file)
    return data

def gen_single_topic_dataset(dataset, filepath="data/single_topic_articles.json"):
    top_level_key = "ClassifierTopLevel"
    second_level_key = "ClassifierSecondLevel"
    for article in dataset:
        top_level_topic = get_max_topic(article[top_level_key], "class", "percentage") 
        second_level_topic = get_max_topic(article[second_level_key], "subclass", "percentage") 
        article["top_level_topic"] = top_level_topic
        article["second_level_topic"] = second_level_topic
        article.pop(top_level_key, None)
        article.pop(second_level_key, None)
    dict_to_json(dataset, filepath=filepath)

def get_max_topic(topic_list, key_name, value_name):
    max_index = max(range(len(topic_list)), key=lambda i: topic_list[i][value_name])
    return topic_list[max_index][key_name]

def paragraph_to_sentences(content):
    import re
    content = re.sub(r'([a-z0-9])\.([A-Z])', r'\1. \2', content)
    return list(nltk.tokenize.sent_tokenize(content))

def article_to_paragraphs(content):
    return list(filter(None, re.split(r'\n', content)))

def article_to_sentences(content):
    return paragraph_to_sentences(" ".join(article_to_paragraphs(content)))

def df_to_csv(df, filepath="data/sentiments.csv"):
    dirname = os.path.dirname(__file__)
    relative_path = os.path.join(dirname, filepath)
    df.to_csv(relative_path, index=False)

def dict_to_json(dict, filepath="data/new_dict.json"):
    dirname = os.path.dirname(__file__)
    relative_path = os.path.join(dirname, filepath)
    with open(relative_path, 'w') as fp:
        json.dump(dict, fp, indent=4)

def gen_candidate_entities(filepath="data/rel_entities.json", num_candidate=1000):
    file = open(filepath)
    entity_dict = json.load(file)
    sorted_entity_list = sorted(entity_dict.items(), key=lambda item: len(item[1]), reverse=True)
    candidates = dict({"ranked_entity_list": sorted_entity_list[:num_candidate]})
    dict_to_json(candidates, filepath="data/candidate_entities.json")

# gen_candidate_entities()

# sentences = article_to_sentences(dataset[21]["content"])
# dataset = getDataset("data/processed_articles_rel.json")
# for article in dataset:
#     if article["id"] == 2304:
#         sentences = article_to_sentences(article["content"])
#         for sentence in sentences:
#             print("---------------------------")
#             print(len(sentence.split(" ")))
#             print(sentence)
