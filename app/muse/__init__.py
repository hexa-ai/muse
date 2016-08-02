from random import random
from flask import Flask, request
from flask import render_template
from flask_socketio import SocketIO
from muse.models import db

app = Flask(__name__)
app.config.from_object('config')

socketio = SocketIO(app, async_mode="eventlet")

db.init_app(app)
with app.app_context():
    db.create_all()

@socketio.on('connect')
def handle_connect():
    pass

@socketio.on('disconnect')
def handle_disconnect():
    pass

@socketio.on('sequence')
def handle_message(data):
    print(data)

@socketio.on('save_sequence')
def handle_save_sequence(data):
    print(data)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    socketio.run(app, debug=app.config['DEBUG'])
