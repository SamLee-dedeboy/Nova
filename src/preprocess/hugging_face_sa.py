from transformers import pipeline

class hugFace:
    def __init__(self):
        self.classifier = pipeline("sentiment-analysis")

    def analyze_sentiment(self, sentences):
        classifier = self.classifier
        results = []
        for sentence in sentences:
            results.append(classifier(sentence)[0])

        sst_pos = 0
        sst_neg = 0
        for sst in results:
            sent = 1 if sst["label"] == "POSITIVE" else -1   
            score = sent * float(sst["score"])
            if score > 0:
                sst_pos += score
            else:
                sst_neg += score

        return  {"pos": sst_pos, "neg": sst_neg, "num_sentences": len(results)} 
        


