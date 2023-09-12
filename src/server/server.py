from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from pprint import pprint

from .RawDataManager import RawDataManager
from .ProcessedDataManager import ProcessedDataManager
from .scatter_data import *
from .hexview_data import *
from .data_types import *
from .processUtils import *
app = Flask(__name__)
CORS(app)
app.url_map.strict_slashes = False


raw_data = RawDataManager()
processed_data = ProcessedDataManager(raw_data)
overview_scatter_overall_data = overall_entity_scatter(processed_data.entity_mention_articles, processed_data)
overview_scatter_grouped_data = grouped_entity_scatter(processed_data.entity_mention_articles, processed_data)
overall_node_dict = list_to_dict(overview_scatter_overall_data.nodes, key=lambda node: node.text)
grouped_node_dict = {}
for outlet, data in overview_scatter_grouped_data.items():
    grouped_node_dict[outlet] = list_to_dict(data.nodes, key=lambda node: node.text)
    
reverse_index_node_outlet_dict = defaultdict(set)
for outlet, node_dict in grouped_node_dict.items():
    for node_id in node_dict.keys():
        node_id = "".join(node_id.split("-")[:-1])
        reverse_index_node_outlet_dict[node_id].add(outlet)
# convert to defaultdict of list
for node_id, outlet_mentions in reverse_index_node_outlet_dict.items():
    reverse_index_node_outlet_dict[node_id] = list(outlet_mentions)

total_articles = 0
for outlet, article_num in processed_data.outlet_article_num_dict.items():
    total_articles += article_num

<<<<<<< HEAD
splitSentences("This will trigger punkt to download")
print("init done")

=======
>>>>>>> 3a2ddb21f057a709b6597b214f1510a7187ed833

@app.route("/overview/data", methods=["POST"])
def get_overview_data():
    article_num_threshold = request.json['article_num_threshold']
    print("filtering:", article_num_threshold)
    filtered_nodes = [node for node in overview_scatter_overall_data.nodes if len(node.article_ids) >= article_num_threshold] 
    # filtered_nodes = overview_scatter_overall_data.nodes[1000:1100]
    res = {
        "nodes": filtered_nodes,
        "max_articles": overview_scatter_overall_data.max_articles,
        "min_articles": overview_scatter_overall_data.min_articles,
        "total_article": total_articles,
        "entity_list": processed_data.entity_list,
        "entity_outlet_dict": reverse_index_node_outlet_dict
    }

    # this needs to be done for all POST requests returning JSON
    response = jsonify(res)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response
    return json.dumps(res, default=vars)

@app.route("/overview/scatter/overall/node/<entity>")
def get_overall_scatter_node(entity):
    node = next(node for node in overview_scatter_overall_data.nodes if node.text == entity)
    return json.dumps(node, default=vars)

@app.route("/hexview/grouped/<title>/<outlet>")
def get_grouped_hexview(title, outlet):
    entity_candidates = get_entity_candidates(title, outlet,
                                                              processed_data.grouped_cooccurrences_dict, 
                                                              grouped_node_dict, 
                                                             overall_node_dict)
    sorted_cooccurrences_list = []
    for candidate in entity_candidates[:9]:
        entity_data = grouped_node_dict[outlet][candidate+'-'+outlet]
        sorted_cooccurrences_list.append({
            "entity": candidate,
            "sst": {
                "pos": entity_data.pos_sst,
                "neg": entity_data.neg_sst
            },
            "article_ids": entity_data.article_ids
        })
    target_entity = grouped_node_dict[outlet][title+'-'+outlet]
    res = {
        "entity": title,
        "outlet": outlet,
        "target": {
            "entity": title,
            "sst": {
                "pos": target_entity.pos_sst,
                "neg": target_entity.neg_sst
            },
            "article_ids": target_entity.article_ids
        },
        "sorted_cooccurrences_list": sorted_cooccurrences_list
    }
    return json.dumps(res, default=vars)

@app.route("/processed_data/ids_to_articles", methods=['POST'])
def ids_to_articles():
    ids = request.json['article_ids']

    # articles
    articles = processed_data.idsToArticles(ids)

    # artticle highlights
    headline_entities_dict = processed_data.headline_entities_dict
    content_entities_dict = processed_data.content_entities_dict
    target_headline_entities = {k:headline_entities_dict[k] for k in ids} 
    target_content_entities = {k:content_entities_dict[k] for k in ids}
    article_highlights = {
        "headline_entities": target_headline_entities,
        "content_entities": target_content_entities,
        # "summary_entities": target_summary_entities
    }
    res = {
        "articles": articles,
        "article_highlights": article_highlights
    }
<<<<<<< HEAD
    response = jsonify(res)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response
=======
>>>>>>> 3a2ddb21f057a709b6597b214f1510a7187ed833
    return json.dumps(res, default=vars)

@app.route("/processed_data/cooccurr_info/grouped/<outlet>/<target>/<co_occurr_entity>")
def get_cooccurr_info_grouped(outlet, target, co_occurr_entity):
    entity = target + '-' + outlet
    co_occurr_entity_key = co_occurr_entity + '-' + outlet
    target_article_ids = grouped_node_dict[outlet][entity].article_ids
    cooccurr_entity_article_ids = grouped_node_dict[outlet][co_occurr_entity_key].article_ids
    merged_article_ids = list(set(target_article_ids + cooccurr_entity_article_ids))
    response = {
        "target": target,
        "target_article_ids": target_article_ids,
        "outlet": outlet,
        "cooccurr_entity": co_occurr_entity,
        "cooccurr_article_ids": merged_article_ids,
    }
    return json.dumps(response)

@app.route("/processed_data/article", methods=['POST'])
def get_article():
    id = request.json['article_id']

    # articles
    article = processed_data.idsToArticles([id])[0]
    content = article['content']
    splited_sentences = splitSentences(content)
    article['splitted_sentences'] = splited_sentences

    response = jsonify(article)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response
    return json.dumps(article, default=vars)
