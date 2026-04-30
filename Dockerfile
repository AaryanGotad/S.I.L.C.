FROM python:3.10
WORKDIR /code

RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Create writable session folder
RUN mkdir -p /code/flask_session && chmod 777 /code/flask_session
EXPOSE 7860
CMD ["gunicorn", "-b", "0.0.0.0:7860", "--timeout", "120", "app:app"]