from email.policy import default
import itertools
from collections import defaultdict
from re import I
from data_types import *
from ProcessedDataManager import *
import sentimentUtils
import functools
import math

def overall_entity_scatter(entity_mentions, processed_data_manager: ProcessedDataManager):
    data = EntityScatterData( nodes=[], max_articles=0, min_articles=0,)
    # all_pos_article_ids, all_neg_article_ids = [], []
    max_pos_articles, max_neg_articles = 0, 0
    min_pos_articles, min_neg_articles = math.inf, math.inf

    max_articles = 0
    min_articles = math.inf
    # generate meta data, e.g. max/min
    for entity, mention_ids in entity_mentions.items():
        # update max & min articles for color scaling in scatter
        max_articles = max(max_articles, len(mention_ids))
        min_articles = min(min_articles, len(mention_ids))

        # divide pos and neg articles
        mentioned_articles = processed_data_manager.idsToArticles(mention_ids)
        pos_article_ids, neg_article_ids = [], []
        for article in mentioned_articles:
            (pos_article_ids if article['doc_level_sentiment'][entity] == 'positive' else neg_article_ids).append(article["id"])

        max_pos_articles = max(max_pos_articles, len(pos_article_ids))
        min_pos_articles = min(min_pos_articles, len(pos_article_ids))
        max_neg_articles = max(max_neg_articles, len(neg_article_ids))
        min_neg_articles = min(min_neg_articles, len(neg_article_ids))
        # add pos & neg articles to be used for min_max_norm
        # all_pos_article_ids += pos_article_ids
        # all_neg_article_ids += neg_article_ids

    # construct node
    for entity, mention_ids in entity_mentions.items():
        mentioned_articles = processed_data_manager.idsToArticles(mention_ids)
        pos_article_ids, neg_article_ids = [], []
        for article in mentioned_articles:
            (pos_article_ids if article['doc_level_sentiment'][entity] == 'positive' else neg_article_ids).append(article["id"])
        node = construct_node(
            entity,
            pos_article_ids, neg_article_ids, 
            pos_max=max_pos_articles, pos_min=min_pos_articles,
            neg_max=max_neg_articles, neg_min=min_neg_articles,
            processed_data_manager=processed_data_manager,
            # pos_max=len(all_pos_article_ids), pos_min=0,
            # neg_max=len(all_pos_article_ids), neg_min=0,
        )
        data.nodes.append(node)
    data.max_articles = max_articles
    data.min_articles = min_articles
    return data

def overall_entity_scatter_depcrecated(entity_mentions, processed_data_manager: ProcessedDataManager ):
    min_articles = len(processed_data_manager.article_dict.keys())
    max_articles = 0
    pos_max_articles = []
    pos_min_articles = range(min_articles)
    neg_max_articles = []
    neg_min_articles = range(min_articles)
    meta_data = OverallSentimentScatterMetaData(0,0,0,0,0,0,{},{},{},{},{})
    data = EntityScatterData( nodes=[], max_articles=0, min_articles=0,)
    node_dict = {}
    # get max & min
    outlet_article_classified_num_dict = processed_data_manager.outlet_article_classified_num_dict
    overall_pos_max = 0
    overall_neg_max = 0
    for outlet, clf_dict in outlet_article_classified_num_dict.items():
        overall_pos_max += clf_dict["pos"]
        overall_neg_max += clf_dict["neg"]
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
    meta_data.max_articles = max_articles
    meta_data.min_articles = min_articles
    meta_data.pos_max = overall_pos_max
    meta_data.pos_min = 0
    meta_data.neg_max = overall_neg_max
    meta_data.neg_min = 0
    # meta_data.pos_max = len(pos_max_articles)
    # meta_data.pos_min = len(pos_min_articles)
    # meta_data.neg_max = len(neg_max_articles)
    # meta_data.neg_min = len(neg_min_articles)
    meta_data.pos_max_grouped = article_num_groupby_outlet(pos_max_articles)
    meta_data.pos_min_grouped = article_num_groupby_outlet(pos_min_articles)
    meta_data.neg_max_grouped = article_num_groupby_outlet(neg_max_articles)
    meta_data.neg_min_grouped = article_num_groupby_outlet(neg_min_articles)

    for entity, mention_ids in entity_mentions.items():
        mentioned_articles = processed_data_manager.idsToArticles(mention_ids)
        mentions_groupby_outlet_dict = grouped_dict(mentioned_articles, lambda article: article["journal"])
        entity_pos_neg_mentions_grouped_dict = defaultdict(dict)
        for outlet, mention_list in mentions_groupby_outlet_dict.items():
            pos_mentions, neg_mentions = [], []
            for article in mention_list:
                (pos_mentions if article['sentiment']['label'] == 'POSITIVE' else neg_mentions).append(article["id"])
            mentions_groupby_outlet_dict[outlet] = {"pos": len(pos_mentions), "neg": len(neg_mentions)}
            entity_pos_neg_mentions_grouped_dict["pos"][outlet] = len(pos_mentions)
            entity_pos_neg_mentions_grouped_dict["neg"][outlet] = len(neg_mentions)
        node = construct_node(
            entity,
            pos_mentions, neg_mentions,
            meta_data.pos_max, meta_data.pos_min,
            meta_data.neg_max, meta_data.neg_min,
            processed_data_manager=processed_data_manager
        )
        node_dict[entity] = node
        data.nodes.append(node)
        meta_data.mentions_groupby_outlet_dict[entity] = entity_pos_neg_mentions_grouped_dict
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
            pos_articles, neg_articles = [], []
            for article in mentioned_articles:
                (pos_articles if article['sentiment']['label'] == 'POSITIVE' else neg_articles).append(article["id"])
            label = "{}-{}".format(entity, outlet)
            node = construct_node(
                label,
                pos_articles, neg_articles,
                len(pos_max_articles), len(pos_min_articles),
                len(neg_max_articles), len(neg_min_articles),
                processed_data_manager
            )
            node_dict[outlet][entity] = node
            data.nodes.append(node)
        scatter_outlet_dict[outlet] = data
    return scatter_outlet_dict, meta_data, node_dict



def construct_node(label, pos_article_ids, neg_article_ids, pos_max, pos_min, neg_max, neg_min, processed_data_manager):
    if len(pos_article_ids) + len(neg_article_ids) == 0:
        return ScatterNode(label, [], 0, 0, 0, 0, {})
    article_ids = pos_article_ids + neg_article_ids
    pos, neg = sentimentUtils.generate_sst_score(
        pos_article_ids,
        neg_article_ids,
        pos_max, pos_min,
        neg_max, neg_min
    )
    # pos_articles = processed_data_manager.idsToArticles(pos_article_ids)
    # neg_articles = processed_data_manager.idsToArticles(neg_article_ids)
    return ScatterNode(label, article_ids, pos_article_ids, neg_article_ids, pos, neg)


def article_num_groupby_outlet(articles_journals):
    outlet_journals_dict = grouped_dict(articles_journals)
    return {journal: len(mentions) for journal, mentions in outlet_journals_dict.items()}

def grouped_dict(target_list, group_func=None):
    res_dict = defaultdict(list)
    for k, g in itertools.groupby(target_list, group_func):
        res_dict[k] += list(g)
    return res_dict