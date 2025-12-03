/**
 * Firebase Cloud Functions v2
 * 
 * Import function triggers from their respective submodules:
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";

// For cost control, set the maximum number of containers
// This helps mitigate the impact of unexpected traffic spikes
setGlobalOptions({maxInstances: 10});

// Example function - uncomment to use:
// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
//
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
