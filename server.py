import flask
import json

import database

app = flask.Flask(__name__, static_url_path='')

@app.route('/')
def index():
    return flask.render_template('index.html')

@app.route('/entities')
def get_entities():
    return json.dumps(database.get_latest_entities())

@app.route('/related/:id')
def get_related_entities(_id):
    return json.dumps(database.get_related_entities(_id))

if __name__ == "__main__":
    app.debug = True
    app.run()