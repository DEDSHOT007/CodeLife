from app.services.pqc_service import pqc_service
import json

def test_pqc_functionality():
    print("Testing Kyber Demo...")
    kyber_res = pqc_service.run_kyber_demo()
    print(f"Kyber Result: {json.dumps(kyber_res, indent=2)}")

    print("\nTesting Dilithium Demo...")
    dilithium_res = pqc_service.run_dilithium_demo()
    print(f"Dilithium Result: {json.dumps(dilithium_res, indent=2)}")

    print("\nTesting Benchmark (Kyber512)...")
    bench_res = pqc_service.run_benchmark("Kyber512")
    print(f"Benchmark Result: {json.dumps(bench_res, indent=2)}")

if __name__ == "__main__":
    test_pqc_functionality()
