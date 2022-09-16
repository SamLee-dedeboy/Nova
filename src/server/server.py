from concurrent.futures import process
from multiprocessing.dummy import Process
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from RawDataManager import RawDataManager
import scatter_data
import hexview_data
from ProcessedDataManager import ProcessedDataManager
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
    cooccurrences = raw_data.entity_cooccurrences[title]
    request_data = hexview_data.constructHexData(title, cooccurrences, overall_node_dict)
    return json.dumps(request_data, default=vars)

@app.route("/hexview/grouped/<title>")
def get_grouped_hexview(title):
    entity = title.split("-")[0]
    outlet = title.split("-")[1]
    cooccurrences = raw_data.entity_cooccurrences_grouped[outlet][entity]
    request_data = hexview_data.constructHexData(entity, cooccurrences, grouped_node_dict[outlet])
    return json.dumps(request_data, default=vars)

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

@app.route("/processed_data/cooccurr_info/<target>/<co_occurr_entity>")
def get_cooccurr_info(target, co_occurr_entity):
    split = target.split("-")

    if len(split) == 1: # overall
        entity = split[0]
        cooccurr_article_ids = raw_data.entity_cooccurrences[entity][co_occurr_entity]
        cooccurr_articles = processed_data.idsToArticles(cooccurr_article_ids)
        articles_topic_dict = processed_data.binArticlesByTopic(cooccurr_articles)
        response = {
            "target": target,
            "cooccurr_entity": co_occurr_entity,
            "cooccurr_num": len(cooccurr_articles),
            "articles_topic_dict": articles_topic_dict
        }
        return json.dumps(response)


@app.route("/test")
def test():
    return get_overall_scatter_data()
