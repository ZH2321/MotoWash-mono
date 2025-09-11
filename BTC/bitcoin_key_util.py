
# bitcoin_key_util_v2.py
# Adds --generate to create a fresh private key and show address/WIF.
# Self-contained Base58Check; RIPEMD160 via hashlib or pycryptodome fallback.
# Deriving pubkey requires 'ecdsa' (pip install ecdsa).

import os, sys, hashlib

_B58_ALPHABET = b'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
_B58_IDX = {c:i for i,c in enumerate(_B58_ALPHABET)}

def b58encode(b: bytes) -> bytes:
    n_zeros = len(b) - len(b.lstrip(b'\x00'))
    x = int.from_bytes(b, 'big')
    out = bytearray()
    while x > 0:
        x, rem = divmod(x, 58)
        out.append(_B58_ALPHABET[rem])
    out.extend(_B58_ALPHABET[0] * n_zeros)
    out.reverse()
    return bytes(out)

def b58decode(s: bytes) -> bytes:
    x = 0
    for ch in s:
        if ch not in _B58_IDX:
            raise ValueError("Invalid Base58 character")
        x = x * 58 + _B58_IDX[ch]
    full = x.to_bytes((x.bit_length() + 7)//8, 'big') if x else b'\x00'
    n_zeros = len(s) - len(s.lstrip(_B58_ALPHABET[:1]))
    return b'\x00' * n_zeros + full.lstrip(b'\x00')

def dsha(b: bytes) -> bytes:
    return hashlib.sha256(hashlib.sha256(b).digest()).digest()

def b58check_encode(versioned_payload: bytes) -> str:
    return b58encode(versioned_payload + dsha(versioned_payload)[:4]).decode()

def b58check_decode(s: str) -> bytes:
    raw = b58decode(s.encode())
    payload, chk = raw[:-4], raw[-4:]
    if dsha(payload)[:4] != chk:
        raise ValueError("Bad Base58Check checksum")
    return payload

def ripemd160(data: bytes) -> bytes:
    try:
        h = hashlib.new("ripemd160")
        h.update(data)
        return h.digest()
    except Exception:
        try:
            from Crypto.Hash import RIPEMD160
        except Exception as e:
            raise RuntimeError("RIPEMD160 unavailable. Install pycryptodome: pip install pycryptodome") from e
        h = RIPEMD160.new()
        h.update(data)
        return h.digest()

def _require_ecdsa():
    try:
        from ecdsa import SigningKey, SECP256k1
        return SigningKey, SECP256k1
    except Exception as e:
        raise RuntimeError("This function requires 'ecdsa'. Install: pip install ecdsa") from e

def priv_to_pubkey(hex_priv: str, compressed: bool) -> bytes:
    SigningKey, SECP256k1 = _require_ecdsa()
    sk = SigningKey.from_string(bytes.fromhex(hex_priv), curve=SECP256k1)
    vk = sk.get_verifying_key()
    x, y = vk.pubkey.point.x(), vk.pubkey.point.y()
    return (b'\x02' if y % 2 == 0 else b'\x03') + x.to_bytes(32, 'big') if compressed else                (b'\x04' + x.to_bytes(32, 'big') + y.to_bytes(32, 'big'))

def parse_privkey(user_input: str):
    s = user_input.strip()
    # HEX
    try:
        raw = bytes.fromhex(s)
        if len(raw) == 32:
            return s.lower(), True, "mainnet"
    except ValueError:
        pass
    # WIF
    payload = b58check_decode(s)  # may raise
    version = payload[0]
    if version == 0x80:
        network = "mainnet"
    elif version == 0xEF:
        network = "testnet"
    else:
        raise ValueError("Unknown WIF version byte")
    if len(payload) == 34 and payload[-1] == 0x01:
        compressed = True
        key_bytes = payload[1:-1]
    elif len(payload) == 33:
        compressed = False
        key_bytes = payload[1:]
    else:
        raise ValueError("Unexpected WIF payload length")
    if len(key_bytes) != 32:
        raise ValueError("Invalid private key length in WIF")
    return key_bytes.hex(), compressed, network

def pubkey_to_p2pkh(pubkey: bytes, network: str) -> str:
    h160 = ripemd160(hashlib.sha256(pubkey).digest())
    ver = b'\x00' if network == "mainnet" else b'\x6f'
    return b58check_encode(ver + h160)

def priv_hex_to_wif(hex_priv: str, compressed: bool, network: str) -> str:
    ver = b'\x80' if network == "mainnet" else b'\xEF'
    payload = ver + bytes.fromhex(hex_priv) + (b'\x01' if compressed else b'')
    return b58check_encode(payload)

def priv_to_address(user_input: str, force_network=None, force_compressed=None):
    hex_priv, compressed, network = parse_privkey(user_input)
    if force_network is not None:
        network = force_network
    if force_compressed is not None:
        compressed = force_compressed
    pub = priv_to_pubkey(hex_priv, compressed)
    addr = pubkey_to_p2pkh(pub, network)
    wif = priv_hex_to_wif(hex_priv, compressed, network)
    return {"hex_priv": hex_priv, "compressed": compressed, "network": network, "pubkey_hex": pub.hex(), "address": addr, "wif": wif}

def generate_priv():
    # 32 bytes random in [1, n-1]; here we just avoid zero; for demo it's fine.
    while True:
        x = os.urandom(32)
        if any(x):  # non-zero
            return x.hex()

def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h","--help"):
        print("Usage: python bitcoin_key_util_v2.py <HEX_or_WIF> [--testnet] [--uncompressed]")
        print("       python bitcoin_key_util_v2.py --generate [--testnet] [--uncompressed]")
        print("\nHints:")
        print(" - HEX: 64 hex chars (0-9a-f).")
        print(" - WIF (mainnet): starts with '5', 'K', or 'L'.")
        print(" - WIF (testnet): starts with 'c'.")
        return

    force_net = "testnet" if "--testnet" in args else None
    force_comp = False if "--uncompressed" in args else None

    if args[0] == "--generate":
        hex_priv = generate_priv()
        if force_net is None:
            force_net = "testnet"  # safer default for demo
        if force_comp is None:
            force_comp = True
        out = priv_to_address(hex_priv, force_network=force_net, force_compressed=force_comp)
        print("Generated new private key:")
        print("  hex_priv :", out["hex_priv"])
        print("  network  :", out["network"])
        print("  compressed:", out["compressed"])
        print("  pubkey   :", out["pubkey_hex"][:20] + "...")
        print("  address  :", out["address"])
        print("  wif      :", out["wif"])
        print("\nNOTE: Keep your private key secret. Use testnet for demos.")
        return

    user_in = args[0]
    try:
        out = priv_to_address(user_in, force_network=force_net, force_compressed=force_comp)
        print("hex_priv :", out["hex_priv"])
        print("network  :", out["network"])
        print("compressed:", out["compressed"])
        print("pubkey   :", out["pubkey_hex"][:20] + "...")
        print("address  :", out["address"])
        print("wif      :", out["wif"])
    except Exception as e:
        print("Error:", e)
        print("\nYour input isn't a valid 64-HEX private key or WIF.")
        print("WIF tip: mainnet starts with '5'/'K'/'L', testnet starts with 'c'.")
        print("If you only have a passphrase/mnemonic, you must derive a key first (BIP39/BIP32), not supported in this simple tool.")

if __name__ == "__main__":
    main()
