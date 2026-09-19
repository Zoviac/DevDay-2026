import os
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import HTTPException

#9. Make function to initialize and get Firestore database connection here:
def get_firestore_db():
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    if not service_account_path:
        raise HTTPException(status_code=500, detail="Missing Firebase service account path")

    if not os.path.isabs(service_account_path):
        service_account_path = os.path.join(os.path.dirname(__file__), service_account_path)

    if not firebase_admin._apps:
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)

    return firestore.client()


#10. make get_favorites function here:
def get_favorites(user_id: str) -> list:
    db = get_firestore_db()
    favorite_doc = db.collection("favorites").document(user_id).get()

    if not favorite_doc.exists:
        return []

    favorite_data = favorite_doc.to_dict() or {}
    return favorite_data.get("items", [])



# 11&12. make toggle_favorite function here:
# code for toggling user favorites:
def toggle_favorite(user_id: str, food: dict) -> list:
    db = get_firestore_db()
    favorite_ref = db.collection("favorites").document(user_id)
    favorites = get_favorites(user_id)
    # Code here to add the food to favorites or remove it if already favorited
    food_id = food.get("id")
    already_favorited = any(item.get("id") == food_id for item in favorites)

    if already_favorited:
        favorites = [item for item in favorites if item.get("id") != food_id]
    else:
        favorites.append(food)

    favorite_ref.set({"items": favorites})
    return favorites