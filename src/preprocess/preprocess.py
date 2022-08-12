import json
import pprint
# import nltk
# nltk.download('punkt')
import pandas as pd
import os
import re
import json
# pp = pprint.PrettyPrinter(indent=4)
import numpy as np
from collections import defaultdict

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

def gen_candidate_entities(filepath="data/rel_entities_ner.json", min_mentions=500):
    file = open(filepath)
    entity_dict = json.load(file)
    sorted_entity_list = sorted(entity_dict.items(), key=lambda item: len(item[1]), reverse=True)
    # candidates = dict({"ranked_entity_list": list(filter(lambda entity: len(entity[1]) >= min_mentions, sorted_entity_list))})
    # dict_to_json(candidates, filepath="data/candidate_entities.json")
    dict_to_json(dict({"ranked_entity_list": sorted_entity_list}), filepath="data/entities.json")

def gen_entity_cooccurrence(filepath="data/entities_gt10.json"):
    file = open(filepath)
    entity_list = json.load(file)["ranked_entity_list"]
    article_list = json.load(open("data/processed_articles_rel_hugFace.json"))
    article_dict = {}
    count = 0
    for article in article_list:
        article_dict[article["id"]] = article
    cooccurrence_mat = defaultdict(lambda: defaultdict(list)) 
    coocccurrence_groupby_dict = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for [entity1, mentioned_articles1] in entity_list:
        for [entity2, mentioned_articles2] in entity_list: 
            cooccurred_article_ids = list(set(mentioned_articles1) & set(mentioned_articles2))
            
            cooccurrence_mat[entity1][entity2] = cooccurred_article_ids
            for article_id in cooccurred_article_ids:
                article = article_dict[article_id]
                journal_cooccurr_dict = coocccurrence_groupby_dict[article["journal"]]
                journal_cooccurr_dict[entity1][entity2].append(article["id"])
                count+=1
    # dict_to_json(cooccurrence_mat, filepath="data/entity_cooccurrences.json")
    dict_to_json(coocccurrence_groupby_dict, filepath="data/entity_cooccurrences_groupby_outlet.json")
    return

def articles_groupby_outlet(filepath="data/processed_articles_rel_hugFace.json"):
    article_list = pd.read_json(filepath)
    outlet_article_dict = dict(tuple(article_list.groupby(['journal'])))
    res = {}
    for outlet, articles in outlet_article_dict.items():
        article_list = articles.to_dict("records")
        for article in article_list:
            article["timestamp"] = article['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
        # dict_to_json(article_list, filepath="data/{}_articles.json".format(outlet))
        res[outlet] = article_list
    dict_to_json(res, filepath="data/outlet_article_dict.json")
        # articles.to_json("data/{}_articles.json".format(outlet))
def entities_groupy_outlet(
entity_filepath="data/entities_gt10.json",
article_filepath="data/outlet_article_dict.json"):

    entity_mentions = pd.read_json(entity_filepath)["ranked_entity_list"].tolist()
    article_file = open(article_filepath)
    outlet_article_dict = json.load(article_file)
    res = {}
    for outlet, articles in outlet_article_dict.items():
        article_ids = list(map(lambda article: article["id"], articles))

        candidate_entities = [] 
        for entity_mention in entity_mentions:
            entity = entity_mention[0]
            mentioned_article_ids = entity_mention[1]
            intersection_article_ids = list(set(article_ids) & set(mentioned_article_ids))
            intersection_article_ids.sort()
            candidate_entities.append({"entity": entity, "article_ids": intersection_article_ids})
        res[outlet] = candidate_entities
    dict_to_json(res, filepath="data/entities_groupby_outlet.json")

gen_entity_cooccurrence()