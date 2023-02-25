import time
import entity_link
import sentiment
import sys

subset_index = 10
def main():
    with open("testlog.txt", 'w') as f:
        sys.stdout = f
        start_time = time.time()
        print("--------------------------")
        print("entity extraction begin!")
        print("--------------------------")
        entity_link.add_entity(
            src_dataset_path="data/articles.json",
            dst_dataset_path="data/articles_w_entities.json",
            entity_list_path="data/rel_entities_ner.json",
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
        print("--- total time: {} ---".format(time.time() - start_time))

if __name__ == "__main__":
    main()