from flask_sqlalchemy import SQLAlchemy, Model
db = SQLAlchemy()

class Composition(db.Model):
    __tablename__ = 'Composition'
    id = db.Column(db.Integer, primary_key=True)
    sequences = db.relationship('Sequence', backref='composition', lazy='dynamic')

class Sequence(db.Model):
    __tablename__ = 'Sequence'
    m = db.Column(db.Integer)
    n = db.Column(db.Integer)
    data = db.Column(db.Text)
    instrument = db.Column(db.Text)
    id = db.Column(db.Integer, primary_key=True)
    composition_id = db.Column(db.Integer, db.ForeignKey('Composition.id'))

    def __init__(self, json):
        self.m = json['shape'][0]
        self.n = json['shape'][1]
        self.data = json['data']
        self.instrument = json['instrument']

    def __repr__(self):
        return 'Sequence {} {} {} {}'.format(self.id, self.instrument, self.m, self.n)


