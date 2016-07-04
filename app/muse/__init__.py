from random import random
from flask import Flask, request
from flask import render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config.from_object('config')
socketio = SocketIO(app, async_mode="eventlet")

@socketio.on('connect')
def handle_connect():
    pass


@socketio.on('disconnect')
def handle_disconnect():
    pass

@socketio.on('in')
def handle_message(json):
    for i in range(len(json)):
        for x in range(len(json[i])):
            json[i][x] = 1 if random() > 0.5 else 0
    socketio.emit('out', json)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    socketio.run(app, debug=app.config['DEBUG'])
