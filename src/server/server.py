from concurrent.futures import process
from multiprocessing.dummy import Process
from flask import Flask, request, jsonify
from flask_cors import CORS
import json

from transformers import PLBART_PRETRAINED_MODEL_ARCHIVE_LIST
from RawDataManager import RawDataManager
import scatter_data
import hexview_data
from ProcessedDataManager import ProcessedDataManager
from data_types import *
from sentiment_processor import SentimentProcessor
import random
import copy

app = Flask(__name__)
CORS(app)

raw_data = RawDataManager()
processed_data = ProcessedDataManager(raw_data)
sentiment_processor = SentimentProcessor()
overview_scatter_overall_data, sentiment_processor.overall_metadata, overall_node_dict = scatter_data.overall_entity_scatter(raw_data.candidate_entity, processed_data)
overview_scatter_grouped_data, sentiment_processor.grouped_metadata, grouped_node_dict = scatter_data.grouped_entity_scatter(raw_data.candidate_entity_grouped, processed_data)


@app.route("/overview/scatter/overall/data")
def get_overall_scatter_data():
    return json.dumps(overview_scatter_overall_data, default=vars)

@app.route("/overview/scatter/overall/node/<entity>")
def get_overall_scatter_node(entity):
    node = next(node for node in overview_scatter_overall_data.nodes if node.text == entity)
    return json.dumps(node, default=vars)

@app.route("/overview/scatter/grouped/data")
def get_grouped_scatter_data():
    return json.dumps(overview_scatter_grouped_data, default=vars)


@app.route("/overview/scatter/overall/metadata")
def get_overall_metadata():
    return json.dumps(sentiment_processor.overall_metadata, default=vars)

@app.route("/overview/scatter/grouped/metadata")
def get_grouped_metadata():
    return json.dumps(sentiment_processor.grouped_metadata, default=vars)

@app.route("/processed_data/outlet_article_num_dict")
def get_outlet_article_num_dict():
    return json.dumps(processed_data.outlet_article_num_dict)

@app.route("/processed_data/entity_list")
def get_entity_list():
    return json.dumps(processed_data.entity_list)

@app.route("/processed_data/outlet_set")
def get_outlet_set():
    return json.dumps(list(processed_data.outlet_set))

@app.route("/hexview/overall/<title>")
def get_overall_hexview(title):
    node_list = overview_scatter_overall_data.nodes
    node_dict = {node.text: node for node in node_list}
    cooccurrences = raw_data.entity_cooccurrences[title]
    request_data = hexview_data.constructHexData(title, cooccurrences, node_dict)
    return json.dumps(request_data, default=vars)

@app.route("/hexview/grouped/<title>")
def get_grouped_hexview(title):
    res, merged_entities = hexview_data.get_entity_candidates(title, raw_data.entity_cooccurrences_grouped, grouped_node_dict, processed_data, overall_node_dict, sentiment_processor)
    for hex_data in res: 
        blanked_list = []
        for entity in merged_entities:
            # entities = list(map(lambda hex_entity: hex_entity.entity, hex_data['sorted_cooccurrences_list']))
            target = (i for i, e in enumerate(hex_data['cooccurrences_data'].sorted_cooccurrences_list) if e.entity == entity)
            index = next(target, None)
            if index != None:
                blanked_list.append(hex_data['cooccurrences_data'].sorted_cooccurrences_list[index])
            else:
                blanked_list.append(HexEntity(
                    entity=entity,
                    article_ids=[],
                    sst=Sentiment2D(0,0)
                ))

        hex_data['cooccurrences_data'].sorted_cooccurrences_list = blanked_list[0:36]

    return json.dumps(res, default=vars)


@app.route("/processed_data/ids_to_articles", methods=['POST'])
def ids_to_articles():
    ids = request.json
    return json.dumps(processed_data.idsToArticles(ids))

@app.route("/processed_data/updateOutletWeight", methods=['POST'])
def updateOutletWeight():
    outlet_weight_dict = request.json
    response = scatter_data.updateOutletWeight(overview_scatter_overall_data, sentiment_processor.overall_metadata, processed_data, outlet_weight_dict)
    return json.dumps(response, default=vars)

@app.route("/processed_data/scatter_node/<node_text>")
def get_scatter_node(node_text):
    split = node_text.split("-")
    if len(split) == 1:
        return json.dumps(overall_node_dict[split[0]], default=vars)
    else:
        return json.dumps(grouped_node_dict[split[1]][split[0]], default=vars)

