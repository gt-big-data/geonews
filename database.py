import pymongo
import datetime
import collections
import time
import pprint

uri = 'mongodb://143.215.138.132:27017/'
client = pymongo.MongoClient(uri)
db = client['big_data']

def get_entity_articles(entity_id, page=1):
    past_day = datetime.datetime.now() - datetime.timedelta(hours=24)
    projection = {'_id': 0, 'timestamp': 0, 'social': 0, 'content': 0,
        'entities': 0}
    page_size = 20
    results = db.qdoc.find({'timestamp': {'$gt': past_day},
        'entities': { '$elemMatch': {'wdid': entity_id}}}, projection=projection,
         skip=(page - 1) * page_size, limit=page_size)
    return list(results)


def _ids_from_articles(articles, accessor=lambda x: x['wdid']):
    return[accessor(entity) for article in articles for entity in article['entities']]

def get_latest_entities():
    past_day = datetime.datetime.now() - datetime.timedelta(hours=24)
    # grab all the articles in the past 24 hours that have entities
    match = {'$match': {'timestamp': {'$gt': past_day}, 'entities': {'$exists': True}}}
    project = {'$project': {'entities.wdid': 1, '_id': 0}}
    unwind = {'$unwind': '$entities'}
    group = {'$group': {'_id': '$entities.wdid', 'count': {'$sum': 1}}}
    sort = {'$sort': {'count': -1}}
    limit = {'$limit': 250}
    pipeline = [match, project, unwind, group, sort, limit]
    results  = list(db.qdoc.aggregate(pipeline))
    entity_ids = {x['_id']: x['count'] for x in results}
    # get the entities that have geolocation data
    entity_query = {'_id': {'$in': entity_ids.keys()},
         'title': {'$ne': 'United States of America'},
         'geolocation.lat': {'$exists': True}}
    entities = db.entities.find(entity_query)
    transform = lambda x: {'name': x['title'],
        'id': x['_id'],
        'lat': x['geolocation']['lat'],
        'lng': x['geolocation']['lon'],
        'frequency': entity_ids[x['_id']]}
    return map(transform, entities)

def get_related_entities(_id):
    past_day = datetime.datetime.now() - datetime.timedelta(hours=24)
    query = {'timestamp': {'$gt': past_day},
            'entities': { '$elemMatch': {'wdid': _id}},
            }
    articles = db.qdoc.find(query)
    entity_ids = _ids_from_articles(articles)
    counter = collections.Counter(entity_ids)
    transform = lambda x: {'id': x,
        'frequency': counter[x]}
    return map(transform, set(entity_ids))

def aggregate_keywords(_id):
    past_day = datetime.datetime.now() - datetime.timedelta(hours=24)
    match = { '$match': {
                'timestamp': {'$gt': past_day},
                'entities': {'$elemMatch': {'wdid': _id}}}
        }
    unwind = {'$unwind': '$keywords'}
    group = {'$group': {'_id': '$keywords', 'count': {'$sum': 1}}}
    sort = {'$sort': {'count': -1}}
    limit = {'$limit': 10}
    pipeline = [match, unwind, group, sort, limit]
    return list(db.qdoc.aggregate(pipeline))
