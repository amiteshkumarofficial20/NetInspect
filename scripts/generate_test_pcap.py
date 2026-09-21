#!/usr/bin/env python3
"""
Dynamic PCAP generator for NetInspect.

Every execution produces a NEW, uniquely-named PCAP under storage/generated/
containing a randomized-but-valid mix of TCP/UDP, DNS, HTTP and TLS (with SNI)
traffic that the existing C++ DPI engine can parse.

Usage:
    python scripts/generate_test_pcap.py
    python scripts/generate_test_pcap.py --out storage/generated/foo.pcap
    python scripts/generate_test_pcap.py --seed 12345
    python scripts/generate_test_pcap.py --keep 20

Prints, on the last line of stdout:
    Generated PCAP: <absolute-or-relative path>
"""

import argparse
import os
import random
import secrets
import struct
import sys
import time
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GENERATED_DIR = os.path.join(ROOT_DIR, "storage", "generated")


# ─────────────────────────── PCAP writer ────────────────────────────
class PCAPWriter:
    def __init__(self, filename, start_ts=None):
        self.file = open(filename, "wb")
        self.write_global_header()
        self.timestamp = start_ts or int(time.time())
        self.packet_count = 0
        self.byte_count = 0

    def write_global_header(self):
        # magic, v2.4, tz 0, sigfigs 0, snaplen 65535, linktype Ethernet
        self.file.write(struct.pack("<IHHIIII", 0xA1B2C3D4, 2, 4, 0, 0, 65535, 1))

    def write_packet(self, data):
        ts_usec = random.randint(0, 999999)
        self.file.write(
            struct.pack("<IIII", self.timestamp, ts_usec, len(data), len(data))
        )
        self.file.write(data)
        # advance clock by a small random delta so flows look temporally spread
        if random.random() < 0.35:
            self.timestamp += 1
        self.packet_count += 1
        self.byte_count += len(data)

    def close(self):
        self.file.close()


# ───────────────────────── protocol builders ────────────────────────
def create_ethernet_header(src_mac, dst_mac, ethertype=0x0800):
    return (
        bytes.fromhex(dst_mac.replace(":", ""))
        + bytes.fromhex(src_mac.replace(":", ""))
        + struct.pack(">H", ethertype)
    )


def create_ip_header(src_ip, dst_ip, protocol, payload_len):
    version_ihl = 0x45
    tos = 0
    total_len = 20 + payload_len
    ident = random.randint(1, 65535)
    flags_frag = 0x4000  # don't fragment
    ttl = random.choice([54, 56, 60, 64, 128])
    checksum = 0

    header = struct.pack(
        ">BBHHHBBH",
        version_ihl,
        tos,
        total_len,
        ident,
        flags_frag,
        ttl,
        protocol,
        checksum,
    )
    header += bytes(int(x) for x in src_ip.split("."))
    header += bytes(int(x) for x in dst_ip.split("."))
    return header


def create_tcp_header(src_port, dst_port, seq, ack, flags):
    data_offset = 5 << 4  # 20-byte header
    window = random.choice([8192, 16384, 32768, 65535])
    return struct.pack(
        ">HHIIBBHHH", src_port, dst_port, seq, ack, data_offset, flags, window, 0, 0
    )


def create_udp_header(src_port, dst_port, payload_len):
    return struct.pack(">HHHH", src_port, dst_port, 8 + payload_len, 0)


