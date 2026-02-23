import http.server
import socketserver
import os
import threading
import time

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
