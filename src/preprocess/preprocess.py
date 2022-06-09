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

def gen_candidate_entities(filepath="data/rel_entities_ner.json", min_mentions=500):
    file = open(filepath)
    entity_dict = json.load(file)
    sorted_entity_list = sorted(entity_dict.items(), key=lambda item: len(item[1]), reverse=True)
    candidates = dict({"ranked_entity_list": list(filter(lambda entity: len(entity[1]) >= min_mentions, sorted_entity_list))})
    dict_to_json(candidates, filepath="data/candidate_entities.json")

def gen_entity_cooccurrence(filepath="data/candidate_entities.json"):
    file = open(filepath)
    entity_list = json.load(file)["ranked_entity_list"]

    cooccurrence_mat = defaultdict(lambda: defaultdict(list)) 
    for [entity1, mentioned_articles1] in entity_list:
        for [entity2, mentioned_articles2] in entity_list: 
            cooccurred_articles = list(set(mentioned_articles1) & set(mentioned_articles2))
            cooccurrence_mat[entity1][entity2] = cooccurred_articles
    dict_to_json(cooccurrence_mat, filepath="data/candidate_cooccurrences.json")

    return
# from collections import defaultdict
# # gen_entity_cooccurrence()

# import json
# import csv
filepath="data/processed_articles_rel_hugFace.json"
dirname = os.path.dirname(__file__)
relative_path = os.path.join(dirname, filepath)
file = open(filepath)
articles = json.load(file)
article_dict = {}
pos_sentiments = []
neg_sentiments = []
for article in articles:
    article_sentiment=article["sentiment"]
    pos = article_sentiment["pos"]
    neg = article_sentiment["neg"]
    pos_sentiments.append(pos)
    neg_sentiments.append(neg)
def myNorm(input):
    mean = np.mean(input)
    std = np.std(input)
    print(mean,std)
    return [np.tanh((i-mean)/std) for i in input]

def mySigmoid(x):
    return 1/(1+np.exp(-x))
pos_mean = np.mean(pos_sentiments)
pos_std = np.std(pos_sentiments)
neg_mean = np.mean(neg_sentiments)
neg_std = np.std(neg_sentiments)
meta_json = {"pos_mean": pos_mean, "pos_std": pos_std, "neg_mean": neg_mean, "neg_std": neg_std}
# pos_norm = myNorm(pos_sentiments)
# neg_norm = myNorm(neg_sentiments)
# import matplotlib.pyplot as plt
# fig = plt.figure()
# bins=list(np.arange(-1,1,0.01))
# plt.hist(neg_norm, bins=bins)
# # plt.hist(np.clip(pos_sentiments,bins[0], bins[1]), bins=bins)
# plt.show()

#     article_id = article["id"]
#     article_mentions = article["entities"]
#     article_mention_json_list = [] 
#     for entity in article_mentions:
#         entity_json = {
#             "start_pos": entity[0],
#             "length": entity[1],
#             "mention_text": entity[2],
#             "entity": entity[3],
#             "confidence_md": entity[4],
#             "confidence_ed": entity[5],
#             "type": entity[6]
#         }
#         article_mention_json_list.append(entity_json)
#     article_dict[article_id] = {"mention_list": article_mention_json_list}
import csv
csv_file = open("data/sentiment_metadata.csv", "w", encoding='utf-8', newline="")
csv_writer = csv.writer(csv_file)
count = 0
csv_writer.writerow(["pos_mean", "pos_std", "neg_mean", "neg_std"])
csv_writer.writerow([pos_mean, pos_std, neg_mean, neg_std])
# for (article_id, sentiment) in article_dict.items():
#     if count == 0:
#         header = ["id", "sentiment"]
#         csv_writer.writerow(header)
#         count += 1
#     sentiment_string = json.dumps(sentiment)
#     # mention_list_string = "{" + ",".join([str(mention) for mention in mention_list]) + "}"
#     csv_writer.writerow([article_id, mention_list_string])
csv_file.close()
# --------
# sorted_entity_list = sorted(entity_dict.items(), key=lambda item: len(item[1]), reverse=True)

# # print(len(sorted_entity_list))
# # num_mentions = [len(entity[1]) for entity in sorted_entity_list]

# import matplotlib.pyplot as plt
# fig = plt.figure()
# plt.plot(list(range(len(sorted_entity_list))), [len(entity[1]) for entity in sorted_entity_list])
# plt.show()
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
