def anchor_to_blockchain(prescription):
    record_hash = hash_prescription_record(prescription)
    txn = {
        "from": account.address,
        "to": account.address,
        "value": 0,
        "gas": 21000,
        "gasPrice": w3.to_wei("1", "gwei"),
        "data": "0x" + record_hash,
        "nonce": w3.eth.get_transaction_count(account.address),
    }
    signed = w3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)  # <-- fix here!
    return record_hash, w3.to_hex(tx_hash)
