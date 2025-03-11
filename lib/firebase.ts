import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

// Initialize Firebase Admin SDK for server-side operations
if (!getApps().length) {
  // Use the service account credentials
  const serviceAccount = {
    type: "service_account",
    project_id: "clinicplus-4c9a4",
    private_key_id: "8dae1454acbfd0ef0adfaebd056e225849f2a5d6",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDWJUIL139T5gqi\n9iPVDY1HlyzxYZ6A5Hb54pNE/gqF4N+uqIyLbdtDUmZBb22opgoJKoweu2QVBh3E\nHOod5X8KqeFVmLgT7625rg3USmWcSWe6RGGIiFeP0EWXaMb18N0j79h/89qSd+TF\nlRWJtZ/5uY4U/GGLo+w6WYmrc3HJwW5DlPB2GBN3pMlYFQhXqwhcO+S9ltQ1gUCM\npxXxjZB+VGcDdL3qAXsyfAVeVkKDLOyIlOIGDfq1Dui/ragMK1+vfP2tSQZHCNEH\nInC+Q2kWaOqjaXJKN8zFfokyNLXZceXmsdwXq9dGtt0hS5tAtgWUSiwqWSWHV9Bo\nwDRRNP/nAgMBAAECggEAFE5jJWlRXxzMvGg3vJ+02mmI7vixRYqkh4yHJ38pc0mA\nHHlKHnyT0p3xKVpOHTRldjoNIGrnkiDK2MpfHuegtNuoDOxW5DkRka5iDFPjr768\nMcsDLqWzG+WFe9aJK1AkQCChuHxgqQvqaxv4d178JPuF8BKAk3O/VkcgSVxAmX9s\nMvmdwseb56EJ3+NqbcdQVDCvShWM8cd1Hb61zF4E09xJWwcGDMb2UYTVR3Uhd9pl\nTNP07st8cPayIhTEVFVE55qw9TBqAu33zGMC5EMowuU3hoqGb+LKIS3UHRXtC8PL\nx/D7EVvCCtghiy8B+ymk33pUaPCEMBOhgi2uFfGn+QKBgQDtf4CIXAd2V22qo9jS\n+wGlaDLDPeYq75xUj4sh9ad9WwNbROX7pwEZl3DGh4jKfUC/B7TX+4fTrrE6iEC3\nxKqwRbV8ddwIeUTJHeeOyyXLvFo+qGN210ikwM+PhOJ0zNw5s+qVzirBpWVn/EHP\nMkuy6luL5pw+xhmSVhGjPLiQaQKBgQDm1AeGGGbjEDwAU5UHu0t6/WLaKQuN9+sF\n2aX4wmD9VKmK0JsIDXLlh7e7pRXO+/rWJHIkvrr+nZqff7RaH4UVSoecPqPVO/Cd\nLvVrCC8u03o7h+zgGY31XyBpVjxQGQLa/CT4Sv6QwTc+A6C5nW+IUF45o6k/Iflc\n1Qb/0y8DzwKBgC/66kSiEv/dedJXd55oB1UbT+YRw0Y5UiPjPACIWGYC1RLDQJMu\nkhJRff8dsoz18Pam3+oibrZdPIDOtgRqPvGNo7SZOvKbTUI0QGugruoSC0lNS4re\nw1ZFfalI91cRbAxcRLAvDoRAndP8Km9pgdGLdyM0W6xy6QefS8Dmq4LBAoGAGGFI\nsicdptnuHHK3iOuFW2Yr7LLtH3+R+To1x4JwUBGDHsBNv5n8CrY897rGBOikY73R\nuIPUqFPpIvOQDvzJR6hpjl0nXLxJ+7AcB8QDh8SaYnNG15ybW9FCUR3knOknXg3H\nsdnp7UwbE5e6gCBayWEDsr7Qf3SNK/rsFFUv4A0CgYBE/8Ke6Y5G8gclJmH12/xK\np/l2fPaFKbeiAhV7a3azd2ts/vVk8lcZMYbkOTgpW2nvgvutuDM2KgDy24FOSkpk\npd72kqcCGYh13Sz8XQ/nMHrnffZ0/OxGQWSKuqJ4VseF92Qr12sbIHCUcERp5SMr\nzIoa7WrwKuFecAeRwWAPBQ==\n-----END PRIVATE KEY-----\n",
    client_email: "firebase-adminsdk-fbsvc@clinicplus-4c9a4.iam.gserviceaccount.com",
    client_id: "108815731775722024626",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40clinicplus-4c9a4.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId: "clinicplus-4c9a4",
    storageBucket: "clinicplus-4c9a4.appspot.com",
    // If you have a database URL, uncomment the following line
    // databaseURL: "https://clinicplus-4c9a4.firebaseio.com"
  })
}

// Export Firestore and Auth instances
export const db = getFirestore()
export const auth = getAuth()

// Helper functions for Firestore
export const converter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) => snap.data() as T
});

export const dataPoint = <T>(collectionPath: string) => 
  db.collection(collectionPath).withConverter(converter<T>());

