import pymongo
import datetime
import collections
import time
import pprint

uri = 'mongodb://143.215.138.132:27017/'
client = pymongo.MongoClient(uri)
db = client['big_data']

def get_entity_articles(entity_id):
    past_day = datetime.datetime.now() - datetime.timedelta(hours=24)
    projection = {'_id': 0, 'timestamp': 0, 'social': 0, 'content': 0,
        'entities': 0}
    results = db.qdoc.find({'timestamp': {'$gt': past_day},
        'entities': { '$elemMatch': {'wdid': entity_id}}}, projection=projection)
    return list(results)

def _ids_from_articles(articles, accessor=lambda x: x['wdid']):
    return[accessor(entity) for article in articles for entity in article['entities']]

def get_latest_entities():
    past_day = datetime.datetime.now() - datetime.timedelta(hours=24)
    # grab all the articles in the past 24 hours that have entities
    article_query = {'timestamp': {'$gt': past_day}, 'entities': {'$exists': True}}
    articles = db.qdoc.find(article_query)
    entity_ids = _ids_from_articles(articles)
    counter = collections.Counter(entity_ids)
    # get the entities that have geolocation data
    exclude = []
    entity_query = {'_id': {'$in': entity_ids},
         'title': {'$ne': 'United States of America'},
         'geolocation.lat': {'$exists': True}}
    entities = db.entities.find(entity_query)
    transform = lambda x: {'name': x['title'],
        'id': x['_id'],
        'lat': x['geolocation']['lat'],
        'lng': x['geolocation']['lon'],
        'frequency': counter[x['_id']]}
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

def list_articles(source):
    # return articles that match the source
    articles = db.qdoc.find({'source': source},
        projection={'_id': 1, 'title': 1}, limit=10)
    return flask.render_template('article_list.html',
        source=source, articles=articles)

def get_article(_id):
    object_id = bson.objectid.ObjectId(_id)
    article = db.qdoc.find_one({'_id': object_id})
    # return the article that has the given id
    article['_id'] = str(article['_id'])
    return flask.render_template('article.html', article=article)