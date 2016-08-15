import json
from flask import Flask, request
from flask import render_template
from flask_socketio import SocketIO, send, emit
from flask_pymongo import PyMongo, ObjectId

app = Flask(__name__)
app.config.from_object('config')
socketio = SocketIO(app, async_mode="eventlet")
mongo = PyMongo(app)

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
                      
@socketio.on('get_sequences')
def handle_get_sequences():
    '''
    sequences = Sequence.query.all()
    for sequence in sequences:
        print(sequence)
    '''
    pass

@socketio.on('request_new_sequence')
def handle_get_new_sequence(data):
    if 'instrument' in data:
        instrument = db.instruments.find_one(data['instrument'])
        sequence_id = str(mongo.db.sequences.insert_one({}).insert_id)
        emit('response_new_sequence', {'sequence_id' : sequence_id })

@socketio.on('sequence_update')
def handle_sequence_update(data):
    pass

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/index2')
def index2():
    return render_template('index_2.html')

if __name__ == '__main__':
    socketio.run(app, debug=app.config['DEBUG'])
