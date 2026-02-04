"""
Financial Services industry data generator.

Provides realistic financial-specific field values for:
- Customers, Accounts, Transactions, Products, Holdings, etc.
"""

import random
from typing import Any, Optional

from ..generator import IndustryGenerator
from . import register_industry


@register_industry("financial")
@register_industry("financial services")
@register_industry("finance")
@register_industry("banking")
class FinancialGenerator(IndustryGenerator):
    """
    Financial services-specific data generator.
    
    Generates realistic:
    - Customer profiles and risk ratings
    - Account types and balances
    - Transaction data
    - Investment products and holdings
    - Loan data
    - Fraud indicators
    """
    
    CUSTOMER_SEGMENTS = [
        ("High Net Worth", 0.05),
        ("Affluent", 0.15),
        ("Mass Affluent", 0.25),
        ("Mass Market", 0.45),
        ("Emerging", 0.10),
    ]
    
    RISK_RATINGS = [
        ("Low", 0.50),
        ("Medium", 0.35),
        ("High", 0.12),
        ("Critical", 0.03),
    ]
    
    CREDIT_SCORES = [
        ("Excellent", 750, 850, 0.20),
        ("Good", 700, 749, 0.30),
        ("Fair", 650, 699, 0.25),
        ("Poor", 550, 649, 0.18),
        ("Very Poor", 300, 549, 0.07),
    ]
    
    ACCOUNT_TYPES = [
        ("Checking", 0.35),
        ("Savings", 0.25),
        ("Money Market", 0.10),
        ("Certificate of Deposit", 0.08),
        ("Investment", 0.12),
        ("Retirement", 0.08),
        ("Credit Card", 0.02),
    ]
    
    ACCOUNT_STATUSES = [
        ("Active", 0.85),
        ("Dormant", 0.08),
        ("Frozen", 0.03),
        ("Closed", 0.04),
    ]
    
    TRANSACTION_TYPES = [
        ("Deposit", 0.20),
        ("Withdrawal", 0.18),
        ("Transfer", 0.22),
        ("Payment", 0.15),
        ("Purchase", 0.12),
        ("Fee", 0.05),
        ("Interest", 0.04),
        ("Dividend", 0.02),
        ("Refund", 0.02),
    ]
    
    TRANSACTION_CHANNELS = [
        ("Online Banking", 0.35),
        ("Mobile App", 0.30),
        ("ATM", 0.15),
        ("Branch", 0.10),
        ("Phone", 0.05),
        ("Wire", 0.03),
        ("ACH", 0.02),
    ]
    
    MERCHANT_CATEGORIES = [
        ("Retail", 0.25),
        ("Grocery", 0.18),
        ("Restaurants", 0.15),
        ("Gas Stations", 0.10),
        ("Utilities", 0.08),
        ("Entertainment", 0.07),
        ("Travel", 0.06),
        ("Healthcare", 0.05),
        ("Insurance", 0.03),
        ("Other", 0.03),
    ]
    
    PRODUCT_TYPES = [
        ("Mutual Fund", 0.30),
        ("ETF", 0.25),
        ("Stock", 0.20),
        ("Bond", 0.12),
        ("Money Market Fund", 0.08),
        ("Alternative", 0.03),
        ("Structured Product", 0.02),
    ]
    
    ASSET_CLASSES = [
        ("Equities", 0.40),
        ("Fixed Income", 0.30),
        ("Cash", 0.15),
        ("Real Estate", 0.08),
        ("Commodities", 0.04),
        ("Alternatives", 0.03),
    ]
    
    LOAN_TYPES = [
        ("Mortgage", 0.35),
        ("Auto", 0.25),
        ("Personal", 0.20),
        ("Student", 0.10),
        ("Business", 0.07),
        ("Home Equity", 0.03),
    ]
    
    LOAN_STATUSES = [
        ("Current", 0.80),
        ("30 Days Late", 0.10),
        ("60 Days Late", 0.05),
        ("90+ Days Late", 0.03),
        ("Default", 0.02),
    ]
    
    FRAUD_FLAGS = [
        ("None", 0.97),
        ("Suspicious", 0.02),
        ("Confirmed Fraud", 0.01),
    ]
    
    CURRENCIES = [
        ("USD", 0.70),
        ("EUR", 0.12),
        ("GBP", 0.08),
        ("CAD", 0.05),
        ("JPY", 0.03),
        ("CHF", 0.02),
    ]
    
    BRANCHES = [
        "Main Street", "Downtown", "Northside", "Southgate", "Westfield",
        "Eastview", "Central", "Riverside", "Lakeside", "Hillcrest",
        "Oakwood", "Pinewood", "Cedar Grove", "Maple Heights", "Valley View",
    ]
    
    def generate_field(
        self,
        entity_name: str,
        field_name: str,
        field_type: str,
    ) -> Any:
        """Generate financial-specific field values."""
        entity = entity_name.lower()
        field = field_name.lower()
        
        # Customer fields
        if entity == "customers":
            if field == "segment" or field == "customer_segment":
                return self._weighted_choice(self.CUSTOMER_SEGMENTS)
            elif field == "risk_rating" or field == "risk_level":
                return self._weighted_choice(self.RISK_RATINGS)
            elif field == "credit_score":
                score_range = self._weighted_choice_full(self.CREDIT_SCORES)
                return random.randint(score_range[1], score_range[2])
            elif field == "credit_rating":
                return self._weighted_choice_full(self.CREDIT_SCORES)[0]
            elif field == "annual_income":
                return round(random.uniform(25000, 500000), 2)
            elif field == "net_worth":
                return round(random.uniform(10000, 5000000), 2)
            elif field == "aum" or field == "assets_under_management":
                return round(random.uniform(10000, 10000000), 2)
            elif field == "tenure_years":
                return random.randint(0, 30)
            elif field == "preferred_channel":
                return self._weighted_choice(self.TRANSACTION_CHANNELS)
        
        # Account fields
        elif entity == "accounts":
            if field == "account_type" or field == "type":
                return self._weighted_choice(self.ACCOUNT_TYPES)
            elif field == "status" or field == "account_status":
                return self._weighted_choice(self.ACCOUNT_STATUSES)
            elif field == "balance" or field == "current_balance":
                return round(random.uniform(0, 500000), 2)
            elif field == "available_balance":
                return round(random.uniform(0, 450000), 2)
            elif field == "interest_rate" or field == "apy":
                return round(random.uniform(0.01, 5.5), 2)
            elif field == "currency":
                return self._weighted_choice(self.CURRENCIES)
            elif field == "branch":
                return random.choice(self.BRANCHES)
            elif field == "overdraft_protection":
                return random.choice([True, False])
        
        # Transaction fields
        elif entity == "transactions":
            if field == "transaction_type" or field == "type":
                return self._weighted_choice(self.TRANSACTION_TYPES)
            elif field == "amount":
                return round(random.uniform(1, 10000), 2)
            elif field == "channel":
                return self._weighted_choice(self.TRANSACTION_CHANNELS)
            elif field == "merchant_category" or field == "category":
                return self._weighted_choice(self.MERCHANT_CATEGORIES)
            elif field == "merchant_name":
                return f"Merchant_{random.randint(1000, 9999)}"
            elif field == "currency":
                return self._weighted_choice(self.CURRENCIES)
            elif field == "fraud_flag" or field == "is_fraud":
                flag = self._weighted_choice(self.FRAUD_FLAGS)
                if field == "is_fraud":
                    return flag == "Confirmed Fraud"
                return flag
            elif field == "status" or field == "transaction_status":
                return random.choice(["Completed", "Pending", "Failed", "Reversed"])
            elif field == "reference_number":
                return f"TXN{random.randint(100000000, 999999999)}"
        
        # Product/Investment fields
        elif entity in ("products", "investments"):
            if field == "product_type" or field == "type":
                return self._weighted_choice(self.PRODUCT_TYPES)
            elif field == "asset_class":
                return self._weighted_choice(self.ASSET_CLASSES)
            elif field == "ticker" or field == "symbol":
                letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                return "".join(random.choices(letters, k=random.randint(3, 4)))
            elif field == "expense_ratio":
                return round(random.uniform(0.03, 2.0), 2)
            elif field == "yield" or field == "dividend_yield":
                return round(random.uniform(0, 8), 2)
            elif field == "nav" or field == "price":
                return round(random.uniform(10, 500), 2)
            elif field == "aum":
                return round(random.uniform(1000000, 50000000000), 2)
            elif field == "risk_level":
                return random.choice(["Conservative", "Moderate", "Aggressive"])
        
        # Holdings fields
        elif entity == "holdings":
            if field == "units" or field == "shares":
                return round(random.uniform(1, 10000), 4)
            elif field == "market_value":
                return round(random.uniform(100, 1000000), 2)
            elif field == "cost_basis":
                return round(random.uniform(50, 800000), 2)
            elif field == "gain_loss":
                return round(random.uniform(-100000, 200000), 2)
            elif field == "gain_loss_pct":
                return round(random.uniform(-50, 100), 2)
        
        # Loan fields
        elif entity == "loans":
            if field == "loan_type" or field == "type":
                return self._weighted_choice(self.LOAN_TYPES)
            elif field == "status" or field == "loan_status":
                return self._weighted_choice(self.LOAN_STATUSES)
            elif field == "principal" or field == "original_amount":
                return round(random.uniform(5000, 500000), 2)
            elif field == "balance" or field == "current_balance":
                return round(random.uniform(1000, 450000), 2)
            elif field == "interest_rate" or field == "apr":
                return round(random.uniform(3.0, 25.0), 2)
            elif field == "term_months":
                return random.choice([12, 24, 36, 48, 60, 84, 120, 180, 240, 360])
            elif field == "monthly_payment":
                return round(random.uniform(100, 5000), 2)
            elif field == "ltv" or field == "loan_to_value":
                return round(random.uniform(50, 100), 1)
        
        return None
    
    def generate_field_sql(
        self,
        entity_name: str,
        field_name: str,
        field_type: str,
    ) -> Optional[str]:
        """Generate SQL expressions for financial fields."""
        entity = entity_name.lower()
        field = field_name.lower()
        
        # Customer fields
        if entity == "customers":
            if field == "segment" or field == "customer_segment":
                return self._weighted_enum_sql(self.CUSTOMER_SEGMENTS)
            elif field == "risk_rating" or field == "risk_level":
                return self._weighted_enum_sql(self.RISK_RATINGS)
            elif field == "credit_score":
                return "UNIFORM(300, 850, RANDOM())"
            elif field == "annual_income":
                return "ROUND(UNIFORM(25000::FLOAT, 500000::FLOAT, RANDOM()), 2)"
            elif field == "net_worth":
                return "ROUND(UNIFORM(10000::FLOAT, 5000000::FLOAT, RANDOM()), 2)"
            elif field == "aum" or field == "assets_under_management":
                return "ROUND(UNIFORM(10000::FLOAT, 10000000::FLOAT, RANDOM()), 2)"
            elif field == "tenure_years":
                return "UNIFORM(0, 30, RANDOM())"
        
        # Account fields
        elif entity == "accounts":
            if field == "account_type" or field == "type":
                return self._weighted_enum_sql(self.ACCOUNT_TYPES)
            elif field == "status" or field == "account_status":
                return self._weighted_enum_sql(self.ACCOUNT_STATUSES)
            elif field == "balance" or field == "current_balance":
                return "ROUND(UNIFORM(0::FLOAT, 500000::FLOAT, RANDOM()), 2)"
            elif field == "interest_rate" or field == "apy":
                return "ROUND(UNIFORM(0.01::FLOAT, 5.5::FLOAT, RANDOM()), 2)"
            elif field == "currency":
                return self._weighted_enum_sql(self.CURRENCIES)
            elif field == "branch":
                return self._enum_sql(self.BRANCHES)
        
        # Transaction fields
        elif entity == "transactions":
            if field == "transaction_type" or field == "type":
                return self._weighted_enum_sql(self.TRANSACTION_TYPES)
            elif field == "amount":
                return "ROUND(UNIFORM(1::FLOAT, 10000::FLOAT, RANDOM()), 2)"
            elif field == "channel":
                return self._weighted_enum_sql(self.TRANSACTION_CHANNELS)
            elif field == "merchant_category" or field == "category":
                return self._weighted_enum_sql(self.MERCHANT_CATEGORIES)
            elif field == "fraud_flag":
                return self._weighted_enum_sql(self.FRAUD_FLAGS)
            elif field == "is_fraud":
                return "UNIFORM(0, 100, RANDOM()) < 1"  # 1% fraud rate
            elif field == "reference_number":
                return "'TXN' || UNIFORM(100000000, 999999999, RANDOM())::STRING"
        
        # Loan fields
        elif entity == "loans":
            if field == "loan_type" or field == "type":
                return self._weighted_enum_sql(self.LOAN_TYPES)
            elif field == "status" or field == "loan_status":
                return self._weighted_enum_sql(self.LOAN_STATUSES)
            elif field == "principal" or field == "original_amount":
                return "ROUND(UNIFORM(5000::FLOAT, 500000::FLOAT, RANDOM()), 2)"
            elif field == "interest_rate" or field == "apr":
                return "ROUND(UNIFORM(3.0::FLOAT, 25.0::FLOAT, RANDOM()), 2)"
            elif field == "term_months":
                return "ARRAY_CONSTRUCT(12, 24, 36, 48, 60, 84, 120, 180, 240, 360)[UNIFORM(0, 9, RANDOM())]"
        
        return None
    
    def _weighted_choice(self, options: list[tuple[str, float]]) -> str:
        """Select from weighted options."""
        values = [o[0] for o in options]
        weights = [o[1] for o in options]
        return random.choices(values, weights=weights)[0]
    
    def _weighted_choice_full(self, options: list[tuple]) -> tuple:
        """Select full tuple from weighted options (for credit scores with ranges)."""
        weights = [o[-1] for o in options]
        return random.choices(options, weights=weights)[0]
    
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
