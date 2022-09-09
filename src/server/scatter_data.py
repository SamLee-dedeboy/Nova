import itertools
from collections import defaultdict
from data_types import *

def overall_entity_scatter(entity_mentions, article_dict):
    min_articles = len(article_dict.keys())
    max_articles = 0
    pos_max_articles = []
    pos_min_articles = range(min_articles)
    neg_max_articles = []
    neg_min_articles = range(min_articles)

    data = OverallEntityScatterData(
        nodes=[], 
        mentions_groupby_outlet_dict={},
        max_articles=0,
        min_articles=0,
        pos_max={},
        pos_min={},
        neg_max={},
        neg_min={})
    # get max & min
    for entity, mention_ids in entity_mentions.items():
        mentioned_articles = idsToArticles(mention_ids, article_dict)
        pos_articles, neg_articles = [], []
        for article in mentioned_articles:
            (pos_articles if article['sentiment']['label'] == 'POSITIVE' else neg_articles).append(article["journal"])
        pos_max_articles = max(pos_max_articles, pos_articles, key=len)
        pos_min_articles = min(pos_min_articles, pos_articles, key=len)
        neg_max_articles = max(neg_max_articles, neg_articles, key=len)
        neg_min_articles = min(neg_min_articles, neg_articles, key=len)
        max_articles = max(len(mentioned_articles), max_articles)
        min_articles = min(len(mentioned_articles), min_articles)
    data.max_articles = max_articles
    data.min_articles = min_articles
    data.pos_max = article_num_groupby_outlet(pos_max_articles)
    data.pos_min = article_num_groupby_outlet(pos_min_articles)
    data.neg_max = article_num_groupby_outlet(neg_max_articles)
    data.neg_min = article_num_groupby_outlet(neg_min_articles)

    for entity, mention_ids in entity_mentions.items():
        mentioned_articles = idsToArticles(mention_ids, article_dict)
        mentions_groupby_outlet_dict = grouped_dict(mentioned_articles, lambda article: article["journal"])
        for outlet, mention_list in mentions_groupby_outlet_dict.items():
            pos_mentions, neg_mentions = [], []
            for article in mention_list:
                (pos_mentions if article['sentiment']['label'] == 'POSITIVE' else neg_mentions).append(article["id"])
            mentions_groupby_outlet_dict[outlet] = {"pos": len(pos_mentions), "neg": len(neg_mentions)}
        node = construct_node(
            mentioned_articles, entity,
            len(pos_max_articles), len(pos_min_articles),
            len(neg_max_articles), len(neg_min_articles)
        )
        data.nodes.append(node)
        data.mentions_groupby_outlet_dict[entity] = mentions_groupby_outlet_dict
    return data

def grouped_entity_scatter(entity_mentions_grouped, article_dict):
    scatter_outlet_dict = {}
    min_articles = len(article_dict.keys())
    max_articles = 0
    pos_max_articles = []
    pos_min_articles = range(min_articles)
    neg_max_articles = []
    neg_min_articles = range(min_articles)

    # get max & min
    for outlet, entity_mentions in entity_mentions_grouped.items():
        for entity_mention in entity_mentions:
            entity = entity_mention["entity"]
            mention_ids = entity_mention['article_ids']
            mentioned_articles = idsToArticles(mention_ids, article_dict)
            pos_articles, neg_articles = [], []
            for article in mentioned_articles:
                (pos_articles if article['sentiment']['label'] == 'POSITIVE' else neg_articles).append(article["journal"])
            pos_max_articles = max(pos_max_articles, pos_articles, key=len)
            pos_min_articles = min(pos_min_articles, pos_articles, key=len)
            neg_max_articles = max(neg_max_articles, neg_articles, key=len)
            neg_min_articles = min(neg_min_articles, neg_articles, key=len)
            max_articles = max(len(mentioned_articles), max_articles)
            min_articles = min(len(mentioned_articles), min_articles)

    for outlet, entity_mentions in entity_mentions_grouped.items():
        data = EntityScatterData(nodes=[], max_articles=max_articles, min_articles=min_articles)
        for entity_mention in entity_mentions:
            entity = entity_mention["entity"]
            mention_ids = entity_mention['article_ids']
            mentioned_articles = idsToArticles(mention_ids, article_dict)
            label = "{}-{}".format(entity, outlet)
            node = construct_node(
                mentioned_articles, label,
                len(pos_max_articles), len(pos_min_articles),
                len(neg_max_articles), len(neg_min_articles)
            )
            data.nodes.append(node)
        scatter_outlet_dict[outlet] = data
    return scatter_outlet_dict



def construct_node(articles, label, pos_max, pos_min, neg_max, neg_min):
    if len(articles) == 0:
        return ScatterNode(label, [], 0, 0, 0, 0, {})
    topicBins = {}
    article_ids = [article['id'] for article in articles]
    for article in articles:
        topic = article['top_level_topic']
        if topic not in topicBins.keys():
            topicBins[topic] = {"pos": 0, "neg": 0}
        if article['sentiment']['label'] == 'POSITIVE': topicBins[topic]["pos"] += 1
        if article['sentiment']['label'] == 'NEGATIVE': topicBins[topic]["neg"] += 1
    pos, neg, pos_articles, neg_articles = generate_sst_score(
        articles,
        pos_max, pos_min,
        neg_max, neg_min
    )
    return ScatterNode(label, article_ids, pos_articles, neg_articles, pos, neg, topicBins)

def generate_sst_score(articles, pos_max, pos_min, neg_max, neg_min):
    pos_articles, neg_articles = [], []
    for article in articles:
        (pos_articles if article['sentiment']['label'] == 'POSITIVE' else neg_articles).append(article["id"])
    pos = min_max_norm_sst_score(len(pos_articles), pos_max, pos_min, lambda x: pow(x, 0.4))
    neg = min_max_norm_sst_score(len(neg_articles), neg_max, neg_min, lambda x: pow(x, 0.3))
    return pos, neg, pos_articles, neg_articles


def min_max_norm_sst_score(num, max, min, scale_func):
    return scale_func((num - min)/(max - min))






        
        

def article_num_groupby_outlet(articles_journals):
    outlet_journals_dict = grouped_dict(articles_journals)
    return {journal: len(mentions) for journal, mentions in outlet_journals_dict.items()}

def grouped_dict(target_list, group_func=None):
    res_dict = defaultdict(list)
    for k, g in itertools.groupby(target_list, group_func):
        res_dict[k] += list(g)
    return res_dict

def idsToArticles(article_ids, article_dict):
    return [article_dict[id] for id in article_ids]