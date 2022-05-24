from transformers import pipeline

class hugFace:
    def __init__(self):
        self.classifier = pipeline("sentiment-analysis")

    def sentiment_analyze(self, sentences):
        classifier = self.classifier
        results = []
        for sentence in sentences:
            res = classifier(sentence)[0]
            if res["label"] != "POSITIVE" and res["label"] != "NEGATIVE":
                print(res["label"])
                return 
            sent = 1 if res["label"] == "POSITIVE" else -1   
            score = sent * float(res["score"])
            results.append(score)
        return results    

