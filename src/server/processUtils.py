def list_to_dict(list, key):
    return {key(x): x for x in list}
