import requests

API_URL = "https://rel.cs.ru.nl/api"
text_doc = "President Donald Trump said he \"doesn\u2019t like\" the idea of states releasing nonviolent offenders. Trump discusses opening the country as coronavirus peak approaches."

# Example EL.
el_result = requests.post(API_URL, json={
    "text": text_doc,
    "spans": []
}).json()

# Example ED.
ed_result = requests.post(API_URL, json={
    "text": text_doc,
    "spans": [(0, 16)]
}).json()
print(el_result)
