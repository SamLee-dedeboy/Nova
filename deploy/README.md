# NOVA DOCKER 
Sets up and runs the container for both frontend + backend for NOVA.


## Usage
- `docker-compose -p nova up --build -d`
- The app should be accessible from `http://localhost:3040/`

## Modifications
- add `"http://localhost:3040/"` to all fetch apis in all page views and `ArticleAnalysis.vue` & `ArticleView.vue`
- change `app.provide("server_address", xxx)` in `main.js` to `app.provide("server_address", xxx)` 
- add `api = Blueprint('api', __name__)` in flasks server __init__.py
- add `app.register_blueprint(api, url_prefix='/api')` at the end of __init__.py
- change flask __init__.py @app to @api
- handling punkt: add the following to `splitSentence()` in `processUtils.py`

```python
    except LookupError:
        import nltk
        nltk.download("punkt")
        return list(map(post_process, tokenize.sent_tokenize(content)))
```
