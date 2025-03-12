package com.example.todo;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import javax.servlet.ServletException;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

public class FirebaseAuthUtil {
    private static FirebaseAuth firebaseAuth;
    private static final String FIREBASE_SERVICE_ACCOUNT_PATH = "/WEB-INF/firebase-service-account.json";

    public static void initialize(String resourcePath) throws ServletException {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = FirebaseAuthUtil.class
                    .getResourceAsStream(resourcePath != null ? resourcePath : FIREBASE_SERVICE_ACCOUNT_PATH);
                
                if (serviceAccount == null) {
                    throw new ServletException("Firebase service account file not found");
                }

                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

                FirebaseApp.initializeApp(options);
            }
            firebaseAuth = FirebaseAuth.getInstance();
        } catch (IOException e) {
            throw new ServletException("Failed to initialize Firebase", e);
        }
    }

    public static String verifyIdToken(String idToken) throws ServletException {
        try {
            if (firebaseAuth == null) {
                throw new ServletException("Firebase Auth not initialized");
            }

            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
            return decodedToken.getUid();
        } catch (FirebaseAuthException e) {
            throw new ServletException("Failed to verify Firebase ID token", e);
        }
    }

    public static void validateAuthHeader(String authHeader) throws ServletException {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ServletException("Missing or invalid Authorization header");
        }

        String idToken = authHeader.substring(7);
        verifyIdToken(idToken);
    }
}
