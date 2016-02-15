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

@app.route('/related/:id')
def get_related_entities(_id):
    return json.dumps(database.get_related_entities(_id))

@app.route('/sources')
def sources():
    # display 10 random sources
    sources = db.qdoc.distinct('source')
    subset = random.sample(sources, 10)
    return flask.jsonify(data=subset)

@app.route('/articles/<string:source>')
def list_articles(source):
    # return articles that match the source
    articles = db.qdoc.find({'source': source},
        projection={'_id': 1, 'title': 1}, limit=10)
    return flask.render_template('article_list.html',
        source=source, articles=articles)

@app.route('/article/<string:_id>')
def get_article(_id):
    object_id = bson.objectid.ObjectId(_id)
    article = db.qdoc.find_one({'_id': object_id})
    # return the article that has the given id
    article['_id'] = str(article['_id'])
    return flask.render_template('article.html', article=article)

if __name__ == "__main__":
    app.debug = True
    app.run()