"""
Retail industry data generator.

Provides realistic retail-specific field values for:
- Customers, Products, Orders, Stores, Inventory, etc.
"""

import random
from typing import Any, Optional

from ..generator import IndustryGenerator
from . import register_industry


@register_industry("retail")
@register_industry("retail & cpg")
class RetailGenerator(IndustryGenerator):
    """
    Retail-specific data generator.
    
    Generates realistic:
    - Customer segments and demographics
    - Product catalogs and categories
    - Orders and order items
    - Store locations
    - Inventory data
    - Promotions and discounts
    """
    
    PRODUCT_CATEGORIES = [
        ("Electronics", 0.20),
        ("Clothing", 0.18),
        ("Home & Garden", 0.15),
        ("Sports & Outdoors", 0.10),
        ("Beauty & Personal Care", 0.10),
        ("Food & Grocery", 0.08),
        ("Toys & Games", 0.07),
        ("Books & Media", 0.05),
        ("Health & Wellness", 0.04),
        ("Office Supplies", 0.03),
    ]
    
    PRODUCT_SUBCATEGORIES = {
        "Electronics": ["Smartphones", "Laptops", "TVs", "Audio", "Cameras", "Wearables", "Accessories"],
        "Clothing": ["Men's Apparel", "Women's Apparel", "Kids' Clothing", "Shoes", "Accessories", "Activewear"],
        "Home & Garden": ["Furniture", "Kitchen", "Bedding", "Decor", "Garden", "Tools", "Storage"],
        "Sports & Outdoors": ["Fitness", "Camping", "Cycling", "Water Sports", "Team Sports", "Golf"],
        "Beauty & Personal Care": ["Skincare", "Makeup", "Hair Care", "Fragrance", "Bath & Body"],
        "Food & Grocery": ["Snacks", "Beverages", "Pantry", "Fresh", "Frozen", "Organic"],
        "Toys & Games": ["Action Figures", "Board Games", "Video Games", "Dolls", "Building Sets", "Outdoor Toys"],
    }
    
    BRANDS = [
        "Apex", "Zenith", "Nova", "Stellar", "Prime", "Elite", "Vertex", "Quantum",
        "Fusion", "Vanguard", "Summit", "Horizon", "Titan", "Nexus", "Pinnacle",
        "Aurora", "Eclipse", "Radiant", "Velocity", "Precision", "Heritage", "Legacy",
    ]
    
    CUSTOMER_SEGMENTS = [
        ("Premium", 0.15),
        ("Loyal", 0.25),
        ("Regular", 0.35),
        ("Occasional", 0.20),
        ("New", 0.05),
    ]
    
    CUSTOMER_TIERS = [
        ("Platinum", 0.05),
        ("Gold", 0.15),
        ("Silver", 0.30),
        ("Bronze", 0.50),
    ]
    
    ORDER_STATUSES = [
        ("Delivered", 0.75),
        ("Shipped", 0.10),
        ("Processing", 0.08),
        ("Pending", 0.04),
        ("Cancelled", 0.02),
        ("Returned", 0.01),
    ]
    
    PAYMENT_METHODS = [
        ("Credit Card", 0.45),
        ("Debit Card", 0.25),
        ("PayPal", 0.15),
        ("Apple Pay", 0.08),
        ("Gift Card", 0.05),
        ("Buy Now Pay Later", 0.02),
    ]
    
    SHIPPING_METHODS = [
        ("Standard", 0.50),
        ("Express", 0.30),
        ("Next Day", 0.12),
        ("Same Day", 0.05),
        ("Store Pickup", 0.03),
    ]
    
    STORE_TYPES = [
        ("Flagship", 0.05),
        ("Mall", 0.30),
        ("Standalone", 0.35),
        ("Outlet", 0.15),
        ("Pop-up", 0.05),
        ("Warehouse", 0.10),
    ]
    
    REGIONS = [
        ("Northeast", 0.20),
        ("Southeast", 0.22),
        ("Midwest", 0.18),
        ("Southwest", 0.15),
        ("West", 0.25),
    ]
    
    INVENTORY_STATUSES = [
        ("In Stock", 0.70),
        ("Low Stock", 0.15),
        ("Out of Stock", 0.08),
        ("Backordered", 0.05),
        ("Discontinued", 0.02),
    ]
    
    PROMOTION_TYPES = [
        "Percentage Off",
        "Dollar Off",
        "BOGO",
        "Free Shipping",
        "Bundle Deal",
        "Flash Sale",
        "Clearance",
        "Loyalty Reward",
    ]
    
    RETURN_REASONS = [
        "Wrong size",
        "Defective product",
        "Not as described",
        "Changed mind",
        "Better price elsewhere",
        "Arrived late",
        "Wrong item received",
        "Quality not as expected",
    ]
    
    def generate_field(
        self,
        entity_name: str,
        field_name: str,
        field_type: str,
    ) -> Any:
        """Generate retail-specific field values."""
        entity = entity_name.lower()
        field = field_name.lower()
        
        # Customer fields
        if entity == "customers":
            if field == "segment" or field == "customer_segment":
                return self._weighted_choice(self.CUSTOMER_SEGMENTS)
            elif field == "tier" or field == "loyalty_tier":
                return self._weighted_choice(self.CUSTOMER_TIERS)
            elif field == "lifetime_value" or field == "ltv":
                return round(random.uniform(100, 50000), 2)
            elif field == "total_orders":
                return random.randint(1, 200)
            elif field == "avg_order_value":
                return round(random.uniform(25, 500), 2)
            elif field == "preferred_category":
                return self._weighted_choice(self.PRODUCT_CATEGORIES)
            elif field == "region":
                return self._weighted_choice(self.REGIONS)
        
        # Product fields
        elif entity == "products":
            if field == "category":
                return self._weighted_choice(self.PRODUCT_CATEGORIES)
            elif field == "subcategory":
                category = random.choice(list(self.PRODUCT_SUBCATEGORIES.keys()))
                return random.choice(self.PRODUCT_SUBCATEGORIES[category])
            elif field == "brand":
                return random.choice(self.BRANDS)
            elif field == "price" or field == "unit_price":
                return round(random.uniform(5, 1000), 2)
            elif field == "cost" or field == "unit_cost":
                return round(random.uniform(2, 600), 2)
            elif field == "margin":
                return round(random.uniform(0.15, 0.65), 2)
            elif field == "sku":
                return f"SKU-{random.randint(100000, 999999)}"
            elif field == "upc":
                return f"{random.randint(100000000000, 999999999999)}"
            elif field == "weight":
                return round(random.uniform(0.1, 50), 2)
            elif field == "rating" or field == "avg_rating":
                return round(random.uniform(2.5, 5.0), 1)
            elif field == "review_count":
                return random.randint(0, 5000)
        
        # Order fields
        elif entity == "orders":
            if field == "status" or field == "order_status":
                return self._weighted_choice(self.ORDER_STATUSES)
            elif field == "total" or field == "order_total":
                return round(random.uniform(15, 2000), 2)
            elif field == "subtotal":
                return round(random.uniform(12, 1800), 2)
            elif field == "tax":
                return round(random.uniform(1, 200), 2)
            elif field == "shipping_cost":
                return round(random.uniform(0, 50), 2)
            elif field == "discount" or field == "discount_amount":
                return round(random.uniform(0, 100), 2)
            elif field == "payment_method":
                return self._weighted_choice(self.PAYMENT_METHODS)
            elif field == "shipping_method":
                return self._weighted_choice(self.SHIPPING_METHODS)
            elif field == "item_count":
                return random.randint(1, 15)
            elif field == "channel":
                return random.choice(["Web", "Mobile App", "In-Store", "Phone", "Marketplace"])
        
        # Order items fields
        elif entity in ("order_items", "orderitems", "line_items"):
            if field == "quantity":
                return random.randint(1, 5)
            elif field == "unit_price":
                return round(random.uniform(5, 500), 2)
            elif field == "discount":
                return round(random.uniform(0, 50), 2)
            elif field == "total" or field == "line_total":
                return round(random.uniform(5, 1000), 2)
        
        # Store fields
        elif entity == "stores":
            if field == "store_type" or field == "type":
                return self._weighted_choice(self.STORE_TYPES)
            elif field == "region":
                return self._weighted_choice(self.REGIONS)
            elif field == "square_footage" or field == "size":
                return random.randint(5000, 150000)
            elif field == "employee_count":
                return random.randint(10, 200)
            elif field == "annual_revenue":
                return round(random.uniform(500000, 50000000), 2)
        
        # Inventory fields
        elif entity == "inventory":
            if field == "quantity" or field == "quantity_on_hand":
                return random.randint(0, 1000)
            elif field == "reorder_point":
                return random.randint(10, 100)
            elif field == "reorder_quantity":
                return random.randint(50, 500)
            elif field == "status" or field == "inventory_status":
                return self._weighted_choice(self.INVENTORY_STATUSES)
            elif field == "days_of_supply":
                return random.randint(0, 90)
        
        return None
    
    def generate_field_sql(
        self,
        entity_name: str,
        field_name: str,
        field_type: str,
    ) -> Optional[str]:
        """Generate SQL expressions for retail fields."""
        entity = entity_name.lower()
        field = field_name.lower()
        
        # Customer fields
        if entity == "customers":
            if field == "segment" or field == "customer_segment":
                return self._weighted_enum_sql(self.CUSTOMER_SEGMENTS)
            elif field == "tier" or field == "loyalty_tier":
                return self._weighted_enum_sql(self.CUSTOMER_TIERS)
            elif field == "lifetime_value" or field == "ltv":
                return "ROUND(UNIFORM(100::FLOAT, 50000::FLOAT, RANDOM()), 2)"
            elif field == "total_orders":
                return "UNIFORM(1, 200, RANDOM())"
            elif field == "avg_order_value":
                return "ROUND(UNIFORM(25::FLOAT, 500::FLOAT, RANDOM()), 2)"
            elif field == "region":
                return self._weighted_enum_sql(self.REGIONS)
        
        # Product fields
        elif entity == "products":
            if field == "category":
                return self._weighted_enum_sql(self.PRODUCT_CATEGORIES)
            elif field == "brand":
                return self._enum_sql(self.BRANDS)
            elif field == "price" or field == "unit_price":
                return "ROUND(UNIFORM(5::FLOAT, 1000::FLOAT, RANDOM()), 2)"
            elif field == "cost" or field == "unit_cost":
                return "ROUND(UNIFORM(2::FLOAT, 600::FLOAT, RANDOM()), 2)"
            elif field == "sku":
                return "'SKU-' || UNIFORM(100000, 999999, RANDOM())::STRING"
            elif field == "rating" or field == "avg_rating":
                return "ROUND(UNIFORM(2.5::FLOAT, 5.0::FLOAT, RANDOM()), 1)"
            elif field == "review_count":
                return "UNIFORM(0, 5000, RANDOM())"
        
        # Order fields
        elif entity == "orders":
            if field == "status" or field == "order_status":
                return self._weighted_enum_sql(self.ORDER_STATUSES)
            elif field == "total" or field == "order_total":
                return "ROUND(UNIFORM(15::FLOAT, 2000::FLOAT, RANDOM()), 2)"
            elif field == "payment_method":
                return self._weighted_enum_sql(self.PAYMENT_METHODS)
            elif field == "shipping_method":
                return self._weighted_enum_sql(self.SHIPPING_METHODS)
            elif field == "item_count":
                return "UNIFORM(1, 15, RANDOM())"
            elif field == "channel":
                return "ARRAY_CONSTRUCT('Web', 'Mobile App', 'In-Store', 'Phone', 'Marketplace')[UNIFORM(0, 4, RANDOM())]"
        
        # Store fields
        elif entity == "stores":
            if field == "store_type" or field == "type":
                return self._weighted_enum_sql(self.STORE_TYPES)
            elif field == "region":
                return self._weighted_enum_sql(self.REGIONS)
            elif field == "square_footage" or field == "size":
                return "UNIFORM(5000, 150000, RANDOM())"
            elif field == "employee_count":
                return "UNIFORM(10, 200, RANDOM())"
        
        # Inventory fields
        elif entity == "inventory":
            if field == "quantity" or field == "quantity_on_hand":
                return "UNIFORM(0, 1000, RANDOM())"
            elif field == "status" or field == "inventory_status":
                return self._weighted_enum_sql(self.INVENTORY_STATUSES)
        
        return None
    
    def _weighted_choice(self, options: list[tuple[str, float]]) -> str:
        """Select from weighted options."""
        values = [o[0] for o in options]
        weights = [o[1] for o in options]
        return random.choices(values, weights=weights)[0]
    
    def _enum_sql(self, values: list[str]) -> str:
        """Generate SQL for random enum selection."""
        values_sql = ", ".join([f"'{v}'" for v in values])
        return f"ARRAY_CONSTRUCT({values_sql})[UNIFORM(0, {len(values)-1}, RANDOM())]"
    
    def _weighted_enum_sql(self, options: list[tuple[str, float]]) -> str:
        """Generate SQL for weighted enum selection."""
        lines = ["CASE"]
        cumulative = 0
        rand_var = "UNIFORM(0, 100, RANDOM())"
        
        for i, (value, weight) in enumerate(options):
            cumulative += weight * 100
            if i < len(options) - 1:
                lines.append(f"    WHEN {rand_var} < {cumulative:.0f} THEN '{value}'")
            else:
                lines.append(f"    ELSE '{value}'")
        
        lines.append("END")
        return "\n".join(lines)
