import { getAuth } from "firebase/auth";

const auth = getAuth();

// To apply the default browser preference instead of explicitly setting it.
auth.useDeviceLanguage();