#!/usr/bin/env python3
"""Serve the planning site with an explicit UTF-8 Markdown content type."""

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Utf8StaticHandler(SimpleHTTPRequestHandler):
    def _is_markdown_request(self):
        path = self.path.split('?', 1)[0].lower()
        return path.endswith(('.md', '.markdown'))

    def guess_type(self, path):
        content_type = super().guess_type(path)
        if path.lower().endswith(('.md', '.markdown')):
            return 'text/plain; charset=utf-8'
        return content_type

    def send_head(self):
        if self._is_markdown_request() and 'If-Modified-Since' in self.headers:
            del self.headers['If-Modified-Since']
        return super().send_head()

    def end_headers(self):
        if self._is_markdown_request():
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bind', default='0.0.0.0')
    parser.add_argument('--port', type=int, default=52341)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.bind, args.port), Utf8StaticHandler)
    print(f'Serving on http://{args.bind}:{args.port}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
