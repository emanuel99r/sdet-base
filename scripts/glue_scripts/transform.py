import sys
import boto3
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.utils import getResolvedOptions
from pyspark.sql.functions import col, countDistinct, sum as spark_sum

args = getResolvedOptions(sys.argv, [
    "STAGING_BUCKET", "ANALYTICS_BUCKET", "GLUE_DATABASE"
])

STAGING_BUCKET = args["STAGING_BUCKET"]
ANALYTICS_BUCKET = args["ANALYTICS_BUCKET"]
GLUE_DATABASE = args["GLUE_DATABASE"]

input_path = f"s3://{STAGING_BUCKET}/orders_parquet/"
output_base = f"s3://{ANALYTICS_BUCKET}/models/"

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
spark.conf.set("spark.sql.parquet.enableVectorizedReader","false")
spark.conf.set("spark.sql.hive.convertMetastoreParquet","true")
spark.conf.set("spark.sql.hive.convertMetastoreParquet.mergeSchema","true")
spark.conf.set("spark.sql.parquet.mergeSchema","true")

df = spark.read.parquet(input_path)

clients_df = df.select("client_id", "client_name", "point_of_sale_channel").dropDuplicates()
products_df = df.select(
    "product_id", "product_description", "product_price", "product_ccf", "product_volume"
).dropDuplicates()
orders_df = df.select(
    "order_id", "client_id", "product_id", "status"
).dropDuplicates()
orders_per_client_df = df.groupBy("client_id").agg(
    countDistinct("order_id").alias("total_orders")
)
sales_per_product_df = df.groupBy("product_id").agg(
    spark_sum("product_price").alias("total_sales")
)
status_counts_df = df.groupBy("status").count().withColumnRenamed("count", "total")

def to_string_df(df):
    return df.select([col(c).cast("string").alias(c) for c in df.columns])

def save(dataframe, name):
    full_path = f"{output_base}{name}/"
    dataframe_str = to_string_df(dataframe)
    dataframe_str.write \
        .mode("overwrite") \
        .format("parquet") \
        .option("path", full_path) \
        .saveAsTable(f"{GLUE_DATABASE}.{name}")

save(clients_df, "clients")
save(products_df, "products")
save(orders_df, "orders")
save(orders_per_client_df, "orders_per_client")
save(sales_per_product_df, "sales_per_product")
save(status_counts_df, "orders_status_summary")
