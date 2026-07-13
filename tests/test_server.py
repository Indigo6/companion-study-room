import importlib.util
import unittest
from pathlib import Path


class MarkdownContentTypeTest(unittest.TestCase):
    def test_markdown_is_served_as_utf8_text(self):
        module_path = Path(__file__).parents[1] / "server.py"
        spec = importlib.util.spec_from_file_location("planning_server", module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        handler = object.__new__(module.Utf8StaticHandler)
        self.assertEqual(
            handler.guess_type("plan.md"),
            "text/markdown; charset=utf-8",
        )


if __name__ == "__main__":
    unittest.main()
