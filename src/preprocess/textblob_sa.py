from turtle import pos
from textblob import TextBlob

# sentences is a list of sentence
def analyze_sentiment(sentences):
    content = " ".join(sentences)
    blob = TextBlob(content)
    sst_pos = 0
    sst_neg = 0
    pos_sentences = 0
    neg_sentences = 0
    for sentence in blob.sentences:
        if sentence.sentiment.polarity > 0: 
            sst_pos += sentence.sentiment.polarity
            pos_sentences += 1
        else:
            sst_neg += sentence.sentiment.polarity
            neg_sentences += 1

    return  {"pos": sst_pos, "neg": sst_neg, "pos_sentences": pos_sentences, "neg_sentences": neg_sentences} 

# text_doc = "President Donald Trump said he \"doesn\u2019t like\" the idea of states releasing nonviolent offenders. Trump discusses opening the country as coronavirus peak approaches."
# wiki = TextBlob(text_doc)
# print(wiki.noun_phrases)