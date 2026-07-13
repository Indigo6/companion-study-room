import importlib.util
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path


class MarkdownContentTypeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        module_path = Path(__file__).parents[1] / "server.py"
        spec = importlib.util.spec_from_file_location("planning_server", module_path)
        cls.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.module)

    def test_markdown_is_served_as_utf8_text(self):
        handler = object.__new__(self.module.Utf8StaticHandler)

        self.assertEqual(
            handler.guess_type("plan.md"),
            "text/plain; charset=utf-8",
        )

    def test_markdown_bypasses_stale_browser_cache(self):
        root = Path(__file__).parents[1]
        handler = lambda *args, **kwargs: self.module.Utf8StaticHandler(
            *args, directory=root, **kwargs
        )
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            url = (
                f"http://127.0.0.1:{server.server_port}/docs/superpowers/specs/"
                "2026-07-12-companion-study-room-product-plan.md"
            )
            request = urllib.request.Request(
                url,
                headers={"If-Modified-Since": "Sun, 12 Jul 2026 07:13:04 GMT"},
            )
            with urllib.request.urlopen(request) as response:
                self.assertEqual(response.status, 200)
                self.assertEqual(response.headers["Cache-Control"], "no-store")
                self.assertEqual(
                    response.headers.get_content_type(),
                    "text/plain",
                )
                self.assertEqual(response.headers.get_content_charset(), "utf-8")
                self.assertTrue(response.read().startswith("# “陪伴自习室”".encode()))
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == "__main__":
    unittest.main()
