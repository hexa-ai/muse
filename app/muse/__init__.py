import json
from flask import Flask, request
from flask import render_template
from flask_socketio import SocketIO, send, emit
from muse.models import db, Sequence

app = Flask(__name__)
app.config.from_object('config')
socketio = SocketIO(app, async_mode="eventlet")

db.init_app(app)
with app.app_context():
    meta = db.metadata
    '''
    # clear the database
    for table in reversed(meta.sorted_tables):
        print('Clear table %s' % table)
        db.session.execute(table.delete())
    db.session.commit()
    '''
    db.create_all()

@socketio.on('connect')
def handle_connect():
    # using send() sends a message back to a single client
    # use socketio.send() to send to all clients
    send('init_composition')

@socketio.on('save_sequence')
def handle_save_sequence(data):
    seq = Sequence(json.loads(data))
    db.session.add(seq)
    db.session.commit()

@socketio.on('get_sequences')
def handle_get_sequences():
    sequences = Sequence.query.all()
    for sequence in sequences:
        print(sequence)

@socketio.on('sequence_update')
def handle_sequence_update(data):
    pass

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    socketio.run(app, debug=app.config['DEBUG'])
