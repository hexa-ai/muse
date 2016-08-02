from flask_sqlalchemy import SQLAlchemy, Model
db = SQLAlchemy()

class Composition(db.Model):
    id = db.Column(db.Integer, primary_key=True)
