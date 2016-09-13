import json
from bson.json_util import dumps, loads
from flask import Flask, request
from flask import render_template
from flask_socketio import SocketIO, send, emit
from flask_pymongo import PyMongo, ObjectId
import numpy as np
from scipy.sparse import csr_matrix, vstack
from math import floor
from sklearn.cluster import KMeans

# ----------------------------------------------------------------   
# Setup and Config

app = Flask(__name__)
app.config.from_object('config')
socketio = SocketIO(app, async_mode="eventlet")
mongo = PyMongo(app)

# ----------------------------------------------------------------   
# SocketIO Handlers

@socketio.on('connect')
def handle_connect():
    # using send() sends a message back to a single client
    # use socketio.send() to send to all clients
    # create a new composition for this session
    new_composition = {
            'tempo' : 120,
            'steps' : 32,
            'name' : 'Untitled'
        }
    composition_id = str(mongo.db.compositions.insert_one(new_composition).inserted_id)
    emit('composition_init', {'composition_id' : composition_id})

@socketio.on('request_instrument_list')
def handle_request_instrument_list():
    instruments = mongo.db.instruments.find({}, {'name' : 1})
    socketio.emit('response_instrument_list', dumps(instruments))

@socketio.on('request_new_sequence')
def handle_request_new_sequence(data):
    if 'instrument' in data and 'composition_id' in data:
        instrument_id = ObjectId(data['instrument'])
        composition_id = data['composition_id']
        instrument = mongo.db.instruments.find_one({'_id' : instrument_id})

        if instrument is not None:
            new_sequence = {
                'composition_id' : composition_id,
                'instrument_id' : str(instrument_id),
                'voices' : instrument['voices'],
                'name' : 'Untitled',
                'ai' : False
            }

            sequence_id = mongo.db.sequences.insert_one(new_sequence).inserted_id
            sequence = mongo.db.sequences.find_one(sequence_id)
            emit('response_new_sequence', json.loads(dumps(sequence)))

@socketio.on('update_models')
def handle_update_models():
    # get all compositions
    # create sparse matrix representations of all compositions
    pass


@socketio.on('sequence_name_update')
def handle_sequence_name_update(data):
    sequence_id = {'_id' : ObjectId(data['sequence_id'])}
    name = data['name']
    update = {'$set' : {'name' : name}}
    mongo.db.sequences.update_one(sequence_id, update)

@socketio.on('sequence_data_update')
def handle_sequence_data_update(data):
    sequence_id = {'_id' : ObjectId(data['sequence_id'])}
    new_data = data['data']
    update = {'$set' : {'data' : new_data}}
    mongo.db.sequences.update_one(sequence_id, update)

@socketio.on('sequence_ai_update')
def handle_sequence_ai_update(data):
    sequence_id = {'_id' : ObjectId(data['sequence_id'])}
    ai = data['ai']
    update = {'$set' : {'ai' : ai}}
    mongo.db.sequences.update_one(sequence_id, update)

@socketio.on('request_ai_sequence')
def handle_request_ai_sequence(data):
    composition_id = data['composition_id']
    ai_sequences = mongo.db.sequences.find({'composition_id' : composition_id, 'ai' : True})
    user_sequences = mongo.db.sequences.find({'composition_id' : composition_id, 'ai' : False})

# ----------------------------------------------------------------   
# Page Routing Handlers

@app.route('/')
def index():
    instruments = mongo.db.instruments.find({}, {'name' : 1})
    return render_template('index.html', instruments=loads(dumps(instruments)))

@app.route('/index2')
def index2():
    return render_template('index_2.html')

# ---------------------------------------------------------------- 
# Utilities 
def create_sparse_composition_matrix(data):
    # splits a string of ones and zeroes into a sparse matrix
    pass

if __name__ == '__main__':
    socketio.run(app, debug=app.config['DEBUG'])
