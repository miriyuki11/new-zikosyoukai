export function getTestCredentials(user) {
  const prefix = user === "A" ? "SUPABASE_TEST" : `SUPABASE_TEST_USER_${user}`;
  const emailVariable = `${prefix}_EMAIL`;
  const passwordVariable = `${prefix}_PASSWORD`;
  const email = process.env[emailVariable];
  const password = process.env[passwordVariable];

  if (!email || !password) {
    throw new Error(`Set ${emailVariable} and ${passwordVariable} before running this script.`);
  }

  return { email, password };
}