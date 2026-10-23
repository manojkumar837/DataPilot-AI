import random
from datetime import datetime, timedelta
from typing import Dict, Any, List
import pandas as pd
import numpy as np

def generate_retail_sales() -> pd.DataFrame:
    random.seed(42)
    np.random.seed(42)
    
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2024, 10, 15)
    days_range = (end_date - start_date).days
    
    categories_products = {
        "Electronics": [
            ("Noise-Cancelling Headphones", 199.99, 45.0),
            ("Smart 4K Ultra TV", 799.00, 180.0),
            ("Ultra-Slim Laptop Pro", 1299.00, 310.0),
            ("Wireless Mechanical Keyboard", 89.50, 24.0),
            ("Smart Home Security Hub", 149.00, 38.0)
        ],
        "Home & Kitchen": [
            ("Espresso Machine Master", 299.00, 85.0),
            ("Ergonomic Office Chair", 249.00, 60.0),
            ("Cast Iron Cookware Set", 129.50, 40.0),
            ("Robot Vacuum Cleaner", 349.00, 95.0),
            ("Air Purifier HEPA Pro", 179.00, 48.0)
        ],
        "Apparel": [
            ("Waterproof Running Jacket", 89.00, 28.0),
            ("Performance Trail Shoes", 120.00, 35.0),
            ("Merino Wool Sweater", 95.00, 30.0),
            ("Commuter Travel Backpack", 75.00, 22.0)
        ],
        "Sports & Fitness": [
            ("Adjustable Dumbbell Set", 219.00, 65.0),
            ("Smart GPS Fitness Watch", 229.00, 70.0),
            ("Pro Yoga Mat & Block", 45.00, 16.0),
            ("Carbon Fiber Road Bicycle", 1450.00, 420.0)
        ]
    }
    
    regions = ["North America", "Europe", "Asia Pacific", "Latin America"]
    store_types = ["Supercenter", "Online Store", "Express Outlet", "Flagship Store"]
    customer_types = ["Consumer", "Corporate", "Small Business"]
    
    rows = []
    num_records = 350
    
    for i in range(num_records):
        rand_days = random.randint(0, days_range)
        date_val = (start_date + timedelta(days=rand_days)).strftime("%Y-%m-%d")
        
        category = random.choice(list(categories_products.keys()))
        product, base_price, base_profit = random.choice(categories_products[category])
        
        quantity = random.choices([1, 2, 3, 4, 5, 8], weights=[40, 25, 15, 10, 7, 3])[0]
        discount = random.choices([0.0, 0.05, 0.10, 0.15, 0.20], weights=[50, 20, 15, 10, 5])[0]
        
        unit_price = round(base_price * (1.0 + random.uniform(-0.08, 0.08)), 2)
        sales = round(unit_price * quantity * (1.0 - discount), 2)
        cost = round((unit_price - base_profit) * quantity, 2)
        profit = round(sales - cost, 2)
        
        rows.append({
            "Date": date_val,
            "Store Type": random.choice(store_types),
            "Region": random.choice(regions),
            "Category": category,
            "Product": product,
            "Sales": sales,
            "Profit": profit,
            "Quantity": quantity,
            "Discount": round(discount * 100, 1),
            "Customer Type": random.choice(customer_types)
        })
        
    return pd.DataFrame(rows)

def generate_ecommerce_orders() -> pd.DataFrame:
    random.seed(101)
    np.random.seed(101)
    
    cities_states = [
        ("New York", "NY"), ("Los Angeles", "CA"), ("Chicago", "IL"),
        ("Houston", "TX"), ("Seattle", "WA"), ("Austin", "TX"),
        ("Miami", "FL"), ("San Francisco", "CA"), ("Boston", "MA")
    ]
    
    segments = ["Consumer", "Corporate", "Home Office"]
    ship_modes = ["Standard Class", "Second Class", "First Class", "Same Day"]
    
    subcategories_map = {
        "Technology": ["Phones", "Laptops", "Accessories", "Printers"],
        "Furniture": ["Chairs", "Tables", "Bookcases", "Furnishings"],
        "Office Supplies": ["Storage", "Binders", "Paper", "Appliances", "Art"]
    }
    
    start_date = datetime(2024, 1, 1)
    rows = []
    
    for i in range(1, 401):
        order_id = f"ORD-2024-{1000 + i}"
        customer_id = f"CUST-{random.randint(100, 250)}"
        rand_days = random.randint(0, 280)
        order_date = (start_date + timedelta(days=rand_days)).strftime("%Y-%m-%d")
        
        city, state = random.choice(cities_states)
        category = random.choice(list(subcategories_map.keys()))
        subcategory = random.choice(subcategories_map[category])
        
        if category == "Technology":
            sales = round(random.uniform(150, 2400), 2)
            profit_margin = random.uniform(0.12, 0.35)
        elif category == "Furniture":
            sales = round(random.uniform(90, 1200), 2)
            profit_margin = random.uniform(-0.05, 0.22)  # Occasional negative margin
        else:
            sales = round(random.uniform(15, 450), 2)
            profit_margin = random.uniform(0.18, 0.45)
            
        discount = random.choices([0.0, 0.1, 0.15, 0.2, 0.25], weights=[60, 15, 12, 8, 5])[0]
        sales = round(sales * (1.0 - discount), 2)
        profit = round(sales * profit_margin, 2)
        qty = random.randint(1, 8)
        deliv_days = random.randint(1, 7)
        
        rows.append({
            "Order ID": order_id,
            "Order Date": order_date,
            "Customer ID": customer_id,
            "City": city,
            "State": state,
            "Country": "United States",
            "Segment": random.choice(segments),
            "Category": category,
            "Sub-Category": subcategory,
            "Sales": sales,
            "Quantity": qty,
            "Discount": round(discount * 100, 1),
            "Profit": profit,
            "Shipping Mode": random.choice(ship_modes),
            "Delivery Days": deliv_days
        })
        
    return pd.DataFrame(rows)

