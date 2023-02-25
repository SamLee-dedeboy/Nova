import math 

def generate_sst_score(pos_article_ids, neg_article_ids, pos_max, pos_min, neg_max, neg_min):
    pos = min_max_norm_sst_score(len(pos_article_ids), pos_max, pos_min, pos_scale_func)
    neg = min_max_norm_sst_score(len(neg_article_ids), neg_max, neg_min, neg_scale_func)
    return pos, neg

def min_max_norm_sst_score(num, max, min, scale_func):
    return scale_func((num - min)/(max - min))

def pos_scale_func(x):
    # return math.log(x+1, 2)
    # return x
    return pow(x, 0.3)
def neg_scale_func(x):
    # return math.log(x+1, 2)
    # return x
    return pow(x, 0.2)