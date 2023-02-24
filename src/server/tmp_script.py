import json
def save_json(data, filepath=r'new_dict.json'):
    with open(filepath, 'w') as fp:
        json.dump(data, fp, indent=4)

def addNERFields(headline_entities):
    for index, ner_res in enumerate(headline_entities):
        headline_entities[index] = {
            "start_pos": ner_res[0],
            "length": ner_res[1],
            "word": ner_res[2],
            "wiki_id": ner_res[3],
            "ner_confidence": ner_res[5],
            "type": ner_res[6],
        }
    return headline_entities

if __name__ == "__main__":
    articles = json.load(open(r'data/articles_w_doc_sentiment.json'))
    headline_entities = json.load(open(r'data/tmp/processed_articles_headline_entities.json'))
    headline_entities_dict = { obj['id']: obj['headline_entities'] for obj in headline_entities }
    for article in articles:
        article['headline_entities'] = addNERFields(headline_entities_dict[article['id']])
    save_json(articles, r'data/articles_w_doc_sentiment.json')


