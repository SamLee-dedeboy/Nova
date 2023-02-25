from google.cloud import language_v1

def analyze_sentiment(sentences):
    text_content = " ".join(sentences)
    client = language_v1.LanguageServiceClient()
    # text_content = 'I am so happy and joyful.'
    # Available types: PLAIN_TEXT, HTML
    type_ = language_v1.Document.Type.PLAIN_TEXT
    # Optional. If not specified, the language is automatically detected.
    # For list of supported languages:
    # https://cloud.google.com/natural-language/docs/languages
    language = "en"
    document = {"content": text_content, "type_": type_, "language": language}
    # Available values: NONE, UTF8, UTF16, UTF32
    encoding_type = language_v1.EncodingType.UTF8
    response = client.analyze_sentiment(request = {'document': document, 'encoding_type': encoding_type})
    return response

    # Get overall sentiment of the input document
    print(u"Document sentiment score: {}".format(response.document_sentiment.score))
    print(
        u"Document sentiment magnitude: {}".format(
            response.document_sentiment.magnitude
        )
    )
    # Get sentiment for all sentences in the document
    # for sentence in response.sentences:
    #     print(u"Sentence text: {}".format(sentence.text.content))
    #     print(u"Sentence sentiment score: {}".format(sentence.sentiment.score))
    #     print(u"Sentence sentiment magnitude: {}".format(sentence.sentiment.magnitude))


def analyze_entity_sentiment(sentences):
    text_content = " ".join(sentences)
    # define metadatas
    client = language_v1.LanguageServiceClient()
    type_ = language_v1.types.Document.Type.PLAIN_TEXT
    language = "en"
    document = {"content": text_content, "type_": type_, "language": language}
    encoding_type = language_v1.EncodingType.UTF8
    # send request 
    response = client.analyze_entity_sentiment(request = {'document': document, 'encoding_type': encoding_type})
    return response
    # Loop through entitites returned from the API
    # for entity in response.entities:
    #     count+=1
    #     if(count > 5):
    #      break
    #     print("--------------------------")
    #     print(u"Representative name for the entity: {}".format(entity.name))
    #     # Get entity type, e.g. PERSON, LOCATION, ADDRESS, NUMBER, et al
    #     print(u"Entity type: {}".format(language_v1.Entity.Type(entity.type_).name))
    #     # Get the salience score associated with the entity in the [0, 1.0] range
    #     print(u"Salience score: {}".format(entity.salience))
    #     # Get the aggregate sentiment expressed for this entity in the provided document.
    #     sentiment = entity.sentiment
    #     print(u"Entity sentiment score: {}".format(sentiment.score))
    #     print(u"Entity sentiment magnitude: {}".format(sentiment.magnitude))
    #     # Loop over the metadata associated with entity. For many known entities,
    #     # the metadata is a Wikipedia URL (wikipedia_url) and Knowledge Graph MID (mid).
    #     # Some entity types may have additional metadata, e.g. ADDRESS entities
    #     # may have metadata for the address street_name, postal_code, et al.
    #     for metadata_name, metadata_value in entity.metadata.items():
    #         print(u"{} = {}".format(metadata_name, metadata_value))

        # Loop over the mentions of this entity in the input document.
        # The API currently supports proper noun mentions.
        # for mention in entity.mentions:
        #     print(u"Mention text: {}".format(mention.text.content))
        #     # Get the mention type, e.g. PROPER for proper noun
        #     print(
        #         u"Mention type: {}".format(language_v1.EntityMention.Type(mention.type_).name)
        #     )
def analyze_entity(sentences):
    text_content = " ".join(sentences)
    client = language_v1.LanguageServiceClient()
    type_ = language_v1.Document.Type.PLAIN_TEXT
    language = "en"
    document = {"content": text_content, "type_": type_, "language": language}
    encoding_type = language_v1.EncodingType.UTF8

    response = client.analyze_entities(request = {'document': document, 'encoding_type': encoding_type})
    return list(filter(lambda entity: "wikipedia_url" in entity.metadata.keys(), response.entities))
    # print(response.entities)
    # Loop through entitites returned from the API
    # for entity in response.entities:
    #     print("---------------")
    #     print(u"Representative name for the entity: {}".format(entity.name))
    #     # Get entity type, e.g. PERSON, LOCATION, ADDRESS, NUMBER, et al
    #     print(u"Entity type: {}".format(language_v1.Entity.Type(entity.type_).name))
    #     # Get the salience score associated with the entity in the [0, 1.0] range
    #     print(u"Salience score: {}".format(entity.salience))
    #     # Loop over the metadata associated with entity. For many known entities,
    #     # the metadata is a Wikipedia URL (wikipedia_url) and Knowledge Graph MID (mid).
    #     # Some entity types may have additional metadata, e.g. ADDRESS entities
    #     # may have metadata for the address street_name, postal_code, et al.
    #     for metadata_name, metadata_value in entity.metadata.items():
    #         print(u"{}: {}".format(metadata_name, metadata_value))

    #     # Loop over the mentions of this entity in the input document.
    #     # The API currently supports proper noun mentions.
    #     for mention in entity.mentions:
    #         print(u"Mention text: {}".format(mention.text.content))
    #         # Get the mention type, e.g. PROPER for proper noun
    #         print(
    #             u"Mention type: {}".format(language_v1.EntityMention.Type(mention.type_).name)
    #         )
