-- Setup Cortex Agent in Snowflake
-- Run this in your Snowflake account before using the LangGraph integration

USE ROLE ACCOUNTADMIN;
USE WAREHOUSE SANDBOX_WH;
USE DATABASE SANDBOX_DB;
USE SCHEMA SANDBOX_SCHEMA;

-- Create a sample table for the agent to query
CREATE OR REPLACE TABLE sales_data (
    sale_id INT,
    product_name VARCHAR,
    category VARCHAR,
    amount DECIMAL(10,2),
    sale_date DATE,
    region VARCHAR
);

INSERT INTO sales_data VALUES
    (1, 'Laptop Pro', 'Electronics', 1299.99, '2025-01-15', 'North'),
    (2, 'Wireless Mouse', 'Electronics', 49.99, '2025-01-16', 'South'),
    (3, 'Office Chair', 'Furniture', 399.99, '2025-01-17', 'East'),
    (4, 'Standing Desk', 'Furniture', 799.99, '2025-01-18', 'West'),
    (5, 'Monitor 27"', 'Electronics', 599.99, '2025-01-19', 'North'),
    (6, 'Keyboard Mechanical', 'Electronics', 149.99, '2025-01-20', 'South'),
    (7, 'Bookshelf', 'Furniture', 249.99, '2025-01-21', 'East'),
    (8, 'Laptop Stand', 'Accessories', 79.99, '2025-01-22', 'West'),
    (9, 'USB Hub', 'Accessories', 39.99, '2025-01-23', 'North'),
    (10, 'Webcam HD', 'Electronics', 129.99, '2025-01-24', 'South');

-- Create a Semantic View for Cortex Analyst
CREATE OR REPLACE SEMANTIC VIEW sales_semantic_view
  COMMENT = 'Semantic view for sales data analytics'
  AS $$
name: sales_analytics
description: Semantic model for analyzing sales data
tables:
  - name: sales_data
    base_table: SANDBOX_DB.SANDBOX_SCHEMA.SALES_DATA
    description: Sales transaction records
    columns:
      - name: sale_id
        description: Unique identifier for the sale
        data_type: NUMBER
      - name: product_name
        description: Name of the product sold
        data_type: VARCHAR
      - name: category
        description: Product category (Electronics, Furniture, Accessories)
        data_type: VARCHAR
      - name: amount
        description: Sale amount in USD
        data_type: NUMBER
      - name: sale_date
        description: Date of the sale
        data_type: DATE
      - name: region
        description: Geographic region (North, South, East, West)
        data_type: VARCHAR
metrics:
  - name: total_sales
    description: Total sales amount
    expr: SUM(amount)
    data_type: NUMBER
  - name: avg_sale
    description: Average sale amount
    expr: AVG(amount)
    data_type: NUMBER
  - name: sale_count
    description: Number of sales
    expr: COUNT(*)
    data_type: NUMBER
dimensions:
  - name: product_name
    description: Product name for grouping
    expr: product_name
    data_type: VARCHAR
  - name: category
    description: Category for grouping
    expr: category
    data_type: VARCHAR
  - name: region
    description: Region for grouping
    expr: region
    data_type: VARCHAR
  - name: sale_date
    description: Date for time-based analysis
    expr: sale_date
    data_type: DATE
$$;

-- Create the Cortex Agent
CREATE OR REPLACE AGENT SANDBOX_DB.SANDBOX_SCHEMA.sales_agent
  COMMENT = 'Sales analytics agent for LangGraph integration'
  PROFILE = '{"display_name": "Sales Analytics Agent"}'
  FROM SPECIFICATION $$
  {
    "models": {
      "orchestration": "claude-4-sonnet"
    },
    "instructions": {
      "orchestration": "You are a sales analytics assistant. Use the sales_analyst tool to answer questions about sales data.",
      "response": "Provide clear, concise answers with relevant numbers and insights."
    },
    "tools": [
      {
        "tool_spec": {
          "type": "cortex_analyst_text_to_sql",
          "name": "sales_analyst",
          "description": "Query sales data using natural language to get insights about products, categories, regions, and sales trends."
        }
      }
    ],
    "tool_resources": {
      "sales_analyst": {
        "semantic_view": "SANDBOX_DB.SANDBOX_SCHEMA.SALES_SEMANTIC_VIEW",
        "execution_environment": {
          "type": "warehouse",
          "warehouse": "SANDBOX_WH"
        },
        "query_timeout": 60
      }
    }
  }
  $$;

-- Grant access (adjust role as needed)
GRANT USAGE ON AGENT SANDBOX_DB.SANDBOX_SCHEMA.sales_agent TO ROLE ACCOUNTADMIN;

-- Verify agent was created
SHOW AGENTS IN SCHEMA SANDBOX_DB.SANDBOX_SCHEMA;
DESC AGENT SANDBOX_DB.SANDBOX_SCHEMA.sales_agent;
