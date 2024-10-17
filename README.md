### **Assignment Story: Duff Beer Inc.**

**Company Background:**
Duff Beer Inc. is a well-known beverage company that specializes in selling different beer products. They have a growing network of point-of-sale channels including direct sales to retailers, online orders, and B2B partnerships. As their sales increase, Duff Beer Inc. needs a robust system to track and analyze their order data in real-time. They are currently facing difficulties in processing their large volumes of order data and want to automate this using AWS services.

Your task is to help Duff Beer Inc. by building an ETL pipeline to process their orders, summarize them, and expose a report through an API.

---

### **Sample CSV File: Orders Data**

Here is a sample structure of the CSV file that Duff Beer Inc. will upload to S3:

| client_id | client_name | order_id | product_id | product_description | product_price | product_ccf | product_volume | point_of_sale_channel | status    |
|-----------|-------------|----------|------------|----------------------|---------------|----------------|-------------|-----------------------|-----------|
| 1001      | Moe's Tavern| 5678     | 102        | Duff Classic          | 2.50          | 6              | 0.33        | Retail                | created   |
| 1002      | Kwik-E-Mart | 5679     | 103        | Duff Lite             | 2.00          | 12             | 0.5         | B2B                   | delivered |
| 1003      | Krusty Burger| 5680     | 104        | Duff Dry              | 3.00          | 8              | 0.25        | Online                | broken    |
| 1004      | Springfield Mall| 5681  | 105        | Duff Special          | 4.00          | 24             | 1.00        | Retail                | created   |
| 1005      | Moe's Tavern| 5682     | 102        | Duff Classic          | 2.50          | 6              | 0.33        | B2B                   | delivered |

- **client_id**: The ID of the client placing the order.
- **client_name**: The name of the client.
- **order_id**: Unique ID for the order.
- **product_id**: Unique ID for the product.
- **product_description**: Name or description of the product ordered.
- **product_price**: Price of the product per unit.
- **product_ccf**: Number of units ordered.
- **product_volume**: Volume per unit (in liters or specific measure).
- **point_of_sale_channel**: Channel through which the order was placed (e.g., Retail, Online, B2B).
- **status**: The current status of the order. Possible values are:
  - `created`: Order has been created.
  - `delivered`: Order has been successfully delivered.
  - `broken`: The order was damaged or had issues during delivery.

---

### **ETL Pipeline Challenge:**

Using this CSV file, you should set up the automated ETL pipeline that processes this data.

Ideally, you should use S3 to save the CSV.

Then, an event, somehow has to detect that the file is on s3 and needs to trigger the ETL process.

The process itself can be with step functions, and one or multiple lambda functions, or Glue Jobs (Serverless is encouraged)

then the data must be saved in another s3 bucket and be available to query from ATHENA.

Finally the API should expose the data previously saved and processed.

### **Additional Task: Data Modeling:**


Now that you've built the ETL pipeline for processing orders, Duff Beer Inc. also wants to improve their data structure for analytics. Based on the processed dataset, create as many models as you can. These models should help the company analyze their data efficiently.

You can include, but are not limited to, the following models:

- Clients Model: A model that tracks information about Duff Beer Inc.'s clients (e.g., client_id, client_name, point_of_sale_channel, etc.).
- Products Model: A model that organizes data about the products Duff Beer Inc. sells (e.g., product_id, product_description, product_price, product_volume, etc.).
- Orders Model: A model that keeps records of orders (e.g., order_id, client_id, product_id, status, etc.).
- Feel free to extend or create additional models that you think would benefit Duff Beer Inc. in analyzing their sales and order data.