def create_tls_client_hello(sni):
    """TLS 1.2/1.3 Client Hello carrying an SNI extension."""
    sni_bytes = sni.encode("ascii")
    sni_entry = struct.pack(">BH", 0, len(sni_bytes)) + sni_bytes
    sni_list = struct.pack(">H", len(sni_entry)) + sni_entry
    sni_ext = struct.pack(">HH", 0x0000, len(sni_list)) + sni_list

    supported_versions = struct.pack(">HHB", 0x002B, 3, 2) + struct.pack(">H", 0x0304)

    extensions = sni_ext + supported_versions
    extensions_data = struct.pack(">H", len(extensions)) + extensions

    client_version = struct.pack(">H", 0x0303)
    random_bytes = bytes(random.getrandbits(8) for _ in range(32))
    session_id = struct.pack("B", 0)
    cipher_suites = struct.pack(">H", 4) + struct.pack(">HH", 0x1301, 0x1302)
    compression = struct.pack("BB", 1, 0)

    body = (
        client_version
        + random_bytes
        + session_id
        + cipher_suites
        + compression
        + extensions_data
    )

    handshake = struct.pack("B", 0x01) + struct.pack(">I", len(body))[1:] + body

    record = (
        struct.pack("B", 0x16)
        + struct.pack(">H", 0x0301)
        + struct.pack(">H", len(handshake))
        + handshake
    )
    return record


def create_http_request(host, method="GET", path="/"):
    agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "curl/8.4.0",
        "DPI-Test/1.0",
        "Mozilla/5.0 (X11; Linux x86_64)",
    ]
    return (
        f"{method} {path} HTTP/1.1\r\n"
        f"Host: {host}\r\n"
        f"User-Agent: {random.choice(agents)}\r\n"
        f"Accept: */*\r\n\r\n"
    ).encode()


def create_dns_query(domain):
    txid = struct.pack(">H", random.randint(1, 65535))
    flags = struct.pack(">H", 0x0100)
    counts = struct.pack(">HHHH", 1, 0, 0, 0)

    question = b""
    for label in domain.split("."):
        question += struct.pack("B", len(label)) + label.encode()
    question += struct.pack("B", 0)
    question += struct.pack(">HH", 1, 1)  # A / IN

    return txid + flags + counts + question


# ──────────────────────────── data pool ─────────────────────────────
# (dst_ip, sni) pairs the existing engine's sniToAppType() recognises.
TLS_POOL = [
    ("142.250.185.206", "www.google.com"),
    ("142.250.185.110", "www.youtube.com"),
    ("172.217.0.100", "accounts.google.com"),
    ("157.240.1.35", "www.facebook.com"),
    ("157.240.1.174", "www.instagram.com"),
    ("104.244.42.65", "twitter.com"),
    ("104.244.42.129", "api.twitter.com"),
    ("52.94.236.248", "www.amazon.com"),
    ("23.52.167.61", "www.netflix.com"),
    ("140.82.114.4", "github.com"),
    ("140.82.113.25", "api.github.com"),
    ("104.16.85.20", "discord.com"),
    ("162.159.128.233", "gateway.discord.gg"),
    ("35.186.224.25", "zoom.us"),
    ("35.186.227.140", "web.telegram.org"),
    ("99.86.0.100", "www.tiktok.com"),
    ("35.186.224.47", "open.spotify.com"),
    ("104.154.127.47", "api.spotify.com"),
    ("192.0.78.24", "www.cloudflare.com"),
    ("13.107.42.14", "www.microsoft.com"),
    ("20.190.159.4", "login.microsoftonline.com"),
    ("17.253.144.10", "www.apple.com"),
    ("151.101.65.140", "www.reddit.com"),
    ("13.107.42.12", "www.linkedin.com"),
    ("151.101.2.167", "www.twitch.tv"),
    ("104.98.24.40", "steamcommunity.com"),
    ("162.125.248.18", "www.dropbox.com"),
    ("157.240.1.53", "web.whatsapp.com"),
]

HTTP_POOL = [
    ("93.184.216.34", "example.com", "/"),
    ("185.199.108.153", "httpbin.org", "/get"),
    ("151.101.1.69", "neverssl.com", "/"),
    ("34.117.59.81", "detectportal.firefox.com", "/success.txt"),
    ("104.21.63.191", "info.cern.ch", "/hypertext/WWW/TheProject.html"),
]

DNS_POOL = [
    "www.google.com",
    "www.youtube.com",
    "www.facebook.com",
    "api.twitter.com",
    "cdn.discordapp.com",
    "open.spotify.com",
    "github.com",
    "www.netflix.com",
    "outlook.office365.com",
    "push.apple.com",
    "telemetry.mozilla.org",
    "ntp.ubuntu.com",
]

