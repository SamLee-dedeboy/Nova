import os
import requests
import json
import pandas as pd

def main():
    saveJson(getSummary(), filepath="data/summary.json")

def fetchQuery(query):
    url = "http://ec2-35-160-171-6.us-west-2.compute.amazonaws.com:8081/v1/graphql"
    r = requests.post(url, json={'query':query})
    # r.text has content
    return r.text

def getSummary():
    query = """query MyQuery {
        Article(where: {timestamp: {_gte: "\\"2020-02-01\\"", _lte: "\\"2020-06-01\\""}}) {
            id
            Analyses(where: {type: {_eq: "5"}}) {
                content
            }
        }
    }
    """
    result = fetchQuery(query)
    return result
def getTenArticles():
    query = """query MyQuery {
        Article(where: {timestamp: {_gte: "\\"2020-02-01\\"", _lte: "\\"2020-06-01\\""}}) {
            id
            headline
            journal
            timestamp
            content
            ClassifierTopLevel {
                class
                percentage
            }
            ClassifierSecondLevel {
                subclass
                percentage
            }
        }
    }
    """
    result = fetchQuery(query)
    return result

def saveJson(data, filepath="data/articles.json"):
    dirname = os.path.dirname(__file__)
    relative_path = os.path.join(dirname, filepath)
    with open(relative_path, 'w') as file:
        json.dump(json.loads(data), file, indent=4)


if __name__ == "__main__":
    main()