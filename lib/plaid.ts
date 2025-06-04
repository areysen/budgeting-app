import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

export function getPlaidClient() {
  const { PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV } = process.env
  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    throw new Error('Missing Plaid credentials')
  }
  const env =
    PLAID_ENV === 'production'
      ? PlaidEnvironments.production
      : PLAID_ENV === 'development'
      ? PlaidEnvironments.development
      : PlaidEnvironments.sandbox

  const config = new Configuration({
    basePath: env,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
    },
  })
  return new PlaidApi(config)
}