DNS_SERVERS = ["8.8.8.8", "1.1.1.1", "9.9.9.9", "8.8.4.4", "208.67.222.222"]

LAN_SUBNETS = ["192.168.1", "192.168.0", "10.0.0", "172.16.5"]


def rand_mac():
    return "02:%02x:%02x:%02x:%02x:%02x" % tuple(random.randint(0, 255) for _ in range(5))


def rand_port():
    return random.randint(49152, 65535)


# ─────────────────────────── generation ─────────────────────────────
def generate(path, seed):
    random.seed(seed)

    writer = PCAPWriter(path, start_ts=int(time.time()) - random.randint(0, 86400))

    subnet = random.choice(LAN_SUBNETS)
    gateway_mac = rand_mac()

    # 1–4 distinct local hosts, each with its own MAC
    host_count = random.randint(1, 4)
    hosts = []
    used = set()
    while len(hosts) < host_count:
        last = random.randint(10, 200)
        if last in used:
            continue
        used.add(last)
        hosts.append({"ip": f"{subnet}.{last}", "mac": rand_mac()})

    tls_count = random.randint(6, min(20, len(TLS_POOL)))
    http_count = random.randint(1, len(HTTP_POOL))
    dns_count = random.randint(3, min(10, len(DNS_POOL)))

    tls_conns = random.sample(TLS_POOL, tls_count)
    http_conns = random.sample(HTTP_POOL, http_count)
    dns_domains = random.sample(DNS_POOL, dns_count)

    seq_base = random.randint(1000, 500000)
    stats = {"tls": 0, "http": 0, "dns": 0, "noise": 0}

    # ── TLS flows: SYN, SYN-ACK, ACK, Client Hello (+ optional app data) ──
    for dst_ip, sni in tls_conns:
        host = random.choice(hosts)
        src_port = rand_port()
        dst_port = 443

        eth_out = create_ethernet_header(host["mac"], gateway_mac)
        eth_in = create_ethernet_header(gateway_mac, host["mac"])

        tcp = create_tcp_header(src_port, dst_port, seq_base, 0, 0x02)
        writer.write_packet(
            eth_out + create_ip_header(host["ip"], dst_ip, 6, len(tcp)) + tcp
        )

        tcp = create_tcp_header(dst_port, src_port, seq_base + 1000, seq_base + 1, 0x12)
        writer.write_packet(
            eth_in + create_ip_header(dst_ip, host["ip"], 6, len(tcp)) + tcp
        )

        tcp = create_tcp_header(src_port, dst_port, seq_base + 1, seq_base + 1001, 0x10)
        writer.write_packet(
            eth_out + create_ip_header(host["ip"], dst_ip, 6, len(tcp)) + tcp
        )

        tls_data = create_tls_client_hello(sni)
        tcp = create_tcp_header(src_port, dst_port, seq_base + 1, seq_base + 1001, 0x18)
        writer.write_packet(
            eth_out
            + create_ip_header(host["ip"], dst_ip, 6, len(tcp) + len(tls_data))
            + tcp
            + tls_data
        )

        # optional encrypted application-data records
        for _ in range(random.randint(0, 3)):
            payload = struct.pack("B", 0x17) + struct.pack(">H", 0x0303)
            chunk = bytes(random.getrandbits(8) for _ in range(random.randint(24, 180)))
            payload += struct.pack(">H", len(chunk)) + chunk
            tcp = create_tcp_header(
                src_port, dst_port, seq_base + 2, seq_base + 1002, 0x18
            )
            writer.write_packet(
                eth_out
                + create_ip_header(host["ip"], dst_ip, 6, len(tcp) + len(payload))
                + tcp
                + payload
            )

        stats["tls"] += 1
        seq_base += random.randint(5000, 20000)

    # ── HTTP flows ──
    for dst_ip, hostname, path_ in http_conns:
        host = random.choice(hosts)
        src_port = rand_port()
        eth_out = create_ethernet_header(host["mac"], gateway_mac)

        tcp = create_tcp_header(src_port, 80, seq_base, 0, 0x02)
        writer.write_packet(
            eth_out + create_ip_header(host["ip"], dst_ip, 6, len(tcp)) + tcp
        )

        http_data = create_http_request(
            hostname, method=random.choice(["GET", "GET", "GET", "POST", "HEAD"]), path=path_
        )
        tcp = create_tcp_header(src_port, 80, seq_base + 1, 1, 0x18)
        writer.write_packet(
            eth_out
            + create_ip_header(host["ip"], dst_ip, 6, len(tcp) + len(http_data))
            + tcp
            + http_data
        )

        stats["http"] += 1
        seq_base += random.randint(5000, 20000)

    # ── DNS queries ──
    for domain in dns_domains:
        host = random.choice(hosts)
        dns_server = random.choice(DNS_SERVERS)
        src_port = rand_port()

        dns_data = create_dns_query(domain)
        udp = create_udp_header(src_port, 53, len(dns_data))
        writer.write_packet(
            create_ethernet_header(host["mac"], gateway_mac)
            + create_ip_header(host["ip"], dns_server, 17, len(udp) + len(dns_data))
            + udp
            + dns_data
        )
        stats["dns"] += 1

    # ── Unclassified noise on a secondary host (exercises "Unknown") ──
    noise_ip = f"{subnet}.{random.randint(201, 250)}"
    noise_mac = rand_mac()
    for _ in range(random.randint(2, 10)):
        src_port = rand_port()
        dst_ip = random.choice(["172.217.0.100", "13.107.4.50", "151.101.1.140"])
        tcp = create_tcp_header(src_port, random.choice([443, 8443, 993]), seq_base, 0, 0x02)
        writer.write_packet(
            create_ethernet_header(noise_mac, gateway_mac)
            + create_ip_header(noise_ip, dst_ip, 6, len(tcp))
            + tcp
        )
        stats["noise"] += 1
        seq_base += 1000

    writer.close()
    return writer.packet_count, writer.byte_count, stats


