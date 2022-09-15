class SentimentProcessor:
    def __init__(self, overall_metadata={}, grouped_metadata={}):
        self.overall_metadata = overall_metadata
        self.grouped_metadata = grouped_metadata

def generate_sst_score(articles, pos_max, pos_min, neg_max, neg_min):
    pos_articles, neg_articles = [], []
    for article in articles:
        (pos_articles if article['sentiment']['label'] == 'POSITIVE' else neg_articles).append(article["id"])
    pos = min_max_norm_sst_score(len(pos_articles), pos_max, pos_min, pos_scale_func)
    neg = min_max_norm_sst_score(len(neg_articles), neg_max, neg_min, neg_scale_func)
    return pos, neg, pos_articles, neg_articles

def min_max_norm_sst_score(num, max, min, scale_func):
    return scale_func((num - min)/(max - min))

def pos_scale_func(x):
    return pow(x, 0.3)
def neg_scale_func(x):
    return pow(x, 0.2)