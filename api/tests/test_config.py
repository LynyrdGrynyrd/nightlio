import json

from api.config import get_config, config_to_public_dict


def test_public_config_shape():
    cfg = get_config()
    public = config_to_public_dict(cfg)
    assert set(public.keys()) == {
        "enable_google_oauth",
        "enable_registration",
        "enable_local_login",
        "google_client_id",
    }
    assert isinstance(public["enable_google_oauth"], bool)
    assert isinstance(public["enable_registration"], bool)
    assert isinstance(public["enable_local_login"], bool)


def test_public_config_default_values():
    cfg = get_config()
    public = config_to_public_dict(cfg)
    assert public["enable_google_oauth"] in (True, False)
    assert public["enable_registration"] in (True, False)
    assert public["enable_local_login"] in (True, False)
