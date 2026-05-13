#!/usr/bin/env python3
import json
import sys
try:
    import speedtest
    st = speedtest.Speedtest(secure=True)
    st.get_best_server()
    ping = st.results.ping
    dl = st.download() / 1_000_000
    ul = st.upload() / 1_000_000
    server = st.results.server.get('sponsor', 'Unknown') + ' (' + st.results.server.get('name', '') + ')'
    print(json.dumps({
        'ping': round(ping, 1),
        'download': round(dl, 2),
        'upload': round(ul, 2),
        'server': server,
        'ip': st.results.client.get('ip', ''),
        'isp': st.results.client.get('isp', '')
    }))
except Exception as e:
    print(json.dumps({'error': str(e)}))
    sys.exit(1)
