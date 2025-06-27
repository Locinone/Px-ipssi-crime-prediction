FROM bitnami/spark:latest

USER root

RUN apt-get update && apt-get install -y python3-pip
COPY requirements.txt /tmp/requirements.txt
RUN pip3 install -r /tmp/requirements.txt

COPY spark_streaming.py /opt/spark/spark_streaming.py
COPY nyc_crime_batch_to_neo4j.py /opt/spark/nyc_crime_batch_to_neo4j.py

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