@app.route("/processed_data/scatter_node/grouped/<node_text>")
def get_scatter_node_grouped(node_text):
    res = []
    for outlet, outlet_dict in grouped_node_dict.items():
        node = outlet_dict[node_text]
        node.text = outlet
        res.append(node)
    return json.dumps(res, default=vars)

@app.route("/processed_data/cooccurr_info/overall/<target>/<co_occurr_entity>")
def get_cooccurr_info(target, co_occurr_entity):
    cooccurr_article_ids = raw_data.entity_cooccurrences[target][co_occurr_entity]
    cooccurr_articles = processed_data.idsToArticles(cooccurr_article_ids)
    articles_topic_dict = processed_data.binArticlesByTopic(cooccurr_articles)
    response = {
        "target": target,
        "cooccurr_entity": co_occurr_entity,
        "cooccurr_num": len(cooccurr_articles),
        "articles_topic_dict": articles_topic_dict
    }
    return json.dumps(response)

@app.route("/processed_data/cooccurr_info/grouped/<outlet>/<target>/<co_occurr_entity>")
def get_cooccurr_info_grouped(outlet, target, co_occurr_entity):
    entity = target
    target_article_ids = raw_data.entity_cooccurrences_grouped[outlet][entity][entity]
    target_articles = processed_data.idsToArticles(target_article_ids)
    target_articles_topic_dict = processed_data.binArticlesByTopic(target_articles)
    cooccurr_article_ids = raw_data.entity_cooccurrences_grouped[outlet][entity][co_occurr_entity]
    cooccurr_articles = processed_data.idsToArticles(cooccurr_article_ids)
    cooccurr_articles_topic_dict = processed_data.binArticlesByTopic(cooccurr_articles)
    response = {
        "target": target,
        "target_num": len(target_articles),
        "target_articles_topic_dict": target_articles_topic_dict,
        "cooccurr_entity": co_occurr_entity,
        "cooccurr_num": len(cooccurr_articles),
        "cooccurr_articles_topic_dict": cooccurr_articles_topic_dict,
        "cooccurr_article_ids": cooccurr_article_ids,
    }
    return json.dumps(response)


@app.route("/processed_data/ids_to_articles_highlights", methods=['POST'])
def ids_to_article_highlights():
    ids = request.json
    headline_entities_dict = processed_data.headline_entities_dict
    summary_entities_dict = processed_data.summary_entities_dict
    target_headline_entities = {k:headline_entities_dict[k] for k in headline_entities_dict.keys() if k in ids}
    target_summary_entities = {k:summary_entities_dict[k] for k in summary_entities_dict.keys() if k in ids}
    res = {
        "headline_entities": target_headline_entities,
        "summary_entities": target_summary_entities
    }
    return json.dumps(res, default=vars)


@app.route("/processed_data/scatter_node/grouped/hex_candidates/<outlet>", methods=["POST"])
def getHexCandidateGroupedNodes(outlet): 
    hex_candidates = request.json
    # nodes = overview_scatter_grouped_data[outlet].nodes
    nodes = []
    for node in overview_scatter_grouped_data[outlet].nodes:
        if node.text.split("-")[0] in hex_candidates:
            node.text = node.text.split("-")[0]
            nodes.append(node)
    return json.dumps(nodes, default=vars)

@app.route("/hex/random", methods=["POST"])
def generate_random_hex():
    outlet = request.json['outlet']
    center_entity = request.json['center_entity']
    # num - 1 because one of the hex is true data
    num = request.json['num'] - 1
    cooccurrences_dict = raw_data.entity_cooccurrences_grouped[outlet][center_entity]

    # true data
    all_hex_data = json.loads(get_grouped_hexview(center_entity))
    target_hex = next(hex_data for hex_data in all_hex_data if hex_data['outlet'] == outlet)

    # randomize entity article & sst
    random_hex_target = {
        'title': 'true_hex',
        'data': target_hex['cooccurrences_data'],
    }
    return json.dumps(random_hex_target, default=vars)

    # for index in range(4):
    #     new_candidate_data = copy.deepcopy(target_hex['cooccurrences_data'])
    #     # randomly assign sst
    #     for entity_data in new_candidate_data['sorted_cooccurrences_list']:
    #         entity_data['sst']['pos'] = random.uniform(0, 1)
    #         entity_data['sst']['neg'] = random.uniform(0, 1)
    #         entity_data['article_ids'] = [0]
    #     new_random_hex = {
    #         'title': 'random_hex_{}'.format(index),
    #         'data': new_candidate_data
    #     }
    #     random_hex.append(new_random_hex)

    # return json.dumps(random_hex, default=vars)

@app.route("/test")
def test():
    return get_overall_scatter_data()
