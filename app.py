import os
import numpy as np
import tensorflow as tf
import keras
from flask import Flask, render_template, request, session, jsonify
from flask_session import Session
from PIL import Image
from keras.layers import Dense
from tensorflow.keras.models import load_model

# 1. Safety Patch for Keras 3 'quantization_config' error
original_dense_init = Dense.__init__
def patched_dense_init(self, *args, **kwargs):
    kwargs.pop("quantization_config", None)
    return original_dense_init(self, *args, **kwargs)
Dense.__init__ = patched_dense_init

# 2. Import your local helper functions
from helper import preprocess, get_top_k_predictions

# 3. Initialize Flask
app = Flask(__name__)

# 4. Hugging Face Writable Session Config
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "Filesystem"
app.config["SESSION_FILE_DIR"] = "/tmp/flask_session" 
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
