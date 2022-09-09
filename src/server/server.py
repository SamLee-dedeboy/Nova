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
node_article_dict = {}
overview_scatter_overall_data, sentiment_processor.overall_metadata = scatter_data.overall_entity_scatter(raw_data.candidate_entity, processed_data)
overview_scatter_grouped_data, sentiment_processor.grouped_metadata = scatter_data.grouped_entity_scatter(raw_data.candidate_entity_grouped, processed_data)


@app.route("/overview/scatter/overall")
def get_overall_scatter_data():
    return json.dumps(overview_scatter_overall_data, default=vars)

@app.route("/overview/scatter/grouped")
def get_grouped_scatter_data():
    return json.dumps(overview_scatter_grouped_data, default=vars)

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
    request_data = hexview_data.constructHexData(title, cooccurrences, processed_data, sentiment_processor.overall_metadata)
    return json.dumps(request_data, default=vars)

@app.route("/hexview/grouped/<title>")
def get_grouped_hexview(title):
    entity = title.split("-")[0]
    outlet = title.split("-")[1]
    cooccurrences = raw_data.entity_cooccurrences[outlet][title]
    request_data = hexview_data.constructHexData(entity, cooccurrences, processed_data, sentiment_processor.grouped_metadata)
    return json.dumps(request_data)
@app.route("/processed_data/ids_to_articles", methods=['POST'])
def ids_to_articles():
    ids = request.json
    print(ids)
    return json.dumps(processed_data.idsToArticles(ids))

@app.route("/test")
def test():
    return get_overall_scatter_data()