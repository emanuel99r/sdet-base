import json
import boto3
import os
import time

athena = boto3.client("athena")

DATABASE = os.environ["ATHENA_DATABASE"]
OUTPUT_LOCATION = os.environ["ATHENA_OUTPUT"]

def lambda_handler(event, context):
    path = event.get("path")
    if path == '/clients':
        try:
            client_id = event.get("queryStringParameters").get("client_id")
            query = f" SELECT * FROM clients where client_id = {client_id}"
        except:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": f"Bad request: no se encontro parametro requerido: client_id"}),
            }
        
    elif path == '/orders':
        try:
            order_id = event.get("queryStringParameters").get("order_id")
            query = f" SELECT * FROM orders where order_id = {order_id}"
        except:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": f"Bad request: no se encontro parametro requerido: order_id"}),
            }

    elif path == '/orders_per_client':
        try:
            client_id = event.get("queryStringParameters").get("client_id")
            query = f" SELECT * FROM orders_per_client where client_id = {client_id}"
        except:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": f"Bad request: no se encontro parametro requerido: client_id"}),
            }

    elif path == '/orders_status_summary':
        try:
            status_id = event.get("queryStringParameters").get("status_id")
            query = f" SELECT * FROM orders_status_summary where status = '{status_id}'"
        except:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": f"Bad request: no se encontro parametro requerido: status_id"}),
            }

    elif path == '/products':
        try:
            product_id = event.get("queryStringParameters").get("product_id")
            query = f" SELECT * FROM products where product_id = {product_id}"
        except:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": f"Bad request: no se encontro parametro requerido: product_id"}),
            }

    elif path == '/sales_per_product':
        try:
            product_id = event.get("queryStringParameters").get("product_id")
            query = f" SELECT * FROM sales_per_product where product_id = {product_id}"
        except:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": f"Bad request: no se encontro parametro requerido: product_id"}),
            }
    else:
        return {
                "statusCode": 400,
                "body": json.dumps({"error": f"Bad request: no se encontro la ruta {path}"}),
            }
        
    try:
        response = athena.start_query_execution(
            QueryString=query,
            QueryExecutionContext={"Database": DATABASE},
            ResultConfiguration={"OutputLocation": OUTPUT_LOCATION},
        )

        execution_id = response["QueryExecutionId"]

        for _ in range(30):
            result = athena.get_query_execution(QueryExecutionId=execution_id)
            state = result["QueryExecution"]["Status"]["State"]

            if state in ["SUCCEEDED", "FAILED", "CANCELLED"]:
                break
            time.sleep(1)

        if state != "SUCCEEDED":
            return {
                "statusCode": 500,
                "body": json.dumps({"error": f"Query failed with state {state}"}),
            }

        result_set = athena.get_query_results(QueryExecutionId=execution_id)
        rows = result_set["ResultSet"]["Rows"]
        headers = [col["VarCharValue"] for col in rows[0]["Data"]]
        data = [
            dict(zip(headers, [col.get("VarCharValue", "") for col in row["Data"]]))
            for row in rows[1:]
        ]

        return {
            "statusCode": 200,
            "body": json.dumps(data),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }
