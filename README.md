# Serverless ETL Pipeline with AWS

Este proyecto implementa una arquitectura serverless de procesamiento de datos en AWS. Permite la ingestión, validación, transformación y consulta de datos CSV utilizando servicios gestionados como S3, AWS Glue, Step Functions, Athena, Lambda y API Gateway.

## 🧱 Arquitectura General

![alt text](https://github.com/nicolanete98/arkho-test/blob/main/arkho-test%20diagrama.png "Diagrama de arquitectura")

## 📁 Estructura del Proyecto

```
.
├── bin/
│   ├── arkho-test.ts
│   └── variables/
│       ├── base-props.ts
│       └── constants.ts
├── interfaces/
│   └── s3-app-props.ts
├── lib/
│   ├── etl/
│   │   ├── apigateway-lambda/
│   │   │   └── apigateway-lambda.ts
│   │   ├── glue/
│   │   │   └── glue-stack.ts
│   │   ├── stepfunction/
│   │   │   └── stepfunction-stack.ts
│   └── transversal/
│       ├── eventbridge/
│       │   └── eventbridge-stack.ts
│       ├── s3/
│       │   └── bucket-stack.ts
│       └── sns/
│           └── sns-stack.ts
├── scripts/
│   ├── glue_scripts/
│   │   ├── large_csv_ingestion.py
│   │   ├── small_csv_ingestion.py
│   │   └── transform.py
│   └── lambda_scripts/
│       └── apigateway-lambda/
│           └── handler.py
```

## 🔧 Servicios Utilizados

- Amazon S3
- AWS Glue
- Step Functions
- EventBridge
- Amazon Athena
- AWS Lambda
- API Gateway
- Athena

## ⚙️ Despliegue

1. `npm install`
2. Configurar variables en `bin/variables/constants.ts`
3. `cdk bootstrap`
4. Desplegar los stacks para un entorno, ejemplo:  `cdk deploy BucketsStackDEV EventBridgeStackDEV GlueStackDEV SnsStackDEV StepFunctionStackDEV ApiGatewayLambdaStackDEV`

## 🚀 Endpoints API Gateway

```
GET https://{api_id}.execute-api.{region}.amazonaws.com/dev/{recurso}
```

### Endpoints disponibles:

| Recurso                | Query Params            | Descripción                      |
|------------------------|-------------------------|----------------------------------|
| `/clients`            | `client_id` (requeridos)  | Consulta clientes                |
| `/orders`             | `order_id` (requeridos)   | Consulta órdenes                 |
| `/orders_per_client`  | `client_id` (requeridos)  | Total de órdenes por cliente     |
| `/orders_status_summary` | `status_id` (requeridos) | Órdenes agrupadas por estado     |
| `/products`           | `product_id` (requeridos) | Consulta productos               |
| `/sales_per_product`  | `product_id` (requeridos) | Ventas por producto              |

Ejemplo: https://{api_id}.execute-api.{region}.amazonaws.com/dev/clients?client_id=1234

## ✅ Validaciones

- Delimitadores válidos: `,`, `;`, `|`
- Columnas obligatorias y `nulls`
- Modelos: clientes, productos, órdenes, métricas agregadas

## 📌 Consideraciones

- `staging_db`: datos validados y estructurados, listos para transformación
- `analytics_db`: modelos analíticos
- Resultados de Athena en: `s3://{bucket-staging}/athena-results/`

## 🛠️ Requisitos

- Node.js ≥ 18
- AWS CLI configurado
- CDK ≥ 2.0

## 🧪 Pruebas

Sube archivos CSV al bucket `raw` para activar el flujo automáticamente.
Archivos csv para testeo: https://drive.google.com/drive/folders/1ygIow0aCwVg5W7gNaO4iFgWNRdTSyubW?usp=sharing

## 📞 Soporte

Emanuel Rivera 