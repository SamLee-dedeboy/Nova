from concurrent.futures import process
from multiprocessing.dummy import Process
from flask import Flask
from flask_cors import CORS
import json
from RawDataManager import RawDataManager
import scatter_data
from ProcessedDataManager import ProcessedDataManager

app = Flask(__name__)
CORS(app)

raw_data = RawDataManager()
processed_data = ProcessedDataManager(raw_data)
node_article_dict = {}
overview_scatter_overall_data = scatter_data.overall_entity_scatter(raw_data.candidate_entity, processed_data.article_dict)
overview_scatter_grouped_data = scatter_data.grouped_entity_scatter(raw_data.candidate_entity_grouped, processed_data.article_dict)
json.dumps(overview_scatter_grouped_data, default=vars)


@app.route("/overview/scatter/overall")
def get_overall_scatter_data():
    return json.dumps(overview_scatter_overall_data, default=vars)

@app.route("/overview/scatter/grouped")
def get_grouped_scatter_data():
    return json.dumps(overview_scatter_grouped_data, default=vars)

@app.route("/processed_data/outlet_article_num_dict")
def get_outlet_article_num_dict():
    return json.dumps(processed_data.outlet_article_num_dict)

@app.route("/test")
def test():
    return get_overall_scatter_data()