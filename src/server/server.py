from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from pprint import pprint

from RawDataManager import RawDataManager
import scatter_data
import hexview_data
from ProcessedDataManager import ProcessedDataManager
from data_types import *
from collections import defaultdict
import processUtils
app = Flask(__name__)
CORS(app)

raw_data = RawDataManager()
processed_data = ProcessedDataManager(raw_data)
overview_scatter_overall_data = scatter_data.overall_entity_scatter(processed_data.entity_mention_articles, processed_data)
overview_scatter_grouped_data = scatter_data.grouped_entity_scatter(processed_data.entity_mention_articles, processed_data)
overall_node_dict = processUtils.list_to_dict(overview_scatter_overall_data.nodes, key=lambda node: node.text)
grouped_node_dict = {}
for outlet, data in overview_scatter_grouped_data.items():
    grouped_node_dict[outlet] = processUtils.list_to_dict(data.nodes, key=lambda node: node.text)
    
reverse_index_node_outlet_dict = defaultdict(set)
for outlet, node_dict in grouped_node_dict.items():
    for node_id in node_dict.keys():
        reverse_index_node_outlet_dict[node_id].add(outlet)
# convert to defaultdict of list
for node_id, outlet_mentions in reverse_index_node_outlet_dict.items():
    reverse_index_node_outlet_dict[node_id] = list(outlet_mentions)

@app.route("/overview/scatter/overall/data", methods=["POST"])
def get_overall_scatter_data():
    article_num_threshold = request.json['article_num_threshold']
    print("filtering:", article_num_threshold)
    filtered_nodes = [node for node in overview_scatter_overall_data.nodes if len(node.article_ids) >= article_num_threshold] 
    print("filtered nodes:", len(filtered_nodes))
    # filtered_nodes = overview_scatter_overall_data.nodes[1000:1100]
    res = {
        "nodes": filtered_nodes,
        "max_articles": overview_scatter_overall_data.max_articles,
        "min_articles": overview_scatter_overall_data.min_articles,
    }
    return json.dumps(res, default=vars)

@app.route("/overview/entity_outlet_dict")
def get_node_outlet_dict():
    return json.dumps(reverse_index_node_outlet_dict)      


@app.route("/overview/scatter/overall/node/<entity>")
def get_overall_scatter_node(entity):
    node = next(node for node in overview_scatter_overall_data.nodes if node.text == entity)
    return json.dumps(node, default=vars)

@app.route("/overview/scatter/grouped/data")
def get_grouped_scatter_data():
    return json.dumps({}, default=vars)


# @app.route("/overview/scatter/overall/metadata")
# def get_overall_metadata():
#     return json.dumps(overview_scatter_overall_metadata, default=vars)

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
    # cooccurrences = raw_data.entity_cooccurrences[title]
    cooccurrences = processed_data.overall_cooccurrences_dict[title]
    request_data = hexview_data.constructHexData_overall(title, cooccurrences, node_dict, top_k=10)
    return json.dumps(request_data, default=vars)

