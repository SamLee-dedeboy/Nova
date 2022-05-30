import requests
import preprocess
API_URL = "https://rel.cs.ru.nl/api"
salience_threshold = 0.5

def getEntityList(content): 
    # Example EL.
    response = requests.post(API_URL, json={
        "text": content, 
        "spans": []
    })
    entity_list = response.json()
    entity_list = list(set([entity[3] for entity in entity_list if entity[4] > salience_threshold]))
    return entity_list

# dataset = preprocess.getSingleTopicDataset()
# article = dataset[0]
# getEntityList(article["content"])

import preprocess
import sys
import os
dirname = os.path.dirname(__file__)
relative_path = os.path.join(dirname, "rel_ned")
sys.path.insert(0, relative_path) 
from ned_utils import REL_NedAnalyzer

articles = preprocess.getRawDataset()
articles = articles[:2]
rel_analyzer = REL_NedAnalyzer()
article_entity_dict = rel_analyzer.analyze_entity(articles)
preprocess.dict_to_json(article_entity_dict, filepath="data/rel_ned_entities.json")