import firebase_admin
from firebase_admin import credentials, auth

cred = credentials.Certificate("codelife-9e846-firebase-adminsdk-fbsvc-53ac4d61e7.json")
firebase_admin.initialize_app(cred)
