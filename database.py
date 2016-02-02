import pymongo
import datetime
import collections

uri = 'mongodb://143.215.138.132:27017/'
client = pymongo.MongoClient(uri)
db = client['big_data']

def _timestamp(dt):
    return int(dt.strftime("%s"))

def _ids_from_articles(articles, accessor=lambda x: x['wdid']):
    return[accessor(entity) for article in articles for entity in article['entities']]

def get_latest_entities():
    past_day = datetime.datetime.now() - datetime.timedelta(hours=24)
    # grab all the articles in the past 24 hours that have entities
    article_query = {'timestamp': {'$gt': _timestamp(past_day)}, 'entities': {'$exists': True}}
    articles = db.qdoc.find(article_query)
    entity_ids = _ids_from_articles(articles)
    counter = collections.Counter(entity_ids)
    # get the entities that have geolocation data
    entity_query = {'_id': {'$in': entity_ids}, 'properties.GeoLocation': {'$exists': True}}
    entities = db.entities.find(entity_query)
    transform = lambda x: {'name': x['title'],
        'id': x['_id'],
        'geo': x['properties']['GeoLocation']['value'],
        'frequency': counter[x['_id']]}
    return map(transform, entities)

def get_related_entities(_id):
    past_day = datetime.datetime.now() - datetime.timedelta(hours=24)
    query = {'timestamp': {'$gt': _timestamp(past_day)},
            'entities': { '$elemMatch': {'wdid': _id}},
            }
    articles = db.qdoc.find(query)
    entity_ids = _ids_from_articles(articles)
    counter = collections.Counter(entity_ids)
    transform = lambda x: {'_id': x,
        'frequency': counter[x]}
    return map(transform, set(entity_ids))
