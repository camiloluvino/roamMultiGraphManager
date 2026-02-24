import http.server
import socketserver
import os
import threading
import time
import json
import urllib.request
import urllib.error

PORT = 8000
last_heartbeat = time.time()

class HeartbeatHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        global last_heartbeat
        if self.path == '/heartbeat':
            last_heartbeat = time.time()
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            self.wfile.write(b'ok')
        else:
            super().do_GET()

    def do_OPTIONS(self):
        """Handle CORS preflight for proxy endpoint"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        """Proxy requests to Roam Research API to bypass browser payload limits"""
        if self.path == '/api/proxy':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                data = json.loads(body)

                # Extract proxy params
                url = data.get('url')
                token = data.get('token')
                payload = data.get('payload')

                if not url or not token or payload is None:
                    self._send_json(400, {'error': 'Faltan parámetros: url, token, payload'})
                    return

                # Custom opener that follows 308 redirects preserving POST method
                class PostRedirectHandler(urllib.request.HTTPRedirectHandler):
                    def redirect_request(self, req, fp, code, msg, headers, newurl):
                        # For 307/308, preserve method and body
                        if code in (307, 308):
                            new_req = urllib.request.Request(
                                newurl,
                                data=req.data,
                                headers=dict(req.header_items()),
                                method=req.get_method()
                            )
                            return new_req
                        return super().redirect_request(req, fp, code, msg, headers, newurl)

                opener = urllib.request.build_opener(PostRedirectHandler)

                # Forward request to Roam API
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        'X-Authorization': f'Bearer {token}',
                        'Content-Type': 'application/json'
                    },
                    method='POST'
                )

                try:
                    with opener.open(req, timeout=30) as response:
                        resp_body = response.read().decode('utf-8')
                        self._send_json(response.status, resp_body, raw=True)
                except urllib.error.HTTPError as e:
                    error_body = e.read().decode('utf-8') if e.fp else str(e)
                    self._send_json(e.code, error_body, raw=True)
                except urllib.error.URLError as e:
                    self._send_json(502, {'error': f'Error de conexión con Roam: {str(e.reason)}'})

            except json.JSONDecodeError:
                self._send_json(400, {'error': 'JSON inválido'})
            except Exception as e:
                self._send_json(500, {'error': str(e)})
        else:
            self.send_error(404)

    def _send_json(self, status, data, raw=False):
        """Helper to send JSON response with CORS headers"""
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        if raw and isinstance(data, str):
            self.wfile.write(data.encode('utf-8'))
        else:
            self.wfile.write(json.dumps(data).encode('utf-8'))

    def log_message(self, format, *args):
        # Mute logging for heartbeat to avoid terminal spam
        if '/heartbeat' not in format % args:
            super().log_message(format, *args)

def monitor_heartbeat():
    global last_heartbeat
    # Wait a bit before starting the monitor to allow the browser to initially load
    time.sleep(3)
    while True:
        time.sleep(2)
        # If no heartbeat received in the last 5 seconds, shut down
        if time.time() - last_heartbeat > 5:
            print("\nBrowser closed or disconnected. Shutting down server...")
            os._exit(0)

def run():
    # Update last_heartbeat right before starting the server so the monitor doesn't kill it immediately
    global last_heartbeat
    last_heartbeat = time.time()
    
    socketserver.TCPServer.allow_reuse_address = True
    
    # Start the monitor thread
    monitor_thread = threading.Thread(target=monitor_heartbeat, daemon=True)
    monitor_thread.start()
    
    with socketserver.TCPServer(("", PORT), HeartbeatHandler) as httpd:
        print("============================================")
        print("  Roam Multi-Graph Manager Servidor")
        print("============================================")
        print(f"Sirviendo en http://localhost:{PORT}")
        print("Cierra la pestaña del navegador para apagar este servidor.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido por el usuario.")
            os._exit(0)

if __name__ == "__main__":
    run()
