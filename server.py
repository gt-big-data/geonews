import flask
import json
import pymongo
import random

import database

app = flask.Flask(__name__, static_url_path='')

uri = 'mongodb://143.215.138.132:27017/'
client = pymongo.MongoClient(uri)
db = client['big_data']

@app.route('/')
def index():
    return flask.render_template('index.html')

@app.route('/entities')
def get_entities():
    return json.dumps(database.get_latest_entities())

@app.route('/related/<string:_id>')
def get_related_entities(_id):
    return json.dumps(database.get_related_entities(_id))

if __name__ == "__main__":
    app.debug = True
    app.run()