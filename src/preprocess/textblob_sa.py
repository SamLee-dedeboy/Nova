from textblob import TextBlob

# sentences is a list of sentence
def analyze_sentiment(sentences):
    content = " ".join(sentences)
    blob = TextBlob(content)
    sst_pos = 0
    sst_neg = 0
    for sentence in blob.sentences:
        if sentence.sentiment.polarity > 0: 
            sst_pos += sentence.sentiment.polarity
        else:
            sst_neg += sentence.sentiment.polarity

    return (sst_pos+sst_neg)/(sst_pos-sst_neg)

# text_doc = "President Donald Trump said he \"doesn\u2019t like\" the idea of states releasing nonviolent offenders. Trump discusses opening the country as coronavirus peak approaches."
# wiki = TextBlob(text_doc)
# print(wiki.noun_phrases)