from flask_sqlalchemy import SQLAlchemy, Model
db = SQLAlchemy()

class Composition(db.Model):
    __tablename__ = 'composition'
    id = db.Column(db.Integer, primary_key=True)
    sequences = db.relationship('Sequence', backref='composition', lazy='dynamic')
    
    def __repr__(self):
        return 'Composition {}'.format(self.id)

class Sequence(db.Model):
    __tablename__ = 'sequence'
    m = db.Column(db.Integer)
    n = db.Column(db.Integer)
    data = db.Column(db.Text)
    instrument = db.Column(db.Text)
    id = db.Column(db.Integer, primary_key=True)
    composition_id = db.Column(db.Integer, db.ForeignKey('composition.id'))

    def __init__(self, m, n, data, instrument, composition):
        self.m = m
        self.n = n
        self.data = data
        self.instrument = instrument
        self.composition = composition

    def __repr__(self):
        return 'Sequence {} {} {} {}'.format(self.id, self.instrument, self.m, self.n)
