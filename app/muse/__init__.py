from flask import Flask
from flask import render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config.from_object('config')
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode="eventlet")

@socketio.on('update')
def handle_message(message):
    print('received update')

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    socketio.run(app, debug=app.config['DEBUG'])
