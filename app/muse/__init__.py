import json
from bson.json_util import dumps, loads
from flask import Flask, request
from flask import render_template
from flask_socketio import SocketIO, send, emit
from flask_pymongo import PyMongo, ObjectId

# ----------------------------------------------------------------   
# Setup and Config

app = Flask(__name__)
app.config.from_object('config')
socketio = SocketIO(app, async_mode="eventlet")
mongo = PyMongo(app)

# ----------------------------------------------------------------   
# WebSocket Handlers

@socketio.on('connect')
def handle_connect():
    # using send() sends a message back to a single client
    # use socketio.send() to send to all clients
    # create a new composition for this session
    composition_id = str(mongo.db.compositions.insert_one({}).inserted_id)
    emit('composition_init', {'composition_id' : composition_id})

@socketio.on('save_composition')
def handle_save_composition(data):
    compostion_data = json.loads(data)
    if 'composition_id' in compostion_data:
        composition_id = ObjectId(d['composition_id'])
        composition = mongo.db.compositions.find_one({'_id' : composition_id})
        if composition is not None:
            if 'sequences' in d:
                for sequence in d['sequences']:
                    pass
                      
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
            result = {
                'composition_id' : composition_id,
                'instrument_id' : str(instrument_id),
                'voices' : instrument['voices'],
                'steps' : 32, 
                'tempo' : 120
            }
            sequence_id = mongo.db.sequences.insert_one(result).inserted_id
            sequence = mongo.db.sequences.find_one(sequence_id)
            emit('response_new_sequence', dumps(sequence))

# ----------------------------------------------------------------   
# Page Routing Handlers

@app.route('/')
def index():
    instruments = mongo.db.instruments.find({}, {'name' : 1})
    return render_template('index.html', instruments=loads(dumps(instruments)))

@app.route('/index2')
def index2():
    return render_template('index_2.html')

if __name__ == '__main__':
    socketio.run(app, debug=app.config['DEBUG'])
