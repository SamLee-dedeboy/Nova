import time
import entity_link
import sentiment
import sys
import json
import utils
from collections import defaultdict

subset_index = 2
# subset_index = None
def main():
    with open("testlog.txt", 'w') as f:
        # sys.stdout = f
        start_time = time.time()
        print("--------------------------")
        print("entity extraction begin!")
        print("--------------------------")
        # extract full content entity
        entity_link.add_entity(
            src_dataset_path="data/articles.json",
            dst_dataset_path="data/articles_w_entities.json",
            content_field='content',
            result_field='entities',
            subset=subset_index
        )
        # extract headline entity
        entity_link.add_entity(
            src_dataset_path="data/articles_w_entities.json",
            dst_dataset_path="data/articles_w_entities.json",
            content_field='headline',
            result_field='headline_entities',
            subset=subset_index
        )
        entity_time = time.time() - start_time
        print("--------------------------")
        print("entity extraction done!")
        print("time used: {}".format(entity_time))
        print("--------------------------")
        sentiment.NewsSentiment_analysis(
            src_dataset_path="data/articles_w_entities.json",
            dst_dataset_path="data/articles_w_entities_sentiment.json",
            subset=subset_index
        )
        sentiment_time = time.time() - entity_time
        print("--- entity time: {} ---".format(entity_time))
        print("--- sentiment time: {} ---".format(sentiment_time))

        print("--------------------------")
        print("Aggregating document level sentiment...")
        print("--------------------------")
        mentions_to_document_sentiment()

        print("--------------------------")
        print("Aggregation done!")
        print("--------------------------")

        print("--- total time: {} ---".format(time.time() - start_time))

def mentions_to_document_sentiment(filepath=r'data/articles_w_entities_sentiment.json'):
    articles = json.load(open(filepath))
    for article in articles:
        entity_dict = article['entities']
        # [entity] => { pos_mentions: num, neg_mentions: num, neu_mentions: num }
        entity_mentions = defaultdict(lambda : defaultdict(int))
        for sentence_index, entity_list in entity_dict.items():
            for entity in entity_list:
                sentiment = entity['sentiment']
                wiki_id = entity['wiki_id']
                entity_mentions[wiki_id][sentiment] += 1
        doc_level_sentiment = {} 
        for entity_id, entity_mention in entity_mentions.items():
            sentiment = max(entity_mention, key=entity_mention.get)
            doc_level_sentiment[entity_id] = sentiment
        article['doc_level_sentiment'] = doc_level_sentiment
    utils.save_json(articles, r'data/articles_w_doc_sentiment.json')

if __name__ == "__main__":
    main()