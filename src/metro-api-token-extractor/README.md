# Installation 

## with uv:
1. `uv venv`
2. `uv pip install -r requirements.txt`

## general:
1. `python -m venv venv`
2. `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
3. `pip install -r requirements.txt`

## After install:
1. `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
2. `playwright install chromium`

Create a .env file with the following variables:
```
USERNAME=your_username
PASSWORD=your_password
```
