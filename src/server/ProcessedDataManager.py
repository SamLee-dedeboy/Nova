from collections import defaultdict
from datetime import datetime
import itertools
class ProcessedDataManager:
    def __init__(self, raw_data):
        self.outlet_set, \
        self.article_dict, \
        self.article_bins_dict, \
        self.min_timestamp, \
        self.max_timestamp, \
        self.outlet_article_num_dict, \
        self.outlet_article_classified_num_dict \
        = processArticleDict(raw_data.outlet_article_dict)
        self.entity_list = list(raw_data.candidate_entity.keys())

    def idsToArticles(self, id_list):
        return [self.article_dict[id] for id in id_list]
    def binArticlesByTopic(self, articles):
        topicBins = {}
        for article in articles:
            topic = article['top_level_topic']
            if topic not in topicBins.keys():
                topicBins[topic] = {"pos": 0, "neg": 0}
            if article['sentiment']['label'] == 'POSITIVE': topicBins[topic]["pos"] += 1
            if article['sentiment']['label'] == 'NEGATIVE': topicBins[topic]["neg"] += 1
        return topicBins
    

def processArticleDict(outlet_article_dict):
    date_str_template = '%Y-%m-%d'
    min_timestamp = datetime.strptime('3000-10-10', date_str_template)
    max_timestamp = datetime.strptime('1000-10-10', date_str_template)
    article_dict = {}
    article_bins_dict = {}
    outlet_article_num_dict = {}
    outlet_article_classified_num_dict = defaultdict(dict)
    for outlet, articles in outlet_article_dict.items():
        for article in articles:
            if(article["sentiment"]["label"] == "NEGATIVE"):
                article["sentiment"]['score'] *= -1
            timestamp = datetime.strptime(article['timestamp'].split(" ")[0], date_str_template)
            if(timestamp < min_timestamp): min_timestamp = timestamp
            if(timestamp > max_timestamp): max_timestamp = timestamp
            article_dict[article["id"]] = article
        article_bins_dict[outlet] = binArticlesByMonth(articles)
        outlet_article_num_dict[outlet] = len(articles)
        pos_articles, neg_articles = [], []
        for article in articles:
            (pos_articles if article['sentiment']['label'] == 'POSITIVE' else neg_articles).append(article["id"])
        outlet_article_classified_num_dict[outlet]["pos"] = len(pos_articles)
        outlet_article_classified_num_dict[outlet]["neg"] = len(neg_articles)


    min_timestamp = min_timestamp.isoformat()
    max_timestamp = max_timestamp.isoformat()
    outlet_set = set(outlet_article_dict.keys())
    return outlet_set, article_dict, article_bins_dict, min_timestamp, max_timestamp, outlet_article_num_dict, outlet_article_classified_num_dict

def binArticlesByMonth(articles):
    article_bin_dict = defaultdict(list)
    for k, g in itertools.groupby(articles, group_by_month):
        article_bin_dict[k] += list(g)
    return article_bin_dict
        

def group_by_month(article):
    month = article['timestamp'].split('-')[1]
    if(month[0] == "0"): return month[1]
    return month






