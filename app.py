import os
from helper import preprocess, get_top_k_predictions

from flask import Flask, redirect, render_template, request, jsonify
from flask_session import Session

import tensorflow as tf
from tensorflow.keras.models import load_model

app = Flask(__name__)

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "Filesystem"
Session(app)

@app.after_request
def after_request(response):
    """Ensures requests aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# loading the model in memory
model = load_model('model/effnet_model.keras')

# labels
labels = [
    "AnnualCrop", "Forest", "HerbaceousVegetation", "Highway",
    "Industrial", "Pasture", "PermanentCrop", "Residential",
    "River", "SeaLake"
]

@app.route('/')
def index():
    """Loads Home Page"""
    return render_template('index.html')

@app.route('/predict', methods=['GET', 'POST'])
def predict():
    """Makes prediction on sent image"""

    # checking if the 'image' key is in the request
    if 'image' not in request.files:
        return {"error": "No image found"}, 400

    file = request.files['image']

    # checking if the user actually selected a file
    if file.filename == '':
        return {"error": "No selected file"}, 400

    if file:
        # passing the file to preprocessing function
        processed_image = preprocess(file)

        # making a prediction using model
        prediction = model.predict(processed_image)

        # passing the prediction tensor to get top 3
        top_3 = get_top_k_predictions(prediction=prediction,
                                      labels=labels,
                                      k=3) # 3 is the default k value

        return jsonify(top_3)
