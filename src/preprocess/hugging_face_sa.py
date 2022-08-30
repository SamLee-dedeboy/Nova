from transformers import pipeline

class hugFace:
    def __init__(self):
        self.classifier = pipeline("sentiment-analysis")

    def analyze_doc_sentiment(self, doc):
        classifier = self.classifier
        try:
            sst = classifier(doc)[0] 
            return sst
        except:
            print("sentence token length too long! Considered noise.")

    def analyze_sentiment(self, sentences):
        classifier = self.classifier
        sst_pos = 0
        sst_neg = 0
        pos_sentences = 0
        neg_sentences = 0
        for sentence in sentences:
            try:
                sst = classifier(sentence)[0] 
                sent_binary = 1 if sst["label"] == "POSITIVE" else -1   
                score = sent_binary * float(sst["score"])
                if score > 0:
                    sst_pos += score
                    pos_sentences += 1
                else:
                    sst_neg += score
                    neg_sentences += 1
            except:
                print("sentence token length too long! Considered noise.")


        
        return  {"pos": sst_pos, "neg": sst_neg, "pos_sentences": pos_sentences, "neg_sentences": neg_sentences} 
        