def generate_hr_analytics() -> pd.DataFrame:
    random.seed(202)
    np.random.seed(202)
    
    departments_roles = {
        "Engineering": ["Senior Software Engineer", "DevOps Engineer", "Frontend Specialist", "Engineering Manager", "Data Engineer"],
        "Product": ["Product Manager", "UI/UX Designer", "Technical Program Manager"],
        "Sales & Marketing": ["Account Executive", "Marketing Specialist", "Sales Director", "Growth Manager"],
        "Human Resources": ["HR Business Partner", "Talent Acquisition Specialist", "People Ops Lead"],
        "Finance": ["Senior Financial Analyst", "Controller", "Risk Analyst"]
    }
    
    education_fields = ["Computer Science", "Business Administration", "Marketing", "Life Sciences", "Economics", "Design"]
    first_names = ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Riley", "Cameron", "Avery", "Elena", "Marcus", "Siddharth", "Sophia", "Liam", "Mei", "Carlos", "Fatima"]
    last_names = ["Chen", "Smith", "Patel", "Johnson", "Williams", "Garcia", "Kim", "Miller", "Davis", "Rodriguez", "Martinez", "Wong", "Singh", "Brown"]
    
    rows = []
    for i in range(1, 301):
        emp_id = f"EMP-{2000 + i}"
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        dept = random.choice(list(departments_roles.keys()))
        role = random.choice(departments_roles[dept])
        
        age = random.randint(22, 58)
        years = min(random.randint(1, 15), max(1, age - 21))
        
        # Income correlates with role and years
        base_salary = 4800 if dept in ["Human Resources", "Sales & Marketing"] else 6200
        income = round(base_salary + (years * 650) + random.uniform(-400, 1800), -2)
        if "Manager" in role or "Director" in role or "Lead" in role:
            income += 3500
            
        rating = random.choices([3, 4, 5], weights=[25, 55, 20])[0]
        work_life = random.choices([1, 2, 3, 4], weights=[10, 30, 45, 15])[0]
        attrition = "Yes" if (work_life <= 2 and years <= 3 and random.random() < 0.35) else "No"
        
        rows.append({
            "Employee ID": emp_id,
            "Employee Name": name,
            "Department": dept,
            "Job Role": role,
            "Age": age,
            "Gender": random.choice(["Female", "Male", "Non-binary"]),
            "Monthly Income": float(income),
            "Years At Company": years,
            "Performance Rating": rating,
            "Work-Life Balance": work_life,
            "Attrition": attrition,
            "Education Field": random.choice(education_fields)
        })
        
    return pd.DataFrame(rows)

SAMPLE_CATALOG = [
    {
        "id": "sample_retail_sales",
        "name": "Retail Sales Performance",
        "filename": "retail_sales_synthetic.csv",
        "description": "Multi-region retail transaction data with categories, profit margins, discounts, and customer segments.",
        "icon": "ShoppingBag",
        "tags": ["Retail", "Sales", "Profit", "Time-series"],
        "generator": generate_retail_sales
    },
    {
        "id": "sample_ecommerce_orders",
        "name": "E-Commerce Global Orders",
        "filename": "ecommerce_orders_synthetic.csv",
        "description": "Customer order fulfillment tracking including delivery times, sub-category sales, and profit distribution.",
        "icon": "Truck",
        "tags": ["E-Commerce", "Logistics", "Customers", "Geography"],
        "generator": generate_ecommerce_orders
    },
    {
        "id": "sample_hr_analytics",
        "name": "HR Talent & Workforce Analytics",
        "filename": "hr_analytics_synthetic.csv",
        "description": "Workforce compensation, performance evaluation, attrition risk, and departmental retention metrics.",
        "icon": "Users2",
        "tags": ["HR", "Workforce", "Compensation", "Attrition"],
        "generator": generate_hr_analytics
    }
]
