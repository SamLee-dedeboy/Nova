from email.policy import default
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

def gen_entity_cooccurrence(filepath="data/candidate_entities.json"):
    file = open(filepath)
    entity_list = json.load(file)["ranked_entity_list"]
    article_list = json.load(open("data/processed_articles_summary_normalized_entity_candidates.json"))
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

def articles_groupby_outlet(filepath="data/processed_articles_summary_normalized.json"):
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

def gen_candidate_entity_mentions(filepath='data/processed_articles_summary_normalized_entity_candidates.json'):
    article_list = json.load(open(filepath))
    entity_article_dict = defaultdict(list)
    for article in article_list:
        for candidate_entity in article['entity_candidates']:
            entity_id = candidate_entity[0]
            entity_article_dict[entity_id].append(article['id'])
    dict_to_json({"entity_article_dict": entity_article_dict}, filepath='data/candidate_entity_mention_articles.json')

def entities_groupy_outlet(
entity_filepath="data/candidate_entity_mention_articles.json",
article_filepath="data/outlet_article_dict.json"):

    entity_mentions = list(json.load(open(entity_filepath))["entity_article_dict"].items())
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
    dict_to_json(res, filepath="data/candidate_entities_groupby_outlet.json")

def filter_article_summary(
test_article_filepath='data/processed_articles_rel_hugFace.json',
article_summary_filepath='data/article_summary.json'):
    article_list = json.load(open((test_article_filepath)))
    article_summary_list = pd.read_json((article_summary_filepath)).values.tolist()
    for article_summary_object in article_summary_list:
        article_id = article_summary_object[0]
        article_summary = article_summary_object[1]['summary'][0]
        for article in article_list:
            if article["id"] == article_id:
                article['summary'] = article_summary
                continue
    dict_to_json(article_list, filepath='data/test_articles_with_summary.json')

def normalize_sst(filepath='data/processed_articles_with_summary.json'):
    article_list = json.load(open(filepath))
    print(len(article_list))
    pos_articles = filter(lambda article: article['sentiment']['label'] == "POSITIVE", article_list)
    neg_articles = filter(lambda article: article['sentiment']['label'] == "NEGATIVE", article_list)
    pos_scores = list(map(lambda article: article['sentiment']['score'], pos_articles))
    neg_scores = list(map(lambda article: article['sentiment']['score'], neg_articles))
    import statistics

    # for article in article_list:
    #     if(article['sentiment']['label'] == 'POSITIVE'):
    #         score = article['sentiment']['score']
    #         score = (score - pos_min)/(pos_max-pos_min)
    #         article['sentiment']['score'] = score
    #     else: 
    #         score = article['sentiment']['score']
    #         score = (score - neg_min)/(neg_max-neg_min)
    #         article['sentiment']['score'] = score
    # dict_to_json(article_list, filepath='data/processed_articles_summary_normalized.json')
    # return
    pos_one = list(filter(lambda score: score <= 0.80, pos_scores))
    neg_one = list(filter(lambda score: score <= 0.80, pos_scores))
    # print(len(pos_one), len(pos_scores))
    # print(len(neg_one), len(neg_scores))

    pos_min = min(pos_scores)
    pos_max = max(pos_scores)
    neg_min = min(neg_scores)
    neg_max = max(neg_scores)
    pos_scores = list(map(lambda pos: (pos-pos_min)/(pos_max-pos_min), pos_scores))
    neg_scores = list(map(lambda neg: (neg-neg_min)/(neg_max-neg_min), neg_scores))

    pos_mean = np.mean(pos_scores)
    pos_std = np.std(pos_scores)
    pos_median = np.median(pos_scores)
    neg_mean = np.mean(pos_scores)
    neg_std = np.std(neg_scores)
    neg_median = np.median(neg_scores)

    # pos_scores = list(map(lambda pos: (pos-pos_mean)/pos_std, pos_scores))
    # neg_scores = list(map(lambda neg: (neg-neg_mean)/neg_std, neg_scores))

    neu_pos = list(filter(lambda score: score < 0.9, pos_scores))
    pos_pos = list(filter(lambda score: score >= 0.9, pos_scores))
    print(len(neu_pos), len(pos_pos), len(pos_scores))
    neu_neg = list(filter(lambda score: score < 0.9, neg_scores))
    neg_neg = list(filter(lambda score: score >= 0.9, neg_scores))
    print(len(neu_neg), len(neg_neg), len(neg_scores))
    
    import scipy.stats as stats
    import matplotlib.pyplot as plt
    from scipy.stats import norm

    h = pos_scores
    mu, std = norm.fit(h)

    hmean = np.mean(h)
    hstd = np.std(h)
    plt.hist(h, bins=100, density=True, alpha=0.6, color='g')
    xmin, xmax = plt.xlim()
    x = np.linspace(xmin, xmax, 100)
    p = norm.pdf(x, mu, std)
    plt.plot(x, p, 'k', linewidth=2)
    title = "Fit results: mu = %.2f,  std = %.2f" % (mu, std)
    plt.title(title)
    plt.show() 
    # pos_mean = statistics.mean(pos_scores)
    # pos_std = statistics.stdev(pos_scores)
    # pos_median = statistics.median(pos_scores)
    # neg_mean = statistics.mean(neg_scores)
    # neg_std = statistics.stdev(neg_scores)
    # neg_median = statistics.median(neg_scores)
    # print(pos_mean, pos_std, pos_median)
    # print(neg_mean, neg_std, neg_median)

def extract_candidate_entities(filepath='data/processed_articles_with_summary.json'):
    article_list = json.load(open(filepath))
    for article in article_list:
        entity_mention_list = article['entities']
        mention_freq_dict = {}
        for entity_mention in entity_mention_list:
            entity_id = entity_mention[3]
            if not entity_id in mention_freq_dict:
                mention_freq_dict[entity_id] = 1
            else:
                mention_freq_dict[entity_id] += 1
        mention_freq_list = list(mention_freq_dict.items())
        mention_freq_list.sort(key=lambda mention: mention[1], reverse=True)
        top_candidates = list(map(lambda pair: [pair[0],pair[1]], mention_freq_list[0:round(len(mention_freq_list)/3)]))
        article['entity_candidates'] = top_candidates
        # print(article)
            
    # dict_to_json(article_list, filepath='data/processed_articles_summary_normalized_entity_candidates.json')



    
gen_entity_cooccurrence()