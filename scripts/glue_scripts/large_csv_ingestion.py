import sys
import boto3
import csv
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.utils import getResolvedOptions

args = getResolvedOptions(sys.argv, [
    "RAW_BUCKET", "STAGING_BUCKET", "CSV_KEY",
    "GLUE_DATABASE", "GLUE_TABLE_NAME"
])

RAW_BUCKET = args["RAW_BUCKET"]
STAGING_BUCKET = args["STAGING_BUCKET"]
CSV_KEY = args["CSV_KEY"]
GLUE_DATABASE = args["GLUE_DATABASE"]
GLUE_TABLE_NAME = args["GLUE_TABLE_NAME"]

input_path = f"s3://{RAW_BUCKET}/{CSV_KEY}"
output_path = f"s3://{STAGING_BUCKET}/orders_parquet/"

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session

expected_columns = [
    'client_id',
    'client_name',
    'order_id',
    'product_id',
    'product_description',
    'product_price',
    'product_ccf',
    'product_volume',
    'point_of_sale_channel',
    'status'
]

s3 = boto3.client("s3")
obj = s3.get_object(Bucket=RAW_BUCKET, Key=CSV_KEY)
sample = obj["Body"].read(1024).decode("utf-8")

sniffer = csv.Sniffer()
try:
    dialect = sniffer.sniff(sample)
    detected_delimiter = dialect.delimiter
except Exception as e:
    raise Exception("No se pudo detectar el delimitador del archivo CSV")

if detected_delimiter not in [",", ";", "|"]:
    raise Exception(f"Delimitador no válido: '{detected_delimiter}'. Solo se permiten ',', ';' y '|'.")

df = spark.read \
    .option("header", "true") \
    .option("sep", detected_delimiter) \
    .csv(input_path)

missing_cols = set(expected_columns) - set(df.columns)
if missing_cols:
    raise Exception(f"Columnas faltantes en el CSV: {missing_cols}")

df = df.na.drop(subset=['client_id', 'order_id', 'product_id', 'status', 'product_price'])

df.write \
    .format("parquet") \
    .option("path", output_path) \
    .mode("overwrite") \
    .partitionBy("status", "point_of_sale_channel") \
    .saveAsTable(f"{GLUE_DATABASE}.{GLUE_TABLE_NAME}")
