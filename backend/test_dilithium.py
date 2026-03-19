import json
from app.services.pqc_service import pqc_service

script = """
import oqs
import json
print(json.dumps({"sigs": oqs.get_enabled_sig_mechanisms(), "kems": oqs.get_enabled_kem_mechanisms()}))
"""

def main():
    from app.services.pqc_sandbox_runner import pqc_sandbox
    res = pqc_sandbox.execute_script(script)
    print("Result:")
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
