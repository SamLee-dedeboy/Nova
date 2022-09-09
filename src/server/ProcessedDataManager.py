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
        self.outlet_article_num_dict \
        = processArticleDict(raw_data.outlet_article_dict)
        self.entity_list = list(raw_data.candidate_entity.keys())

    def idsToArticles(self, id_list):
        return [self.article_dict[id] for id in id_list]

def processArticleDict(outlet_article_dict):
    date_str_template = '%Y-%m-%d'
    min_timestamp = datetime.strptime('3000-10-10', date_str_template)
    max_timestamp = datetime.strptime('1000-10-10', date_str_template)
    article_dict = {}
    article_bins_dict = {}
    outlet_article_num_dict = {}
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
    min_timestamp = min_timestamp.isoformat()
    max_timestamp = max_timestamp.isoformat()
    outlet_set = set(outlet_article_dict.keys())
    return outlet_set, article_dict, article_bins_dict, min_timestamp, max_timestamp, outlet_article_num_dict

def binArticlesByMonth(articles):
    article_bin_dict = defaultdict(list)
    for k, g in itertools.groupby(articles, group_by_month):
        article_bin_dict[k] += list(g)
    return article_bin_dict
        

def group_by_month(article):
    month = article['timestamp'].split('-')[1]
    if(month[0] == "0"): return month[1]
    return month






