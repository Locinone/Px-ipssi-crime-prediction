from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StructField, StringType, FloatType, IntegerType

# Configuration Spark
KAFKA_BROKER = 'kafka:9092'
TOPIC = 'space_data'
HDFS_PATH = 'hdfs://hadoop-namenode:9000/dangerous_objects/'
CHECKPOINT_DIR = 'hdfs://hadoop-namenode:9000/spark_checkpoints/space_data'

# Schéma JSON des objets spatiaux
schema = StructType([
    StructField("id", StringType(), True),
    StructField("timestamp", IntegerType(), True),
    StructField("position", StructType([
        StructField("x", FloatType(), True),
        StructField("y", FloatType(), True),
        StructField("z", FloatType(), True)
    ]), True),
    StructField("vitesse", FloatType(), True),
    StructField("taille", FloatType(), True),
    StructField("type", StringType(), True)
])

# Initialisation de Spark
spark = SparkSession.builder \
    .appName("SpaceDataStreaming") \
    .config("spark.hadoop.fs.defaultFS", "hdfs://hadoop-namenode:9000") \
    .getOrCreate()

# Lecture du topic Kafka
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", KAFKA_BROKER) \
    .option("subscribe", TOPIC) \
    .option("startingOffsets", "latest") \
    .option("failOnDataLoss", "false") \
    .load()

# Parsing des messages JSON
parsed_df = df.selectExpr("CAST(value AS STRING)") \
    .select(from_json(col("value"), schema).alias("data")) \
    .select("data.*")

# Filtrage des objets dangereux
dangerous_objects = parsed_df.filter((col("vitesse") > 25) & (col("taille") > 10))

# Écriture en HDFS (parquet) avec checkpoint
query = dangerous_objects.writeStream \
    .format("parquet") \
    .option("path", HDFS_PATH) \
    .option("checkpointLocation", CHECKPOINT_DIR) \
    .outputMode("append") \
    .start()

# Affichage console (optionnel)
dangerous_objects.writeStream \
    .outputMode("append") \
    .format("console") \
    .start()

dangerous_objects.selectExpr("to_json(struct(*)) AS value") \
    .writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", KAFKA_BROKER) \
    .option("topic", "alerts") \
    .option("checkpointLocation", "hdfs://hadoop-namenode:9000/spark_checkpoints/alerts") \
    .outputMode("append") \
    .start()


query.awaitTermination()
