import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// This is the *Salary Tracker* Firebase Web config, separate from zWhisFlow.
// Firebase API keys are public client identifiers, NOT service account credentials.
const config = {
  apiKey: import.meta.env.VITE_MINDX_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_MINDX_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_MINDX_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_MINDX_FIREBASE_APP_ID,
};
export const mindxConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
const name = "mindx-salary-secondary";
const app = mindxConfigured ? (getApps().some((candidate) => candidate.name === name) ? getApp(name) : initializeApp(config, name)) : null;
export const mindxAuth = app ? getAuth(app) : null;
export const mindxDb = app ? getFirestore(app) : null;
