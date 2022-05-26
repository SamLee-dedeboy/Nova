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