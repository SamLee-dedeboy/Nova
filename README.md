# MediaBias
This project is a visual analytics system that enables user to explore media bias in a group of documents. This repo is under active development.

## Dependencies:
1. Textblob: 
```
pip install textblob
```
2. Hugging face:
```
pip install transformers
```
## Setup
1. Query Raw Data: 
```bash
# this script should download data/articles.json
python3 query.py
```
2. Generate single-topic data:
```python
# this should create data/single_topic_articles.json
import preprocess
dataset = preprocess.getRawDataset()
preprocess.gen_single_topic_dataset(dataset)
```
3. Run sentiment analysis and entity disambiguation:
```bash
python3 sentiment.py
```