@app.route("/hexview/grouped/<title>/<outlet>")
def get_grouped_hexview(title, outlet):
    entity_candidates = hexview_data.get_entity_candidates(title, outlet,
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

# @app.route("/hexview/grouped/<title>")
# def get_grouped_hexview_old(title):
#     res, merged_entities = hexview_data.get_entity_candidates(title, 
#                                                               raw_data.entity_cooccurrences_grouped, 
#                                                               grouped_node_dict, 
#                                                               processed_data, 
#                                                               overall_node_dict, 
#                                                               grouped_metadata)
#     for hex_data in res: 
#         blanked_list = []
#         for entity in merged_entities:
#             # entities = list(map(lambda hex_entity: hex_entity.entity, hex_data['sorted_cooccurrences_list']))
#             target = (i for i, e in enumerate(hex_data['cooccurrences_data'].sorted_cooccurrences_list) if e.entity == entity)
#             index = next(target, None)
#             if index != None:
#                 blanked_list.append(hex_data['cooccurrences_data'].sorted_cooccurrences_list[index])
#             else:
#                 blanked_list.append(HexEntity(
#                     entity=entity,
#                     article_ids=[],
#                     sst=Sentiment2D(0,0)
#                 ))

#         hex_data['cooccurrences_data'].sorted_cooccurrences_list = blanked_list[0:36]

#     return json.dumps(res, default=vars)


@app.route("/processed_data/ids_to_articles", methods=['POST'])
def ids_to_articles():
    ids = request.json['article_ids']
    no_content = request.json['no_content']
    return json.dumps(processed_data.idsToArticles(ids, no_content=no_content))

# @app.route("/processed_data/scatter_node/<node_text>")
# def get_scatter_node(node_text):
#     split = node_text.split("-")
#     if len(split) == 1:
#         return json.dumps(overall_node_dict[split[0]], default=vars)
#     else:
#         return json.dumps(grouped_node_dict[split[1]][split[0]], default=vars)

# @app.route("/processed_data/scatter_node/grouped/<node_text>")
# def get_scatter_node_grouped(node_text):
#     res = []
#     for outlet, outlet_dict in grouped_node_dict.items():
#         node = outlet_dict[node_text]
#         node.text = outlet
#         res.append(node)
#     return json.dumps(res, default=vars)

@app.route("/processed_data/cooccurr_info/overall/<target>/<co_occurr_entity>")
def get_cooccurr_info(target, co_occurr_entity):
    cooccurr_article_ids = processed_data.overall_cooccurrences_dict[target][co_occurr_entity]
    cooccurr_articles = processed_data.idsToArticles(cooccurr_article_ids)
    # articles_topic_dict = processed_data.binArticlesByTopic(cooccurr_articles)
    response = {
        "target": target,
        "cooccurr_entity": co_occurr_entity,
        "cooccurr_num": len(cooccurr_articles),
        "outlet": outlet,
        "cooccurr_entity": co_occurr_entity,
        "cooccurr_article_ids": cooccurr_article_ids,
    }
    return json.dumps(response)

@app.route("/processed_data/cooccurr_info/grouped/<outlet>/<target>/<co_occurr_entity>")
def get_cooccurr_info_grouped(outlet, target, co_occurr_entity):
    entity = target + '-' + outlet
    co_occurr_entity_key = co_occurr_entity + '-' + outlet
    target_article_ids = grouped_node_dict[outlet][entity].article_ids
    # cooccurr_article_ids = list(map(lambda data: data['article_id'],
    #     processed_data.grouped_cooccurrences_dict[outlet][target][co_occurr_entity]))
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


@app.route("/processed_data/ids_to_articles_highlights", methods=['POST'])
def ids_to_article_highlights():
    ids = request.json
    headline_entities_dict = processed_data.headline_entities_dict
    content_entities_dict = processed_data.content_entities_dict
    # summary_entities_dict = processed_data.summary_entities_dict
    # target_headline_entities = {k:headline_entities_dict[k] for k in headline_entities_dict.keys() if k in ids}
    # target_content_entities = {k:content_entities_dict[k] for k in content_entities_dict.keys() if k in ids}
    target_headline_entities = {k:headline_entities_dict[k] for k in ids} 
    target_content_entities = {k:content_entities_dict[k] for k in ids}
    # target_summary_entities = {k:summary_entities_dict[k] for k in summary_entities_dict.keys() if k in ids}
    res = {
        "headline_entities": target_headline_entities,
        "content_entities": target_content_entities,
        # "summary_entities": target_summary_entities
    }
    return json.dumps(res, default=vars)

@app.route("/splitSentences", methods=['POST'])
def splitSentences():
    content = request.json
    return processUtils.list_to_dict(processUtils.splitSentences(content))

# @app.route("/processed_data/scatter_node/grouped/hex_candidates/<outlet>", methods=["POST"])
# def getHexCandidateGroupedNodes(outlet): 
#     hex_candidates = request.json
#     nodes = []
#     for node in overview_scatter_grouped_data[outlet].nodes:
#         if node.text.split("-")[0] in hex_candidates:
#             node.text = node.text.split("-")[0]
#             nodes.append(node)
#     return json.dumps(nodes, default=vars)

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

@app.route("/overall/table/data", methods=["POST"])
def entity_table_data():
    article_num_threshold = request.json['article_num_threshold']
    filtered_nodes = [node for node in overview_scatter_overall_data.nodes if len(node.article_ids) >= article_num_threshold] 
    return json.dumps(filtered_nodes, default=vars)
    


@app.route("/test")
def test():
    return get_overall_scatter_data()
