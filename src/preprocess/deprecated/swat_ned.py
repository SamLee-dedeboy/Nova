import json
from re import S
from tracemalloc import start
from unittest import result
import requests
import time
from collections import defaultdict

from torch import default_generator

MY_GCUBE_TOKEN = '49d6163a-9b64-494c-9e57-6797f247c2d3-843339462'
url = 'https://swat.d4science.org/salience'

def getEntityList(sentences, title):
    entity_dict = defaultdict(set)
    # start_time = time.time()
    for sentence in sentences:
        # print("--------------")
        # print(sentence)
        document = {
            "title": title, 
            "content": sentence
        }

        response = requests.post(url,
                                data=json.dumps(document),
                                params={'gcube-token': MY_GCUBE_TOKEN})
        entity_list = response.json()["annotations"]
        for entity in entity_list:
            if entity['salience_class'] == 1:
                id = entity["wiki_id"]
                name = entity['wiki_title']
                entity_dict[id].add(name)


    # end_time = time.time() - start_time
    # print(end_time)
    return entity_dict.keys(), entity_dict 

# import preprocess
# dataset = preprocess.getSingleTopicDataset()
# article = dataset[0]
# document = {
#     "title": article["headline"], 
#     "content": article["content"]
# }


# response = requests.post(url,
#                         data=json.dumps(document),
#                         params={'gcube-token': MY_GCUBE_TOKEN})
# entity_list = response.json()["annotations"]
# print(entity_list)
# sentences = preprocess.article_to_sentences(article["content"])
# swat_entities = getEntityList(sentences, article["headline"])
