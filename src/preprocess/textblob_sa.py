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