def prune(directory, keep, suffixes=(".pcap",)):
    """Keep only the newest `keep` files in `directory`."""
    if keep <= 0 or not os.path.isdir(directory):
        return
    files = [
        os.path.join(directory, f)
        for f in os.listdir(directory)
        if f.endswith(suffixes)
    ]
    files.sort(key=os.path.getmtime, reverse=True)
    for stale in files[keep:]:
        try:
            os.remove(stale)
        except OSError:
            pass


def main():
    parser = argparse.ArgumentParser(description="Generate a unique test PCAP.")
    parser.add_argument("--out", help="explicit output path (default: auto-named)")
    parser.add_argument("--seed", type=int, help="explicit RNG seed (default: random)")
    parser.add_argument(
        "--keep",
        type=int,
        default=20,
        help="how many generated PCAPs to retain (0 = unlimited)",
    )
    args = parser.parse_args()

    seed = args.seed if args.seed is not None else secrets.randbits(64)

    if args.out:
        out_path = os.path.abspath(args.out)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
    else:
        os.makedirs(GENERATED_DIR, exist_ok=True)
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_path = os.path.join(
            GENERATED_DIR, f"generated_{stamp}_{secrets.token_hex(2)}.pcap"
        )

    try:
        packets, total_bytes, stats = generate(out_path, seed)
    except Exception as exc:  # noqa: BLE001 - surfaced to the caller via exit code
        print(f"ERROR: PCAP generation failed: {exc}", file=sys.stderr)
        return 1

    if not args.out:
        prune(GENERATED_DIR, args.keep)

    print(f"Seed: {seed}")
    print(
        f"Packets: {packets}  Bytes: {total_bytes}  "
        f"TLS flows: {stats['tls']}  HTTP flows: {stats['http']}  "
        f"DNS queries: {stats['dns']}  Noise: {stats['noise']}"
    )
    print(f"Generated PCAP: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())