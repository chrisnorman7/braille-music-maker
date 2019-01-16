from klein import Klein
from twisted.web.static import File

app = Klein()


@app.route("/", branch=True)
def index(request):
    return File('.')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
