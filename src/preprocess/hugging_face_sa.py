from transformers import pipeline

class hugFace:
    def __init__(self):
        self.classifier = pipeline("sentiment-analysis")

    def analyze_sentiment(self, sentences):
        classifier = self.classifier
        results = []
        for sentence in sentences:
            results.append(classifier(sentence)[0])
        return self.normalize_sst(results)

    def normalize_sst(self, res):
        res_pos = 0
        res_neg = 0
        for sst in res:
            sent = 1 if sst["label"] == "POSITIVE" else -1   
            score = sent * float(sst["score"])
            if score > 0:
                res_pos += score
            else:
                res_neg += score

        return  {"pos": res_pos, "neg": res_neg, "score": (res_pos+res_neg)/(res_pos-res_neg)}
        


