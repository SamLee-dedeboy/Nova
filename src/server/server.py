from concurrent.futures import process
from multiprocessing.dummy import Process
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from RawDataManager import RawDataManager
import scatter_data
import hexview_data
from ProcessedDataManager import ProcessedDataManager
from data_types import *
from sentiment_processor import SentimentProcessor

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

@app.route("/hexview/overall/<title>", methods=['POST'])
def get_overall_hexview(title):
    outlet_weight_dict = request.json
    updated_node_dict = scatter_data.updateOutletWeight(overview_scatter_overall_data, sentiment_processor.overall_metadata, processed_data, outlet_weight_dict, return_format="dict")
    cooccurrences = raw_data.entity_cooccurrences[title]
    request_data = hexview_data.constructHexData(title, cooccurrences, updated_node_dict)
    return json.dumps(request_data, default=vars)

@app.route("/hexview/grouped/<title>")
def get_grouped_hexview(title):
    res = []
    merged_entities = []
    for outlet, cooccurrences_dict in raw_data.entity_cooccurrences_grouped.items():
        cooccurrences = cooccurrences_dict[title]
        hex_data = hexview_data.constructGroupedHexData(title, cooccurrences, grouped_node_dict[outlet], processed_data, sentiment_processor.grouped_metadata)
        res.append({"entity": title, "outlet": outlet, "cooccurrences_data": hex_data})
        entities = list(map(lambda hex_entity: hex_entity.entity, hex_data.sorted_cooccurrences_list))
        merged_entities = list(set(merged_entities + entities))
        # sort by freq in overall scatter
    merged_entities.sort(reverse=True, key=lambda entity: len(overall_node_dict[entity].article_ids))
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

        # blanked_list = [None for i in range(len(merged_entities))]
        # for hex_entity in hex_data['sorted_cooccurrences_list']:
        #     index = merged_entities.index(hex_entity.entity)
        #     blanked_list[index] = hex_entity
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
    print(overview_scatter_grouped_data[outlet].nodes[0].text)
    for node in overview_scatter_grouped_data[outlet].nodes:
        if node.text.split("-")[0] in hex_candidates:
            node.text = node.text.split("-")[0]
            nodes.append(node)
    return json.dumps(nodes, default=vars)

@app.route("/test")
def test():
    return get_overall_scatter_data()
