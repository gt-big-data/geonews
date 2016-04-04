import flask
import json
import pymongo
import random
import datetime
import database

app = flask.Flask(__name__, static_url_path='')

uri = 'mongodb://143.215.138.132:27017/'
client = pymongo.MongoClient(uri)
db = client['big_data']

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/entities')
def get_entities():
    return json.dumps(database.get_latest_entities())

@app.route('/related/<string:_id>')
def get_related_entities(_id):
    return json.dumps(database.get_related_entities(_id))

@app.route('/articles/<string:entity_id>')
def get_articles_for_entity(entity_id):
    return json.dumps(database.get_entity_articles(entity_id,
                                                   page=int(flask.request.args.get('page'))))

@app.route('/keywords/<string:entity_id>')
def get_keyword_count(entity_id):
    return json.dumps(database.aggregate_keywords(entity_id))

@app.route('/timeseries/<string:entity_id>')
def get_timeseries(entity_id):
    return json.dumps(database.timeseries(entity_id))

@app.route('/heatmap/<string:keyword>')
def get_heatmap(keyword):
    hour = int(flask.request.args.get('hour'))
    past_day = datetime.datetime.now() - datetime.timedelta(hours=24 - hour * 4)
    end = past_day + datetime.timedelta(hours=4)
    # grab all the articles in the past 24 hours that have entities
    match = {'$match': {
    'timestamp': {'$gt': past_day, '$lt': end},
    'keywords': keyword}}
    return json.dumps(database.get_latest_entities(match))

if __name__ == "__main__":
    app.debug = True
    app.run()