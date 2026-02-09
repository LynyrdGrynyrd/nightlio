from pathlib import Path


API_DIR = Path(__file__).resolve().parents[1]


def test_procfile_uses_centralized_gunicorn_config():
    procfile = (API_DIR / "Procfile").read_text(encoding="utf-8")
    assert "gunicorn -c gunicorn.conf.py wsgi:application" in procfile


def test_runtime_entrypoints_reference_shared_gunicorn_config():
    entrypoints = [
        "start.py",
        "wsgi.py",
        "docker_start.py",
        "run_production.sh",
    ]

    for entrypoint in entrypoints:
        content = (API_DIR / entrypoint).read_text(encoding="utf-8")
        assert "gunicorn.conf.py" in content
