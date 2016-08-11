from flask_sqlalchemy import SQLAlchemy, Model
db = SQLAlchemy()

class Sequence(db.Model):
    __tablename__ = 'Sequence'
    m = db.Column(db.Integer)
    n = db.Column(db.Integer)
    data = db.Column(db.Text)
    id = db.Column(db.Integer, primary_key=True)

    def __init__(self, json):
        self.m = json['shape'][0]
        self.n = json['shape'][1]
        data = json['data']

class Composition(db.Model):
    id = db.Column(db.Integer, primary_key=True)
