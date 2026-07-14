#!/usr/bin/env python3
"""Serve the planning site with an explicit UTF-8 Markdown content type."""

import argparse
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class AppHandler(SimpleHTTPRequestHandler):
    max_body_bytes = 1_500_000

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

    def do_POST(self):
        routes = {'/api/ai/chat': self._chat, '/api/ai/vision': self._vision}
        handler = routes.get(self.path.split('?', 1)[0])
        if not handler:
            self._json(404, {'error': 'not_found'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > self.max_body_bytes:
                raise ValueError('请求内容为空或过大')
            payload = json.loads(self.rfile.read(length))
            self._json(200, handler(payload))
        except ValueError as error:
            self._json(400, {'error': str(error)})
        except (HTTPError, URLError, TimeoutError) as error:
            self._json(502, {'error': f'AI 服务暂不可用：{error}'})
        except Exception:
            self._json(500, {'error': 'AI 代理内部错误'})

    def _chat(self, payload):
        question = str(payload.get('question', '')).strip()
        if not question or len(question) > 4000:
            raise ValueError('问题不能为空且不能超过 4000 字符')
        answer = self._completion(os.environ.get('AI_TEXT_MODEL'), [
            {'role': 'system', 'content': '你是简洁、支持性的学习伙伴。帮助用户拆解任务和理解知识，不编造事实。'},
            {'role': 'user', 'content': question},
        ])
        return {'answer': answer}

    def _vision(self, payload):
        image = str(payload.get('image', ''))
        if not image.startswith('data:image/jpeg;base64,'):
            raise ValueError('仅接受 JPEG data URL')
        content = self._completion(os.environ.get('AI_VISION_MODEL') or os.environ.get('AI_TEXT_MODEL'), [
            {'role': 'system', 'content': '判断自习者是否在摄像头前。只回答 present、absent 或 uncertain。'},
            {'role': 'user', 'content': [
                {'type': 'text', 'text': '判断画面中的自习者是否在席。'},
                {'type': 'image_url', 'image_url': {'url': image}},
            ]},
        ]).lower()
        status = next((value for value in ('uncertain', 'absent', 'present') if value in content), 'uncertain')
        return {'status': status}

    def _completion(self, model, messages):
        base_url = os.environ.get('AI_BASE_URL', '').rstrip('/')
        if not base_url or not model:
            raise ValueError('服务器尚未配置 AI_BASE_URL 和模型名称')
        body = json.dumps({'model': model, 'messages': messages, 'temperature': 0.2, 'max_tokens': 500}).encode()
        headers = {'Content-Type': 'application/json'}
        api_key = os.environ.get('AI_API_KEY')
        if api_key:
            headers['Authorization'] = f'Bearer {api_key}'
        request = Request(f'{base_url}/chat/completions', data=body, headers=headers, method='POST')
        with urlopen(request, timeout=45) as response:
            payload = json.loads(response.read())
        try:
            return str(payload['choices'][0]['message']['content']).strip()
        except (KeyError, IndexError, TypeError):
            raise ValueError('AI 服务响应格式不兼容')

    def _json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)


Utf8StaticHandler = AppHandler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bind', default='0.0.0.0')
    parser.add_argument('--port', type=int, default=52341)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.bind, args.port), AppHandler)
    print(f'Serving on http://{args.bind}:{args.port}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
