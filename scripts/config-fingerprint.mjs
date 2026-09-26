import { loadParameters } from "./load-parameters.mjs";
import { validate } from "./validate-environment.mjs";

const environment = process.argv[2];
const parameters = loadParameters(environment);
validate(parameters);
console.log(JSON.stringify({
  environment: parameters.APP_ENV,
  appHost: new URL(parameters.APP_BASE_URL).hostname,
  supabaseProjectRef: parameters.SUPABASE_PROJECT_REF,
  worker: parameters.CLOUDFLARE_WORKER_NAME,
  lineChannel: parameters.LINE_LOGIN_CHANNEL_NAME,
}, null, 2));
