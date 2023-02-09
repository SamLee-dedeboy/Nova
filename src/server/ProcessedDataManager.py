from collections import defaultdict
from datetime import datetime
import itertools
import processUtils

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
        self.headline_entities_dict = object_to_dict(raw_data.headline_entities, "id", "headline_entities")
        self.summary_entities_dict = object_to_dict(raw_data.summary_entities, "id", "summary_entities")

        # NewsSentiment
        # self.scatter_raw_data, self.cooccurrences_dict, self.metadata = processRawData(raw_data.raw_data)
        self.entity_mention_articles, self.metadata = index_by_entities(raw_data.article_data)
        self.cooccurrences_dict = extract_cooccurrences_overall(raw_data.article_data)
        self.article_dict = processUtils.list_to_dict(raw_data.article_data, key=lambda article: article['id'])

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
    

def extract_cooccurrences_overall(article_list):
    cooccurrences_dict = defaultdict(lambda : defaultdict(list))
    count = 0
    for article in article_list:
        count += 1
        print('{}/{} articles done'.format(count, len(article_list)))
        article_id = article['id']
        outlet = article['journal']
        entity_sentiments = article['doc_level_sentiment']
        for entity1, sentiment1 in entity_sentiments.items():
            if sentiment1 != "neutral":
                # add co-occurrences
                for entity2, sentiment2 in entity_sentiments.items():
                    if sentiment2 != "neutral":
                        # add to co-occurrences data 
                        cooccurrences_dict[entity1][entity2].append(article_id) 
                        # utils.save_json(cooccurrences_dict, 'cooccurrences.json')
    return cooccurrences_dict

def extract_cooccurrences_grouped(article_list):
    cooccurrences_dict = defaultdict(lambda : defaultdict(lambda : defaultdict(list)))
    count = 0
    for article in article_list:
        count += 1
        print('{}/{} articles done'.format(count, len(article_list)))
        article_id = article['id']
        outlet = article['journal']
        entity_sentiments = article['doc_level_sentiment']
        for entity1, sentiment1 in entity_sentiments.items():
            if sentiment1 != "neutral":
                # add co-occurrences
                for entity2, sentiment2 in entity_sentiments.items():
                    if sentiment2 != "neutral":
                        # add to co-occurrences data 
                        cooccurrences_dict[entity1][entity2][outlet].append({
                            "article_id": article_id,
                            "sentiment": {
                                "entity1": entity1,
                                "sentiment1": sentiment1,
                                "entity2": entity2,
                                "sentiment2": sentiment2,
                            },
                        })
    # utils.save_json(cooccurrences_dict, 'cooccurrences.json')
    return cooccurrences_dict


def index_by_entities(article_list):
    # scatter data grouped
    entity_mentioned_articles_dict = defaultdict(list)
    # entity_mentioned_articles_dict = defaultdict(lambda : defaultdict(list))
    outlet_set = set()

    for article in article_list:
        article_id = article['id']
        outlet = article['journal']
        outlet_set.add(outlet)
        entity_sentiments = article['doc_level_sentiment']
        for entity1, sentiment1 in entity_sentiments.items():
            # add pos/neg mentions to scatter data 
            if sentiment1 != "neutral":
                entity_mentioned_articles_dict[entity1].append(article_id)
    metadata = {
        "total_articles": len(article_list),
        "outlet_list": list(outlet_set)
    }
    return entity_mentioned_articles_dict, metadata

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

def object_to_dict(list_of_objects, key_key, key_value):
    res = {}
    for item in list_of_objects:
        key = item[key_key]
        value = item[key_value]
        res[key] = value
    return res





