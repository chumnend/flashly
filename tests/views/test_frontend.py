import unittest
from unittest.mock import MagicMock, patch
from pyramid.response import FileResponse, Response
from flashly.views.frontend import frontend_view

class TestFrontendView(unittest.TestCase):

    def setUp(self):
        self.request = MagicMock()

    @patch('os.path.exists', return_value=True)
    @patch('flashly.views.frontend.FileResponse')
    def test_frontend_view_file_exists(self, mock_file_response, mock_os_path_exists):
        response = frontend_view(self.request)
        mock_os_path_exists.assert_called_once()
        mock_file_response.assert_called_once_with(mock_file_response.call_args[0][0], content_type='text/html')
        self.assertIsInstance(response, MagicMock)

    @patch('os.path.exists', return_value=False)
    def test_frontend_view_file_does_not_exist(self, mock_os_path_exists):
        response = frontend_view(self.request)
        mock_os_path_exists.assert_called_once()
        self.assertIsInstance(response, Response)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.body, b"React app not built. Run 'yarn run build' in frontend directory.")
