# Mfly API

## YouTube Music search

Search is provided by [tombulled/innertube](https://github.com/tombulled/innertube), a Python client for YouTube's private InnerTube API. Mfly does not require a YOUTUBE_API_KEY.

Install the Python dependency before running the API:

```bash
python3 -m pip install -r requirements.txt
```

Then start the API normally:

```bash
npm run dev
```

Set `PYTHON_BIN` if Python is not available as `python3`:

```bash
PYTHON_BIN=python npm run dev
```

The API endpoint `GET /api/search?q=...` invokes the integrated InnerTube adapter and returns the normalized items consumed by the Mfly result grid.
