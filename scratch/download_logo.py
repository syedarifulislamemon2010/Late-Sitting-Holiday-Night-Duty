import urllib.request
import ssl
import re

url = "https://commons.wikimedia.org/wiki/File:Janata_Bank_Logo.svg"
req = urllib.request.Request(
    url, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        html = response.read().decode('utf-8')
        # Let's search for the direct upload link
        matches = re.findall(r'href="([^"]+upload\.wikimedia\.org/wikipedia/commons/[^"]+\.svg)"', html)
        if matches:
            svg_url = matches[0]
            print(f"Found SVG URL: {svg_url}")
            
            # Now download it
            req_svg = urllib.request.Request(
                svg_url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                }
            )
            with urllib.request.urlopen(req_svg, context=ctx) as response_svg:
                svg_content = response_svg.read()
                with open("public/janata-bank-logo-real.svg", "wb") as f:
                    f.write(svg_content)
                print("Success! Official logo downloaded.")
        else:
            print("Could not find SVG link in page HTML. Let's dump some lines.")
            # Print lines with 'upload.wikimedia.org'
            for line in html.split('\n'):
                if 'upload.wikimedia.org' in line:
                    print(line[:300])
except Exception as e:
    print(f"Error: {e}")
