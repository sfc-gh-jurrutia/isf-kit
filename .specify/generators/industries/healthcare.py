"""
Healthcare industry data generator.

Provides realistic healthcare-specific field values for:
- Patients, Providers, Encounters, Claims, Medications, etc.
"""

import random
from typing import Any, Optional

from ..generator import IndustryGenerator
from . import register_industry


@register_industry("healthcare")
@register_industry("healthcare & life sciences")
class HealthcareGenerator(IndustryGenerator):
    """
    Healthcare-specific data generator.
    
    Generates realistic:
    - Patient demographics
    - Provider information
    - Encounter/visit data
    - Diagnosis codes (ICD-10)
    - Procedure codes (CPT)
    - Insurance/payer information
    - Claim data
    """
    
    # ICD-10 Diagnosis Codes (common ones)
    DIAGNOSIS_CODES = [
        ("J18.9", "Pneumonia, unspecified organism"),
        ("I10", "Essential hypertension"),
        ("E11.9", "Type 2 diabetes without complications"),
        ("M54.5", "Low back pain"),
        ("F32.9", "Major depressive disorder"),
        ("J06.9", "Acute upper respiratory infection"),
        ("K21.0", "GERD with esophagitis"),
        ("N39.0", "Urinary tract infection"),
        ("R10.9", "Unspecified abdominal pain"),
        ("J45.909", "Unspecified asthma, uncomplicated"),
        ("G43.909", "Migraine, unspecified"),
        ("M79.3", "Panniculitis, unspecified"),
        ("R51", "Headache"),
        ("Z23", "Encounter for immunization"),
        ("Z00.00", "General adult medical examination"),
    ]
    
    # CPT Procedure Codes
    PROCEDURE_CODES = [
        ("99213", "Office visit, established patient, low complexity"),
        ("99214", "Office visit, established patient, moderate complexity"),
        ("99215", "Office visit, established patient, high complexity"),
        ("99203", "Office visit, new patient, low complexity"),
        ("99204", "Office visit, new patient, moderate complexity"),
        ("99281", "Emergency department visit, minor"),
        ("99283", "Emergency department visit, moderate"),
        ("99285", "Emergency department visit, high severity"),
        ("36415", "Venipuncture"),
        ("85025", "Complete blood count"),
        ("80053", "Comprehensive metabolic panel"),
        ("71046", "Chest X-ray, 2 views"),
        ("93000", "Electrocardiogram"),
        ("90715", "Tdap vaccine"),
        ("96372", "Therapeutic injection"),
    ]
    
    DEPARTMENTS = [
        "Emergency",
        "Internal Medicine",
        "Cardiology",
        "Oncology",
        "Orthopedics",
        "Pediatrics",
        "Neurology",
        "Pulmonology",
        "Gastroenterology",
        "Dermatology",
        "Psychiatry",
        "OB/GYN",
        "Urology",
        "Radiology",
        "Surgery",
    ]
    
    SPECIALTIES = [
        "Family Medicine",
        "Internal Medicine",
        "Cardiology",
        "Oncology",
        "Orthopedic Surgery",
        "Pediatrics",
        "Neurology",
        "Emergency Medicine",
        "Psychiatry",
        "General Surgery",
        "Anesthesiology",
        "Radiology",
        "Pathology",
        "Dermatology",
        "Ophthalmology",
    ]
    
    INSURANCE_TYPES = [
        ("Medicare", 0.35),
        ("Medicaid", 0.15),
        ("Commercial", 0.40),
        ("Self-Pay", 0.08),
        ("Other", 0.02),
    ]
    
    INSURANCE_PAYERS = [
        "Medicare",
        "Medicaid",
        "Blue Cross Blue Shield",
        "Aetna",
        "UnitedHealthcare",
        "Cigna",
        "Humana",
        "Kaiser Permanente",
        "Anthem",
        "Self-Pay",
    ]
    
    ENCOUNTER_TYPES = [
        ("Outpatient", 0.60),
        ("Inpatient", 0.15),
        ("Emergency", 0.15),
        ("Observation", 0.05),
        ("Telehealth", 0.05),
    ]
    
    CLAIM_STATUSES = [
        ("Paid", 0.70),
        ("Pending", 0.15),
        ("Denied", 0.10),
        ("Appealed", 0.05),
    ]
    
    DISCHARGE_DISPOSITIONS = [
        ("Home", 0.75),
        ("SNF", 0.10),
        ("Rehab", 0.05),
        ("Home Health", 0.05),
        ("AMA", 0.02),
        ("Expired", 0.01),
        ("Transfer", 0.02),
    ]
    
    MEDICATIONS = [
        ("Lisinopril", "ACE Inhibitor", "Hypertension"),
        ("Metformin", "Biguanide", "Type 2 Diabetes"),
        ("Atorvastatin", "Statin", "Hyperlipidemia"),
        ("Omeprazole", "PPI", "GERD"),
        ("Amlodipine", "Calcium Channel Blocker", "Hypertension"),
        ("Metoprolol", "Beta Blocker", "Hypertension"),
        ("Albuterol", "Bronchodilator", "Asthma/COPD"),
        ("Gabapentin", "Anticonvulsant", "Neuropathy"),
        ("Sertraline", "SSRI", "Depression"),
        ("Levothyroxine", "Thyroid Hormone", "Hypothyroidism"),
        ("Hydrochlorothiazide", "Diuretic", "Hypertension"),
        ("Losartan", "ARB", "Hypertension"),
        ("Prednisone", "Corticosteroid", "Inflammation"),
        ("Ibuprofen", "NSAID", "Pain"),
        ("Acetaminophen", "Analgesic", "Pain/Fever"),
    ]
    
    def generate_field(
        self,
        entity_name: str,
        field_name: str,
        field_type: str,
    ) -> Any:
        """Generate healthcare-specific field values."""
        entity = entity_name.lower()
        field = field_name.lower()
        
        # Patient fields
        if entity == "patients":
            if field == "gender" or field == "sex":
                return random.choice(["M", "F"])
            elif field == "insurance_type":
                return self._weighted_choice(self.INSURANCE_TYPES)
            elif field == "risk_score":
                return round(random.uniform(0, 1), 3)
            elif field == "blood_type":
                return random.choice(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        
        # Provider fields
        elif entity == "providers":
            if field == "specialty":
                return random.choice(self.SPECIALTIES)
            elif field == "department":
                return random.choice(self.DEPARTMENTS)
            elif field == "npi":
                return f"{random.randint(1000000000, 9999999999)}"
        
        # Encounter fields
        elif entity == "encounters":
            if field == "department":
                return random.choice(self.DEPARTMENTS)
            elif field == "encounter_type" or field == "visit_type":
                return self._weighted_choice(self.ENCOUNTER_TYPES)
            elif field == "diagnosis_code" or field == "primary_diagnosis":
                return random.choice(self.DIAGNOSIS_CODES)[0]
            elif field == "diagnosis_description":
                return random.choice(self.DIAGNOSIS_CODES)[1]
            elif field == "procedure_code":
                return random.choice(self.PROCEDURE_CODES)[0]
            elif field == "procedure_description":
                return random.choice(self.PROCEDURE_CODES)[1]
            elif field == "length_of_stay" or field == "los":
                return random.randint(1, 14)
            elif field == "discharge_disposition":
                return self._weighted_choice(self.DISCHARGE_DISPOSITIONS)
            elif field == "cost" or field == "total_cost":
                return round(random.uniform(100, 50000), 2)
            elif field == "charge" or field == "total_charge":
                return round(random.uniform(150, 75000), 2)
        
        # Claim fields
        elif entity == "claims":
            if field == "status" or field == "claim_status":
                return self._weighted_choice(self.CLAIM_STATUSES)
            elif field == "payer" or field == "insurance_payer":
                return random.choice(self.INSURANCE_PAYERS)
            elif field == "amount" or field == "claim_amount":
                return round(random.uniform(50, 25000), 2)
            elif field == "paid_amount":
                return round(random.uniform(25, 20000), 2)
            elif field == "denied_reason":
                return random.choice([
                    "Missing information",
                    "Not medically necessary",
                    "Out of network",
                    "Pre-authorization required",
                    "Duplicate claim",
                    None, None, None  # Most claims don't have denial reason
                ])
        
        # Medication fields
        elif entity == "medications":
            med = random.choice(self.MEDICATIONS)
            if field == "medication_name" or field == "drug_name":
                return med[0]
            elif field == "drug_class":
                return med[1]
            elif field == "indication":
                return med[2]
            elif field == "dosage":
                return random.choice(["10mg", "20mg", "25mg", "50mg", "100mg", "250mg", "500mg"])
            elif field == "frequency":
                return random.choice(["QD", "BID", "TID", "QID", "PRN", "QHS"])
        
        return None
    
    def generate_field_sql(
        self,
        entity_name: str,
        field_name: str,
        field_type: str,
    ) -> Optional[str]:
        """Generate SQL expressions for healthcare fields."""
        entity = entity_name.lower()
        field = field_name.lower()
        
        # Patient fields
        if entity == "patients":
            if field == "gender" or field == "sex":
                return "ARRAY_CONSTRUCT('M', 'F')[UNIFORM(0, 1, RANDOM())]"
            elif field == "insurance_type":
                return self._weighted_enum_sql(self.INSURANCE_TYPES)
            elif field == "risk_score":
                return "ROUND(UNIFORM(0::FLOAT, 1::FLOAT, RANDOM()), 3)"
            elif field == "blood_type":
                return "ARRAY_CONSTRUCT('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')[UNIFORM(0, 7, RANDOM())]"
        
        # Provider fields
        elif entity == "providers":
            if field == "specialty":
                return self._enum_sql(self.SPECIALTIES)
            elif field == "department":
                return self._enum_sql(self.DEPARTMENTS)
            elif field == "npi":
                return "UNIFORM(1000000000, 9999999999, RANDOM())::STRING"
        
        # Encounter fields
        elif entity == "encounters":
            if field == "department":
                return self._enum_sql(self.DEPARTMENTS)
            elif field == "encounter_type" or field == "visit_type":
                return self._weighted_enum_sql(self.ENCOUNTER_TYPES)
            elif field == "diagnosis_code" or field == "primary_diagnosis":
                codes = [c[0] for c in self.DIAGNOSIS_CODES]
                return self._enum_sql(codes)
            elif field == "procedure_code":
                codes = [c[0] for c in self.PROCEDURE_CODES]
                return self._enum_sql(codes)
            elif field == "length_of_stay" or field == "los":
                return "UNIFORM(1, 14, RANDOM())"
            elif field == "discharge_disposition":
                return self._weighted_enum_sql(self.DISCHARGE_DISPOSITIONS)
            elif field == "cost" or field == "total_cost":
                return "ROUND(UNIFORM(100::FLOAT, 50000::FLOAT, RANDOM()), 2)"
            elif field == "charge" or field == "total_charge":
                return "ROUND(UNIFORM(150::FLOAT, 75000::FLOAT, RANDOM()), 2)"
        
        # Claim fields
        elif entity == "claims":
            if field == "status" or field == "claim_status":
                return self._weighted_enum_sql(self.CLAIM_STATUSES)
            elif field == "payer" or field == "insurance_payer":
                return self._enum_sql(self.INSURANCE_PAYERS)
            elif field == "amount" or field == "claim_amount":
                return "ROUND(UNIFORM(50::FLOAT, 25000::FLOAT, RANDOM()), 2)"
            elif field == "paid_amount":
                return "ROUND(UNIFORM(25::FLOAT, 20000::FLOAT, RANDOM()), 2)"
        
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
        # Build CASE statement based on cumulative weights
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
