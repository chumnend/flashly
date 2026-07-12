import unittest
from pyramid import testing

class TestRoutes(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_includeme(self):
        from flashly.routes import includeme
        includeme(self.config)
        # We can assert that at least one known route exists
        self.assertIn('status', self.config.registry.introspector.get('routes', 'status')['name'])
        self.assertIn('frontend', self.config.registry.introspector.get('routes', 'frontend')['name'])
