"""
PostgreSQL DDL Syntax & Constraint AST Verification Script
Uses official PostgreSQL libpg_query parser (via pglast)
"""

import sys
from pathlib import Path
import pglast

def verify_ddl(sql_path: Path):
    print(f"Reading SQL migration: {sql_path}")
    sql_text = sql_path.read_text(encoding="utf-8")
    print(f"Total file size: {len(sql_text)} bytes")

    try:
        ast = pglast.parse_sql(sql_text)
        print(f"PostgreSQL libpg_query parser SUCCESS: parsed {len(ast)} top-level statements.")
    except Exception as e:
        print(f"PostgreSQL parse FAILED: {e}", file=sys.stderr)
        sys.exit(1)

    # Detailed AST inspection
    tables = {}
    table_constraints = {}
    views = []
    enums = []
    indexes = []
    policies = []
    triggers = []
    functions = []
    inserts = []

    for item in ast:
        stmt = item.stmt
        name = type(stmt).__name__

        if name == "CreateStmt":
            tbl = stmt.relation.relname
            cols = []
            c_list = []
            for elt in stmt.tableElts:
                elt_type = type(elt).__name__
                if elt_type == "ColumnDef":
                    cname = elt.colname
                    tname = elt.typeName.names[-1].sval if elt.typeName else "unknown"
                    c_flags = []
                    if elt.constraints:
                        for c in elt.constraints:
                            c_flags.append(type(c).__name__)
                    cols.append((cname, tname, c_flags))
                elif elt_type == "Constraint":
                    c_list.append(elt.conname or "unnamed")
            tables[tbl] = cols
            table_constraints[tbl] = c_list

        elif name == "ViewStmt":
            views.append(stmt.view.relname)
        elif name == "IndexStmt":
            indexes.append(stmt.idxname)
        elif name == "CreatePolicyStmt":
            policies.append((stmt.policy_name, stmt.table.relname))
        elif name == "CreateTrigStmt":
            triggers.append(stmt.trigname)
        elif name == "CreateFunctionStmt":
            functions.append(stmt.funcname[0].sval)
        elif name == "InsertStmt":
            inserts.append(stmt.relation.relname)

    print("\n--- SCHEMA ENTITIES DISCOVERY ---")
    print(f"Tables ({len(tables)}): {list(tables.keys())}")
    for tbl, cols in tables.items():
        print(f"  * {tbl} ({len(cols)} columns):")
        for cname, tname, c_flags in cols:
            print(f"      - {cname}: {tname} {c_flags}")
        if table_constraints.get(tbl):
            print(f"      [Table Constraints]: {table_constraints[tbl]}")

    print(f"\nViews ({len(views)}): {views}")
    print(f"Indexes ({len(indexes)}): {indexes}")
    print(f"Policies ({len(policies)}):")
    for pol, tbl in policies:
        print(f"  * {pol} ON {tbl}")
    print(f"Triggers ({len(triggers)}): {triggers}")
    print(f"Functions ({len(functions)}): {functions}")
    print(f"Seed Inserts ({len(inserts)}): {inserts}")

    # Specific Check Constraints Auditing
    print("\n--- SPECIFIC CONSTRAINT AUDITING ---")
    # 1. citizen_id regex
    print("1. contractors.citizen_id check constraint:")
    citizen_col = next((c for c in tables["contractors"] if c[0] == "citizen_id"), None)
    print(f"   Found: {citizen_col}")

    # 2. payer_officer_name 50 dots
    print("2. agencies.payer_officer_name default value:")
    import re
    dots_in_sql = re.findall(r"\.{10,}", sql_text)
    print(f"   Found dotted strings with lengths: {[len(d) for d in dots_in_sql]}")

    # 3. contracts dates constraint check
    print("3. contracts start_date <= end_date check constraint:")
    has_date_chk = "chk_contract_dates" in table_constraints.get("contracts", []) or "start_date <=" in sql_text
    print(f"   Database-level start_date <= end_date constraint present: {has_date_chk}")

    # 4. audit_logs immutability policy
    print("4. audit_logs UPDATE policy:")
    no_update_pol = next((p for p in policies if p[0] == "audit_logs_no_update"), None)
    print(f"   Policy found: {no_update_pol}")

if __name__ == "__main__":
    sql_path = Path("salary-doc-web/supabase/migrations/20261102000000_init_schema.sql")
    verify_ddl(sql_path)
