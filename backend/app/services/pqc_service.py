import logging
from typing import Dict, Any, Optional
from app.services.pqc_sandbox_runner import pqc_sandbox

logger = logging.getLogger(__name__)

class PQCService:
    def __init__(self):
        pass

    def run_kyber_demo(self) -> Dict[str, Any]:
        """
        Executes a Kyber Key Encapsulation demo in the sandbox.
        """
        script = """
import oqs
import json
import time

try:
    kem = "Kyber512"
    with oqs.KeyEncapsulation(kem) as client:
        # Keygen
        start = time.perf_counter()
        public_key = client.generate_keypair()
        keygen_time = (time.perf_counter() - start) * 1000

        with oqs.KeyEncapsulation(kem) as server:
            # Encapsulate
            start = time.perf_counter()
            ciphertext, shared_secret_server = server.encap_secret(public_key)
            encap_time = (time.perf_counter() - start) * 1000

            # Decapsulate
            start = time.perf_counter()
            shared_secret_client = client.decap_secret(ciphertext)
            decap_time = (time.perf_counter() - start) * 1000

            success = (shared_secret_client == shared_secret_server)

            output = {
                "algorithm": kem,
                "keygen_time_ms": round(keygen_time, 2),
                "encap_time_ms": round(encap_time, 2),
                "decap_time_ms": round(decap_time, 2),
                "public_key_size": len(public_key),
                "ciphertext_size": len(ciphertext),
                "success": success
            }
            print(json.dumps(output))

except Exception as e:
    print(json.dumps({"error": str(e)}))
"""
        return pqc_sandbox.execute_script(script)

    def run_dilithium_demo(self) -> Dict[str, Any]:
        """
        Executes a Dilithium Digital Signature demo in the sandbox.
        """
        script = """
import oqs
import json
import time

try:
    sig_alg = "Dilithium2"
    message = b"This is a highly secure message."
    
    with oqs.Signature(sig_alg) as signer:
        # Keygen
        start = time.perf_counter()
        public_key = signer.generate_keypair()
        keygen_time = (time.perf_counter() - start) * 1000

        # Sign
        start = time.perf_counter()
        signature = signer.sign(message)
        sign_time = (time.perf_counter() - start) * 1000

        with oqs.Signature(sig_alg) as verifier:
            # Verify
            start = time.perf_counter()
            is_valid = verifier.verify(message, signature, public_key)
            verify_time = (time.perf_counter() - start) * 1000

            output = {
                "algorithm": sig_alg,
                "keygen_time_ms": round(keygen_time, 2),
                "sign_time_ms": round(sign_time, 2),
                "verify_time_ms": round(verify_time, 2),
                "public_key_size": len(public_key),
                "signature_size": len(signature),
                "success": is_valid
            }
            print(json.dumps(output))

except Exception as e:
    print(json.dumps({"error": str(e)}))
"""
        return pqc_sandbox.execute_script(script)

    def run_benchmark(self, algorithm: str) -> Dict[str, Any]:
        """
        Runs a specific cryptographic algorithm and returns performance metrics.
        """
        # Mapping frontend names to OQS internal names
        algo_map = {
            "Kyber512": ("kem", "Kyber512"),
            "Kyber768": ("kem", "Kyber768"),
            "Dilithium2": ("sig", "Dilithium2"),
            # For classical simulation, we might need a dummy script or rely on Python 'cryptography' inside the container
            "RSA-2048": ("sig", "RSA-2048"), # Requires different handling in script
            "ECC": ("sig", "ECDSA")         # Requires different handling in script
        }
        
        if algorithm not in algo_map:
            return {"success": False, "error": f"Algorithm '{algorithm}' not supported for benchmarking."}
            
        algo_type, oqs_name = algo_map[algorithm]
        
        if algorithm in ["RSA-2048", "ECC"]:
            # Generate classical script using standard library or cryptography package
            script = self._get_classical_benchmark_script(algorithm)
        elif algo_type == "kem":
             script = self._get_kem_benchmark_script(oqs_name)
        elif algo_type == "sig":
             script = self._get_sig_benchmark_script(oqs_name)
             
        return pqc_sandbox.execute_script(script)

    def _get_kem_benchmark_script(self, kem_name: str) -> str:
        return f"""
import oqs
import json
import time

try:
    total_keygen, total_encap, total_decap = 0, 0, 0
    iterations = 100
    
    with oqs.KeyEncapsulation("{kem_name}") as client:
        with oqs.KeyEncapsulation("{kem_name}") as server:
            for _ in range(iterations):
                start = time.perf_counter()
                public_key = client.generate_keypair()
                total_keygen += (time.perf_counter() - start)

                start = time.perf_counter()
                ciphertext, secret_s = server.encap_secret(public_key)
                total_encap += (time.perf_counter() - start)

                start = time.perf_counter()
                secret_c = client.decap_secret(ciphertext)
                total_decap += (time.perf_counter() - start)

    output = {{
        "algorithm": "{kem_name}",
        "keygen_time_ms": round((total_keygen / iterations) * 1000, 4),
        "encrypt_time_ms": round((total_encap / iterations) * 1000, 4),
        "decrypt_time_ms": round((total_decap / iterations) * 1000, 4),
        "public_key_size": len(public_key),
        "ciphertext_size": len(ciphertext)
    }}
    print(json.dumps(output))
except Exception as e:
    print(json.dumps({{"error": str(e)}}))
"""

    def _get_sig_benchmark_script(self, sig_name: str) -> str:
        return f"""
import oqs
import json
import time

try:
    total_keygen, total_sign, total_verify = 0, 0, 0
    iterations = 100
    message = b"Benchmark test message for digital signatures."
    
    with oqs.Signature("{sig_name}") as signer:
        with oqs.Signature("{sig_name}") as verifier:
            for _ in range(iterations):
                start = time.perf_counter()
                public_key = signer.generate_keypair()
                total_keygen += (time.perf_counter() - start)

                start = time.perf_counter()
                signature = signer.sign(message)
                total_sign += (time.perf_counter() - start)

                start = time.perf_counter()
                verifier.verify(message, signature, public_key)
                total_verify += (time.perf_counter() - start)

    output = {{
        "algorithm": "{sig_name}",
        "keygen_time_ms": round((total_keygen / iterations) * 1000, 4),
        "encrypt_time_ms": round((total_sign / iterations) * 1000, 4), # Mapping sign to encrypt for generic graph
        "decrypt_time_ms": round((total_verify / iterations) * 1000, 4), # Mapping vary to decrypt for generic graph
        "public_key_size": len(public_key),
        "ciphertext_size": len(signature) # Mapping signature to ciphertext
    }}
    print(json.dumps(output))
except Exception as e:
    print(json.dumps({{"error": str(e)}}))
"""

    def _get_classical_benchmark_script(self, algo: str) -> str:
        # Mocking RSA/ECC performance for now, or use python's built-in crypto implementations if container has cryptography package
        # Assuming cryptography package is not explicitly added yet, simulate based on known metrics
        
        metrics = {
             "RSA-2048": {
                 "keygen": 45.0, "encrypt": 0.1, "decrypt": 2.5, "pk_size": 256, "c_size": 256
             },
             "ECC": {
                 "keygen": 0.5, "encrypt": 1.2, "decrypt": 1.2, "pk_size": 64, "c_size": 64
             }
        }
        
        m = metrics[algo]
        return f"""
import json
output = {{
    "algorithm": "{algo}",
    "keygen_time_ms": {m['keygen']},
    "encrypt_time_ms": {m['encrypt']},
    "decrypt_time_ms": {m['decrypt']},
    "public_key_size": {m['pk_size']},
    "ciphertext_size": {m['c_size']}
}}
print(json.dumps(output))
"""


pqc_service = PQCService()
