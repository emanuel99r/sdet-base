import awswrangler as wr
import pandas as pd
import sys
import boto3
import csv

RAW_BUCKET = sys.argv[sys.argv.index("--RAW_BUCKET") + 1]
STAGING_BUCKET = sys.argv[sys.argv.index("--STAGING_BUCKET") + 1]
CSV_KEY = sys.argv[sys.argv.index("--CSV_KEY") + 1]
GLUE_DATABASE = sys.argv[sys.argv.index("--GLUE_DATABASE") + 1]
GLUE_TABLE_NAME = sys.argv[sys.argv.index("--GLUE_TABLE_NAME") + 1]
PARTITION_COLS = ["status", "point_of_sale_channel"]

s3_input_path = f"s3://{RAW_BUCKET}/{CSV_KEY}"
local_file = "/tmp/input.csv"

s3 = boto3.client("s3")
s3.download_file(RAW_BUCKET, CSV_KEY, local_file)

def detect_delimiter(file_path):
    with open(file_path, 'r', newline='') as csvfile:
        sample = csvfile.read(2048)
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample)
        delimiter = dialect.delimiter
        if delimiter not in [",", ";", "|"]:
            raise Exception(f"Delimitador inválido: '{delimiter}'. Solo se permite ',', ';' o '|'.")
        return delimiter

detected_delimiter = detect_delimiter(local_file)

df = wr.s3.read_csv(
    path=s3_input_path,
    sep=detected_delimiter
)

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

missing_cols = set(expected_columns) - set(df.columns)
if missing_cols:
    raise Exception(f"Columnas faltantes en el CSV: {missing_cols}")

df = df.dropna(subset=['client_id', 'order_id', 'product_id', 'status', 'product_price'])

wr.s3.to_parquet(
    df=df,
    path=f"s3://{STAGING_BUCKET}/orders_parquet/",
    dataset=True,
    mode="append",
    database=GLUE_DATABASE,
    table=GLUE_TABLE_NAME,
    partition_cols=PARTITION_COLS
)
