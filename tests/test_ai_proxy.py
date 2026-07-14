import json
import os
import threading
import unittest
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from urllib.request import Request, urlopen

import server


class FakeUpstream:
    status = 200
    def __enter__(self): return self
    def __exit__(self, *_): return None
    def read(self):
        return json.dumps({"choices": [{"message": {"content": "先完成一道题。"}}]}).encode()


class AiProxyTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.AppHandler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown(); cls.httpd.server_close(); cls.thread.join()

    def post(self, path, payload):
        request = Request(
            f"http://127.0.0.1:{self.httpd.server_port}{path}",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"}, method="POST",
        )
        return urlopen(request)

    @patch.dict(os.environ, {"AI_BASE_URL": "http://model.local/v1", "AI_API_KEY": "secret", "AI_TEXT_MODEL": "text-model"})
    @patch("server.urlopen", return_value=FakeUpstream())
    def test_proxies_question_without_exposing_key(self, upstream):
        with self.post("/api/ai/chat", {"question": "如何开始？"}) as response:
            self.assertEqual(json.loads(response.read()), {"answer": "先完成一道题。"})
        sent = upstream.call_args.args[0]
        self.assertEqual(sent.full_url, "http://model.local/v1/chat/completions")
        self.assertEqual(sent.headers["Authorization"], "Bearer secret")

    def test_rejects_oversized_or_missing_questions(self):
        with self.assertRaises(Exception):
            self.post("/api/ai/chat", {"question": ""})


if __name__ == "__main__": unittest.main()
