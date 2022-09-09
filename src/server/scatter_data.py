import itertools
from collections import defaultdict
from data_types import *
from ProcessedDataManager import *
import sentiment_processor

def overall_entity_scatter(entity_mentions, processed_data_manager ):
    min_articles = len(processed_data_manager.article_dict.keys())
    max_articles = 0
    pos_max_articles = []
    pos_min_articles = range(min_articles)
    neg_max_articles = []
    neg_min_articles = range(min_articles)
    meta_data = OverallSentimentScatterMetaData(0,0,0,0,0,0,{},{},{},{},{})
    data = EntityScatterData(nodes=[], max_articles=0, min_articles=0)
    node_dict = {}
    # get max & min
    for entity, mention_ids in entity_mentions.items():
        mentioned_articles = processed_data_manager.idsToArticles(mention_ids)
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
    # data.pos_max = article_num_groupby_outlet(pos_max_articles)
    # data.pos_min = article_num_groupby_outlet(pos_min_articles)
    # data.neg_max = article_num_groupby_outlet(neg_max_articles)
    # data.neg_min = article_num_groupby_outlet(neg_min_articles)
    meta_data.max_articles = max_articles
    meta_data.min_articles = min_articles
    meta_data.pos_max = len(pos_max_articles)
    meta_data.pos_min = len(pos_min_articles)
    meta_data.neg_max = len(neg_max_articles)
    meta_data.neg_min = len(neg_min_articles)
    meta_data.pos_max_grouped = article_num_groupby_outlet(pos_max_articles)
    meta_data.pos_min_grouped = article_num_groupby_outlet(pos_min_articles)
    meta_data.neg_max_grouped = article_num_groupby_outlet(neg_max_articles)
    meta_data.neg_min_grouped = article_num_groupby_outlet(neg_min_articles)

    for entity, mention_ids in entity_mentions.items():
        mentioned_articles = processed_data_manager.idsToArticles(mention_ids)
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
        node_dict[entity] = node
        data.nodes.append(node)
        meta_data.mentions_groupby_outlet_dict[entity] = mentions_groupby_outlet_dict
    return data, meta_data, node_dict

def grouped_entity_scatter(entity_mentions_grouped, processed_data_manager):
    scatter_outlet_dict = {}
    min_articles = len(processed_data_manager.article_dict.keys())
    max_articles = 0
    pos_max_articles = []
    pos_min_articles = range(min_articles)
    neg_max_articles = []
    neg_min_articles = range(min_articles)

    meta_data = SentimentScatterMetaData(0,0,0,0,0,0)
    node_dict = {}
    # get max & min
    for outlet, entity_mentions in entity_mentions_grouped.items():
        for entity_mention in entity_mentions:
            entity = entity_mention["entity"]
            mention_ids = entity_mention['article_ids']
            mentioned_articles = processed_data_manager.idsToArticles(mention_ids)
            pos_articles, neg_articles = [], []
            for article in mentioned_articles:
                (pos_articles if article['sentiment']['label'] == 'POSITIVE' else neg_articles).append(article["journal"])
            pos_max_articles = max(pos_max_articles, pos_articles, key=len)
            pos_min_articles = min(pos_min_articles, pos_articles, key=len)
            neg_max_articles = max(neg_max_articles, neg_articles, key=len)
            neg_min_articles = min(neg_min_articles, neg_articles, key=len)
            max_articles = max(len(mentioned_articles), max_articles)
            min_articles = min(len(mentioned_articles), min_articles)

    meta_data.max_articles = max_articles
    meta_data.min_articles = min_articles
    meta_data.pos_max = len(pos_max_articles)
    meta_data.pos_min = len(pos_min_articles)
    meta_data.neg_max = len(neg_max_articles)
    meta_data.neg_min = len(neg_min_articles)

    for outlet, entity_mentions in entity_mentions_grouped.items():
        data = EntityScatterData(nodes=[], max_articles=max_articles, min_articles=min_articles)
        node_dict[outlet] = {}
        for entity_mention in entity_mentions:
            entity = entity_mention["entity"]
            mention_ids = entity_mention['article_ids']
            mentioned_articles = processed_data_manager.idsToArticles(mention_ids)
            label = "{}-{}".format(entity, outlet)
            node = construct_node(
                mentioned_articles, label,
                len(pos_max_articles), len(pos_min_articles),
                len(neg_max_articles), len(neg_min_articles)
            )
            node_dict[outlet][entity] = node
            data.nodes.append(node)
        scatter_outlet_dict[outlet] = data
    return scatter_outlet_dict, meta_data, node_dict



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
    pos, neg, pos_articles, neg_articles = sentiment_processor.generate_sst_score(
        articles,
        pos_max, pos_min,
        neg_max, neg_min
    )
    return ScatterNode(label, article_ids, pos_articles, neg_articles, pos, neg, topicBins)


def article_num_groupby_outlet(articles_journals):
    outlet_journals_dict = grouped_dict(articles_journals)
    return {journal: len(mentions) for journal, mentions in outlet_journals_dict.items()}

def grouped_dict(target_list, group_func=None):
    res_dict = defaultdict(list)
    for k, g in itertools.groupby(target_list, group_func):
        res_dict[k] += list(g)
    return res_dict
