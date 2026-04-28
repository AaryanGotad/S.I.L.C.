import tensorflow as tf

# function to preprocess images to feed in the model
def preprocess(file, img_height=64, img_width=64):
    """
    Reads an image from filename, turns it into a tensor and reshapes it
    to (img_shape, img_shape, colour channels).

    Parameters:
        file (File object): Image file
        img_height (int): final height of the image. (default: 64)
        img_width (int): final width of the image. (default: 64)

    Returns:
        img (tensor): image succesfully reshapes and converted to a tensor.
    """
    # read in the bytes from the Flask FileStorage Object
    img_bytes = file.read()

    # decode the read image into a tensor
    img = tf.io.decode_image(img_bytes, channels=3)

    # resize the image
    img = tf.image.resize_with_pad(img,
                                   img_height,
                                   img_width,
                                   method=tf.image.ResizeMethod.BILINEAR,
                                   antialias=True)

    # converting pixel values to float32
    img = tf.cast(img, tf.float32)

    img = tf.keras.applications.efficientnet.preprocess_input(img)

    # adding batch dimension (eg., [1, 64, 64, 3] )
    img = tf.expand_dims(img, axis=0)

    return img

def get_top_k_predictions(prediction, labels, k=3):
    """
    Returns the top k predictions from a prediction probability vector
    of model.

    Parameters:
        prediction (tensor): A prediction probability tensor
        labels (list): A list of class names
        k (int): no. of top predictions wanted (default: 3)

    Returns:
        top_k (dictionary): top k predictions in python dictionary format
    """
    # getting the probabilities and indices for the top k
    top_k_values, top_k_indices = tf.math.top_k(prediction[0], k=k)

    # converting to numpy for easy looping
    preds = top_k_values.numpy()
    indices = top_k_indices.numpy()

    # dictionary to store prediction class and probabilty percentage
    top_k = []
    for i in range(k):
        class_name = labels[indices[i]]
        confidence = float(preds[i] * 100)

        # appending as a dictionary to the list
        top_k.append({
            "label": class_name,
            "confidence": round(confidence, 2)
        })

    return top_k
