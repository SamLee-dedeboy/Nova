import time
import entity_link
import sentiment

def main():
    start_time = time.time()
    entity_link.add_entity(
        src_dataset_path="data/single_topic_articles.json",
        dst_dataset_path="data/processed_articles_rel.json",
        entity_list_path="data/rel_entities.json",
        subset=1000
        )
    entity_time = time.time() - start_time
    sentiment.add_sentiment(
        src_dataset_path="data/processed_articles_rel.json",
        dst_dataset_path="data/processed_articles_hugFace.json",
        subset=1000
    )
    sentiment_time = time.time() - entity_time
    print("--- entity time: {} ---".format(entity_time))
    print("--- sentiment time: {} ---".format(sentiment_time))
    print("--- total time: {} ---".format(time.time() - start_time))

if __name__ == "__main__":
    main()