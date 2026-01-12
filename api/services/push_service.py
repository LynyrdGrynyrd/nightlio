import json
import os
import logging
from pywebpush import webpush, WebPushException
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class PushService:
    def __init__(self, db, vapid_key_file: str = "vapid_keys.json"):
        self.db = db
        self.vapid_key_file = vapid_key_file
        # Fixed email claim is required by VAPID
        self.vapid_claims = {"sub": "mailto:admin@nightlio.app"}
        
        self.private_key = None
        self.public_key = None
        
        self._load_or_generate_keys()

    def _load_or_generate_keys(self):
        """Load VAPID keys from file or env, or generate them."""
        # 1. Try ENV
        env_priv = os.getenv("VAPID_PRIVATE_KEY")
        env_pub = os.getenv("VAPID_PUBLIC_KEY")
        
        if env_priv and env_pub:
            self.private_key = env_priv
            self.public_key = env_pub
            return

        # 2. Try File
        if os.path.exists(self.vapid_key_file):
            try:
                with open(self.vapid_key_file, "r") as f:
                    data = json.load(f)
                    self.private_key = data.get("privateKey")
                    self.public_key = data.get("publicKey")
                    if self.private_key and self.public_key:
                        return
            except Exception as e:
                logger.warning(f"Failed to read VAPID keys file: {e}")

        # 3. Generate New
        logger.info("Generating new VAPID keys...")
        try:
            # Using py-vapid library to generate keys
            from py_vapid import Vapid
            v = Vapid()
            v.generate_keys()
            
            # Format keys for saving/using
            # raw strings often work with pywebpush if they are base64url encoded?
            # actually pywebpush expects PEM or specific formats. 
            # easier: rely on the library to give us what we need or just use the ec objects?
            # pywebpush accepts path to PEM file OR string.
            
            # Helper to get base64 keys which are easier to store in JSON/Frontend
            # But pywebpush likes PEM for private key usually.
            
            # Let's save as PEM files for simplicity if we can? 
            # Or just store the raw values.
            
            # Actually, `v.save_pem()` creates a file.
            v.save_pem('private_key.pem')
            self.private_key = 'private_key.pem' 
            
            # We need the public key string for the frontend (base64url)
            # v.public_key_and_der() returns (b64url_string, der_bytes)
            self.public_key = v.public_key_and_der()[0].decode('utf-8')
            
            # Save public key for reference
            with open(self.vapid_key_file, "w") as f:
                json.dump({
                    "privateKeyPath": "private_key.pem",
                    "publicKey": self.public_key
                }, f)
                
        except Exception as e:
            logger.error(f"Failed to generate VAPID keys: {e}")

    def get_vapid_public_key(self) -> Optional[str]:
        return self.public_key

    def subscribe_user(self, user_id: int, subscription_info: Dict) -> bool:
        """Store a user's subscription info."""
        try:
            endpoint = subscription_info.get("endpoint")
            keys = subscription_info.get("keys", {})
            p256dh = keys.get("p256dh")
            auth = keys.get("auth")

            if not endpoint or not p256dh or not auth:
                logger.warning("Invalid subscription data received")
                return False

            with self.db._connect() as conn:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO push_subscriptions 
                    (user_id, endpoint, p256dh_key, auth_key)
                    VALUES (?, ?, ?, ?)
                    """,
                    (user_id, endpoint, p256dh, auth)
                )
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to subscribe user {user_id}: {e}")
            return False

    def send_notification(self, user_id: int, message: str) -> int:
        """Send a notification to all of a user's subscriptions. Returns success count."""
        try:
            with self.db._connect() as conn:
                conn.row_factory = sqlite3.Row if hasattr(self.db, 'sqlite3') else None
                # Manual row factory if needed
                cursor = conn.execute(
                    "SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = ?",
                    (user_id,)
                )
                rows = cursor.fetchall()

            if not rows:
                return 0

            success_count = 0
            for row in rows:
                # Handle both tuple and Row object
                if isinstance(row, tuple):
                    endpoint, p256dh, auth = row
                else:
                    endpoint = row[0]
                    p256dh = row[1]
                    auth = row[2]

                try:
                    subscription_info = {
                        "endpoint": endpoint,
                        "keys": {
                            "p256dh": p256dh,
                            "auth": auth
                        }
                    }
                    
                    # Determine private key source
                    # If self.private_key wraps a file path
                    priv_key_param = self.private_key
                    if self.private_key and os.path.exists(self.private_key) and 'BEGIN' not in self.private_key:
                        priv_key_param = self.private_key # path
                    elif self.private_key:
                        priv_key_param = self.private_key # key content
                        
                    webpush(
                        subscription_info=subscription_info,
                        data=message,
                        vapid_private_key=priv_key_param,
                        vapid_claims=self.vapid_claims
                    )
                    success_count += 1
                except WebPushException as ex:
                    logger.warning(f"WebPush failed: {ex}")
                    if ex.response and ex.response.status_code == 410:
                        self._delete_subscription(endpoint)
                except Exception as ex:
                    logger.error(f"Notification error: {ex}")

            return success_count
        except Exception as e:
            logger.error(f"Send notification logic failed: {e}")
            return 0

    def _delete_subscription(self, endpoint: str):
        try:
            with self.db._connect() as conn:
                conn.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", (endpoint,))
                conn.commit()
        except:
            pass
